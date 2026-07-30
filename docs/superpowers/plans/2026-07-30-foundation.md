# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-KEY: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Supabase foundation for Kita Kerja: schema migrations, RLS policies, `selesaikan_pekerjaan` function, seed data from existing mocks, and Next.js auth middleware/helpers.

**Architecture:** Postgres schema follows PROMPT Bagian 7 exactly; RLS policies follow Bagian 8; `selesaikan_pekerjaan` is a `security definer` function that is the only writer to `pekerjaan`. Seed runner is a TypeScript script that uses the service-role Supabase client to insert mock data in dependency order. Auth middleware reads the Supabase session from cookies and enforces role-based route access.

**Tech Stack:** Next.js 16, TypeScript, Supabase Postgres + Auth + Storage, `supabase` CLI, `tsx`, Zod.

## Global Constraints

- All file, folder, and variable names must be in English; user-facing copy remains Indonesian.
- Server-only secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) must never appear in the client bundle.
- Every server boundary must validate input with Zod.
- Table and column names follow the Indonesian domain model from PROMPT Bagian 7.
- `pekerjaan` is never writable from the client; writes only via `selesaikan_pekerjaan()`.
- `penilaian` is insert-only; no update/delete policies.

---

## File Map

| File | Responsibility |
|------|----------------|
| `supabase/migrations/20260730120000_initial_schema.sql` | DDL: extensions, tables, indexes, foreign keys |
| `supabase/migrations/20260730120001_rls_and_functions.sql` | RLS enable, policies, `selesaikan_pekerjaan()` |
| `supabase/seed.ts` | TypeScript seed runner: read mock data, insert into Supabase in order |
| `scripts/verify-foundation.mjs` | Smoke test: row counts, RLS rejection of direct `pekerjaan` insert |
| `src/lib/auth/server.ts` | `requireSession()`, `requireRole(role)` helpers |
| `src/lib/supabase/server-client.ts` | Existing service-role/RLS-aware client (verify, no changes expected) |
| `src/middleware.ts` | Role-based route protection + DEMO_MODE gate |
| `package.json` | Add `tsx` dev dependency + `seed` script |

---

### Task 1: Add seed runner tooling

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `src/lib/mock/data.ts` and `src/lib/mock/types.ts`.
- Produces: `npm run seed` command available.

- [ ] **Step 1: Install `tsx`**

Run:
```bash
npm install --save-dev tsx
```

- [ ] **Step 2: Add seed script to `package.json`**

Add inside `"scripts"`:
```json
"seed": "tsx supabase/seed.ts",
"verify:foundation": "node scripts/verify-foundation.mjs"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tsx and seed/verify scripts

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create initial schema migration

**Files:**
- Create: `supabase/migrations/20260730120000_initial_schema.sql`

**Interfaces:**
- Produces: all tables, indexes, and FKs required by the backend.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260730120000_initial_schema.sql`:

```sql
-- Extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Wilayah & taxonomy
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

-- Users
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

-- Kartu Kerja
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

-- Lowongan
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

-- Upah
CREATE TABLE IF NOT EXISTS acuan_upah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keahlian_id uuid NOT NULL REFERENCES keahlian_baku(id) ON DELETE CASCADE,
  wilayah_id uuid NOT NULL REFERENCES wilayah(id) ON DELETE CASCADE,
  acuan_harian integer NOT NULL,
  metode text NOT NULL,
  jumlah_laporan integer NOT NULL DEFAULT 0,
  UNIQUE (keahlian_id, wilayah_id)
);

-- Kesepakatan & riwayat
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

-- AI operational
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lowongan_status ON lowongan(status) WHERE status = 'tayang';
CREATE INDEX IF NOT EXISTS idx_lowongan_wilayah ON lowongan(wilayah_id);
CREATE INDEX IF NOT EXISTS idx_kartu_kerja_token ON kartu_kerja(token_publik);
CREATE INDEX IF NOT EXISTS idx_pekerjaan_pekerja ON pekerjaan(pekerja_id);
CREATE INDEX IF NOT EXISTS idx_log_ai_created ON log_ai(dibuat_pada);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260730120000_initial_schema.sql
git commit -m "feat: add initial Supabase schema migration

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Create RLS policies and `selesaikan_pekerjaan`

**Files:**
- Create: `supabase/migrations/20260730120001_rls_and_functions.sql`

**Interfaces:**
- Produces: `selesaikan_pekerjaan(uuid, text)` function; RLS policies for all user tables.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260730120001_rls_and_functions.sql`:

```sql
-- Enable RLS
ALTER TABLE pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE kartu_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE kartu_keahlian ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesi_wawancara ENABLE ROW LEVEL SECURITY;
ALTER TABLE lowongan ENABLE ROW LEVEL SECURITY;
ALTER TABLE lowongan_keahlian ENABLE ROW LEVEL SECURITY;
ALTER TABLE saringan_aman ENABLE ROW LEVEL SECURITY;
ALTER TABLE lamaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE kesepakatan_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE pekerjaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE penilaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE lapor_upah ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_ai ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-run during local reset
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'pengguna','kartu_kerja','kartu_keahlian','sesi_wawancara',
        'lowongan','lowongan_keahlian','saringan_aman','lamaran',
        'kesepakatan_kerja','pekerjaan','penilaian','lapor_upah','log_ai'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- pengguna
CREATE POLICY "pengguna_select_own" ON pengguna FOR SELECT USING (auth.uid() = id);
CREATE POLICY "pengguna_update_own" ON pengguna FOR UPDATE USING (auth.uid() = id);

-- kartu_kerja
CREATE POLICY "kartu_kerja_select_own" ON kartu_kerja FOR SELECT USING (auth.uid() = pekerja_id);
CREATE POLICY "kartu_kerja_insert_own" ON kartu_kerja FOR INSERT WITH CHECK (auth.uid() = pekerja_id);
CREATE POLICY "kartu_kerja_update_own" ON kartu_kerja FOR UPDATE USING (auth.uid() = pekerja_id);
CREATE POLICY "kartu_kerja_delete_own" ON kartu_kerja FOR DELETE USING (auth.uid() = pekerja_id);

-- kartu_keahlian (via kartu_kerja ownership)
CREATE POLICY "kartu_keahlian_select_own" ON kartu_keahlian FOR SELECT USING (
  EXISTS (SELECT 1 FROM kartu_kerja WHERE kartu_kerja.id = kartu_keahlian.kartu_id AND kartu_kerja.pekerja_id = auth.uid())
);
CREATE POLICY "kartu_keahlian_insert_own" ON kartu_keahlian FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM kartu_kerja WHERE kartu_kerja.id = kartu_keahlian.kartu_id AND kartu_kerja.pekerja_id = auth.uid())
);
CREATE POLICY "kartu_keahlian_update_own" ON kartu_keahlian FOR UPDATE USING (
  EXISTS (SELECT 1 FROM kartu_kerja WHERE kartu_kerja.id = kartu_keahlian.kartu_id AND kartu_kerja.pekerja_id = auth.uid())
);
CREATE POLICY "kartu_keahlian_delete_own" ON kartu_keahlian FOR DELETE USING (
  EXISTS (SELECT 1 FROM kartu_kerja WHERE kartu_kerja.id = kartu_keahlian.kartu_id AND kartu_kerja.pekerja_id = auth.uid())
);

-- sesi_wawancara
CREATE POLICY "sesi_wawancara_own" ON sesi_wawancara FOR ALL USING (auth.uid() = pekerja_id);

-- lowongan
CREATE POLICY "lowongan_select_public" ON lowongan FOR SELECT USING (status = 'tayang');
CREATE POLICY "lowongan_select_own" ON lowongan FOR SELECT USING (auth.uid() = pemberi_kerja_id);
CREATE POLICY "lowongan_insert_own" ON lowongan FOR INSERT WITH CHECK (auth.uid() = pemberi_kerja_id);
CREATE POLICY "lowongan_update_own" ON lowongan FOR UPDATE USING (auth.uid() = pemberi_kerja_id);
CREATE POLICY "lowongan_delete_own" ON lowongan FOR DELETE USING (auth.uid() = pemberi_kerja_id);

-- lowongan_keahlian
CREATE POLICY "lowongan_keahlian_select_public" ON lowongan_keahlian FOR SELECT USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = lowongan_keahlian.lowongan_id AND lowongan.status = 'tayang')
);
CREATE POLICY "lowongan_keahlian_own" ON lowongan_keahlian FOR ALL USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = lowongan_keahlian.lowongan_id AND lowongan.pemberi_kerja_id = auth.uid())
);

-- saringan_aman
CREATE POLICY "saringan_aman_select_public" ON saringan_aman FOR SELECT USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = saringan_aman.lowongan_id AND lowongan.status = 'tayang')
);
CREATE POLICY "saringan_aman_own" ON saringan_aman FOR ALL USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = saringan_aman.lowongan_id AND lowongan.pemberi_kerja_id = auth.uid())
);

-- lamaran
CREATE POLICY "lamaran_select_pekerja" ON lamaran FOR SELECT USING (auth.uid() = pekerja_id);
CREATE POLICY "lamaran_select_employer" ON lamaran FOR SELECT USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = lamaran.lowongan_id AND lowongan.pemberi_kerja_id = auth.uid())
);
CREATE POLICY "lamaran_insert_pekerja" ON lamaran FOR INSERT WITH CHECK (auth.uid() = pekerja_id);
CREATE POLICY "lamaran_update_pekerja" ON lamaran FOR UPDATE USING (auth.uid() = pekerja_id);
CREATE POLICY "lamaran_update_employer" ON lamaran FOR UPDATE USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = lamaran.lowongan_id AND lowongan.pemberi_kerja_id = auth.uid())
);

-- kesepakatan_kerja
CREATE POLICY "kesepakatan_kerja_parties" ON kesepakatan_kerja FOR ALL USING (
  auth.uid() = pekerja_id OR auth.uid() = pemberi_kerja_id
);

-- pekerjaan: SELECT only for parties; NO INSERT/UPDATE/DELETE policies
CREATE POLICY "pekerjaan_select_parties" ON pekerjaan FOR SELECT USING (
  auth.uid() = pekerja_id OR auth.uid() = pemberi_kerja_id
);

-- penilaian
CREATE POLICY "penilaian_select_all" ON penilaian FOR SELECT USING (true);
CREATE POLICY "penilaian_insert_employer" ON penilaian FOR INSERT WITH CHECK (
  auth.uid() = pemberi_kerja_id
  AND EXISTS (
    SELECT 1 FROM pekerjaan
    WHERE pekerjaan.id = penilaian.pekerjaan_id
      AND pekerjaan.pemberi_kerja_id = auth.uid()
      AND pekerjaan.selesai_pada IS NOT NULL
  )
);
-- No UPDATE/DELETE policy => immutable

-- lapor_upah
CREATE POLICY "lapor_upah_select_own" ON lapor_upah FOR SELECT USING (auth.uid() = pekerja_id);
CREATE POLICY "lapor_upah_insert_own" ON lapor_upah FOR INSERT WITH CHECK (auth.uid() = pekerja_id);

-- log_ai
CREATE POLICY "log_ai_select_own" ON log_ai FOR SELECT USING (auth.uid() = pengguna_id);

-- selesaikan_pekerjaan function
CREATE OR REPLACE FUNCTION selesaikan_pekerjaan(
  p_kesepakatan_id uuid,
  p_pihak text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kesepakatan record;
  v_pekerjaan_id uuid;
BEGIN
  SELECT * INTO v_kesepakatan
  FROM kesepakatan_kerja
  WHERE id = p_kesepakatan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kesepakatan tidak ditemukan';
  END IF;

  IF v_kesepakatan.status != 'berjalan' THEN
    RAISE EXCEPTION 'Kesepakatan harus dalam status berjalan';
  END IF;

  IF v_kesepakatan.otp_pekerja_pada IS NULL OR v_kesepakatan.otp_pemberi_pada IS NULL THEN
    RAISE EXCEPTION 'Kedua OTP harus dikonfirmasi';
  END IF;

  IF p_pihak NOT IN ('pekerja', 'pemberi_kerja') THEN
    RAISE EXCEPTION 'Pihak tidak valid';
  END IF;

  IF p_pihak = 'pekerja' AND auth.uid() != v_kesepakatan.pekerja_id THEN
    RAISE EXCEPTION 'Bukan pekerja terkait';
  END IF;

  IF p_pihak = 'pemberi_kerja' AND auth.uid() != v_kesepakatan.pemberi_kerja_id THEN
    RAISE EXCEPTION 'Bukan pemberi kerja terkait';
  END IF;

  INSERT INTO pekerjaan (
    kesepakatan_id, pekerja_id, pemberi_kerja_id
  ) VALUES (
    p_kesepakatan_id, v_kesepakatan.pekerja_id, v_kesepakatan.pemberi_kerja_id
  )
  ON CONFLICT (kesepakatan_id) DO NOTHING
  RETURNING id INTO v_pekerjaan_id;

  IF v_pekerjaan_id IS NULL THEN
    SELECT id INTO v_pekerjaan_id
    FROM pekerjaan
    WHERE kesepakatan_id = p_kesepakatan_id;
  END IF;

  IF p_pihak = 'pekerja' THEN
    UPDATE pekerjaan
    SET dikonfirmasi_selesai_pekerja = true
    WHERE id = v_pekerjaan_id;
  ELSE
    UPDATE pekerjaan
    SET dikonfirmasi_selesai_pemberi = true
    WHERE id = v_pekerjaan_id;
  END IF;

  UPDATE pekerjaan
  SET selesai_pada = now()
  WHERE id = v_pekerjaan_id
    AND dikonfirmasi_selesai_pekerja = true
    AND dikonfirmasi_selesai_pemberi = true;

  UPDATE kesepakatan_kerja
  SET status = 'selesai'
  WHERE id = p_kesepakatan_id
    AND EXISTS (
      SELECT 1 FROM pekerjaan
      WHERE pekerjaan.kesepakatan_id = p_kesepakatan_id
        AND pekerjaan.selesai_pada IS NOT NULL
    );

  RETURN v_pekerjaan_id;
END;
$$;
```

Note: fix typo `ot_p_pemberi_pada` → `otp_pemberi_pada` if present.

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260730120001_rls_and_functions.sql
git commit -m "feat: add RLS policies and selesaikan_pekerjaan function

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Apply migrations to remote Supabase

**Files:**
- Modify: none (uses CLI)

**Interfaces:**
- Produces: live schema on Supabase project.

- [ ] **Step 1: Link project (if not already)**

Run:
```bash
npx supabase link --project-ref $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | sed 's/.*\/\///; s/\..*//')
```
If already linked, skip.

- [ ] **Step 2: Push migrations**

Run:
```bash
npx supabase db push
```

Expected: migrations applied successfully.

- [ ] **Step 3: Verify via MCP**

Run:
```bash
node -e "require('child_process').execSync('npx supabase migration list', {stdio:'inherit'})"
```
Expected: two migrations listed as applied.

---

### Task 5: Create seed runner from mock data

**Files:**
- Create: `supabase/seed.ts`

**Interfaces:**
- Consumes: `src/lib/mock/data.ts` exports (wilayah, bidangKerja, keahlianBaku, etc.).
- Produces: populated rows in all foundation tables.

- [ ] **Step 1: Inspect mock exports**

Run:
```bash
node -e "const m = require('./src/lib/mock/data.ts'); console.log(Object.keys(m))"
```
If this fails due to TS, use `npx tsx -e`.

Identify export names and shapes. Adapt the seed script below to match exact export names.

- [ ] **Step 2: Write `supabase/seed.ts`**

Create `supabase/seed.ts`:

```ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  wilayah,
  bidangKerja,
  keahlianBaku,
  konversiSatuan,
  pengguna,
  kartuKerja,
  kartuKeahlian,
  acuanUpah,
  lowongan,
  lowonganKeahlian,
  saringanAman,
  lamaran,
  kesepakatanKerja,
  pekerjaan,
  penilaian,
  laporUpah,
} from "@/lib/mock/data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function seed() {
  // 1. wilayah
  const { error: e1 } = await admin.from("wilayah").upsert(wilayah, { onConflict: "nama" });
  if (e1) throw e1;

  // 2. bidang_kerja
  const { error: e2 } = await admin.from("bidang_kerja").upsert(bidangKerja, { onConflict: "nama" });
  if (e2) throw e2;

  // 3. keahlian_baku
  const { error: e3 } = await admin.from("keahlian_baku").upsert(keahlianBaku, { onConflict: "nama_baku" });
  if (e3) throw e3;

  // 4. konversi_satuan
  const { error: e4 } = await admin.from("konversi_satuan").upsert(konversiSatuan, { onConflict: "konteks,satuan_lokal" });
  if (e4) throw e4;

  // 5. pengguna — requires auth.users to exist. For seed, insert only if matching auth user exists,
  //    otherwise skip. In demo/development we rely on test accounts created via Supabase Auth.
  for (const p of pengguna) {
    const { error } = await admin.from("pengguna").upsert(p, { onConflict: "id" });
    if (error) console.warn("Skip pengguna", p.id, error.message);
  }

  // 6. kartu_kerja
  const { error: e6 } = await admin.from("kartu_kerja").upsert(kartuKerja, { onConflict: "pekerja_id" });
  if (e6) throw e6;

  // 7. kartu_keahlian
  const { error: e7 } = await admin.from("kartu_keahlian").upsert(kartuKeahlian);
  if (e7) throw e7;

  // 8. acuan_upah
  const { error: e8 } = await admin.from("acuan_upah").upsert(acuanUpah, { onConflict: "keahlian_id,wilayah_id" });
  if (e8) throw e8;

  // 9. lowongan
  const { error: e9 } = await admin.from("lowongan").upsert(lowongan, { onConflict: "id" });
  if (e9) throw e9;

  // 10. lowongan_keahlian
  const { error: e10 } = await admin.from("lowongan_keahlian").upsert(lowonganKeahlian);
  if (e10) throw e10;

  // 11. saringan_aman
  const { error: e11 } = await admin.from("saringan_aman").upsert(saringanAman, { onConflict: "lowongan_id" });
  if (e11) throw e11;

  // 12. lamaran
  const { error: e12 } = await admin.from("lamaran").upsert(lamaran, { onConflict: "lowongan_id,pekerja_id" });
  if (e12) throw e12;

  // 13. kesepakatan_kerja
  const { error: e13 } = await admin.from("kesepakatan_kerja").upsert(kesepakatanKerja, { onConflict: "id" });
  if (e13) throw e13;

  // 14. pekerjaan
  const { error: e14 } = await admin.from("pekerjaan").upsert(pekerjaan, { onConflict: "kesepakatan_id" });
  if (e14) throw e14;

  // 15. penilaian
  const { error: e15 } = await admin.from("penilaian").upsert(penilaian, { onConflict: "pekerjaan_id" });
  if (e15) throw e15;

  // 16. lapor_upah
  const { error: e16 } = await admin.from("lapor_upah").upsert(laporUpah);
  if (e16) throw e16;

  console.log("Seed completed");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

If mock export names differ, adjust accordingly.

- [ ] **Step 3: Install `dotenv` for seed**

Run:
```bash
npm install --save-dev dotenv
```

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.ts package.json package-lock.json
git commit -m "feat: add Supabase seed runner from mock data

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Run seed and verify row counts

**Files:**
- Modify: none

- [ ] **Step 1: Run seed**

```bash
npm run seed
```

Expected: "Seed completed" without errors.

- [ ] **Step 2: Create verify script**

Create `scripts/verify-foundation.mjs`:

```js
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase env");

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const tables = [
  "wilayah",
  "bidang_kerja",
  "keahlian_baku",
  "pengguna",
  "kartu_kerja",
  "lowongan",
  "lamaran",
  "kesepakatan_kerja",
  "pekerjaan",
  "penilaian",
];

async function main() {
  for (const t of tables) {
    const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
    if (error) throw error;
    console.log(`${t}: ${count}`);
  }

  // Verify direct insert into pekerjaan fails for anon
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await anon.from("pekerjaan").insert({
    kesepakatan_id: "00000000-0000-0000-0000-000000000000",
    pekerja_id: "00000000-0000-0000-0000-000000000000",
    pemberi_kerja_id: "00000000-0000-0000-0000-000000000000",
  });
  if (!error) throw new Error("RLS allowed direct pekerjaan insert");
  console.log("RLS blocks direct pekerjaan insert:", error.code);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Run verify**

```bash
npm run verify:foundation
```

Expected: row counts for each table and RLS blocks direct insert.

- [ ] **Step 4: Commit verify script**

```bash
git add scripts/verify-foundation.mjs
git commit -m "test: add foundation smoke test

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Create auth server helpers

**Files:**
- Create: `src/lib/auth/server.ts`

**Interfaces:**
- Produces: `requireSession()` and `requireRole(role)`.

- [ ] **Step 1: Write helpers**

Create `src/lib/auth/server.ts`:

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";

export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  return user;
}

export async function requireRole(expected: "pekerja" | "pemberi_kerja" | "pendamping") {
  const user = await requireSession();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("pengguna")
    .select("peran")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/sign-in");
  }

  if (profile.peran !== expected) {
    redirect(roleHomeRoute(profile.peran));
  }

  return { user, profile };
}

function roleHomeRoute(peran: string): string {
  switch (peran) {
    case "pekerja":
      return "/worker";
    case "pemberi_kerja":
      return "/employer";
    case "pendamping":
      return "/companion";
    default:
      return "/sign-in";
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/server.ts
git commit -m "feat: add server-side auth helpers

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Create middleware for role-based routes

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env.
- Produces: redirects for unauthenticated or wrong-role users.

- [ ] **Step 1: Write middleware**

Create `src/middleware.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            response.cookies.set(name, value);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // DEMO_MODE gate
  if (pathname.startsWith("/demo")) {
    if (process.env.DEMO_MODE !== "true") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // Public routes
  if (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verifikasi/")
  ) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const { data: profile } = await supabase
    .from("pengguna")
    .select("peran")
    .eq("id", user.id)
    .single();

  const peran = profile?.peran;

  if (pathname.startsWith("/worker") && peran !== "pekerja") {
    return NextResponse.redirect(new URL(roleHome(peran), request.url));
  }
  if (pathname.startsWith("/employer") && peran !== "pemberi_kerja") {
    return NextResponse.redirect(new URL(roleHome(peran), request.url));
  }
  if (pathname.startsWith("/companion") && peran !== "pendamping") {
    return NextResponse.redirect(new URL(roleHome(peran), request.url));
  }

  return response;
}

function roleHome(peran: string | undefined): string {
  switch (peran) {
    case "pekerja":
      return "/worker";
    case "pemberi_kerja":
      return "/employer";
    case "pendamping":
      return "/companion";
    default:
      return "/sign-in";
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add role-based route protection middleware

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Verify build and typecheck

**Files:**
- Modify: none

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no warnings/errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Push to GitHub**

```bash
git push origin master
```

---

## Self-Review

**Spec coverage:**
- Schema tables: all listed in PROMPT Bagian 7 are covered.
- RLS policies: summary from Bagian 8 covered.
- `selesaikan_pekerjaan` function: covered.
- Seed from mock data: covered.
- Auth middleware: role-based protection covered.

**Placeholder scan:**
- No TBD/TODO.
- Mock export names are assumed; implementer must verify exact names in Task 5 Step 1.

**Type consistency:**
- `requireRole` parameter uses exact peran literals from schema.
- Middleware and `roleHome` use same literals.

**Known risk:**
- Mock `pengguna` rows require matching `auth.users` rows. In a fresh Supabase project, seed will skip them unless test users are created first. For local development, create test users via Supabase Auth dashboard or CLI before seeding.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-30-foundation.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks.
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
