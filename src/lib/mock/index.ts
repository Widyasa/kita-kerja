/**
 * Modul mock sentral Kita Kerja (fase 2 frontend statis).
 *
 * Pakai:  import { kartuWarto, lowongan, formatRupiah, ... } from "@/lib/mock";
 *
 * - types.ts  : semua tipe meniru skema Bagian 7 spec
 * - data.ts   : data awal Bagian 17 (wilayah UMK 2026, taksonomi, persona,
 *               15 lowongan + Saringan Aman, riwayat 47 pekerjaan Pak Warto)
 * - utils.ts  : formatRupiah, inisialkanNamaBelakang, formatTanggal, jarakTeks,
 *               upahTeks, statusUpah, kalimatMetodeAcuan
 */

export * from "./types";
export * from "./data";
export * from "./utils";
