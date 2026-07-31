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
