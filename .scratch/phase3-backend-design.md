# Desain Backend — Fase 3 Kita Kerja

Tanggal: 2026-07-30  
Tujuan: menyelaraskan fondasi (skema, RLS, auth, seed) dan enam issue fase-3 backend (#12–#17) sebelum implementasi dimulai.

---

## 1. Konteks & tujuan

Fase 3 membangun logika server untuk:
- AI core (klien Gemini tunggal, penjaga keluaran, kuota, fallback, log_ai).
- Wawancara suara (state machine, upload audio ke Storage dulu, auto-delete).
- Lowongan (ekstrak teks bebas, Saringan Aman, moderasi, geocoding).
- Mesin deterministik (acuan upah, pencocokan+alasan, normalisasi+cache).
- Kartu Kerja (terbitkan, endpoint publik [token], QR SVG server, lapis kepercayaan turunan).
- Kesepakatan Kerja (buat via lamaran, OTP dua pihak, selesai, penilaian, lapor upah, laporan masalah).

Fase 3 bergantung pada fondasi dari fase 1:
- Skema basis data (Bagian 7).
- RLS + fungsi `selesaikan_pekerjaan` (Bagian 8).
- Autentikasi 3 peran + middleware proteksi rute (issue #4).
- Data awal / seed (issue #3).

Keputusan: fondasi dibangun dulu, kemudian API fase-3 dibuat sebagai *vertical slices* sesuai urutan dependensi.

---

## 2. Ruang lingkup & batasan

**Masuk lingkup:**
- Semua migrasi Supabase (DDL, RLS policies, function, indexes).
- Konversi mock data yang sudah ada (`src/lib/mock/`) menjadi seed SQL/TS runner.
- Middleware Next.js untuk proteksi rute berdasarkan peran.
- AI core lengkap: `lib/ai/klien-gemini.ts`, `penjaga.ts`, `kuota.ts`, prompt files, skema Zod cermin.
- Semua endpoint `/api/...` sesuai Bagian 9.
- Integrasi Supabase Storage untuk audio (private bucket, signed URL).

**Tidak masuk lingkup sekarang:**
- UI halaman lengkap (sudah ada mock/static di fase 2; hanya wiring ke API).
- Fitur demo interaktif penuh (panel demo ada, tapi logika reset/persona diurus setelah backend stabil).
- Pengujian end-to-end otomatis (dibuat di fase akhir).

---

## 3. Arsitektur tingkat tinggi

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router (Route Handlers / Server Actions)    │
│  - middleware.ts → cek sesi & peran                         │
│  - api/... → validasi Zod → kuota → AI/DB/Storage           │
├─────────────────────────────────────────────────────────────┤
│  lib/ai/                                                    │
│  - klien-gemini.ts   : satu pintu ke Gemini                 │
│  - penjaga.ts        : validasi & filter keluaran AI        │
│  - kuota.ts          : cek kuota global/per-user            │
│  - prompt-*.ts       : instruksi per fitur                  │
│  - skema-keluaran.ts : Zod mirror responseSchema            │
├─────────────────────────────────────────────────────────────┤
│  lib/mesin/                                                 │
│  - acuan-upah.ts     : deterministik UMK × pengali          │
│  - pencocokan.ts     : skor + alasan tanpa embedding        │
│  - risiko.ts         : kombinasi aturan + AI                │
├─────────────────────────────────────────────────────────────┤
│  lib/supabase/                                              │
│  - klien-server.ts   : service-role / RLS-aware             │
│  - klien-browser.ts  : anon key untuk client                │
├─────────────────────────────────────────────────────────────┤
│  Supabase                                                   │
│  - Postgres (skema + RLS + function selesaikan_pekerjaan)   │
│  - Auth (OTP/phone, 3 peran di tabel pengguna)              │
│  - Storage (private bucket audio)                           │
└─────────────────────────────────────────────────────────────┘
```

Semua panggilan Gemini hanya dari `lib/ai/klien-gemini.ts`. Tidak ada file lain yang boleh memanggil Gemini secara langsung.

---

## 4. Model data (ringkasan)

Implementasi mengikuti Bagian 7 PROMPT. Tabel utama:

| Grup | Tabel |
|------|-------|
| Wilayah & taksonomi | `wilayah`, `bidang_kerja`, `keahlian_baku`, `konversi_satuan` |
| Pengguna | `pengguna` (FK `auth.users`) |
| Kartu Kerja | `kartu_kerja`, `kartu_keahlian`, `sesi_wawancara` |
| Lowongan | `lowongan`, `lowongan_keahlian`, `saringan_aman` |
| Upah | `acuan_upah`, `lapor_upah` |
| Riwayat | `lamaran`, `kesepakatan_kerja`, `pekerjaan`, `penilaian`, `laporan_masalah` |
| AI & kuota | `cache_normalisasi`, `log_ai`, `kuota_harian` |

**Kunci integritas:**
- `kartu_keahlian.kutipan_bukti` NOT NULL, minimal 3 karakter.
- `sesi_wawancara.jumlah_putaran <= 6` (hard stop DB).
- `pekerjaan` tidak punya policy INSERT/UPDATE/DELETE — hanya ditulis via fungsi `selesaikan_pekerjaan()`.
- `penilaian` hanya INSERT oleh pemberi kerja pada pekerjaan sendiri yang sudah selesai; tidak ada UPDATE/DELETE.

---

## 5. RLS & fungsi `selesaikan_pekerjaan`

RLS diaktifkan pada semua tabel user-facing. Ringkasan kebijakan:
- `pengguna`: select/update milik sendiri.
- `kartu_kerja`, `kartu_keahlian`, `sesi_wawancara`: milik pekerja sendiri.
- `lowongan`: pemberi kerja boleh semua; publik/anonymous hanya `status = 'tayang'`.
- `saringan_aman`: publik read untuk lowongan tayang; tulis via service role.
- `lamaran`: pekerja & pemilik lowongan boleh lihat; insert hanya sebagai pekerja.
- `kesepakatan_kerja`: hanya kedua belah pihak.
- `pekerjaan`: select untuk kedua belah pihak; **tidak ada write policy**.
- `penilaian`: select all; insert oleh pemberi kerja pada pekerjaan selesai miliknya.

`selesaikan_pekerjaan(p_kesepakatan_id uuid, p_pihak text)`:
- SECURITY DEFINER, `search_path = public`.
- Cek kesepakatan ada, status `berjalan`, kedua OTP sudah di-stamp.
- Cek pemanggil adalah pekerja atau pemberi kerja terkait.
- Insert `pekerjaan` (on conflict do nothing).
- Set flag `dikofirmasi_selesai_pekerja` atau `dikonfirmasi_selesai_pemberi`.
- Kalau kedua flag true: set `selesai_pada = now()`, ubah kesepakatan jadi `selesai`.

---

## 6. Autentikasi & proteksi rute

- Supabase Auth menggunakan nomor HP + OTP.
- Peran disimpan di `pengguna.peran` ('pekerja' | 'pemberi_kerja' | 'pendamping').
- `middleware.ts`:
  - Membaca sesi dari cookie Supabase.
  - `/worker/*` → hanya `pekerja`.
  - `/employer/*` → hanya `pemberi_kerja`.
  - `/companion/*` → hanya `pendamping`.
  - `/demo` → hanya bila `DEMO_MODE=true`.
  - `/api/*` → validasi sesi untuk route yang memerlukan; publik endpoint (`/api/cards/[token]`) boleh tanpa login.
- Helper server `requireSession()` dan `requireRole(role)` di `lib/auth/server.ts`.

---

## 7. AI core

### 7.1 Klien Gemini (`lib/ai/klien-gemini.ts`)

Satu fungsi publik:
```ts
await callGemini<T>({
  jenis: 'wawancara' | 'baca_lowongan' | 'saringan' | 'normalisasi' | 'profil',
  promptParts: Content[],
  responseSchema: object,        // Gemini responseSchema
  zodSchema: ZodSchema<T>,       // mirror validasi server
  temperature: 0.1 | 0.6,
  userId?: string,
}): Promise<{ ok: true; data: T } | { ok: false; kode: ...; pesan_pengguna: string }>
```

Alur internal:
1. `assertGeminiConfig()` — cek env.
2. `checkQuota(jenis, userId)` — tolak atau tier hemat.
3. Panggil Gemini SDK (`@google/genai`) dengan `responseMimeType: 'application/json'`.
4. Parse JSON; validasi `zodSchema`.
5. Log ke `log_ai` (model, latensi, token, status).
6. Fallback ladder: retry 1× → prompt sederhana → graceful degrade (`JALUR_MANUAL`).

Model dari env:
- `GEMINI_MODEL` untuk inference utama.
- `GEMINI_MODEL_LIGHT` untuk normalisasi taksonomi.

### 7.2 Penjaga (`lib/ai/penjaga.ts`)

Pipeline selalu dijalankan pada keluaran AI:
1. Zod parse.
2. Buang keahlian dengan `kutipan_bukti` < 3 karakter.
3. Verifikasi setiap kutipan muncul dalam transkrip gabungan (normalisasi longgar, reject jika overlap token < 60%).
4. Klem level oleh `keyakinan`: ≥0.75 → pertahankan; 0.5–0.75 → 'terampil'; <0.5 → 'pemula'.
5. Maksimal 12 keahlian.
6. Bersihkan pola nominal (Rp..., ribu/rb/juta/jt/k, angka ≥5 digit) menjadi '—'.
7. Klem `pengalaman_tahun` 0–60, `jangkauan_km` 1–200.

### 7.3 Kuota (`lib/ai/kuota.ts`)

- Global harian: tabel `kuota_harian`.
  - `< 1200`: normal.
  - `1200–1400`: hemat (saringan & normalisasi cache/alias only; wawancara tetap jalan).
  - `> 1400`: manual-only dengan pesan ramah.
- Per pengguna per jam: 20 panggilan AI (dari `log_ai` dalam 1 jam terakhir).
- Wawancara: 3 sesi/hari per pengguna.
- Rate 10 req/menit per pengguna.

Pesan selalu bahasa Indonesia sederhana, tidak pernah error teknis.

### 7.4 Logging

Setiap panggilan AI masuk `log_ai`:
- `pengguna_id`, `jenis`, `model`, `latensi_ms`, `token_masuk`, `token_keluar`, `status`, `catatan`.
- Status: 'sukses' | 'gagal' | 'kuota_habis' | 'ditolak_validasi'.

---

## 8. API endpoint design

### 8.1 Wawancara (`/api/ai/wawancara/*`)

- `POST /mulai` — buat `sesi_wawancara` (status `berjalan`), kembalikan pertanyaan pertama.
- `POST /jawab` — body `{ sesi_id, path_audio, mime }`. Server baca audio dari Storage (service role), kirim ke Gemini, simpan transkrip & pertanyaan berikutnya ke `putaran` JSONB.
- `POST /selesai` — body `{ sesi_id }`. Setelah ≥3 putaran, komposisi profil, jalankan penjaga, insert `kartu_keahlian` sementara (status menyusun), hapus audio sesuai ADR-0003.

Audio:
- Client upload langsung ke Storage private bucket sebelum memanggil API.
- Server hanya menerima `path` dan `mime` (tidak base64).
- Dukung `audio/webm;codecs=opus` dan `audio/mp4`.
- Maksimal 60 detik / 8 MB.

### 8.2 Lowongan (`/api/ai/lowongan/*`)

- `POST /ekstrak` — input teks bebas atau path audio. Output: struktur lowongan, syarat tersirat, yang belum jelas, kelengkapan deterministik. Tidak boleh menciptakan upah/tanggal jika tidak ada.
- `POST /saring` — input `lowongan_id`. Gabungan `skor_ai` (0–60) + `skor_aturan` (0–40). Cache oleh `sha256(teks_asli)`. Jika ≥60, status lowongan jadi `moderasi` dengan daftar yang perlu diperbaiki.

Geocoding:
- Nominatim dipanggil sekali saat konfirmasi lowongan.
- Hasil `lat/lng` dan kecamatan disimpan.
- Fallback ke centroid kecamatan yang di-seed (ADR-0002).

### 8.3 Mesin (`/api/cocok`, `/api/acuan-upah`)

- `GET /acuan-upah?keahlian=...&wilayah=...` — acuan harian + metode + jumlah laporan.
- `GET /cocok?pekerja=...` atau `?lowongan=...` — daftar lowongan/kartu yang cocok dengan alasan manusia.

### 8.4 Kartu (`/api/cards/*`)

- `POST /issue` — pekerja konfirmasi keahlian, set `diterbitkan_pada`, generate `token_publik` (random), QR SVG.
- `GET /[token]` — publik, service role, explicit column list, rate limit per IP, noindex. Data yang sama untuk token tidak aktif & tidak dikenal.

### 8.5 Kesepakatan (`/api/agreements/*`, `/api/jobs/complete`, `/api/wages/report`)

- `POST /agreements/create` — wajib ada baris `lamaran`. Insert `kesepakatan_kerja` status `menunggu`.
- `POST /agreements/otp` — `aksi: 'kirim'|'verifikasi'`. Stamp `otp_pekerja_pada` / `otp_pemberi_pada`. Status jadi `berjalan` hanya setelah keduanya.
- `POST /jobs/complete` — panggil `selesaikan_pekerjaan()`; kembalikan apakah pekerjaan sudah selesai.
- `POST /wages/report` — insert `lapor_upah` untuk memperkaya median.
- `POST /problems/report` — insert `laporan_masalah`.

---

## 9. Keamanan & privasi

- `GEMINI_API_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` hanya di server; tidak ada di client bundle.
- Verifikasi publik menggunakan token random; tidak ada ID berurutan.
- Audio di bucket private; tidak pernah URL publik.
- `pekerjaan` hanya bisa ditulis via fungsi; penilaian immutable.
- Setiap input divalidasi Zod di boundary server.
- Endpoint AI memiliki rate limit.

---

## 10. Seed data

Sumber: `src/lib/mock/data.ts` dan `src/lib/mock/utils.ts`.

Pendekatan:
- Buat TypeScript seed runner (`supabase/seed.ts`) yang memakai service-role client.
- Seed berurutan: wilayah → bidang → keahlian → konversi satuan → pengguna → kartu_kerja → kartu_keahlian → acuan_upah → lowongan + keahlian + saringan_aman → lamaran → kesepakatan_kerja → pekerjaan → penilaian → lapor_upah.
- Seed bisa dijalankan dengan `npx tsx supabase/seed.ts`.
- Alternatif: generate `supabase/seed.sql` dari mock data jika user lebih suka SQL murni.

---

## 11. Urutan implementasi

1. **Foundation**
   - Migrasi skema + indexes + RLS + `selesaikan_pekerjaan`.
   - Seed runner dari mock data.
   - Middleware + helper auth.
2. **AI core (#12)**
   - Install `@google/genai`.
   - `klien-gemini.ts`, `penjaga.ts`, `kuota.ts`, prompt files, Zod mirrors.
   - `log_ai` helper.
3. **Mesin deterministik (#15)**
   - `acuan-upah.ts`, `pencocokan.ts`, normalisasi + cache.
   - Endpoint `/api/acuan-upah` dan `/api/cocok`.
4. **Lowongan API (#14)**
   - Ekstraksi + Saringan Aman + geocoding.
   - Cache saringan.
5. **Wawancara API (#13)**
   - Storage upload flow, state machine, prompt, penjaga, auto-delete.
6. **Kartu API (#16)**
   - Terbitkan, QR SVG, public verification.
7. **Kesepakatan API (#17)**
   - Buat, OTP, selesai, penilaian, lapor upah, laporan masalah.
8. **Demo & polish**
   - Wiring UI, panel demo, monitoring log_ai.

---

## 12. Pertanyaan terbuka

1. Apakah kita menggunakan `@google/genai` (SDK baru) atau `@google/generative-ai` (SDK lama)?  
   Rekomendasi: `@google/genai` karena unified API dan responseSchema lebih mudah.
2. Apakah perlu bucket Storage terpisah untuk foto profil?  
   Untuk fase 3, foto profil bisa URL eksternal dulu; fokus ke bucket audio.
3. Apakah OTP benar-benar menggunakan Supabase Auth test phone / Twilio, atau cukup `DEMO_MODE=true` dengan kode tetap?  
   Mengikuti ADR-0001: demo mode fixed code, Supabase Auth test phones, Twilio path documented-but-unwired.

---

## 13. Acceptance criteria bersama

- `grep` panggilan Gemini di luar `lib/ai/klien-gemini.ts` menghasilkan 0.
- Kutipan tidak muncul di transkrip ditolak penjaga.
- Tidak ada nominal mata uang di teks AI setelah penjaga.
- `GEMINI_API_KEY` mati → jalur manual tetap berfungsi.
- Tier kuota beralih di threshold yang tepat.
- `pekerjaan` tidak bisa di-insert dari client (RLS test).
- `penilaian` tidak bisa di-update/delete (RLS test).
- Interview hard-stop di putaran 6 (DB + app).
- Normalisasi cache benar-benar menghemat AI call (dua kali input sama = 0 call).
- Endpoint publik kartu tidak membalas perbedaan untuk token aktif vs tidak aktif.

