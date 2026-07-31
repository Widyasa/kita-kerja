/**
 * Tipe tampilan bersama untuk seluruh lapisan data.
 * Semua nama relasi SUDAH diresolusi di server (nama_tampil, wilayah_nama)
 * supaya komponen tampilan tidak perlu melakukan pencarian sendiri.
 */

import type {
  JenisKerja,
  LapisKepercayaan,
  LevelKeahlian,
  SatuanUpah,
  StatusLamaran,
  StatusLowongan,
  StatusVerifikasi,
  TingkatRisiko,
  TemuanSaringan,
} from "@/lib/mock/types";

export interface KeahlianTampil {
  id: string;
  keahlian_id: string | null;
  /** nama_baku bila terpetakan, kalau tidak nama_diajukan/sebutan pekerja */
  nama_tampil: string;
  sebutan_pekerja: string;
  level: LevelKeahlian;
  kutipan_bukti: string;
  sumber: "ai" | "manual";
  dikonfirmasi_pekerja: boolean;
  /** DITURUNKAN dari riwayat — tidak pernah disimpan */
  lapis: LapisKepercayaan;
}

export interface SaringanTampil {
  tingkat: TingkatRisiko;
  temuan: TemuanSaringan[];
  pertanyaan_disarankan: string[];
}

export interface AcuanTampil {
  acuan_harian: number;
  metode: "umk_saja" | "umk_dan_lapangan";
  jumlah_laporan: number;
}

export interface LowonganTampil {
  id: string;
  judul_baku: string;
  teks_asli: string;
  status: StatusLowongan;
  jenis_kerja: JenisKerja | null;
  jumlah_pekerja: number;
  upah_ditawarkan: number | null;
  satuan_upah: SatuanUpah | null;
  lokasi_teks: string | null;
  mulai: string | null;
  syarat_tersirat: string[];
  wilayah_id: string | null;
  wilayah_nama: string | null;
  pemberi_kerja_id: string;
  saringan: SaringanTampil | null;
  acuan: AcuanTampil | null;
  /** satu kalimat, TIDAK PERNAH skor angka */
  alasan_cocok: string | null;
  /** perkiraan garis lurus (haversine) dari kecamatan pekerja ke kecamatan
   * lowongan — null bila salah satu (atau keduanya) belum punya kecamatan_id */
  jarak_km: number | null;
}

export interface RekamJejakPemberi {
  pekerjaan_selesai: number;
  laporan_terbuka: number;
}

export interface RekamJejakPekerja {
  pekerjaan_selesai: number;
  rata_penilaian: number;
  jumlah_penilai: number;
}

export interface CalonTampil {
  lamaran_id: string;
  status: StatusLamaran;
  alasan_cocok: string[];
  pekerja_id: string;
  nama: string;
  wilayah_nama: string | null;
  bidang_nama: string | null;
  pengalaman_tahun: number | null;
  keahlian: KeahlianTampil[];
  rekam_jejak: RekamJejakPekerja;
  kesepakatan_id: string | null;
}

export const LABEL_VERIFIKASI: Record<StatusVerifikasi, string> = {
  identitas_terverifikasi: "Identitas terverifikasi",
  hp_terverifikasi: "Nomor HP terverifikasi",
  belum: "Belum terverifikasi",
};
