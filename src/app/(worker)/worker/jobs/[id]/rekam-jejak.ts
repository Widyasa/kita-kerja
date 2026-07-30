import type { StatusVerifikasi } from "@/lib/mock";

/**
 * Rekam jejak FAKTUAL pemberi kerja (bukan bintang):
 * jumlah pekerjaan selesai dihitung dari riwayat mock; laporan terbuka
 * adalah data demo lokal halaman ini.
 */

/** Jumlah laporan masalah yang belum selesai per pemberi kerja (mock demo). */
export const LAPORAN_TERBUKA: Record<string, number> = {
  "u-hadi": 0,
  "u-rina": 0,
  "u-eko": 0,
  "u-sari": 1,
  "u-dhika": 0,
};

export const LABEL_VERIFIKASI: Record<StatusVerifikasi, string> = {
  identitas_terverifikasi: "Identitas terverifikasi",
  hp_terverifikasi: "Nomor HP terverifikasi",
  belum: "Belum terverifikasi",
};
