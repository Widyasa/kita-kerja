/**
 * Helper tampilan kecil untuk domain kartu (halaman kartu & cetak).
 * Fungsi murni — aman di server maupun client.
 */

import type { KeahlianTampil } from "@/lib/data/types";

const formatterBulan = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "numeric",
});

/** "2026-06-27" → "Jun 2026" — untuk baris riwayat pekerjaan */
export function formatBulanTahun(iso: string): string {
  return formatterBulan.format(new Date(iso));
}

/**
 * Nama pendek keahlian untuk kartu saku 85×54mm (ruang sangat sempit).
 * Fallback: nama diajukan, lalu sebutan asli pekerja.
 */
const NAMA_PENDEK: Record<string, string> = {
  "kb-keramik": "Keramik",
  "kb-plester": "Plesteran",
  "kb-tukang-umum": "Tukang umum",
  "kb-cor": "Cor",
  "kb-bata": "Pasang bata",
  "kb-cat": "Pengecatan",
};

export function namaPendekKeahlian(keahlian: KeahlianTampil): string {
  return (
    (keahlian.keahlian_id && NAMA_PENDEK[keahlian.keahlian_id]) ||
    keahlian.nama_tampil ||
    keahlian.sebutan_pekerja
  );
}

/**
 * BUG-032 — nilai penilaian untuk ditampilkan.
 *
 * Sebelumnya kartu menulis "0,0" saat belum ada penilai, sedangkan blok
 * ringkasan di halaman yang sama menulis "—". Selain tidak konsisten,
 * "0,0" terbaca seperti nilai buruk padahal artinya belum dinilai — itu
 * merugikan pekerja yang menunjukkan kartunya ke calon pemberi kerja.
 *
 * Satu sumber kebenaran supaya kartu, lembar A5, dan halaman verifikasi
 * tidak lagi merender hal yang sama dengan cara berbeda.
 */
export function formatPenilaian(
  rataRata: number,
  jumlahPenilai: number,
): string {
  if (jumlahPenilai <= 0) return "—";
  return rataRata.toFixed(1).replace(".", ",");
}
