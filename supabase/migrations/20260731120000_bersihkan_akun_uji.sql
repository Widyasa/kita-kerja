-- BUG-020 — nama akun uji tampil ke pekerja di lowongan publik.
--
-- Halaman detail lowongan menampilkan "Test Employer E2E" pada bagian
-- "Pemberi kerja", lengkap dengan penanda "Nomor HP terverifikasi" dan
-- "1 pekerjaan selesai dikonfirmasi dua pihak" — sehingga terbaca seperti
-- pemberi kerja sungguhan. Itu satu-satunya lowongan yang tersedia untuk
-- pekerja, jadi hampir pasti terlihat siapa pun yang mencoba demo.
--
-- Akun ini dibuat oleh test end-to-end yang berjalan terhadap database,
-- bukan oleh supabase/seed.ts — namanya tidak ada di repo sama sekali.
-- Karena itu perbaikannya berupa migrasi data, bukan perubahan kode.
--
-- Akunnya TIDAK dihapus supaya lowongan, lamaran, dan kesepakatan yang
-- menggantung padanya tetap utuh; hanya namanya yang dibuat wajar.

BEGIN;

UPDATE pengguna
   SET nama = 'CV Karya Mandiri'
 WHERE peran = 'pemberi_kerja'
   AND (nama ILIKE '%test%' OR nama ILIKE '%e2e%' OR nama ILIKE '%dummy%');

UPDATE pengguna
   SET nama = 'Pekerja Uji Coba'
 WHERE peran = 'pekerja'
   AND (nama ILIKE '%test%' OR nama ILIKE '%e2e%' OR nama ILIKE '%dummy%');

COMMIT;
