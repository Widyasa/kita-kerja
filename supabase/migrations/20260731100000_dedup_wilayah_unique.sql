-- BUG-010 — opsi wilayah berlipat di dropdown profil pekerja dan form lowongan.
--
-- Penyebabnya supabase/seed.ts memakai .insert() dengan uuid() baru setiap
-- dijalankan, sedangkan tabel wilayah tidak punya unique constraint. Tiap
-- seed menambah satu set wilayah baru: terpantau 3x, lalu 5x, lalu 6x
-- (37 opsi untuk 6 wilayah). Akibatnya pengguna tak bisa tahu mana yang
-- benar, dan pilihan berbeda memecah data pencocokan lokasi.
--
-- Bandingkan bidang_kerja yang sudah punya `nama text NOT NULL UNIQUE`
-- dan karenanya tidak pernah menggandakan.
--
-- Migrasi ini: (1) memilih satu baris kanonik per (nama, provinsi),
-- (2) mengalihkan seluruh foreign key ke baris kanonik itu,
-- (3) menghapus sisa duplikat, (4) memasang unique constraint.

BEGIN;

-- 1. Baris kanonik = id terkecil per (nama, provinsi), agar deterministik.
CREATE TEMP TABLE wilayah_kanonik ON COMMIT DROP AS
SELECT
  w.id                     AS id_lama,
  MIN(w2.id::text)::uuid   AS id_kanonik
FROM wilayah w
JOIN wilayah w2
  ON w2.nama = w.nama
 AND w2.provinsi = w.provinsi
GROUP BY w.id;

-- 2. Alihkan seluruh referensi ke baris kanonik.
UPDATE pengguna p
   SET wilayah_id = k.id_kanonik
  FROM wilayah_kanonik k
 WHERE p.wilayah_id = k.id_lama
   AND p.wilayah_id <> k.id_kanonik;

UPDATE lowongan l
   SET wilayah_id = k.id_kanonik
  FROM wilayah_kanonik k
 WHERE l.wilayah_id = k.id_lama
   AND l.wilayah_id <> k.id_kanonik;

UPDATE acuan_upah a
   SET wilayah_id = k.id_kanonik
  FROM wilayah_kanonik k
 WHERE a.wilayah_id = k.id_lama
   AND a.wilayah_id <> k.id_kanonik;

UPDATE lapor_upah lu
   SET wilayah_id = k.id_kanonik
  FROM wilayah_kanonik k
 WHERE lu.wilayah_id = k.id_lama
   AND lu.wilayah_id <> k.id_kanonik;

UPDATE kecamatan kc
   SET wilayah_id = k.id_kanonik
  FROM wilayah_kanonik k
 WHERE kc.wilayah_id = k.id_lama
   AND kc.wilayah_id <> k.id_kanonik;

-- 3. Buang duplikat acuan_upah yang mungkin muncul setelah pengalihan,
--    supaya penghapusan wilayah tidak tertahan constraint turunan.
DELETE FROM acuan_upah a
 USING acuan_upah b
 WHERE a.ctid > b.ctid
   AND a.wilayah_id   = b.wilayah_id
   AND a.keahlian_id IS NOT DISTINCT FROM b.keahlian_id;

-- 4. Hapus wilayah duplikat yang sudah tidak direferensikan.
DELETE FROM wilayah w
 USING wilayah_kanonik k
 WHERE w.id = k.id_lama
   AND w.id <> k.id_kanonik;

-- 5. Cegah terulang. Seed juga diubah memakai upsert onConflict.
ALTER TABLE wilayah
  ADD CONSTRAINT wilayah_nama_provinsi_unik UNIQUE (nama, provinsi);

COMMIT;
