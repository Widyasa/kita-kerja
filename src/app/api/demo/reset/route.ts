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

type LangkahGagal = { langkah: string; pesan: string };

export async function POST() {
  if (!DEMO_MODE) {
    return NextResponse.json({ ok: false, pesan: "Tidak ditemukan." }, { status: 404 });
  }

  const service = await createServiceClient();

  // Kumpulkan SEMUA error dari setiap panggilan Supabase di bawah — endpoint
  // ini TIDAK BOLEH melaporkan "ok: true" kalau ada langkah yang sebetulnya
  // gagal (mis. galat jaringan/rate-limit sesaat di proyek live yang dipakai
  // bersama). Ini bukan transaksi/rollback penuh — cuma memastikan kegagalan
  // tidak dilaporkan sebagai sukses secara diam-diam.
  const gagal: LangkahGagal[] = [];
  const catat = (langkah: string, error: { message: string } | null) => {
    if (error) gagal.push({ langkah, pesan: error.message });
  };

  const { data: personas, error: personasError } = await service
    .from("pengguna")
    .select("id, no_hp")
    .in("no_hp", DEMO_PHONES);
  if (personasError) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal membaca persona demo: ${personasError.message}` },
      { status: 500 }
    );
  }

  const ids = (personas ?? []).map((p) => p.id);
  if (ids.length === 0) {
    return NextResponse.json(
      { ok: false, pesan: "Persona demo belum di-seed." },
      { status: 500 }
    );
  }
  const idSet = new Set(ids);
  const idsCsv = ids.join(",");

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
  catat(
    "hapus lapor_upah milik pekerja demo",
    (await service.from("lapor_upah").delete().in("pekerja_id", ids)).error
  );
  catat(
    "hapus laporan_masalah milik pelapor demo",
    (await service.from("laporan_masalah").delete().in("pelapor_id", ids)).error
  );
  catat(
    "hapus penilaian",
    (await service.from("penilaian").delete().in("pemberi_kerja_id", ids)).error
  );
  catat(
    "hapus sesi_wawancara",
    (await service.from("sesi_wawancara").delete().in("pekerja_id", ids)).error
  );

  // pekerjaan & kesepakatan_kerja: hanya kandidat hapus baris yang KEDUA
  // belah pihaknya persona demo (lihat catatan di atas).
  const { data: pekerjaanDemo, error: pekerjaanDemoError } = await service
    .from("pekerjaan")
    .select("id, pekerja_id, pemberi_kerja_id, kesepakatan_id")
    .or(`pekerja_id.in.(${idsCsv}),pemberi_kerja_id.in.(${idsCsv})`);
  catat("cek data pekerjaan terkait persona demo", pekerjaanDemoError);

  const { data: kesepakatanDemo, error: kesepakatanDemoError } = await service
    .from("kesepakatan_kerja")
    .select("id, pekerja_id, pemberi_kerja_id, lowongan_id")
    .or(`pekerja_id.in.(${idsCsv}),pemberi_kerja_id.in.(${idsCsv})`);
  catat("cek data kesepakatan_kerja terkait persona demo", kesepakatanDemoError);

  const pekerjaanKandidat = (pekerjaanDemo ?? []).filter(
    (p) => idSet.has(p.pekerja_id) && idSet.has(p.pemberi_kerja_id)
  );
  const pekerjaanKandidatIds = pekerjaanKandidat.map((p) => p.id);
  const kesepakatanKandidatIds = (kesepakatanDemo ?? [])
    .filter((k) => idSet.has(k.pekerja_id) && idSet.has(k.pemberi_kerja_id))
    .map((k) => k.id);

  // Baris pekerjaan/kesepakatan_kerja yang "kedua pihaknya demo" masih bisa
  // dirujuk oleh laporan_masalah.pekerjaan_id / lapor_upah.pekerjaan_id milik
  // PENGGUNA ASLI (bukan demo) — laporan_masalah RLS-nya nonaktif total dan
  // POST /api/problems/report tidak memverifikasi kepemilikan lowongan_id/
  // pekerjaan_id yang dirujuk, jadi siapa pun yang login bisa membuat baris
  // yang merujuk pekerjaan milik persona demo. Kedua FK itu ON DELETE SET
  // NULL, jadi menghapus pekerjaan ini akan MENGUBAH baris milik pengguna
  // asli tersebut (meng-NULL-kan pekerjaan_id-nya) — pelanggaran "jangan
  // pernah menyentuh data akun asli". Karena itu WAJIB dicek dulu, gagal-
  // tertutup: kalau query cek ini sendiri error, JANGAN hapus satu pun
  // kandidat pekerjaan/kesepakatan_kerja pada request ini (anggap semua
  // masih berpotensi terkait, bukan diam-diam dianggap aman).
  let pekerjaanAmanIds: string[] = [];
  let pekerjaanDilewati: string[] = [];
  let kesepakatanAmanIds: string[] = [];
  let kesepakatanDilewati: string[] = [];

  if (pekerjaanKandidatIds.length > 0 || kesepakatanKandidatIds.length > 0) {
    let cekPekerjaanGagal = false;
    const asingPekerjaan = new Set<string>();

    if (pekerjaanKandidatIds.length > 0) {
      const { data: laporanPekerjaanSisa, error: e1 } = await service
        .from("laporan_masalah")
        .select("pekerjaan_id, pelapor_id")
        .in("pekerjaan_id", pekerjaanKandidatIds);
      const { data: laporUpahSisa, error: e2 } = await service
        .from("lapor_upah")
        .select("pekerjaan_id, pekerja_id")
        .in("pekerjaan_id", pekerjaanKandidatIds);
      catat("cek keterkaitan laporan_masalah pada pekerjaan", e1);
      catat("cek keterkaitan lapor_upah pada pekerjaan", e2);

      if (e1 || e2) {
        cekPekerjaanGagal = true;
      } else {
        for (const r of laporanPekerjaanSisa ?? []) {
          if (r.pekerjaan_id && !idSet.has(r.pelapor_id)) asingPekerjaan.add(r.pekerjaan_id);
        }
        for (const r of laporUpahSisa ?? []) {
          if (r.pekerjaan_id && !idSet.has(r.pekerja_id)) asingPekerjaan.add(r.pekerjaan_id);
        }
      }
    }

    if (cekPekerjaanGagal) {
      // Gagal-tertutup: cek tidak bisa dipercaya, jangan hapus siapa pun.
      pekerjaanDilewati = pekerjaanKandidatIds;
      kesepakatanDilewati = kesepakatanKandidatIds;
    } else {
      pekerjaanAmanIds = pekerjaanKandidatIds.filter((id) => !asingPekerjaan.has(id));
      pekerjaanDilewati = pekerjaanKandidatIds.filter((id) => asingPekerjaan.has(id));

      // kesepakatan_kerja: kalau baris pekerjaan hasil kesepakatan itu TIDAK
      // aman dihapus (masih dirujuk laporan_masalah/lapor_upah asing), maka
      // kesepakatan_kerja-nya juga TIDAK boleh dihapus — menghapusnya akan
      // CASCADE menghapus baris pekerjaan itu juga
      // (pekerjaan.kesepakatan_id -> kesepakatan_kerja ON DELETE CASCADE),
      // terlepas dari kita sendiri memilih untuk tidak menghapus baris
      // pekerjaan itu secara langsung.
      const kesepakatanIdKePekerjaanId = new Map<string, string>();
      for (const p of pekerjaanKandidat) {
        if (p.kesepakatan_id) kesepakatanIdKePekerjaanId.set(p.kesepakatan_id, p.id);
      }
      const kesepakatanTerlarang = new Set<string>();
      for (const [kesepakatanId, pekerjaanId] of kesepakatanIdKePekerjaanId) {
        if (asingPekerjaan.has(pekerjaanId)) kesepakatanTerlarang.add(kesepakatanId);
      }
      kesepakatanAmanIds = kesepakatanKandidatIds.filter((id) => !kesepakatanTerlarang.has(id));
      kesepakatanDilewati = kesepakatanKandidatIds.filter((id) => kesepakatanTerlarang.has(id));
    }
  }

  if (pekerjaanAmanIds.length > 0) {
    catat("hapus pekerjaan", (await service.from("pekerjaan").delete().in("id", pekerjaanAmanIds)).error);
  }
  if (kesepakatanAmanIds.length > 0) {
    catat(
      "hapus kesepakatan_kerja",
      (await service.from("kesepakatan_kerja").delete().in("id", kesepakatanAmanIds)).error
    );
  }

  // Kalau ada kesepakatan_kerja yang SENGAJA tidak dihapus di atas (karena
  // pekerjaan hasilnya masih terkait laporan/lapor_upah asing), lowongan
  // induknya juga WAJIB tidak dihapus di langkah lowongan di bawah —
  // kesepakatan_kerja.lowongan_id -> lowongan ON DELETE CASCADE, jadi kalau
  // lowongan-nya tetap dihapus, kesepakatan_kerja yang "dilewati" ini akan
  // ikut terhapus lewat cascade juga (melewati perlindungan yang baru saja
  // kita putuskan), lalu men-cascade lagi ke pekerjaan yang terkait itu.
  const kesepakatanLowonganMap = new Map<string, string>();
  for (const k of kesepakatanDemo ?? []) {
    if (k.lowongan_id) kesepakatanLowonganMap.set(k.id, k.lowongan_id);
  }
  const lowonganDilindungiKesepakatan = new Set<string>();
  for (const kId of kesepakatanDilewati) {
    const terkaitLowonganId = kesepakatanLowonganMap.get(kId);
    if (terkaitLowonganId) lowonganDilindungiKesepakatan.add(terkaitLowonganId);
  }

  // lamaran: baris lamaran milik persona demo sebagai pelamar — aman dihapus
  // apa pun status lowongan tujuannya (lamaran tidak jadi induk tabel lain).
  catat(
    "hapus lamaran milik pekerja demo",
    (await service.from("lamaran").delete().in("pekerja_id", ids)).error
  );

  // lowongan milik persona demo — tapi kalau masih ada lamaran/kesepakatan
  // dari pihak LAIN (bukan persona demo), atau laporan_masalah dari pengguna
  // ASLI yang merujuk lowongan_id ini (SET NULL, sama alasannya seperti
  // pekerjaan di atas), JANGAN dihapus. Lowongan begini dilewati & dilaporkan
  // balik.
  const { data: lowonganDemo, error: lowonganDemoError } = await service
    .from("lowongan")
    .select("id")
    .in("pemberi_kerja_id", ids);
  catat("cek lowongan milik persona demo", lowonganDemoError);
  const lowonganIds = (lowonganDemo ?? []).map((l) => l.id);

  let lowonganDilewati: string[] = [];
  if (lowonganIds.length > 0) {
    const { data: lamaranSisa, error: e1 } = await service
      .from("lamaran")
      .select("lowongan_id, pekerja_id")
      .in("lowongan_id", lowonganIds);
    const { data: kesepakatanSisa, error: e2 } = await service
      .from("kesepakatan_kerja")
      .select("lowongan_id, pekerja_id, pemberi_kerja_id")
      .in("lowongan_id", lowonganIds);
    const { data: laporanLowonganSisa, error: e3 } = await service
      .from("laporan_masalah")
      .select("lowongan_id, pelapor_id")
      .in("lowongan_id", lowonganIds);
    catat("cek keterkaitan lamaran pada lowongan", e1);
    catat("cek keterkaitan kesepakatan_kerja pada lowongan", e2);
    catat("cek keterkaitan laporan_masalah pada lowongan", e3);

    if (e1 || e2 || e3) {
      // Gagal-tertutup: salah satu cek keterkaitan gagal — JANGAN hapus
      // satu pun kandidat lowongan pada request ini (dulu: `?? []` diam-diam
      // menganggap semua aman kalau query error — itu bug kritis, sudah
      // diperbaiki di sini).
      lowonganDilewati = lowonganIds;
    } else {
      const asing = new Set<string>();
      for (const r of lamaranSisa ?? []) {
        if (!idSet.has(r.pekerja_id)) asing.add(r.lowongan_id);
      }
      for (const r of kesepakatanSisa ?? []) {
        if (!idSet.has(r.pekerja_id) || !idSet.has(r.pemberi_kerja_id)) asing.add(r.lowongan_id);
      }
      for (const r of laporanLowonganSisa ?? []) {
        if (r.lowongan_id && !idSet.has(r.pelapor_id)) asing.add(r.lowongan_id);
      }
      for (const id of lowonganDilindungiKesepakatan) {
        asing.add(id);
      }

      const lowonganAman = lowonganIds.filter((id) => !asing.has(id));
      lowonganDilewati = lowonganIds.filter((id) => asing.has(id));

      if (lowonganAman.length > 0) {
        catat(
          "hapus lowongan_keahlian",
          (await service.from("lowongan_keahlian").delete().in("lowongan_id", lowonganAman)).error
        );
        catat(
          "hapus saringan_aman",
          (await service.from("saringan_aman").delete().in("lowongan_id", lowonganAman)).error
        );
        catat("hapus lowongan", (await service.from("lowongan").delete().in("id", lowonganAman)).error);
      }
    }
  }

  // Kartu Kerja Warto: hapus keahlian tambahan hasil percobaan, sisakan 2
  // keahlian asli hasil seed ("Tukang Batu", "Tukang Plester").
  const warto = personas?.find((p) => p.no_hp === "+6281234567890");
  if (warto) {
    const { data: kartu, error: kartuError } = await service
      .from("kartu_kerja")
      .select("id")
      .eq("pekerja_id", warto.id)
      .maybeSingle();
    catat("cek kartu_kerja Warto", kartuError);
    if (kartu) {
      catat(
        "hapus kartu_keahlian tambahan Warto",
        (
          await service
            .from("kartu_keahlian")
            .delete()
            .eq("kartu_id", kartu.id)
            .not("sebutan_pekerja", "in", '("Tukang Batu","Tukang Plester")')
        ).error
      );
    }
  }

  // Yanti: kartu_kerja tidak seharusnya ada — hapus kalau percobaan demo
  // (mis. wawancara AI) sempat menerbitkannya.
  const yanti = personas?.find((p) => p.no_hp === "+6281234567893");
  if (yanti) {
    catat(
      "hapus kartu_kerja Yanti",
      (await service.from("kartu_kerja").delete().eq("pekerja_id", yanti.id)).error
    );
  }

  const data = {
    lowonganDilewati: lowonganDilewati.length > 0 ? lowonganDilewati : undefined,
    pekerjaanDilewati: pekerjaanDilewati.length > 0 ? pekerjaanDilewati : undefined,
    kesepakatanDilewati: kesepakatanDilewati.length > 0 ? kesepakatanDilewati : undefined,
  };

  if (gagal.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        pesan: `Sebagian langkah reset gagal, coba lagi: ${gagal.map((g) => g.langkah).join(", ")}.`,
        data: { ...data, langkahGagal: gagal },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: { pesan: "Data demo dikembalikan ke awal.", ...data },
  });
}
