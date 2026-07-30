/**
 * Helper tampilan untuk data mock Kita Kerja.
 * Semua fungsi murni — aman dipakai di server maupun client component.
 */

import type { SatuanUpah, StatusUpah } from "./types";

const formatterRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** 180000 → "Rp180.000" */
export function formatRupiah(nilai: number): string {
  return formatterRupiah.format(nilai);
}

/** "Warto Sugianto" → "Warto S." — nama belakang disingkat di tampilan publik */
export function inisialkanNamaBelakang(namaLengkap: string): string {
  const bagian = namaLengkap.trim().split(/\s+/);
  if (bagian.length === 1) return bagian[0];
  const terakhir = bagian[bagian.length - 1];
  return `${bagian.slice(0, -1).join(" ")} ${terakhir.charAt(0)}.`;
}

/** "Warto Sugianto" → "WS" — untuk avatar inisial */
export function inisialNama(namaLengkap: string): string {
  const bagian = namaLengkap.trim().split(/\s+/);
  return bagian
    .slice(0, 2)
    .map((b) => b.charAt(0).toUpperCase())
    .join("");
}

const formatterTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "2026-08-03" → "3 Agustus 2026" */
export function formatTanggal(iso: string): string {
  return formatterTanggal.format(new Date(iso));
}

/** 3.2 → "3,2 km" ; 0.4 → "kurang dari 1 km" */
export function jarakTeks(km: number): string {
  if (km < 1) return "kurang dari 1 km";
  return `${km.toFixed(1).replace(".", ",")} km`;
}

const TEKS_SATUAN: Record<SatuanUpah, string> = {
  harian: "/ hari",
  bulanan: "/ bulan",
  borongan: "/ borongan",
  per_jam: "/ jam",
};

/** (180000, 'harian') → "Rp180.000 / hari" */
export function upahTeks(nilai: number, satuan: SatuanUpah): string {
  return `${formatRupiah(nilai)} ${TEKS_SATUAN[satuan]}`;
}

/**
 * Tiga keadaan Upah Terang (spec: statusUpah).
 * sesuai_acuan | sedikit_di_bawah (>= 85% acuan) | di_bawah_acuan
 */
export function statusUpah(ditawarkan: number, acuan: number): StatusUpah {
  if (ditawarkan >= acuan) return "sesuai_acuan";
  if (ditawarkan >= acuan * 0.85) return "sedikit_di_bawah";
  return "di_bawah_acuan";
}

/**
 * Kalimat metode Upah Terang — wajib selalu ditampilkan di sebelah nominal.
 * "Acuan dihitung dari UMK Kota Malang dibagi 26 hari kerja, disesuaikan
 *  dengan jenis pekerjaan."
 */
export function kalimatMetodeAcuan(namaWilayah: string): string {
  return `Acuan dihitung dari UMK ${namaWilayah} dibagi 26 hari kerja, disesuaikan dengan jenis pekerjaan.`;
}
