/**
 * Mesin acuan upah — deterministik UMK × pengali.
 * AI tidak pernah menyentuh angka upah.
 */

import { createServiceClient } from "@/lib/supabase/server-client";

const HARI_KERJA_PER_BULAN = 26;

export interface AcuanUpahResult {
  acuan_harian: number;
  metode: "umk_saja" | "umk_dan_lapangan";
  jumlah_laporan: number;
  sumber: string;
}

/**
 * Hitung acuan upah harian untuk keahlian di wilayah tertentu.
 */
export async function hitungAcuanUpah(
  keahlianId: string,
  wilayahId: string
): Promise<AcuanUpahResult | null> {
  const supabase = await createServiceClient();

  // Ambil UMK wilayah
  const { data: wilayah } = await supabase
    .from("wilayah")
    .select("nama, umk")
    .eq("id", wilayahId)
    .single();

  if (!wilayah) return null;

  // Ambil pengali keahlian
  const { data: keahlian } = await supabase
    .from("keahlian_baku")
    .select("pengali_upah")
    .eq("id", keahlianId)
    .single();

  if (!keahlian) return null;

  // Cek apakah sudah ada data lapangan
  const { data: acuan } = await supabase
    .from("acuan_upah")
    .select("acuan_harian, metode, jumlah_laporan")
    .eq("keahlian_id", keahlianId)
    .eq("wilayah_id", wilayahId)
    .single();

  const acuanUmk = Math.round((wilayah.umk / HARI_KERJA_PER_BULAN) * keahlian.pengali_upah);

  if (acuan) {
    return {
      acuan_harian: acuan.acuan_harian,
      metode: acuan.metode,
      jumlah_laporan: acuan.jumlah_laporan,
      sumber: `UMK ${wilayah.nama} × ${keahlian.pengali_upah}`,
    };
  }

  // Belum ada data lapangan, pakai UMK saja
  return {
    acuan_harian: acuanUmk,
    metode: "umk_saja",
    jumlah_laporan: 0,
    sumber: `UMK ${wilayah.nama} ÷ ${HARI_KERJA_PER_BULAN} × ${keahlian.pengali_upah}`,
  };
}
