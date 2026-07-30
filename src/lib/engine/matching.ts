/**
 * Mesin pencocokan — skor + alasan tanpa embedding.
 * Menggunakan aturan deterministik berbasis keahlian, lokasi, dan ketersediaan.
 */

import { createServiceClient } from "@/lib/supabase/server-client";

export interface HasilCocok {
  id: string;
  judul?: string;
  nama?: string;
  alasan: string;
  skor: number; // 0-100, internal only (tidak ditampilkan ke user)
}

/**
 * Cocokkan pekerja dengan lowongan yang tersedia.
 */
export async function cocokkanPekerja(
  pekerjaId: string,
  limit = 10
): Promise<HasilCocok[]> {
  const supabase = await createServiceClient();

  // Ambil profil pekerja
  const { data: kartu } = await supabase
    .from("kartu_kerja")
    .select("wilayah_id, jangkauan_km, kesediaan, bidang_utama_id, pengalaman_tahun")
    .eq("pekerja_id", pekerjaId)
    .single();

  if (!kartu) return [];

  // Ambil keahlian pekerja
  const { data: keahlianPekerja } = await supabase
    .from("kartu_keahlian")
    .select("keahlian_id, nama_diajukan, level")
    .eq("kartu_id", (
      await supabase.from("kartu_kerja").select("id").eq("pekerja_id", pekerjaId).single()
    ).data?.id ?? "");

  const keahlianIds = keahlianPekerja?.map((k) => k.keahlian_id).filter(Boolean) ?? [];

  // Ambil lowongan tayang
  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, judul_baku, bidang_id, jenis_kerja, wilayah_id, upah_ditawarkan, lokasi_teks")
    .eq("status", "tayang")
    .limit(50);

  if (!lowongan) return [];

  const hasil: HasilCocok[] = [];

  for (const l of lowongan) {
    let skor = 0;
    const alasan: string[] = [];

    // Cocok keahlian
    const { data: lowonganKeahlian } = await supabase
      .from("lowongan_keahlian")
      .select("keahlian_id")
      .eq("lowongan_id", l.id);

    const cocokKeahlian = lowonganKeahlian?.some((lk) =>
      keahlianIds.includes(lk.keahlian_id)
    );

    if (cocokKeahlian) {
      skor += 40;
      alasan.push("Keahlianmu cocok dengan yang dicari");
    }

    // Cocok bidang
    if (l.bidang_id === kartu.bidang_utama_id) {
      skor += 20;
      alasan.push("Bidang pekerjaan sesuai keahlian utama");
    }

    // Cocok jenis kerja
    if (kartu.kesediaan.includes(l.jenis_kerja as any)) {
      skor += 15;
      alasan.push(`Kamu bersedia kerja ${l.jenis_kerja.replace("_", " ")}`);
    }

    // Upah di atas acuan (simplified)
    if (l.upah_ditawarkan && l.upah_ditawarkan > 0) {
      skor += 10;
    }

    if (skor >= 30) {
      hasil.push({
        id: l.id,
        judul: l.judul_baku ?? "Lowongan",
        alasan: alasan.join(". ") + ".",
        skor,
      });
    }
  }

  return hasil.sort((a, b) => b.skor - a.skor).slice(0, limit);
}

/**
 * Cocokkan lowongan dengan pekerja yang tersedia.
 */
export async function cocokkanLowongan(
  lowonganId: string,
  limit = 10
): Promise<HasilCocok[]> {
  const supabase = await createServiceClient();

  // Ambil detail lowongan
  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, bidang_id, jenis_kerja, wilayah_id")
    .eq("id", lowonganId)
    .single();

  if (!lowongan) return [];

  // Ambil keahlian yang dibutuhkan
  const { data: lowonganKeahlian } = await supabase
    .from("lowongan_keahlian")
    .select("keahlian_id")
    .eq("lowongan_id", lowonganId);

  const keahlianButuh = lowonganKeahlian?.map((k) => k.keahlian_id) ?? [];

  // Ambil pekerja yang punya kartu aktif
  const { data: pekerja } = await supabase
    .from("kartu_kerja")
    .select("pekerja_id, bidang_utama_id, kesediaan, jangkauan_km, pengalaman_tahun, pekerja:pengguna(nama)")
    .eq("aktif_publik", true)
    .limit(50);

  if (!pekerja) return [];

  const hasil: HasilCocok[] = [];

  for (const p of pekerja as any[]) {
    let skor = 0;
    const alasan: string[] = [];

    // Cocok keahlian
    const { data: keahlianPekerja } = await supabase
      .from("kartu_keahlian")
      .select("keahlian_id, level")
      .eq("kartu_id", (
        await supabase.from("kartu_kerja").select("id").eq("pekerja_id", p.pekerja_id).single()
      ).data?.id ?? "");

    const pekerjaKeahlianIds = keahlianPekerja?.map((k) => k.keahlian_id).filter(Boolean) ?? [];
    const cocokKeahlian = keahlianButuh.some((k) => pekerjaKeahlianIds.includes(k));

    if (cocokKeahlian) {
      skor += 40;
      alasan.push("Pekerja punya keahlian yang dicari");
    }

    // Cocok bidang
    if (p.bidang_utama_id === lowongan.bidang_id) {
      skor += 20;
      alasan.push("Bidang utama pekerja sesuai");
    }

    // Cocok jenis kerja
    if (p.kesediaan.includes(lowongan.jenis_kerja)) {
      skor += 15;
      alasan.push("Pekerja bersedia dengan jenis pekerjaan ini");
    }

    if (skor >= 30) {
      hasil.push({
        id: p.pekerja_id,
        nama: p.pekerja?.nama ?? "Pekerja",
        alasan: alasan.join(". ") + ".",
        skor,
      });
    }
  }

  return hasil.sort((a, b) => b.skor - a.skor).slice(0, limit);
}
