-- Initial schema for Kita Kerja (PROMPT Bagian 7)
-- Order note: lapor_upah references pekerjaan(id), so it is created after
-- pekerjaan and penilaian.

-- Extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ WILAYAH & TAKSONOMI ============
CREATE TABLE IF NOT EXISTS wilayah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  jenis text NOT NULL CHECK (jenis IN ('kabupaten', 'kota')),
  provinsi text NOT NULL,
  umk integer NOT NULL,
  tahun_umk integer NOT NULL
);

CREATE TABLE IF NOT EXISTS bidang_kerja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL UNIQUE,
  ikon text
);

CREATE TABLE IF NOT EXISTS keahlian_baku (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang_id uuid NOT NULL REFERENCES bidang_kerja(id) ON DELETE CASCADE,
  nama_baku text NOT NULL UNIQUE,
  alias text[] DEFAULT '{}',
  pengali_upah numeric(4,2) NOT NULL DEFAULT 1.00
);

CREATE TABLE IF NOT EXISTS konversi_satuan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  konteks text NOT NULL,
  satuan_lokal text NOT NULL,
  faktor numeric NOT NULL,
  satuan_baku text NOT NULL,
  UNIQUE (konteks, satuan_lokal)
);

-- ============ PENGGUNA ============
CREATE TABLE IF NOT EXISTS pengguna (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama text NOT NULL,
  no_hp text NOT NULL UNIQUE,
  peran text NOT NULL CHECK (peran IN ('pekerja', 'pemberi_kerja', 'pendamping')),
  wilayah_id uuid REFERENCES wilayah(id),
  url_foto text,
  status_verifikasi text NOT NULL DEFAULT 'belum' CHECK (status_verifikasi IN ('belum', 'hp_terverifikasi', 'identitas_terverifikasi')),
  didampingi_oleh uuid REFERENCES pengguna(id)
);

-- ============ KARTU KERJA ============
CREATE TABLE IF NOT EXISTS kartu_kerja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pekerja_id uuid NOT NULL UNIQUE REFERENCES pengguna(id) ON DELETE CASCADE,
  token_publik text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  aktif_publik boolean NOT NULL DEFAULT true,
  ringkasan text,
  bidang_utama_id uuid REFERENCES bidang_kerja(id),
  pengalaman_tahun integer NOT NULL DEFAULT 0 CHECK (pengalaman_tahun BETWEEN 0 AND 60),
  kesediaan text[] DEFAULT '{}',
  jangkauan_km integer NOT NULL DEFAULT 15 CHECK (jangkauan_km BETWEEN 1 AND 200),
  alat_dimiliki text[] DEFAULT '{}',
  bahasa_terdeteksi text[] DEFAULT '{}',
  diterbitkan_pada timestamptz
);

CREATE TABLE IF NOT EXISTS kartu_keahlian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kartu_id uuid NOT NULL REFERENCES kartu_kerja(id) ON DELETE CASCADE,
  keahlian_id uuid REFERENCES keahlian_baku(id),
  nama_diajukan text,
  sebutan_pekerja text,
  level text NOT NULL DEFAULT 'terampil' CHECK (level IN ('pemula', 'terampil', 'ahli')),
  kutipan_bukti text NOT NULL CHECK (length(trim(kutipan_bukti)) >= 3),
  keyakinan numeric(3,2) NOT NULL DEFAULT 0.50 CHECK (keyakinan BETWEEN 0 AND 1),
  sumber text NOT NULL DEFAULT 'ai' CHECK (sumber IN ('ai', 'manual')),
  dikonfirmasi_pekerja boolean NOT NULL DEFAULT false,
  CHECK (keahlian_id IS NOT NULL OR nama_diajukan IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS sesi_wawancara (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pekerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'berjalan' CHECK (status IN ('berjalan', 'menyusun', 'selesai', 'gagal', 'manual')),
  putaran jsonb NOT NULL DEFAULT '[]',
  jumlah_putaran integer NOT NULL DEFAULT 0 CHECK (jumlah_putaran <= 6),
  hasil_ekstraksi jsonb,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diperbarui_pada timestamptz NOT NULL DEFAULT now()
);

-- ============ LOWONGAN ============
CREATE TABLE IF NOT EXISTS lowongan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pemberi_kerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  wilayah_id uuid REFERENCES wilayah(id),
  teks_asli text NOT NULL,
  judul_baku text,
  bidang_id uuid REFERENCES bidang_kerja(id),
  jenis_kerja text CHECK (jenis_kerja IN ('harian', 'borongan', 'paruh_waktu', 'menginap')),
  jumlah_pekerja integer NOT NULL DEFAULT 1,
  upah_ditawarkan integer,
  satuan_upah text CHECK (satuan_upah IN ('harian', 'bulanan', 'borongan', 'per_jam')),
  lokasi_teks text,
  lat numeric,
  lng numeric,
  mulai date,
  syarat_tersirat text[] DEFAULT '{}',
  kelengkapan numeric(3,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'draf' CHECK (status IN ('draf', 'moderasi', 'tayang', 'terisi', 'ditutup'))
);

CREATE TABLE IF NOT EXISTS lowongan_keahlian (
  lowongan_id uuid NOT NULL REFERENCES lowongan(id) ON DELETE CASCADE,
  keahlian_id uuid NOT NULL REFERENCES keahlian_baku(id) ON DELETE CASCADE,
  wajib boolean NOT NULL DEFAULT true,
  PRIMARY KEY (lowongan_id, keahlian_id)
);

CREATE TABLE IF NOT EXISTS saringan_aman (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lowongan_id uuid NOT NULL UNIQUE REFERENCES lowongan(id) ON DELETE CASCADE,
  skor_risiko integer NOT NULL CHECK (skor_risiko BETWEEN 0 AND 100),
  tingkat text NOT NULL CHECK (tingkat IN ('aman', 'hati_hati', 'berisiko_tinggi')),
  temuan jsonb NOT NULL DEFAULT '[]',
  pertanyaan_disarankan text[] DEFAULT '{}',
  skor_ai integer NOT NULL DEFAULT 0,
  skor_aturan integer NOT NULL DEFAULT 0,
  model text,
  diperiksa_pada timestamptz NOT NULL DEFAULT now()
);

-- ============ UPAH ============
CREATE TABLE IF NOT EXISTS acuan_upah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keahlian_id uuid NOT NULL REFERENCES keahlian_baku(id) ON DELETE CASCADE,
  wilayah_id uuid NOT NULL REFERENCES wilayah(id) ON DELETE CASCADE,
  acuan_harian integer NOT NULL,
  metode text NOT NULL,
  jumlah_laporan integer NOT NULL DEFAULT 0,
  UNIQUE (keahlian_id, wilayah_id)
);

-- ============ KESEPAKATAN & RIWAYAT ============
CREATE TABLE IF NOT EXISTS lamaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lowongan_id uuid NOT NULL REFERENCES lowongan(id) ON DELETE CASCADE,
  pekerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'dilamar' CHECK (status IN ('dilamar', 'diundang', 'ditolak', 'disepakati')),
  alasan_cocok jsonb,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lowongan_id, pekerja_id)
);

CREATE TABLE IF NOT EXISTS kesepakatan_kerja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lowongan_id uuid NOT NULL REFERENCES lowongan(id) ON DELETE CASCADE,
  pekerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  pemberi_kerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  lingkup text NOT NULL,
  upah_disepakati integer NOT NULL,
  satuan text NOT NULL,
  mulai date,
  selesai date,
  tanggal_bayar_dijanjikan date NOT NULL,
  otp_pekerja_pada timestamptz,
  otp_pemberi_pada timestamptz,
  status text NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'berjalan', 'selesai', 'batal', 'sengketa'))
);

CREATE TABLE IF NOT EXISTS pekerjaan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kesepakatan_id uuid NOT NULL UNIQUE REFERENCES kesepakatan_kerja(id) ON DELETE CASCADE,
  pekerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  pemberi_kerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  dikonfirmasi_selesai_pekerja boolean NOT NULL DEFAULT false,
  dikonfirmasi_selesai_pemberi boolean NOT NULL DEFAULT false,
  selesai_pada timestamptz
);

CREATE TABLE IF NOT EXISTS penilaian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pekerjaan_id uuid NOT NULL UNIQUE REFERENCES pekerjaan(id) ON DELETE CASCADE,
  pemberi_kerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  skor integer NOT NULL CHECK (skor BETWEEN 1 AND 5),
  catatan text,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lapor_upah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pekerjaan_id uuid REFERENCES pekerjaan(id) ON DELETE SET NULL,
  pekerja_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  keahlian_id uuid REFERENCES keahlian_baku(id),
  wilayah_id uuid REFERENCES wilayah(id),
  upah_diterima integer NOT NULL,
  satuan text NOT NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS laporan_masalah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pekerjaan_id uuid REFERENCES pekerjaan(id) ON DELETE SET NULL,
  lowongan_id uuid REFERENCES lowongan(id) ON DELETE SET NULL,
  pelapor_id uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  jenis text NOT NULL CHECK (jenis IN ('upah_tidak_dibayar', 'kondisi_tidak_sesuai', 'lowongan_palsu', 'lainnya')),
  status text NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'ditindak', 'selesai')),
  keterangan text,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- ============ OPERASIONAL AI ============
CREATE TABLE IF NOT EXISTS cache_normalisasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kunci text NOT NULL UNIQUE,
  keahlian_id uuid REFERENCES keahlian_baku(id),
  hasil jsonb NOT NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS log_ai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id uuid REFERENCES pengguna(id) ON DELETE SET NULL,
  jenis text NOT NULL CHECK (jenis IN ('wawancara', 'baca_lowongan', 'saringan', 'normalisasi', 'profil')),
  model text NOT NULL,
  latensi_ms integer,
  token_masuk integer,
  token_keluar integer,
  status text NOT NULL CHECK (status IN ('sukses', 'gagal', 'kuota_habis', 'ditolak_validasi')),
  catatan text,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kuota_harian (
  tanggal date PRIMARY KEY DEFAULT now(),
  terpakai integer NOT NULL DEFAULT 0
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_lowongan_status ON lowongan(status) WHERE status = 'tayang';
CREATE INDEX IF NOT EXISTS idx_lowongan_wilayah ON lowongan(wilayah_id);
CREATE INDEX IF NOT EXISTS idx_kartu_kerja_token ON kartu_kerja(token_publik);
CREATE INDEX IF NOT EXISTS idx_pekerjaan_pekerja ON pekerjaan(pekerja_id);
CREATE INDEX IF NOT EXISTS idx_log_ai_created ON log_ai(dibuat_pada);
