/**
 * Tipe data mock Kita Kerja — meniru skema Bagian 7 spec.
 * Semua halaman fase 2 mengimpor tipe dari modul ini.
 * Penamaan kolom sengaja mengikuti skema basis data (snake_case Bahasa Indonesia).
 */

// ============ WILAYAH & TAKSONOMI ============

export type JenisWilayah = "kabupaten" | "kota";

export interface Wilayah {
  id: string;
  nama: string;
  jenis: JenisWilayah;
  provinsi: string;
  /** UMK bulanan dalam rupiah */
  umk: number;
  tahun_umk: number;
}

export interface BidangKerja {
  id: string;
  nama: string;
  /** nama ikon lucide, mis. "hard-hat" */
  ikon: string;
}

export interface KeahlianBaku {
  id: string;
  bidang_id: string;
  nama_baku: string;
  /** sebutan informal yang dinormalisasi ke nama baku */
  alias: string[];
  /** pengali Upah Terang terhadap UMK/26 (tabel spec 1721–1733) */
  pengali_upah: number;
}

// ============ PENGGUNA ============

export type Peran = "pekerja" | "pemberi_kerja" | "pendamping";

export type StatusVerifikasi =
  | "belum"
  | "hp_terverifikasi"
  | "email_terverifikasi"
  | "identitas_terverifikasi";

export interface Pengguna {
  id: string;
  nama: string;
  no_hp: string;
  peran: Peran;
  wilayah_id: string | null;
  url_foto: string | null;
  status_verifikasi: StatusVerifikasi;
  /** id pendamping, bila akun ini didampingi */
  didampingi_oleh: string | null;
  umur?: number;
}

// ============ KARTU KERJA ============

export type JenisKerja = "harian" | "borongan" | "paruh_waktu" | "menginap";

export interface KartuKerja {
  id: string;
  pekerja_id: string;
  /** token publik hex 32 karakter untuk QR /verify/[token] */
  token_publik: string;
  aktif_publik: boolean;
  ringkasan: string | null;
  bidang_utama_id: string | null;
  pengalaman_tahun: number;
  kesediaan: JenisKerja[];
  jangkauan_km: number;
  alat_dimiliki: string[];
  bahasa_terdeteksi: string | null;
  diterbitkan_pada: string | null;
}

export type LevelKeahlian = "pemula" | "terampil" | "ahli";

/**
 * Tiga lapis kepercayaan (CONTEXT.md) — di dunia nyata ini TURUNAN,
 * tidak pernah disimpan. Di mock, nilai dihitung oleh hitungLapis()
 * dari riwayat pekerjaan + penilaian (lihat data.ts).
 */
export type LapisKepercayaan = "terverifikasi" | "dinilai" | "diklaim";

export interface KartuKeahlian {
  id: string;
  kartu_id: string;
  keahlian_id: string | null;
  nama_diajukan: string | null;
  /** sebutan asli pekerja, ditampilkan dalam tanda kutip */
  sebutan_pekerja: string;
  level: LevelKeahlian;
  /** kutipan ucapan asli yang menjadi bukti (anti-halusinasi) */
  kutipan_bukti: string;
  keyakinan: number;
  sumber: "ai" | "manual";
  dikonfirmasi_pekerja: boolean;
  /** lapis kepercayaan — di mock dihitung dari riwayat, lihat hitungLapis() */
  lapis: LapisKepercayaan;
}

// ============ LOWONGAN ============

export type SatuanUpah = "harian" | "bulanan" | "borongan" | "per_jam";

export type StatusLowongan = "draf" | "moderasi" | "tayang" | "terisi" | "ditutup";

export interface Lowongan {
  id: string;
  pemberi_kerja_id: string;
  wilayah_id: string;
  teks_asli: string;
  judul_baku: string;
  bidang_id: string;
  jenis_kerja: JenisKerja;
  jumlah_pekerja: number;
  upah_ditawarkan: number;
  satuan_upah: SatuanUpah;
  lokasi_teks: string;
  mulai: string;
  syarat_tersirat: string[];
  status: StatusLowongan;
  /** keahlian baku yang dibutuhkan */
  keahlian_ids: string[];
  /** jarak dari rumah Pak Warto (km) — untuk demo pencocokan */
  jarak_km: number;
  /** satu baris alasan pencocokan untuk Warto — TANPA skor angka */
  alasan_cocok: string;
}

export type TingkatRisiko = "aman" | "hati_hati" | "berisiko_tinggi";

export interface TemuanSaringan {
  jenis: string;
  /** kutipan persis dari teks lowongan */
  kutipan: string;
  penjelasan: string;
}

export interface SaringanAman {
  id: string;
  lowongan_id: string;
  skor_risiko: number;
  tingkat: TingkatRisiko;
  temuan: TemuanSaringan[];
  pertanyaan_disarankan: string[];
}

// ============ UPAH ============

export interface AcuanUpah {
  id: string;
  keahlian_id: string;
  wilayah_id: string;
  acuan_harian: number;
  metode: "umk_saja" | "umk_dan_lapangan";
  jumlah_laporan: number;
}

export type StatusUpah = "sesuai_acuan" | "sedikit_di_bawah" | "di_bawah_acuan";

// ============ KESEPAKATAN & RIWAYAT ============

export type StatusLamaran = "dilamar" | "diundang" | "ditolak" | "disepakati";

export interface Lamaran {
  id: string;
  lowongan_id: string;
  pekerja_id: string;
  status: StatusLamaran;
  alasan_cocok: string[];
}

export type StatusKesepakatan =
  | "menunggu"
  | "berjalan"
  | "selesai"
  | "batal"
  | "sengketa";

export interface KesepakatanKerja {
  id: string;
  lowongan_id: string;
  pekerja_id: string;
  pemberi_kerja_id: string;
  lingkup: string;
  upah_disepakati: number;
  satuan: SatuanUpah;
  mulai: string;
  selesai: string | null;
  tanggal_bayar_dijanjikan: string;
  status: StatusKesepakatan;
}

export interface Pekerjaan {
  id: string;
  kesepakatan_id: string | null;
  pekerja_id: string;
  pemberi_kerja_id: string;
  /** keahlian utama yang dipakai — dasar lapis Terverifikasi */
  keahlian_id: string;
  judul: string;
  wilayah_id: string;
  upah_diterima: number;
  satuan: SatuanUpah;
  selesai_pada: string;
  dikonfirmasi_selesai_pekerja: boolean;
  dikonfirmasi_selesai_pemberi: boolean;
}

export interface Penilaian {
  id: string;
  pekerjaan_id: string;
  pemberi_kerja_id: string;
  skor: 1 | 2 | 3 | 4 | 5;
  catatan: string | null;
}

// ============ NGOBROL KERJA ============

export interface PutaranWawancara {
  nomor: number;
  pertanyaan: string;
  /** transkrip ucapan pekerja (boleh bahasa Jawa) */
  transkrip: string;
  sinyal_ditangkap: string[];
  dibuat_pada: string;
}
