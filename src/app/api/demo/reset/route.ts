import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server-client";

const DEMO_MODE = process.env.DEMO_MODE === "true";

// Nomor HP 4 persona demo yang di-seed (lihat supabase/seed.ts) — dipakai untuk
// mencari ulang id mereka di setiap request, TIDAK PERNAH di-hardcode sebagai UUID.
const DEMO_PHONES = [
  "+6281234567890", // Warto — pekerja
  "+6281234567891", // Dhika — pemberi_kerja
  "+6281234567892", // Slamet — pendamping
  "+6281234567893", // Yanti — pekerja (tanpa kartu_kerja)
] as const;

export async function POST() {
  if (!DEMO_MODE) {
    return NextResponse.json({ ok: false, pesan: "Tidak ditemukan." }, { status: 404 });
  }

  const service = await createServiceClient();

  const { data: personas } = await service
    .from("pengguna")
    .select("id, no_hp")
    .in("no_hp", DEMO_PHONES);

  const ids = (personas ?? []).map((p) => p.id);
  if (ids.length === 0) {
    return NextResponse.json(
      { ok: false, pesan: "Persona demo belum di-seed." },
      { status: 500 }
    );
  }
  const idSet = new Set(ids);

  // Urutan hapus mengikuti arah FK (anak dulu, baru induk) supaya tidak
  // tertahan constraint — SEMUA di-scope ke id 4 persona demo yang baru saja
  // dicari di atas, tidak pernah ke id lain.
  //
  // Tabel relasi dua pihak (pekerjaan, kesepakatan_kerja) di-scope dengan
  // "kedua sisi harus persona demo", BUKAN "salah satu sisi" — supaya kalau
  // suatu saat persona demo (mis. Dhika) sungguhan berinteraksi dengan akun
  // asli (mis. pelamar E2E test), baris milik pihak asli itu TIDAK ikut
  // terhapus lewat cascade FK (pekerjaan -> penilaian, kesepakatan_kerja ->
  // pekerjaan). Baris yang salah satu sisinya bukan persona demo dibiarkan.
  await service.from("lapor_upah").delete().in("pekerja_id", ids);
  await service.from("laporan_masalah").delete().in("pelapor_id", ids);
  await service.from("penilaian").delete().in("pemberi_kerja_id", ids);
  await service.from("sesi_wawancara").delete().in("pekerja_id", ids);

  // pekerjaan & kesepakatan_kerja: hanya hapus baris yang KEDUA belah pihaknya
  // persona demo (lihat catatan di atas).
  const { data: pekerjaanDemo } = await service
    .from("pekerjaan")
    .select("id, pekerja_id, pemberi_kerja_id")
    .or(`pekerja_id.in.(${ids.join(",")}),pemberi_kerja_id.in.(${ids.join(",")})`);
  const pekerjaanAmanIds = (pekerjaanDemo ?? [])
    .filter((p) => idSet.has(p.pekerja_id) && idSet.has(p.pemberi_kerja_id))
    .map((p) => p.id);
  if (pekerjaanAmanIds.length > 0) {
    await service.from("pekerjaan").delete().in("id", pekerjaanAmanIds);
  }

  const { data: kesepakatanDemo } = await service
    .from("kesepakatan_kerja")
    .select("id, pekerja_id, pemberi_kerja_id")
    .or(`pekerja_id.in.(${ids.join(",")}),pemberi_kerja_id.in.(${ids.join(",")})`);
  const kesepakatanAmanIds = (kesepakatanDemo ?? [])
    .filter((k) => idSet.has(k.pekerja_id) && idSet.has(k.pemberi_kerja_id))
    .map((k) => k.id);
  if (kesepakatanAmanIds.length > 0) {
    await service.from("kesepakatan_kerja").delete().in("id", kesepakatanAmanIds);
  }

  // lamaran: baris lamaran milik persona demo sebagai pelamar — aman dihapus
  // apa pun status lowongan tujuannya (lamaran tidak jadi induk tabel lain).
  await service.from("lamaran").delete().in("pekerja_id", ids);

  // lowongan milik persona demo — tapi kalau masih ada lamaran/kesepakatan
  // dari pihak LAIN (bukan persona demo) yang menempel di lowongan itu,
  // JANGAN dihapus (menghapus lowongan akan men-cascade hapus baris pihak
  // lain itu lewat FK). Lowongan begini dilewati & dilaporkan balik.
  const { data: lowonganDemo } = await service
    .from("lowongan")
    .select("id")
    .in("pemberi_kerja_id", ids);
  const lowonganIds = (lowonganDemo ?? []).map((l) => l.id);

  let lowonganDilewati: string[] = [];
  if (lowonganIds.length > 0) {
    const { data: lamaranSisa } = await service
      .from("lamaran")
      .select("lowongan_id, pekerja_id")
      .in("lowongan_id", lowonganIds);
    const { data: kesepakatanSisa } = await service
      .from("kesepakatan_kerja")
      .select("lowongan_id, pekerja_id, pemberi_kerja_id")
      .in("lowongan_id", lowonganIds);

    const asing = new Set<string>();
    for (const r of lamaranSisa ?? []) {
      if (!idSet.has(r.pekerja_id)) asing.add(r.lowongan_id);
    }
    for (const r of kesepakatanSisa ?? []) {
      if (!idSet.has(r.pekerja_id) || !idSet.has(r.pemberi_kerja_id)) asing.add(r.lowongan_id);
    }

    const lowonganAman = lowonganIds.filter((id) => !asing.has(id));
    lowonganDilewati = lowonganIds.filter((id) => asing.has(id));

    if (lowonganAman.length > 0) {
      await service.from("lowongan_keahlian").delete().in("lowongan_id", lowonganAman);
      await service.from("saringan_aman").delete().in("lowongan_id", lowonganAman);
      await service.from("lowongan").delete().in("id", lowonganAman);
    }
  }

  // Kartu Kerja Warto: hapus keahlian tambahan hasil percobaan, sisakan 2
  // keahlian asli hasil seed ("Tukang Batu", "Tukang Plester").
  const warto = personas?.find((p) => p.no_hp === "+6281234567890");
  if (warto) {
    const { data: kartu } = await service
      .from("kartu_kerja")
      .select("id")
      .eq("pekerja_id", warto.id)
      .maybeSingle();
    if (kartu) {
      await service
        .from("kartu_keahlian")
        .delete()
        .eq("kartu_id", kartu.id)
        .not("sebutan_pekerja", "in", '("Tukang Batu","Tukang Plester")');
    }
  }

  // Yanti: kartu_kerja tidak seharusnya ada — hapus kalau percobaan demo
  // (mis. wawancara AI) sempat menerbitkannya.
  const yanti = personas?.find((p) => p.no_hp === "+6281234567893");
  if (yanti) {
    await service.from("kartu_kerja").delete().eq("pekerja_id", yanti.id);
  }

  return NextResponse.json({
    ok: true,
    data: {
      pesan: "Data demo dikembalikan ke awal.",
      lowonganDilewati: lowonganDilewati.length > 0 ? lowonganDilewati : undefined,
    },
  });
}
