-- BUG-001 — pindah kunci akun dari nomor HP ke email.
--
-- Sebelumnya OTP SMS dijalankan dalam DEMO_MODE yang menerima kode apa pun,
-- sehingga siapa saja yang tahu nomor HP seseorang bisa masuk ke akunnya.
-- Email OTP dipilih karena Supabase menyediakannya tanpa biaya provider,
-- sehingga verifikasi asli bisa diaktifkan tanpa menunggu langganan SMS.
--
-- Nomor HP TIDAK dihapus: masih dipakai pemberi kerja untuk menghubungi
-- pekerja. Statusnya turun dari kunci akun menjadi data kontak biasa,
-- karena itu NOT NULL dan UNIQUE-nya dilepas.

BEGIN;

-- 1. Kolom email sebagai kunci akun yang baru.
ALTER TABLE pengguna ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill dari auth.users supaya akun lama (termasuk hasil seed) tetap
--    bisa masuk setelah perubahan ini.
UPDATE pengguna p
   SET email = u.email
  FROM auth.users u
 WHERE u.id = p.id
   AND p.email IS DISTINCT FROM u.email;

-- 3. Baris tanpa email tidak akan bisa masuk; beri penanda agar mudah
--    ditemukan operator, bukan dihapus diam-diam.
UPDATE pengguna
   SET email = 'tanpa-email+' || id::text || '@kitakerja.invalid'
 WHERE email IS NULL;

ALTER TABLE pengguna ALTER COLUMN email SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pengguna_email_unik'
  ) THEN
    ALTER TABLE pengguna ADD CONSTRAINT pengguna_email_unik UNIQUE (email);
  END IF;
END $$;

-- 4. Nomor HP turun jadi data kontak opsional.
ALTER TABLE pengguna ALTER COLUMN no_hp DROP NOT NULL;

DO $$
DECLARE
  nama_constraint text;
BEGIN
  SELECT conname INTO nama_constraint
    FROM pg_constraint
   WHERE conrelid = 'pengguna'::regclass
     AND contype = 'u'
     AND pg_get_constraintdef(oid) ILIKE '%(no_hp)%';
  IF nama_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE pengguna DROP CONSTRAINT %I', nama_constraint);
  END IF;
END $$;

-- Nomor HP tetap unik bila diisi, supaya dua akun tak saling klaim nomor.
CREATE UNIQUE INDEX IF NOT EXISTS pengguna_no_hp_unik
  ON pengguna (no_hp) WHERE no_hp IS NOT NULL;

-- 5. status_verifikasi mendapat nilai baru untuk email.
ALTER TABLE pengguna DROP CONSTRAINT IF EXISTS pengguna_status_verifikasi_check;
ALTER TABLE pengguna ADD CONSTRAINT pengguna_status_verifikasi_check
  CHECK (status_verifikasi IN (
    'belum',
    'email_terverifikasi',
    'hp_terverifikasi',
    'identitas_terverifikasi'
  ));

COMMIT;
