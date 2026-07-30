# Dynamic Pages (Worker / Employer / Companion) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every remaining hard-coded mock persona (Pak Warto, Mbak Dhika, Pak Slamet) in the worker, employer, and companion route groups with real per-user Supabase data, adding the API endpoints and RLS policies that are still missing.

**Architecture:** A server-only data layer under `src/lib/data/` owns every read query; pages become `async` server components that call it with the logged-in user's id. Writes go through new route handlers under `src/app/api/`. Relationship-scoped reads (employer↔applicant, pendamping↔assisted worker, worker↔employer-of-a-live-job) are unlocked with new RLS policies plus three `SECURITY DEFINER` aggregate functions, so no page ever needs the service-role client.

**Tech Stack:** Next.js 15 App Router (server components), TypeScript, Supabase (`@supabase/ssr`), Zod, Tailwind v4, Recharts, lucide-react, sonner.

## Global Constraints

- All user-facing copy in Bahasa Indonesia, simple words. Never surface raw Postgres/Gemini errors.
- Never display a numeric match score. Matching is always explained as a sentence (`alasan_cocok`).
- `PenandaUpah` must always show the nominal acuan plus the method sentence. AI never touches wage numbers.
- Trust layers (`terverifikasi` / `dinilai` / `diklaim`) are **derived, never stored**.
- Route protection stays in `src/middleware.ts` **and** is re-checked server-side in every route handler via `requireRole`.
- Failure envelope for all route handlers: `{ ok: false, pesan: string }` with a correct HTTP status.
- Pages read through the RLS-aware client (`createClient`). `createServiceClient` is allowed **only** in route handlers that must bypass RLS (auth-user creation, screening writes) and in the existing public `/api/cards/[token]`.
- Touch-target minimum 48px; primary CTAs 56px (`size="lg"`).
- **No test framework exists in this repo.** Every task verifies with: `npm run typecheck`, `npm run lint`, `npx next build`, plus the live-server curl checks written into the task.
- `@/lib/mock` keeps exporting **types** (`types.ts`) and **pure formatters** (`utils.ts`) — those stay in use. Only the mock **data arrays** from `data.ts` (and `component/pemberi/mockPemberi.ts`) get removed from app pages.

---

## File Structure

**New — data layer (server-only reads):**
| File | Responsibility |
|---|---|
| `src/lib/data/types.ts` | Shared display types (`KeahlianTampil`, `LowonganTampil`, `CalonTampil`, …) |
| `src/lib/data/keahlian.ts` | Resolve `kartu_keahlian` rows → `KeahlianTampil` incl. derived lapis |
| `src/lib/data/lowongan.ts` | Job list + job detail for a pekerja |
| `src/lib/data/lamaran.ts` | A pekerja's applications |
| `src/lib/data/riwayat.ts` | Completed jobs + monthly earnings |
| `src/lib/data/kesepakatan.ts` | One agreement, for either party |
| `src/lib/data/pemberi.ts` | Employer dashboard, manage-job, candidates |
| `src/lib/data/pendamping.ts` | Assisted workers for a pendamping |
| `src/lib/data/profil.ts` | Profile page read |
| `src/lib/data/kartu-kerja.ts` | *(exists)* — switch to real lapis derivation |

**New — route handlers (writes):**
`/api/applications` (apply), `/api/applications/invite`, `/api/jobs/publish`, `/api/jobs/close`, `/api/ratings`, `/api/profile`, `/api/companion/register`.

**New — engine:** `src/lib/engine/screening-runner.ts` (extracted so both `/api/ai/jobs/screen` and `/api/jobs/publish` use one implementation).

**New — migration:** `supabase/migrations/20260731000000_rls_relational_access.sql`.

**New — page:** `src/app/(worker)/worker/profile/page.tsx` + `profil-form.tsx`.

**Modified — components (drop mock-data lookups, take resolved props):**
`KartuLowongan`, `PenandaUpah`, `KartuKerjaVisual`, `ItemKeahlianKartu`, `KartuKonfirmasi`, `KartuCalon`, `NavBawahPekerja`.

**Deleted:** `src/component/pemberi/mockPemberi.ts`, `src/app/(worker)/worker/jobs/[id]/rekam-jejak.ts` (replaced by the `rekam_jejak_pemberi` RPC; the `LABEL_VERIFIKASI` map moves into `src/lib/data/types.ts`).

---

## Phase A — Foundation

### Task 1: RLS policies + aggregate functions for relational access

**Files:**
- Create: `supabase/migrations/20260731000000_rls_relational_access.sql`

**Interfaces:**
- Produces: RPCs `rekam_jejak_pemberi(p_pemberi uuid)`, `rekam_jejak_pekerja(p_pekerja uuid)`, `lapis_keahlian_pekerja(p_pekerja uuid)`; new SELECT policies on `pengguna`, `kartu_kerja`, `kartu_keahlian`.

**Why this is needed:** today `pengguna_select_own` means an employer cannot read an applicant's name, a worker cannot read the employer's name on a job detail page, and a pendamping cannot list the workers they assist. Every dynamic page in Phases B–D depends on this task landing first.

- [ ] **Step 1: Write the migration**

```sql
-- Relational read access + derived-aggregate functions.
-- Policy chains are acyclic: pengguna -> lamaran -> lowongan -> auth.uid().

-- ============ PENGGUNA ============
DROP POLICY IF EXISTS "pengguna_select_pelamar" ON pengguna;
CREATE POLICY "pengguna_select_pelamar" ON pengguna FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lamaran l
    JOIN lowongan lo ON lo.id = l.lowongan_id
    WHERE l.pekerja_id = pengguna.id AND lo.pemberi_kerja_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pengguna_select_pemberi_tayang" ON pengguna;
CREATE POLICY "pengguna_select_pemberi_tayang" ON pengguna FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lowongan lo
    WHERE lo.pemberi_kerja_id = pengguna.id AND lo.status = 'tayang'
  )
);

DROP POLICY IF EXISTS "pengguna_select_mitra_kesepakatan" ON pengguna;
CREATE POLICY "pengguna_select_mitra_kesepakatan" ON pengguna FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kesepakatan_kerja k
    WHERE (k.pekerja_id = pengguna.id AND k.pemberi_kerja_id = auth.uid())
       OR (k.pemberi_kerja_id = pengguna.id AND k.pekerja_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "pengguna_select_dampingan" ON pengguna;
CREATE POLICY "pengguna_select_dampingan" ON pengguna FOR SELECT USING (
  didampingi_oleh = auth.uid()
);

DROP POLICY IF EXISTS "pengguna_update_dampingan" ON pengguna;
CREATE POLICY "pengguna_update_dampingan" ON pengguna FOR UPDATE USING (
  didampingi_oleh = auth.uid()
);

-- ============ KARTU KERJA ============
DROP POLICY IF EXISTS "kartu_kerja_select_pelamar" ON kartu_kerja;
CREATE POLICY "kartu_kerja_select_pelamar" ON kartu_kerja FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lamaran l
    JOIN lowongan lo ON lo.id = l.lowongan_id
    WHERE l.pekerja_id = kartu_kerja.pekerja_id AND lo.pemberi_kerja_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "kartu_kerja_select_dampingan" ON kartu_kerja;
CREATE POLICY "kartu_kerja_select_dampingan" ON kartu_kerja FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pengguna p
    WHERE p.id = kartu_kerja.pekerja_id AND p.didampingi_oleh = auth.uid()
  )
);

-- ============ KARTU KEAHLIAN ============
DROP POLICY IF EXISTS "kartu_keahlian_select_pelamar" ON kartu_keahlian;
CREATE POLICY "kartu_keahlian_select_pelamar" ON kartu_keahlian FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kartu_kerja kk
    JOIN lamaran l ON l.pekerja_id = kk.pekerja_id
    JOIN lowongan lo ON lo.id = l.lowongan_id
    WHERE kk.id = kartu_keahlian.kartu_id AND lo.pemberi_kerja_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "kartu_keahlian_select_dampingan" ON kartu_keahlian;
CREATE POLICY "kartu_keahlian_select_dampingan" ON kartu_keahlian FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kartu_kerja kk
    JOIN pengguna p ON p.id = kk.pekerja_id
    WHERE kk.id = kartu_keahlian.kartu_id AND p.didampingi_oleh = auth.uid()
  )
);

-- ============ AGREGAT TURUNAN (SECURITY DEFINER) ============
-- Mengembalikan HANYA angka agregat, tidak pernah baris mentah.

CREATE OR REPLACE FUNCTION rekam_jejak_pemberi(p_pemberi uuid)
RETURNS TABLE (pekerjaan_selesai int, laporan_terbuka int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*)::int FROM pekerjaan
      WHERE pemberi_kerja_id = p_pemberi AND selesai_pada IS NOT NULL),
    (SELECT count(*)::int FROM laporan_masalah lm
       JOIN pekerjaan pk ON pk.id = lm.pekerjaan_id
      WHERE pk.pemberi_kerja_id = p_pemberi AND lm.status <> 'selesai');
$$;

CREATE OR REPLACE FUNCTION rekam_jejak_pekerja(p_pekerja uuid)
RETURNS TABLE (pekerjaan_selesai int, rata_penilaian numeric, jumlah_penilai int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*)::int FROM pekerjaan
      WHERE pekerja_id = p_pekerja AND selesai_pada IS NOT NULL),
    COALESCE((SELECT avg(pn.skor) FROM penilaian pn
       JOIN pekerjaan pk ON pk.id = pn.pekerjaan_id
      WHERE pk.pekerja_id = p_pekerja), 0)::numeric,
    (SELECT count(*)::int FROM penilaian pn
       JOIN pekerjaan pk ON pk.id = pn.pekerjaan_id
      WHERE pk.pekerja_id = p_pekerja);
$$;

-- Lapis kepercayaan diturunkan dari riwayat, TIDAK PERNAH disimpan.
CREATE OR REPLACE FUNCTION lapis_keahlian_pekerja(p_pekerja uuid)
RETURNS TABLE (keahlian_id uuid, lapis text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lk.keahlian_id,
         CASE
           WHEN bool_or(pk.selesai_pada IS NOT NULL
                        AND pk.dikonfirmasi_selesai_pekerja
                        AND pk.dikonfirmasi_selesai_pemberi) THEN 'terverifikasi'
           WHEN bool_or(pn.id IS NOT NULL) THEN 'dinilai'
           ELSE 'diklaim'
         END AS lapis
  FROM pekerjaan pk
  JOIN kesepakatan_kerja kk ON kk.id = pk.kesepakatan_id
  JOIN lowongan_keahlian lk ON lk.lowongan_id = kk.lowongan_id
  LEFT JOIN penilaian pn ON pn.pekerjaan_id = pk.id
  WHERE pk.pekerja_id = p_pekerja
  GROUP BY lk.keahlian_id;
$$;

GRANT EXECUTE ON FUNCTION rekam_jejak_pemberi(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION rekam_jejak_pekerja(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION lapis_keahlian_pekerja(uuid) TO authenticated;
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool with name `rls_relational_access` and the SQL above.

- [ ] **Step 3: Verify the functions exist and are callable**

Run via Supabase MCP `execute_sql`:

```sql
SELECT proname FROM pg_proc
WHERE proname IN ('rekam_jejak_pemberi','rekam_jejak_pekerja','lapis_keahlian_pekerja')
ORDER BY proname;
```
Expected: 3 rows.

```sql
SELECT policyname FROM pg_policies
WHERE tablename IN ('pengguna','kartu_kerja','kartu_keahlian')
  AND policyname LIKE '%pelamar%' OR policyname LIKE '%dampingan%'
ORDER BY policyname;
```
Expected: the 6 new policy names appear.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260731000000_rls_relational_access.sql
git commit -m "feat(db): relational RLS policies and derived-aggregate functions"
```

---

### Task 2: Shared display types + keahlian/lapis resolver

**Files:**
- Create: `src/lib/data/types.ts`
- Create: `src/lib/data/keahlian.ts`
- Modify: `src/lib/data/kartu-kerja.ts`

**Interfaces:**
- Produces: `KeahlianTampil`, `LABEL_VERIFIKASI`, `RekamJejakPemberi`; `ambilKeahlianTampil(supabase, kartuId, pekerjaId)`.
- Consumes: RPC `lapis_keahlian_pekerja` from Task 1.

- [ ] **Step 1: Create the shared display types**

```ts
// src/lib/data/types.ts
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
```

- [ ] **Step 2: Create the keahlian resolver**

```ts
// src/lib/data/keahlian.ts
/**
 * Resolusi kartu_keahlian -> KeahlianTampil, termasuk lapis kepercayaan
 * yang DITURUNKAN lewat RPC lapis_keahlian_pekerja (tidak pernah disimpan).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { KeahlianTampil } from "./types";

interface BarisKeahlian {
  id: string;
  keahlian_id: string | null;
  nama_diajukan: string | null;
  sebutan_pekerja: string | null;
  level: "pemula" | "terampil" | "ahli";
  kutipan_bukti: string;
  sumber: "ai" | "manual";
  dikonfirmasi_pekerja: boolean;
  keahlian_baku: { nama_baku: string } | { nama_baku: string }[] | null;
}

const KOLOM_KEAHLIAN =
  "id, keahlian_id, nama_diajukan, sebutan_pekerja, level, kutipan_bukti, sumber, dikonfirmasi_pekerja, keahlian_baku:keahlian_id(nama_baku)";

export async function ambilKeahlianTampil(
  supabase: SupabaseClient,
  kartuId: string,
  pekerjaId: string,
  opsi: { hanyaDikonfirmasi?: boolean } = {},
): Promise<KeahlianTampil[]> {
  let q = supabase.from("kartu_keahlian").select(KOLOM_KEAHLIAN).eq("kartu_id", kartuId);
  if (opsi.hanyaDikonfirmasi) q = q.eq("dikonfirmasi_pekerja", true);
  const { data: baris } = await q.returns<BarisKeahlian[]>();
  if (!baris || baris.length === 0) return [];

  const { data: lapisBaris } = await supabase.rpc("lapis_keahlian_pekerja", {
    p_pekerja: pekerjaId,
  });
  const petaLapis = new Map<string, KeahlianTampil["lapis"]>(
    ((lapisBaris ?? []) as { keahlian_id: string; lapis: KeahlianTampil["lapis"] }[]).map(
      (r) => [r.keahlian_id, r.lapis],
    ),
  );

  return baris.map((k) => {
    const baku = Array.isArray(k.keahlian_baku) ? k.keahlian_baku[0] : k.keahlian_baku;
    return {
      id: k.id,
      keahlian_id: k.keahlian_id,
      nama_tampil: baku?.nama_baku ?? k.nama_diajukan ?? k.sebutan_pekerja ?? "Keahlian",
      sebutan_pekerja: k.sebutan_pekerja ?? k.nama_diajukan ?? "",
      level: k.level,
      kutipan_bukti: k.kutipan_bukti,
      sumber: k.sumber,
      dikonfirmasi_pekerja: k.dikonfirmasi_pekerja,
      lapis: (k.keahlian_id && petaLapis.get(k.keahlian_id)) || "diklaim",
    };
  });
}

export { KOLOM_KEAHLIAN };
```

- [ ] **Step 3: Switch `kartu-kerja.ts` to the real resolver**

In `src/lib/data/kartu-kerja.ts`: change the `keahlian` field type on `DashboardPekerja` from `KartuKeahlian[]` to `KeahlianTampil[]`, delete the block that hand-maps rows with `lapis: "diklaim"`, and replace it with:

```ts
const keahlian = await ambilKeahlianTampil(supabase, kartu.id, userId, {
  hanyaDikonfirmasi: true,
});
```

Add `import { ambilKeahlianTampil } from "./keahlian";` and `import type { KeahlianTampil } from "./types";`. Delete the now-stale file-header paragraph that says lapis is always `"diklaim"` and replace it with:

```ts
 * Lapis kepercayaan diturunkan lewat RPC lapis_keahlian_pekerja (Task 1).
```

- [ ] **Step 4: Verify it compiles and the RPC returns**

```bash
npm run typecheck && npm run lint
```
Expected: both clean. `KartuKerjaVisual` / `ItemKeahlianKartu` type errors here are expected and are fixed in Task 3 — if they appear, finish Task 3 before committing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/types.ts src/lib/data/keahlian.ts src/lib/data/kartu-kerja.ts
git commit -m "feat(data): shared display types and derived trust-layer resolver"
```

---

### Task 3: Make card/skill display components data-source agnostic

**Files:**
- Modify: `src/component/kartu/ItemKeahlianKartu.tsx`
- Modify: `src/component/kartu/KartuKerjaVisual.tsx`
- Modify: `src/app/(worker)/worker/interview/_komponen/KartuKonfirmasi.tsx`
- Modify: `src/app/(worker)/worker/interview/result/page.tsx`
- Modify: `src/component/bersama/PenandaUpah.tsx`

**Interfaces:**
- Consumes: `KeahlianTampil`, `AcuanTampil` (Task 2).
- Produces: components that take resolved names instead of doing `keahlianBaku.find(...)`.

**Why:** real `keahlian_id` values are uuids; `keahlianBaku.find()` against mock string ids (`"kb-keramik"`) silently returns `undefined`, so every skill would render its fallback name.

- [ ] **Step 1: `ItemKeahlianKartu` takes `KeahlianTampil`**

Replace the import block and the two lookup lines:

```tsx
import type { KeahlianTampil } from "@/lib/data/types";
import type { LevelKeahlian } from "@/lib/mock/types";
```

```tsx
export function ItemKeahlianKartu({
  keahlian,
  className,
}: {
  keahlian: KeahlianTampil;
  className?: string;
}) {
  const [buka, setBuka] = useState(false);
  const namaTampil = keahlian.nama_tampil;
```

Delete the `const baku = keahlian.keahlian_id ? keahlianBaku.find(...)` line and the old `namaTampil` expression. Keep all JSX below unchanged.

- [ ] **Step 2: `KartuKerjaVisual` takes `KeahlianTampil[]`**

Change the `keahlian` prop type to `KeahlianTampil[]`, drop `keahlianBaku` from the `@/lib/mock` import, and replace the list body:

```tsx
{keahlian.slice(0, 3).map((k) => (
  <li
    key={k.id}
    className="flex items-center justify-between gap-2 rounded-lg bg-tanah-50 px-3 py-2"
  >
    <span className="text-body font-semibold">{k.nama_tampil}</span>
    <BadgeLapis lapis={k.lapis} />
  </li>
))}
```

- [ ] **Step 3: `KartuKonfirmasi` takes `KeahlianTampil`**

Replace `namaTampilKeahlian` with a passthrough and retype the prop:

```tsx
import type { KeahlianTampil } from "@/lib/data/types";
import type { LevelKeahlian } from "@/lib/mock/types";

export function namaTampilKeahlian(k: KeahlianTampil): string {
  return k.nama_tampil;
}

export function KartuKonfirmasi({
  keahlian,
  onBetul,
  onUbahLagi,
  onSimpan,
}: {
  keahlian: KeahlianTampil;
  onBetul: () => void;
  onUbahLagi: () => void;
  onSimpan: (nama: string, level: LevelKeahlian) => void;
}) {
```

Remove the `keahlianBaku` import. Keep all JSX unchanged.

- [ ] **Step 4: Update the interview result page to the new type**

In `src/app/(worker)/worker/interview/result/page.tsx` replace the mock type import and the two state mappings:

```tsx
import type { KeahlianTampil } from "@/lib/data/types";
```

```tsx
const [daftar, setDaftar] = useState<KeahlianTampil[]>([]);
```

and in the fetch handler:

```tsx
setDaftar(
  (json.data.keahlian as KeahlianTampil[]).map((k) => ({
    ...k,
    lapis: "diklaim" as const,
  })),
);
```

and in `simpanPerbaikan` change `nama_diajukan: nama` to `nama_tampil: nama`. Change the callback signature type from `TKartuKeahlian["level"]` to `KeahlianTampil["level"]`. Delete the `type KartuKeahlian as TKartuKeahlian` import.

- [ ] **Step 5: `/api/cards/keahlian` GET returns `KeahlianTampil`**

In `src/app/api/cards/keahlian/route.ts`, replace the GET query + response with the resolver so the shapes match:

```ts
import { ambilKeahlianTampil } from "@/lib/data/keahlian";
```

```ts
  const supabase = await createClient();
  const keahlian = await ambilKeahlianTampil(supabase, kartu.id, userOrResponse.id);
  const belum = keahlian.filter((k) => !k.dikonfirmasi_pekerja);

  return NextResponse.json({ ok: true, data: { keahlian: belum } });
```

Delete the old inline `.from("kartu_keahlian").select(...)` block and its `error` handling in GET only. Change `ambilKartuSendiri` to also return early `null` unchanged.

In the confirm route `src/app/api/cards/keahlian/confirm/route.ts`, the client now sends `nama_tampil`; accept it by renaming the optional field in `BodySchema` from `nama_diajukan` to `nama_tampil`, and map it when patching:

```ts
    if (item.nama_tampil) patch.nama_diajukan = item.nama_tampil;
```

Update the caller in `interview/result/page.tsx` to send `nama_tampil: k.nama_tampil`.

- [ ] **Step 6: `PenandaUpah` takes plain values**

Replace its props so it no longer imports `AcuanUpah`/`Wilayah` mock types:

```tsx
import type { AcuanTampil } from "@/lib/data/types";

interface PenandaUpahProps {
  ditawarkan: number;
  acuan: AcuanTampil;
  wilayahNama: string;
  ringkas?: boolean;
  className?: string;
}

export function PenandaUpah({
  ditawarkan,
  acuan,
  wilayahNama,
  ringkas = false,
  className,
}: PenandaUpahProps) {
```

and replace `kalimatMetodeAcuan(wilayah.nama)` with `kalimatMetodeAcuan(wilayahNama)`. Keep everything else.

- [ ] **Step 7: Verify**

```bash
npm run typecheck
```
Expected: the only remaining errors are in files listed for Tasks 5, 11–15 (pages still on mock). Note them; they are fixed by those tasks.

- [ ] **Step 8: Commit**

```bash
git add src/component/kartu src/component/bersama/PenandaUpah.tsx "src/app/(worker)/worker/interview" src/app/api/cards/keahlian
git commit -m "refactor(ui): card and wage components take resolved props, not mock lookups"
```

---

## Phase B — Worker

### Task 4: Job list + detail data layer

**Files:**
- Create: `src/lib/data/lowongan.ts`

**Interfaces:**
- Consumes: `LowonganTampil`, `RekamJejakPemberi` (Task 2); `hitungAcuanUpah` from `@/lib/engine/wage-benchmark`; `cocokkanPekerja` from `@/lib/engine/matching`.
- Produces: `daftarLowonganUntukPekerja(pekerjaId)`, `detailLowonganUntukPekerja(lowonganId, pekerjaId)`.

- [ ] **Step 1: Write the module**

```ts
// src/lib/data/lowongan.ts
/**
 * Baca lowongan untuk pekerja. Alasan pencocokan berupa KALIMAT
 * (mesin cocok mengembalikan skor internal — skor tidak pernah keluar dari sini).
 */

import { createClient } from "@/lib/supabase/server-client";
import { hitungAcuanUpah } from "@/lib/engine/wage-benchmark";
import { cocokkanPekerja } from "@/lib/engine/matching";
import type { LowonganTampil, RekamJejakPemberi, SaringanTampil } from "./types";

const KOLOM_LOWONGAN = `
  id, judul_baku, teks_asli, status, jenis_kerja, jumlah_pekerja,
  upah_ditawarkan, satuan_upah, lokasi_teks, mulai, syarat_tersirat,
  wilayah_id, pemberi_kerja_id,
  wilayah:wilayah_id(nama),
  saringan:saringan_aman(tingkat, temuan, pertanyaan_disarankan),
  keahlian:lowongan_keahlian(keahlian_id)
`;

interface BarisLowongan {
  id: string;
  judul_baku: string | null;
  teks_asli: string;
  status: LowonganTampil["status"];
  jenis_kerja: LowonganTampil["jenis_kerja"];
  jumlah_pekerja: number;
  upah_ditawarkan: number | null;
  satuan_upah: LowonganTampil["satuan_upah"];
  lokasi_teks: string | null;
  mulai: string | null;
  syarat_tersirat: string[] | null;
  wilayah_id: string | null;
  pemberi_kerja_id: string;
  wilayah: { nama: string } | { nama: string }[] | null;
  saringan: SaringanTampil | SaringanTampil[] | null;
  keahlian: { keahlian_id: string }[] | null;
}

function satu<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

async function keLowonganTampil(
  b: BarisLowongan,
  alasan: string | null,
): Promise<LowonganTampil> {
  const keahlianId = b.keahlian?.[0]?.keahlian_id ?? null;
  const acuan =
    keahlianId && b.wilayah_id ? await hitungAcuanUpah(keahlianId, b.wilayah_id) : null;

  return {
    id: b.id,
    judul_baku: b.judul_baku ?? "Lowongan",
    teks_asli: b.teks_asli,
    status: b.status,
    jenis_kerja: b.jenis_kerja,
    jumlah_pekerja: b.jumlah_pekerja,
    upah_ditawarkan: b.upah_ditawarkan,
    satuan_upah: b.satuan_upah,
    lokasi_teks: b.lokasi_teks,
    mulai: b.mulai,
    syarat_tersirat: b.syarat_tersirat ?? [],
    wilayah_id: b.wilayah_id,
    wilayah_nama: satu(b.wilayah)?.nama ?? null,
    pemberi_kerja_id: b.pemberi_kerja_id,
    saringan: satu(b.saringan),
    acuan: acuan
      ? {
          acuan_harian: acuan.acuan_harian,
          metode: acuan.metode,
          jumlah_laporan: acuan.jumlah_laporan,
        }
      : null,
    alasan_cocok: alasan,
  };
}

export async function daftarLowonganUntukPekerja(
  pekerjaId: string,
): Promise<{ lowongan: LowonganTampil[]; idSudahDilamar: Set<string> }> {
  const supabase = await createClient();

  const { data: baris } = await supabase
    .from("lowongan")
    .select(KOLOM_LOWONGAN)
    .eq("status", "tayang")
    .order("id")
    .returns<BarisLowongan[]>();

  const cocok = await cocokkanPekerja(pekerjaId, 50);
  const petaAlasan = new Map(cocok.map((c) => [c.id, c.alasan]));

  const { data: lamaranSaya } = await supabase
    .from("lamaran")
    .select("lowongan_id")
    .eq("pekerja_id", pekerjaId);

  const lowongan = await Promise.all(
    (baris ?? []).map((b) => keLowonganTampil(b, petaAlasan.get(b.id) ?? null)),
  );

  return {
    lowongan,
    idSudahDilamar: new Set((lamaranSaya ?? []).map((l) => l.lowongan_id as string)),
  };
}

export interface DetailLowongan {
  lowongan: LowonganTampil;
  pemberi: {
    id: string;
    nama: string;
    status_verifikasi: "belum" | "hp_terverifikasi" | "identitas_terverifikasi";
  } | null;
  rekamJejakPemberi: RekamJejakPemberi;
  sudahMelamar: boolean;
  kesepakatanId: string | null;
}

export async function detailLowonganUntukPekerja(
  lowonganId: string,
  pekerjaId: string,
): Promise<DetailLowongan | null> {
  const supabase = await createClient();

  const { data: baris } = await supabase
    .from("lowongan")
    .select(KOLOM_LOWONGAN)
    .eq("id", lowonganId)
    .maybeSingle<BarisLowongan>();

  if (!baris) return null;

  const cocok = await cocokkanPekerja(pekerjaId, 50);
  const lowongan = await keLowonganTampil(
    baris,
    cocok.find((c) => c.id === baris.id)?.alasan ?? null,
  );

  const { data: pemberi } = await supabase
    .from("pengguna")
    .select("id, nama, status_verifikasi")
    .eq("id", baris.pemberi_kerja_id)
    .maybeSingle();

  const { data: jejak } = await supabase.rpc("rekam_jejak_pemberi", {
    p_pemberi: baris.pemberi_kerja_id,
  });
  const jejakSatu = (jejak as RekamJejakPemberi[] | null)?.[0];

  const { data: lamaranSaya } = await supabase
    .from("lamaran")
    .select("id")
    .eq("lowongan_id", lowonganId)
    .eq("pekerja_id", pekerjaId)
    .maybeSingle();

  const { data: kesepakatan } = await supabase
    .from("kesepakatan_kerja")
    .select("id")
    .eq("lowongan_id", lowonganId)
    .eq("pekerja_id", pekerjaId)
    .maybeSingle();

  return {
    lowongan,
    pemberi: pemberi as DetailLowongan["pemberi"],
    rekamJejakPemberi: jejakSatu ?? { pekerjaan_selesai: 0, laporan_terbuka: 0 },
    sudahMelamar: !!lamaranSaya,
    kesepakatanId: (kesepakatan?.id as string) ?? null,
  };
}
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint
```
Expected: clean for this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/lowongan.ts
git commit -m "feat(data): job list and job detail reads for pekerja"
```

---

### Task 5: Apply-to-job endpoint

**Files:**
- Create: `src/app/api/applications/route.ts`

**Interfaces:**
- Consumes: `cocokkanPekerja`.
- Produces: `POST /api/applications` with body `{ lowongan_id: string }` → `{ ok: true, data: { lamaran_id } }`.

- [ ] **Step 1: Write the route**

```ts
// src/app/api/applications/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { cocokkanPekerja } from "@/lib/engine/matching";
import { z } from "zod";

const BodySchema = z.object({ lowongan_id: z.string().uuid() });

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pekerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, status")
    .eq("id", body.lowongan_id)
    .maybeSingle();

  if (!lowongan) {
    return NextResponse.json({ ok: false, pesan: "Lowongan tidak ditemukan." }, { status: 404 });
  }
  if (lowongan.status !== "tayang") {
    return NextResponse.json(
      { ok: false, pesan: "Lowongan ini sudah tidak menerima lamaran." },
      { status: 409 },
    );
  }

  const cocok = await cocokkanPekerja(userOrResponse.id, 50);
  const alasan = cocok.find((c) => c.id === body.lowongan_id)?.alasan;

  const { data: lamaran, error } = await supabase
    .from("lamaran")
    .insert({
      lowongan_id: body.lowongan_id,
      pekerja_id: userOrResponse.id,
      status: "dilamar",
      alasan_cocok: alasan ? [alasan] : [],
    })
    .select("id")
    .single();

  if (error) {
    // UNIQUE (lowongan_id, pekerja_id)
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, pesan: "Anda sudah melamar lowongan ini." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, pesan: "Gagal mengirim lamaran." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: { lamaran_id: lamaran.id } });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run typecheck && npx next build 2>&1 | grep "api/applications"
```
Expected: `/api/applications` appears in the route table.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/applications/route.ts
git commit -m "feat(api): apply to a job"
```

---

### Task 6: `/worker/jobs` and `/worker/jobs/[id]` dynamic

**Files:**
- Modify: `src/component/pekerja/KartuLowongan.tsx`
- Modify: `src/app/(worker)/worker/jobs/page.tsx`
- Modify: `src/app/(worker)/worker/jobs/[id]/page.tsx`
- Modify: `src/app/(worker)/worker/jobs/[id]/tombol-lamar.tsx`
- Delete: `src/app/(worker)/worker/jobs/[id]/rekam-jejak.ts`

**Interfaces:**
- Consumes: `daftarLowonganUntukPekerja`, `detailLowonganUntukPekerja` (Task 4); `POST /api/applications` (Task 5).

- [ ] **Step 1: `KartuLowongan` takes `LowonganTampil`**

Replace the whole props + lookup preamble (keep the JSX body, swapping the four value expressions):

```tsx
import type { LowonganTampil } from "@/lib/data/types";
import { upahTeks } from "@/lib/mock/utils";

export function KartuLowongan({
  lowongan: lw,
  href,
  className,
}: {
  lowongan: LowonganTampil;
  href?: string;
  className?: string;
}) {
  const isi = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-h3 text-tanah-900">{lw.judul_baku}</h3>
        {lw.saringan && <PenandaRisiko tingkat={lw.saringan.tingkat} />}
      </div>

      <p className="mt-2 flex items-center gap-2 text-body text-tanah-600">
        <MapPin className="size-5 shrink-0" aria-hidden />
        {lw.lokasi_teks ?? lw.wilayah_nama ?? "Lokasi belum diisi"}
      </p>

      {lw.upah_ditawarkan !== null && lw.satuan_upah && (
        <p className="mt-2 text-body font-semibold text-tanah-900">
          {upahTeks(lw.upah_ditawarkan, lw.satuan_upah)}
        </p>
      )}

      {lw.satuan_upah === "harian" && lw.acuan && lw.upah_ditawarkan !== null && (
        <PenandaUpah
          ringkas
          className="mt-3"
          ditawarkan={lw.upah_ditawarkan}
          acuan={lw.acuan}
          wilayahNama={lw.wilayah_nama ?? "wilayah ini"}
        />
      )}

      {lw.alasan_cocok && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-kuning-50 p-3 text-label text-tanah-800">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-kuning-600" aria-hidden />
          {lw.alasan_cocok}
        </p>
      )}
    </>
  );
```

Keep the `kelas`/`href` block at the bottom unchanged. Remove the `@/lib/mock` data import entirely.

- [ ] **Step 2: `/worker/jobs` becomes an async server component**

Replace the imports and function head; keep the JSX from `<div className="flex flex-col gap-6">` down, with `tayang`/`biasa`/`berisiko` now derived from the fetched list:

```tsx
import { BriefcaseBusiness, OctagonAlert } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { KartuLowongan } from "@/component/pekerja/KartuLowongan";
import { createClient } from "@/lib/supabase/server-client";
import { daftarLowonganUntukPekerja } from "@/lib/data/lowongan";

export default async function HalamanDaftarLowongan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { lowongan: tayang } = await daftarLowonganUntukPekerja(user!.id);

  const biasa = tayang.filter((l) => l.saringan?.tingkat !== "berisiko_tinggi");
  const berisiko = tayang.filter((l) => l.saringan?.tingkat === "berisiko_tinggi");
```

- [ ] **Step 3: `/worker/jobs/[id]` becomes dynamic**

Replace the imports and the data preamble with:

```tsx
import { createClient } from "@/lib/supabase/server-client";
import { detailLowonganUntukPekerja } from "@/lib/data/lowongan";
import { LABEL_VERIFIKASI } from "@/lib/data/types";
import {
  formatRupiah,
  formatTanggal,
  kalimatMetodeAcuan,
  upahTeks,
} from "@/lib/mock/utils";
import type { JenisKerja } from "@/lib/mock/types";

export default async function HalamanDetailLowongan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const detail = await detailLowonganUntukPekerja(id, user!.id);

  if (!detail) {
    return (
      <KeadaanKosong
        ikon={FileSearch}
        judul="Lowongan tidak ditemukan"
        penjelasan="Tautan ini mungkin sudah tidak berlaku atau lowongan sudah ditutup. Silakan lihat lowongan lain yang sedang tayang."
        labelAksi="Kembali ke daftar lowongan"
        hrefAksi="/worker/jobs"
      />
    );
  }

  const { lowongan: lw, pemberi, rekamJejakPemberi, sudahMelamar, kesepakatanId } = detail;
```

Then apply these exact substitutions in the JSX below:

| Old | New |
|---|---|
| `{wl.nama} · {jarakTeks(lw.jarak_km)} dari rumah Anda` | `{lw.lokasi_teks ?? lw.wilayah_nama ?? "Lokasi belum diisi"}` |
| `{upahTeks(lw.upah_ditawarkan, lw.satuan_upah)}` | `{lw.upah_ditawarkan !== null && lw.satuan_upah ? upahTeks(lw.upah_ditawarkan, lw.satuan_upah) : "Upah belum disebutkan"}` |
| `<PenandaUpah ditawarkan={lw.upah_ditawarkan} acuan={acuan} wilayah={wl} />` | `<PenandaUpah ditawarkan={lw.upah_ditawarkan!} acuan={lw.acuan!} wilayahNama={lw.wilayah_nama ?? "wilayah ini"} />` |
| the `keahlianUtama.nama_baku` acuan paragraph | wrap it in `{lw.acuan && lw.wilayah_nama && ( … )}` and replace `{keahlianUtama.nama_baku}` with `pekerjaan ini`, `{wl.nama}` with `{lw.wilayah_nama}`, `acuan.acuan_harian` with `lw.acuan.acuan_harian` |
| `<PanelSaringanAman saringan={saringan} />` | `{lw.saringan && <PanelSaringanAman saringan={lw.saringan} />}` |
| `{lw.alasan_cocok}` paragraph | wrap in `{lw.alasan_cocok && ( … )}` |
| `{LABEL_JENIS_KERJA[lw.jenis_kerja]}` | `{lw.jenis_kerja ? LABEL_JENIS_KERJA[lw.jenis_kerja] : "Belum disebutkan"}` |
| `{formatTanggal(lw.mulai)}` | `{lw.mulai ? formatTanggal(lw.mulai) : "Belum disebutkan"}` |
| `{lw.lokasi_teks}` | `{lw.lokasi_teks ?? "Belum disebutkan"}` |
| `{pemberi.nama}` | `{pemberi?.nama ?? "Pemberi kerja"}` |
| `pemberi.status_verifikasi === "belum"` | `pemberi?.status_verifikasi === "belum"` |
| `{LABEL_VERIFIKASI[pemberi.status_verifikasi]}` | `{LABEL_VERIFIKASI[pemberi?.status_verifikasi ?? "belum"]}` |
| `{pekerjaanSelesai} pekerjaan` | `{rekamJejakPemberi.pekerjaan_selesai} pekerjaan` |
| every `laporanTerbuka` | `rekamJejakPemberi.laporan_terbuka` |
| `{jadiKesepakatan ? (` | `{kesepakatanId ? (` |
| `href={`/worker/agreements/${jadiKesepakatan.id}`}` | `href={`/worker/agreements/${kesepakatanId}`}` |
| `<TombolLamar tingkat={saringan.tingkat} pertanyaan={saringan.pertanyaan_disarankan} sudahMelamar={sudahMelamar} />` | `<TombolLamar lowonganId={lw.id} tingkat={lw.saringan?.tingkat ?? "aman"} pertanyaan={lw.saringan?.pertanyaan_disarankan ?? []} sudahMelamar={sudahMelamar} />` |

- [ ] **Step 4: `TombolLamar` actually posts**

Add `lowonganId` to the props, import `toast` from `sonner`, and replace the two `setTerkirim(true)` call sites with a real submit:

```tsx
const [mengirim, setMengirim] = useState(false);

async function kirimLamaran() {
  if (mengirim) return;
  setMengirim(true);
  try {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lowongan_id: lowonganId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.pesan || "Gagal mengirim lamaran.");
    setTerkirim(true);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
  } finally {
    setMengirim(false);
  }
}
```

Main button `onClick`: `if (tingkat === "berisiko_tinggi") setDialogTerbuka(true); else void kirimLamaran();` and add `disabled={mengirim}`. Dialog confirm button: `onClick={() => { setDialogTerbuka(false); void kirimLamaran(); }}`.

- [ ] **Step 5: Delete the stale mock file**

```bash
git rm "src/app/(worker)/worker/jobs/[id]/rekam-jejak.ts"
```

- [ ] **Step 6: Verify live**

```bash
npm run typecheck && npm run lint && npx next build
```
Then, with the dev server running and a seeded pekerja cookie jar at `$COOKIES`:

```bash
curl -s -b "$COOKIES" http://localhost:3000/worker/jobs | grep -c "Lowongan"
```
Expected: ≥ 1 (page renders server-side without throwing).

- [ ] **Step 7: Commit**

```bash
git add -A "src/app/(worker)/worker/jobs" src/component/pekerja/KartuLowongan.tsx
git commit -m "feat(worker): job list and detail read real data; apply button posts"
```

---

### Task 7: `/worker/applications` dynamic

**Files:**
- Create: `src/lib/data/lamaran.ts`
- Modify: `src/app/(worker)/worker/applications/page.tsx`

**Interfaces:**
- Produces: `lamaranPekerja(pekerjaId): Promise<LamaranTampil[]>`.

- [ ] **Step 1: Write the data module**

```ts
// src/lib/data/lamaran.ts
import { createClient } from "@/lib/supabase/server-client";
import type { StatusLamaran, SatuanUpah } from "@/lib/mock/types";

export interface LamaranTampil {
  id: string;
  status: StatusLamaran;
  lowongan_id: string;
  judul_baku: string;
  lokasi_teks: string | null;
  wilayah_nama: string | null;
  upah_ditawarkan: number | null;
  satuan_upah: SatuanUpah | null;
}

interface Baris {
  id: string;
  status: StatusLamaran;
  lowongan_id: string;
  lowongan:
    | {
        judul_baku: string | null;
        lokasi_teks: string | null;
        upah_ditawarkan: number | null;
        satuan_upah: SatuanUpah | null;
        wilayah: { nama: string } | { nama: string }[] | null;
      }
    | null;
}

export async function lamaranPekerja(pekerjaId: string): Promise<LamaranTampil[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lamaran")
    .select(
      "id, status, lowongan_id, lowongan:lowongan_id(judul_baku, lokasi_teks, upah_ditawarkan, satuan_upah, wilayah:wilayah_id(nama))",
    )
    .eq("pekerja_id", pekerjaId)
    .order("dibuat_pada", { ascending: false })
    .returns<Baris[]>();

  return (data ?? []).flatMap((b) => {
    const lo = Array.isArray(b.lowongan) ? b.lowongan[0] : b.lowongan;
    if (!lo) return [];
    const wl = Array.isArray(lo.wilayah) ? lo.wilayah[0] : lo.wilayah;
    return [
      {
        id: b.id,
        status: b.status,
        lowongan_id: b.lowongan_id,
        judul_baku: lo.judul_baku ?? "Lowongan",
        lokasi_teks: lo.lokasi_teks,
        wilayah_nama: wl?.nama ?? null,
        upah_ditawarkan: lo.upah_ditawarkan,
        satuan_upah: lo.satuan_upah,
      },
    ];
  });
}
```

- [ ] **Step 2: Rewrite the page head**

```tsx
import Link from "next/link";
import { ArrowRight, Inbox, MapPin } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { lamaranPekerja } from "@/lib/data/lamaran";
import { upahTeks } from "@/lib/mock/utils";

import { INFO_STATUS_LAMARAN } from "../status-lamaran";

export default async function HalamanLamaran() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const milik = await lamaranPekerja(user!.id);
```

Then inside the `.map`, delete the `lw`/`wl` lookups and substitute:
- `{lw.judul_baku}` → `{lm.judul_baku}`
- `{wl.nama} · {jarakTeks(lw.jarak_km)}` → `{lm.lokasi_teks ?? lm.wilayah_nama ?? "Lokasi belum diisi"}`
- the upah `<p>` → `{lm.upah_ditawarkan !== null && lm.satuan_upah && (<p className="mt-1 text-body font-semibold text-tanah-900">{upahTeks(lm.upah_ditawarkan, lm.satuan_upah)}</p>)}`
- `href={`/worker/jobs/${lw.id}`}` → `href={`/worker/jobs/${lm.lowongan_id}`}`
- delete `if (!lw) return null;`

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/data/lamaran.ts "src/app/(worker)/worker/applications/page.tsx"
git commit -m "feat(worker): applications page reads real lamaran"
```

---

### Task 8: `/worker/history` dynamic

**Files:**
- Create: `src/lib/data/riwayat.ts`
- Modify: `src/app/(worker)/worker/history/page.tsx`
- Modify: `src/app/(worker)/worker/history/grafik-penghasilan.tsx`

**Interfaces:**
- Produces: `riwayatPekerja(pekerjaId): Promise<{ pekerjaan: PekerjaanTampil[]; totalPenghasilan: number; perBulan: TitikBulan[] }>`.

- [ ] **Step 1: Write the data module**

```ts
// src/lib/data/riwayat.ts
/**
 * Riwayat pekerjaan selesai + penghasilan per bulan.
 * pekerjaan tidak menyimpan judul/upah — semuanya lewat kesepakatan_kerja.
 */

import { createClient } from "@/lib/supabase/server-client";
import type { SatuanUpah } from "@/lib/mock/types";

export interface PekerjaanTampil {
  id: string;
  judul: string;
  selesai_pada: string;
  upah: number;
  satuan: SatuanUpah;
  wilayah_nama: string | null;
  dua_pihak: boolean;
  skor: number | null;
  catatan: string | null;
}

export interface TitikBulan {
  bulan: string;
  total: number;
}

interface Baris {
  id: string;
  selesai_pada: string | null;
  dikonfirmasi_selesai_pekerja: boolean;
  dikonfirmasi_selesai_pemberi: boolean;
  kesepakatan:
    | {
        lingkup: string;
        upah_disepakati: number;
        satuan: SatuanUpah;
        lowongan: { judul_baku: string | null; wilayah: { nama: string } | { nama: string }[] | null } | null;
      }
    | null;
  penilaian: { skor: number; catatan: string | null }[] | null;
}

const NAMA_BULAN = new Intl.DateTimeFormat("id-ID", { month: "short" });

export async function riwayatPekerja(pekerjaId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pekerjaan")
    .select(
      `id, selesai_pada, dikonfirmasi_selesai_pekerja, dikonfirmasi_selesai_pemberi,
       kesepakatan:kesepakatan_id(lingkup, upah_disepakati, satuan,
         lowongan:lowongan_id(judul_baku, wilayah:wilayah_id(nama))),
       penilaian(skor, catatan)`,
    )
    .eq("pekerja_id", pekerjaId)
    .not("selesai_pada", "is", null)
    .order("selesai_pada", { ascending: false })
    .returns<Baris[]>();

  const pekerjaan: PekerjaanTampil[] = (data ?? []).flatMap((b) => {
    const ks = Array.isArray(b.kesepakatan) ? b.kesepakatan[0] : b.kesepakatan;
    if (!ks || !b.selesai_pada) return [];
    const lo = Array.isArray(ks.lowongan) ? ks.lowongan[0] : ks.lowongan;
    const wl = lo && (Array.isArray(lo.wilayah) ? lo.wilayah[0] : lo.wilayah);
    const nilai = b.penilaian?.[0] ?? null;
    return [
      {
        id: b.id,
        judul: lo?.judul_baku ?? ks.lingkup,
        selesai_pada: b.selesai_pada,
        upah: ks.upah_disepakati,
        satuan: ks.satuan,
        wilayah_nama: wl?.nama ?? null,
        dua_pihak: b.dikonfirmasi_selesai_pekerja && b.dikonfirmasi_selesai_pemberi,
        skor: nilai?.skor ?? null,
        catatan: nilai?.catatan ?? null,
      },
    ];
  });

  const perBulanPeta = new Map<string, number>();
  for (const p of pekerjaan) {
    const kunci = p.selesai_pada.slice(0, 7);
    perBulanPeta.set(kunci, (perBulanPeta.get(kunci) ?? 0) + p.upah);
  }
  const perBulan: TitikBulan[] = [...perBulanPeta.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([kunci, total]) => ({
      bulan: NAMA_BULAN.format(new Date(`${kunci}-02`)),
      total,
    }));

  return {
    pekerjaan,
    totalPenghasilan: pekerjaan.reduce((a, p) => a + p.upah, 0),
    perBulan,
  };
}
```

- [ ] **Step 2: Move `TitikBulan` import in the chart**

In `grafik-penghasilan.tsx` replace the local `TitikBulan` export with a re-export and fix the formatter import:

```tsx
import { formatRupiah } from "@/lib/mock/utils";
import type { TitikBulan } from "@/lib/data/riwayat";

export type { TitikBulan };
```

Delete the old `export interface TitikBulan { … }` block.

- [ ] **Step 3: Rewrite the page head**

```tsx
import { House, Megaphone, Star } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { riwayatPekerja } from "@/lib/data/riwayat";
import { formatRupiah, formatTanggal, upahTeks } from "@/lib/mock/utils";

import { GrafikPenghasilan } from "./grafik-penghasilan";

const JUMLAH_RIWAYAT_TAMPIL = 10;

export default async function HalamanRiwayat() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pekerjaan: riwayat, totalPenghasilan: totalSemua, perBulan: dataGrafik } =
    await riwayatPekerja(user!.id);
```

Delete `labelBulan`, `JUMLAH_BULAN_GRAFIK`, the `penilaianByPekerjaan` map and the `perBulan` computation. Then inside the list `.map((p) => …)` substitute:
- delete `const wl = …` and `const nilai = …` and `const duaPihak = …`
- `{duaPihak && <BadgeLapis lapis="terverifikasi" />}` → `{p.dua_pihak && <BadgeLapis lapis="terverifikasi" />}`
- `{wl ? ` · ${wl.nama}` : ""} · {upahTeks(p.upah_diterima, p.satuan)}` → `{p.wilayah_nama ? ` · ${p.wilayah_nama}` : ""} · {upahTeks(p.upah, p.satuan)}`
- `{nilai && (` → `{p.skor !== null && (`, then `{nilai.skor}` → `{p.skor}` and `{nilai.catatan && (…{nilai.catatan}…)}` → `{p.catatan && (…{p.catatan}…)}`

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/riwayat.ts "src/app/(worker)/worker/history"
git commit -m "feat(worker): history and earnings chart read real pekerjaan"
```

---

### Task 9: `/worker/agreements/[id]` dynamic + wired actions

**Files:**
- Create: `src/lib/data/kesepakatan.ts`
- Modify: `src/app/(worker)/worker/agreements/[id]/page.tsx`
- Modify: `src/app/(worker)/worker/agreements/[id]/aksi-kesepakatan.tsx`

**Interfaces:**
- Produces: `kesepakatanUntukPihak(kesepakatanId, penggunaId)`.
- Consumes: `POST /api/agreements/otp`, `POST /api/jobs/complete`, `POST /api/problems/report` (all already exist).

- [ ] **Step 1: Write the data module**

```ts
// src/lib/data/kesepakatan.ts
import { createClient } from "@/lib/supabase/server-client";
import type { SatuanUpah, StatusKesepakatan } from "@/lib/mock/types";

export interface KesepakatanTampil {
  id: string;
  lingkup: string;
  upah_disepakati: number;
  satuan: SatuanUpah;
  mulai: string | null;
  selesai: string | null;
  tanggal_bayar_dijanjikan: string;
  status: StatusKesepakatan;
  otp_pekerja_sudah: boolean;
  otp_pemberi_sudah: boolean;
  judul_lowongan: string | null;
  pekerja_id: string;
  pemberi_kerja_id: string;
  nama_pekerja: string;
  nama_pemberi: string;
  pekerjaan_selesai: boolean;
}

interface Baris {
  id: string;
  lingkup: string;
  upah_disepakati: number;
  satuan: SatuanUpah;
  mulai: string | null;
  selesai: string | null;
  tanggal_bayar_dijanjikan: string;
  status: StatusKesepakatan;
  otp_pekerja_pada: string | null;
  otp_pemberi_pada: string | null;
  pekerja_id: string;
  pemberi_kerja_id: string;
  lowongan: { judul_baku: string | null } | { judul_baku: string | null }[] | null;
  pekerja: { nama: string } | { nama: string }[] | null;
  pemberi: { nama: string } | { nama: string }[] | null;
}

function satu<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function kesepakatanUntukPihak(
  kesepakatanId: string,
  penggunaId: string,
): Promise<KesepakatanTampil | null> {
  const supabase = await createClient();

  const { data: b } = await supabase
    .from("kesepakatan_kerja")
    .select(
      `id, lingkup, upah_disepakati, satuan, mulai, selesai, tanggal_bayar_dijanjikan,
       status, otp_pekerja_pada, otp_pemberi_pada, pekerja_id, pemberi_kerja_id,
       lowongan:lowongan_id(judul_baku),
       pekerja:pekerja_id(nama),
       pemberi:pemberi_kerja_id(nama)`,
    )
    .eq("id", kesepakatanId)
    .maybeSingle<Baris>();

  if (!b) return null;
  if (b.pekerja_id !== penggunaId && b.pemberi_kerja_id !== penggunaId) return null;

  const { data: pekerjaan } = await supabase
    .from("pekerjaan")
    .select("selesai_pada")
    .eq("kesepakatan_id", kesepakatanId)
    .maybeSingle();

  return {
    id: b.id,
    lingkup: b.lingkup,
    upah_disepakati: b.upah_disepakati,
    satuan: b.satuan,
    mulai: b.mulai,
    selesai: b.selesai,
    tanggal_bayar_dijanjikan: b.tanggal_bayar_dijanjikan,
    status: b.status,
    otp_pekerja_sudah: !!b.otp_pekerja_pada,
    otp_pemberi_sudah: !!b.otp_pemberi_pada,
    judul_lowongan: satu(b.lowongan)?.judul_baku ?? null,
    pekerja_id: b.pekerja_id,
    pemberi_kerja_id: b.pemberi_kerja_id,
    nama_pekerja: satu(b.pekerja)?.nama ?? "Pekerja",
    nama_pemberi: satu(b.pemberi)?.nama ?? "Pemberi kerja",
    pekerjaan_selesai: !!pekerjaan?.selesai_pada,
  };
}
```

- [ ] **Step 2: Rewrite the worker agreement page**

```tsx
import Link from "next/link";
import { ArrowLeft, CalendarCheck, FileSearch } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { kesepakatanUntukPihak, type KesepakatanTampil } from "@/lib/data/kesepakatan";
import { formatTanggal, upahTeks } from "@/lib/mock/utils";

import { AksiKesepakatan } from "./aksi-kesepakatan";
```

In `DokumenKesepakatan`, change the prop type to `KesepakatanTampil`, delete the two mock lookups, and substitute:
- `Pak Warto dan {pemberi?.nama ?? "pemberi kerja"}` → `{k.nama_pekerja} dan {k.nama_pemberi}`
- `{lw && (<p …>{lw.judul_baku}</p>)}` → `{k.judul_lowongan && (<p className="mt-1 text-body text-tanah-600">{k.judul_lowongan}</p>)}`
- `isi={formatTanggal(k.mulai)}` → `isi={k.mulai ? formatTanggal(k.mulai) : "Belum ditentukan"}`

Replace the page body:

```tsx
export default async function HalamanKesepakatan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const k = await kesepakatanUntukPihak(id, user!.id);

  if (!k) {
    return (
      <KeadaanKosong
        ikon={FileSearch}
        judul="Kesepakatan tidak ditemukan"
        penjelasan="Tautan ini mungkin sudah tidak berlaku. Kesepakatan aktif Anda bisa dilihat dari beranda."
        labelAksi="Kembali ke beranda"
        hrefAksi="/worker"
      />
    );
  }
```

and the action element:

```tsx
      <AksiKesepakatan
        kesepakatanId={k.id}
        namaPemberi={k.nama_pemberi}
        sudahOtp={k.otp_pekerja_sudah}
        statusAwal={k.status}
        pekerjaanSelesai={k.pekerjaan_selesai}
      />
```

- [ ] **Step 3: Wire `AksiKesepakatan` to the real endpoints**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, CircleCheck, Flag, MessageSquareText, Smartphone } from "lucide-react";

import { LangkahOTP } from "@/component/bersama/LangkahOTP";
import { Button } from "@/component/ui/button";
import type { StatusKesepakatan } from "@/lib/mock/types";

export function AksiKesepakatan({
  kesepakatanId,
  namaPemberi,
  sudahOtp,
  statusAwal,
  pekerjaanSelesai,
}: {
  kesepakatanId: string;
  namaPemberi: string;
  sudahOtp: boolean;
  statusAwal: StatusKesepakatan;
  pekerjaanSelesai: boolean;
}) {
  const [tahap, setTahap] = useState<"kirim" | "otp" | "aktif">(
    sudahOtp || statusAwal === "berjalan" ? "aktif" : "kirim",
  );
  const [selesaiDiminta, setSelesaiDiminta] = useState(pekerjaanSelesai);
  const [laporanTerkirim, setLaporanTerkirim] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  async function kirimKode() {
    setSibuk(true);
    try {
      const res = await fetch("/api/agreements/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kesepakatan_id: kesepakatanId, aksi: "kirim" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim kode.");
      setTahap("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  async function verifikasiKode(kode: string) {
    setSibuk(true);
    try {
      const res = await fetch("/api/agreements/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kesepakatan_id: kesepakatanId, aksi: "verifikasi", kode_otp: kode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Kode tidak cocok.");
      setTahap("aktif");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  async function tandaiSelesai() {
    setSibuk(true);
    try {
      const res = await fetch("/api/jobs/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kesepakatan_id: kesepakatanId, pihak: "pekerja" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal menandai selesai.");
      setSelesaiDiminta(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  async function laporkan() {
    setSibuk(true);
    try {
      const res = await fetch("/api/problems/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis: "upah_tidak_dibayar" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim laporan.");
      setLaporanTerkirim(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }
```

Keep the existing JSX, changing only these handlers: send button `onClick={kirimKode}` `disabled={sibuk}`; `<LangkahOTP … onSelesai={verifikasiKode} onKirimUlang={kirimKode} />`; complete button `onClick={tandaiSelesai}` `disabled={sibuk}`; report button `onClick={laporkan}` `disabled={sibuk}`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run lint && npx next build
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/kesepakatan.ts "src/app/(worker)/worker/agreements"
git commit -m "feat(worker): agreement page reads real data and calls OTP/complete/report APIs"
```

---

### Task 10: `/worker/profile` page + `/api/profile`

**Files:**
- Create: `src/lib/data/profil.ts`
- Create: `src/app/api/profile/route.ts`
- Create: `src/app/(worker)/worker/profile/page.tsx`
- Create: `src/app/(worker)/worker/profile/profil-form.tsx`
- Modify: `src/component/bersama/NavBawahPekerja.tsx`

**Interfaces:**
- Produces: `PATCH /api/profile` body `{ nama?: string; wilayah_id?: string | null }`; `profilPengguna(penggunaId)`.

- [ ] **Step 1: Data module**

```ts
// src/lib/data/profil.ts
import { createClient } from "@/lib/supabase/server-client";
import type { Peran, StatusVerifikasi } from "@/lib/mock/types";

export interface ProfilTampil {
  id: string;
  nama: string;
  no_hp: string;
  peran: Peran;
  status_verifikasi: StatusVerifikasi;
  wilayah_id: string | null;
  wilayah_nama: string | null;
  didampingi_oleh: string | null;
}

export interface PilihanWilayah {
  id: string;
  nama: string;
  provinsi: string;
}

export async function profilPengguna(penggunaId: string) {
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("pengguna")
    .select("id, nama, no_hp, peran, status_verifikasi, wilayah_id, didampingi_oleh, wilayah:wilayah_id(nama)")
    .eq("id", penggunaId)
    .single();

  const { data: daftarWilayah } = await supabase
    .from("wilayah")
    .select("id, nama, provinsi")
    .order("nama");

  const wl = p && (Array.isArray(p.wilayah) ? p.wilayah[0] : p.wilayah);

  const profil: ProfilTampil = {
    id: p!.id as string,
    nama: p!.nama as string,
    no_hp: p!.no_hp as string,
    peran: p!.peran as Peran,
    status_verifikasi: p!.status_verifikasi as StatusVerifikasi,
    wilayah_id: (p!.wilayah_id as string | null) ?? null,
    wilayah_nama: (wl as { nama: string } | null)?.nama ?? null,
    didampingi_oleh: (p!.didampingi_oleh as string | null) ?? null,
  };

  return { profil, daftarWilayah: (daftarWilayah ?? []) as PilihanWilayah[] };
}
```

- [ ] **Step 2: The endpoint**

```ts
// src/app/api/profile/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  nama: z.string().trim().min(3).max(100).optional(),
  wilayah_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.nama !== undefined) patch.nama = body.nama;
  if (body.wilayah_id !== undefined) patch.wilayah_id = body.wilayah_id;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, pesan: "Tidak ada yang diubah." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pengguna").update(patch).eq("id", userOrResponse.id);

  if (error) {
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan profil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: The form component**

```tsx
// src/app/(worker)/worker/profile/profil-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import type { PilihanWilayah, ProfilTampil } from "@/lib/data/profil";

export function ProfilForm({
  profil,
  daftarWilayah,
}: {
  profil: ProfilTampil;
  daftarWilayah: PilihanWilayah[];
}) {
  const router = useRouter();
  const [nama, setNama] = useState(profil.nama);
  const [wilayahId, setWilayahId] = useState(profil.wilayah_id ?? "");
  const [menyimpan, setMenyimpan] = useState(false);

  const namaValid = nama.trim().length >= 3;

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!namaValid || menyimpan) return;
    setMenyimpan(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim(), wilayah_id: wilayahId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal menyimpan profil.");
      toast.success("Profil tersimpan.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={simpan}>
      <div className="flex flex-col gap-2">
        <label htmlFor="nama" className="text-label text-tanah-800">
          Nama lengkap
        </label>
        <Input
          id="nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="h-14 text-body-lg"
          disabled={menyimpan}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="wilayah" className="text-label text-tanah-800">
          Wilayah tempat Anda biasa bekerja
        </label>
        <select
          id="wilayah"
          value={wilayahId}
          onChange={(e) => setWilayahId(e.target.value)}
          disabled={menyimpan}
          className="h-14 w-full rounded-md border border-input bg-tanah-0 px-4 text-body-lg shadow-1 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">Belum dipilih</option>
          {daftarWilayah.map((w) => (
            <option key={w.id} value={w.id}>
              {w.nama}, {w.provinsi}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="lg" variant="aksen" disabled={!namaValid || menyimpan}>
        {menyimpan ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
        Simpan perubahan
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: The page**

```tsx
// src/app/(worker)/worker/profile/page.tsx
import type { Metadata } from "next";
import { IdCard, Phone, ShieldCheck } from "lucide-react";

import { TombolKeluar } from "@/component/bersama/TombolKeluar";
import { createClient } from "@/lib/supabase/server-client";
import { profilPengguna } from "@/lib/data/profil";
import { LABEL_VERIFIKASI } from "@/lib/data/types";

import { ProfilForm } from "./profil-form";

export const metadata: Metadata = { title: "Profil Saya — Kita Kerja" };

export default async function HalamanProfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { profil, daftarWilayah } = await profilPengguna(user!.id);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-h1 text-tanah-900">Profil Saya</h1>
        <p className="mt-1 text-body-lg text-tanah-600">
          Nama ini yang dilihat pemberi kerja di Kartu Kerja Anda.
        </p>
      </header>

      <section
        aria-label="Informasi akun"
        className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
      >
        <p className="flex items-center gap-2 text-body text-tanah-700">
          <Phone className="size-5 shrink-0 text-tanah-500" aria-hidden />
          {profil.no_hp}
        </p>
        <p className="flex items-center gap-2 text-body text-tanah-700">
          <ShieldCheck className="size-5 shrink-0 text-biru-600" aria-hidden />
          {LABEL_VERIFIKASI[profil.status_verifikasi]}
        </p>
        <p className="flex items-center gap-2 text-body text-tanah-700">
          <IdCard className="size-5 shrink-0 text-tanah-500" aria-hidden />
          Nomor HP adalah kunci akun Anda dan tidak bisa diubah di sini.
        </p>
      </section>

      <ProfilForm profil={profil} daftarWilayah={daftarWilayah} />

      <section aria-label="Keluar akun" className="border-t border-tanah-200 pt-6">
        <TombolKeluar />
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Add the Profil tab**

In `NavBawahPekerja.tsx` add `import { CircleUser } from "lucide-react";` (merge into the existing lucide import), append to `TAB`:

```tsx
  { href: "/worker/profile", label: "Profil", ikon: CircleUser },
```

and change the grid to fit 5 tabs plus the logout cell:

```tsx
      <ul className="mx-auto grid h-16 max-w-(--max-worker) grid-cols-6">
```

- [ ] **Step 6: Verify live**

```bash
npm run typecheck && npm run lint && npx next build
curl -s -b "$COOKIES" -X PATCH http://localhost:3000/api/profile \
  -H "Content-Type: application/json" -d '{"nama":"Nama Baru Uji"}'
```
Expected: `{"ok":true}`. Then confirm the greeting on `/worker` shows the new name.

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/profil.ts src/app/api/profile "src/app/(worker)/worker/profile" src/component/bersama/NavBawahPekerja.tsx
git commit -m "feat(worker): profile page with editable name and wilayah"
```

---

## Phase C — Employer

### Task 11: Extract the screening runner + publish-job endpoint

**Files:**
- Create: `src/lib/engine/screening-runner.ts`
- Modify: `src/app/api/ai/jobs/screen/route.ts`
- Create: `src/app/api/jobs/publish/route.ts`

**Interfaces:**
- Produces: `jalankanSaringan(lowonganId, teksAsli, userId)`; `POST /api/jobs/publish`.

- [ ] **Step 1: Extract the runner**

```ts
// src/lib/engine/screening-runner.ts
/**
 * Saringan Aman: aturan deterministik + AI, disimpan lewat service role.
 * Dipakai oleh /api/ai/jobs/screen dan /api/jobs/publish supaya satu implementasi.
 */

import { callGemini } from "@/lib/ai/gemini-client";
import { SkemaSaringan } from "@/lib/ai/output-schemas";
import { PROMPT_SARINGAN } from "@/lib/ai/prompt-screening";
import { analisisRisikoAturan, tingkatRisiko } from "@/lib/engine/risk";
import { createServiceClient } from "@/lib/supabase/server-client";
import type { TemuanSaringan, TingkatRisiko } from "@/lib/mock/types";

export interface HasilSaringan {
  skor_risiko: number;
  tingkat: TingkatRisiko;
  temuan: TemuanSaringan[];
  pertanyaan_disarankan: string[];
  skor_ai: number;
  skor_aturan: number;
}

export async function jalankanSaringan(
  lowonganId: string,
  teksAsli: string,
  userId: string,
): Promise<HasilSaringan> {
  const aturan = analisisRisikoAturan(teksAsli);

  const ai = await callGemini({
    jenis: "saringan",
    promptParts: [
      { role: "user", parts: [{ text: PROMPT_SARINGAN }] },
      { role: "user", parts: [{ text: `Teks lowongan:\n${teksAsli}` }] },
    ],
    responseSchema: {
      type: "object",
      properties: {
        temuan: {
          type: "array",
          items: {
            type: "object",
            properties: {
              jenis: { type: "string" },
              kutipan: { type: "string" },
              penjelasan: { type: "string" },
            },
            required: ["jenis", "kutipan", "penjelasan"],
          },
        },
        pertanyaan_disarankan: { type: "array", items: { type: "string" } },
        skor_ai: { type: "integer" },
      },
      required: ["temuan", "pertanyaan_disarankan", "skor_ai"],
    },
    zodSchema: SkemaSaringan,
    temperature: 0.1,
    userId,
  });

  const skorAi = ai.ok ? ai.data.skor_ai : 0;
  const skorTotal = Math.min(aturan.skor_aturan + skorAi, 100);
  const tingkat = tingkatRisiko(skorTotal);
  const temuan = [...aturan.temuan, ...(ai.ok ? ai.data.temuan : [])];
  const pertanyaan = ai.ok ? ai.data.pertanyaan_disarankan : [];

  const service = await createServiceClient();
  await service.from("saringan_aman").upsert(
    {
      lowongan_id: lowonganId,
      skor_risiko: skorTotal,
      tingkat,
      temuan,
      pertanyaan_disarankan: pertanyaan,
      skor_ai: skorAi,
      skor_aturan: aturan.skor_aturan,
    },
    { onConflict: "lowongan_id" },
  );

  return {
    skor_risiko: skorTotal,
    tingkat,
    temuan,
    pertanyaan_disarankan: pertanyaan,
    skor_ai: skorAi,
    skor_aturan: aturan.skor_aturan,
  };
}
```

- [ ] **Step 2: Point the existing screen route at the runner**

Replace everything in `src/app/api/ai/jobs/screen/route.ts` after the ownership check with:

```ts
  const hasil = await jalankanSaringan(body.lowongan_id, lowongan.teks_asli, userOrResponse.id);

  if (hasil.tingkat === "berisiko_tinggi" && hasil.skor_risiko >= 60) {
    const service = await createServiceClient();
    await service.from("lowongan").update({ status: "moderasi" }).eq("id", body.lowongan_id);
  }

  return NextResponse.json({ ok: true, data: hasil });
```

and reduce its imports to `NextResponse`, `requireRole`, `createClient`, `createServiceClient`, `jalankanSaringan`, `z`.

- [ ] **Step 3: The publish endpoint**

```ts
// src/app/api/jobs/publish/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { jalankanSaringan } from "@/lib/engine/screening-runner";
import { z } from "zod";

const BodySchema = z.object({
  teks_asli: z.string().min(3).max(5000),
  judul_baku: z.string().trim().min(3).max(200),
  jenis_kerja: z.enum(["harian", "borongan", "paruh_waktu", "menginap"]).nullable(),
  jumlah_pekerja: z.number().int().min(1).max(100),
  upah_ditawarkan: z.number().int().min(0).nullable(),
  satuan_upah: z.enum(["harian", "bulanan", "borongan", "per_jam"]).nullable(),
  lokasi_teks: z.string().max(300).nullable(),
  wilayah_id: z.string().uuid().nullable(),
  mulai: z.string().nullable(),
  syarat_tersirat: z.array(z.string()).max(20).default([]),
  keahlian_ids: z.array(z.string().uuid()).max(10).default([]),
  /** true bila pemberi kerja memilih "Tayangkan dengan penanda" pada keadaan moderasi */
  paksa_tayang: z.boolean().default(false),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pemberi_kerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: lowongan, error } = await supabase
    .from("lowongan")
    .insert({
      pemberi_kerja_id: userOrResponse.id,
      teks_asli: body.teks_asli,
      judul_baku: body.judul_baku,
      jenis_kerja: body.jenis_kerja,
      jumlah_pekerja: body.jumlah_pekerja,
      upah_ditawarkan: body.upah_ditawarkan,
      satuan_upah: body.satuan_upah,
      lokasi_teks: body.lokasi_teks,
      wilayah_id: body.wilayah_id,
      mulai: body.mulai,
      syarat_tersirat: body.syarat_tersirat,
      status: "draf",
    })
    .select("id")
    .single();

  if (error || !lowongan) {
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan lowongan." }, { status: 500 });
  }

  if (body.keahlian_ids.length > 0) {
    await supabase.from("lowongan_keahlian").insert(
      body.keahlian_ids.map((keahlian_id) => ({
        lowongan_id: lowongan.id,
        keahlian_id,
        wajib: true,
      })),
    );
  }

  const saringan = await jalankanSaringan(lowongan.id, body.teks_asli, userOrResponse.id);

  const perluModerasi = saringan.tingkat === "berisiko_tinggi" && saringan.skor_risiko >= 60;
  const status = perluModerasi && !body.paksa_tayang ? "moderasi" : "tayang";

  await supabase.from("lowongan").update({ status }).eq("id", lowongan.id);

  return NextResponse.json({
    ok: true,
    data: { lowongan_id: lowongan.id, status, saringan },
  });
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run lint && npx next build 2>&1 | grep -E "jobs/publish|jobs/screen"
```
Expected: both routes listed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/screening-runner.ts src/app/api/ai/jobs/screen/route.ts src/app/api/jobs/publish/route.ts
git commit -m "feat(api): publish a lowongan; share one Saringan Aman runner"
```

---

### Task 12: `/employer/post` + `/employer/post/result` on real AI + publish

**Files:**
- Modify: `src/component/pemberi/ekstraksi.ts`
- Modify: `src/app/(employer)/employer/post/page.tsx`
- Modify: `src/app/(employer)/employer/post/result/page.tsx`
- Modify: `src/component/pemberi/RingkasanEkstraksi.tsx`

**Interfaces:**
- Consumes: `POST /api/ai/jobs/extract`, `POST /api/jobs/publish` (Task 11), `GET /api/wage-benchmark`.

- [ ] **Step 1: Reduce `ekstraksi.ts` to storage keys and labels**

Delete every parsing helper (`PETA_KECAMATAN`, `HARI`, `cariKeahlian`, `cariKecamatan`, `cariUpah`, `cariSatuanUpah`, `cariJenisKerja`, `cariTanggalMulai`, `simpulkanSyarat`, `ekstrakLowongan`, `saringTeks`) and its `@/lib/mock` data import. Keep only:

```ts
import type { JenisKerja, SatuanUpah } from "@/lib/mock/types";

export const KUNCI_TEKS_LOWONGAN = "kita-kerja:teks-lowongan";

export interface BidangLowongan {
  judul: string;
  jenisKerja: JenisKerja | "";
  jumlahPekerja: string;
  lokasi: string;
  wilayahId: string;
  keahlianIds: string[];
  upah: string;
  satuanUpah: SatuanUpah;
  mulai: string;
  syaratTersirat: string[];
  yangBelumJelas: string[];
  kelengkapan: number;
  teksAsli: string;
}

export const LABEL_JENIS_KERJA: Record<JenisKerja, string> = {
  harian: "Harian",
  borongan: "Borongan",
  paruh_waktu: "Paruh waktu",
  menginap: "Menginap",
};

export const LABEL_SATUAN_UPAH: Record<SatuanUpah, string> = {
  harian: "per hari",
  bulanan: "per bulan",
  borongan: "borongan",
  per_jam: "per jam",
};
```

- [ ] **Step 2: `/employer/post` — voice path uses real transcription**

Replace the `TombolRekam` `onSelesai` handler so it stops faking a transcript. Add at the top of the component:

```tsx
const [transkrip, setTranskrip] = useState(false);

async function rekamSelesai(blob: Blob | null) {
  if (!blob) {
    toast.error("Rekaman tidak tersedia di perangkat ini. Silakan ketik saja.");
    return;
  }
  setTranskrip(true);
  try {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let biner = "";
    for (let i = 0; i < bytes.length; i++) biner += String.fromCharCode(bytes[i]);
    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_base64: btoa(biner), mime_type: blob.type || "audio/webm" }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.pesan || "Gagal menuliskan rekaman.");
    setTeks(json.data.teks);
    setDariSuara(true);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
  } finally {
    setTranskrip(false);
  }
}
```

Add `import { toast } from "sonner";` and set `<TombolRekam mode="ketuk" onSelesai={rekamSelesai} />`.

Create the shared transcription endpoint it calls:

```ts
// src/app/api/transcribe/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { transcribeAudio } from "@/lib/ai/groq-client";
import { transcodeKeWav } from "@/lib/audio/transcode";
import { z } from "zod";

const BodySchema = z.object({
  audio_base64: z.string().min(1),
  mime_type: z.string().min(1),
});

export async function POST(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  let wav: string;
  try {
    wav = await transcodeKeWav(body.audio_base64, body.mime_type);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Gagal memproses rekaman audio. Coba rekam ulang." },
      { status: 400 },
    );
  }

  const hasil = await transcribeAudio(wav, userOrResponse.id);
  if (!hasil.ok) {
    return NextResponse.json(
      { ok: false, pesan: hasil.pesan_pengguna },
      { status: hasil.kode === "kuota" ? 429 : 503 },
    );
  }

  const teks = hasil.text.trim();
  if (!teks) {
    return NextResponse.json(
      { ok: false, pesan: "Rekaman tidak terdengar jelas. Coba rekam ulang lebih dekat ke mikrofon." },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true, data: { teks } });
}
```

- [ ] **Step 3: `/employer/post/result` calls extract then publish**

Replace the state initialiser and add the two effects/handlers:

```tsx
const [bidang, setBidang] = useState<BidangLowongan | null>(null);
const [memuat, setMemuat] = useState(true);
const [menayangkan, setMenayangkan] = useState(false);
const [saringan, setSaringan] = useState<{ tingkat: string; temuan: TemuanSaringan[] } | null>(null);

useEffect(() => {
  (async () => {
    const teks = sessionStorage.getItem(KUNCI_TEKS_LOWONGAN)?.trim();
    if (!teks) {
      router.replace("/employer/post");
      return;
    }
    try {
      const res = await fetch("/api/ai/jobs/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teks }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal membaca tulisan Anda.");
      const d = json.data;
      setBidang({
        judul: d.judul_baku ?? "",
        jenisKerja: d.jenis_kerja ?? "",
        jumlahPekerja: d.jumlah_pekerja ? String(d.jumlah_pekerja) : "",
        lokasi: d.lokasi_teks ?? "",
        wilayahId: "",
        keahlianIds: [],
        upah: d.upah_ditawarkan ? String(d.upah_ditawarkan) : "",
        satuanUpah: d.satuan_upah ?? "harian",
        mulai: d.mulai ?? "",
        syaratTersirat: d.syarat_tersirat ?? [],
        yangBelumJelas: d.yang_belum_jelas ?? [],
        kelengkapan: d.kelengkapan ?? 0,
        teksAsli: teks,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      router.replace("/employer/post");
    } finally {
      setMemuat(false);
    }
  })();
}, [router]);

async function tayangkan(paksa: boolean) {
  if (!bidang || menayangkan) return;
  setMenayangkan(true);
  try {
    const res = await fetch("/api/jobs/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teks_asli: bidang.teksAsli,
        judul_baku: bidang.judul,
        jenis_kerja: bidang.jenisKerja || null,
        jumlah_pekerja: Number(bidang.jumlahPekerja) || 1,
        upah_ditawarkan: bidang.upah ? Number(bidang.upah) : null,
        satuan_upah: bidang.satuanUpah,
        lokasi_teks: bidang.lokasi || null,
        wilayah_id: bidang.wilayahId || null,
        mulai: bidang.mulai || null,
        syarat_tersirat: bidang.syaratTersirat,
        keahlian_ids: bidang.keahlianIds,
        paksa_tayang: paksa,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.pesan || "Gagal menayangkan lowongan.");
    sessionStorage.removeItem(KUNCI_TEKS_LOWONGAN);
    if (json.data.status === "moderasi") {
      setSaringan(json.data.saringan);
      setKeadaan("sunting");
    } else {
      setKeadaan(paksa ? "tayang_dengan_penanda" : "tayang");
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
  } finally {
    setMenayangkan(false);
  }
}
```

Then in the JSX: guard the whole render with `if (memuat || !bidang) return <p role="status" className="text-body text-tanah-600">Membaca tulisan Anda…</p>;`; drive the moderation section off `saringan !== null` instead of the `?moderasi=1` query param (`{saringan && ( … {saringan.temuan.map(…)} … )}`); the "Tayangkan dengan penanda" button becomes `onClick={() => tayangkan(true)}`; the main CTA becomes `onClick={() => tayangkan(false)}` `disabled={menayangkan}`; replace `belumJelas` with `bidang.yangBelumJelas` and `kelengkapan` with `bidang.kelengkapan`; delete the `useSearchParams`, `hitungBelumJelas`, `hitungKelengkapan`, `saringTeks`, `acuanUntuk`, `wilayah`, `statusUpah` usages and the whole `upahDiBawahAcuan` PenandaUpah block (wage comparison now needs a `wilayah_id` the AI does not return — the employer sets it in the fields, and the dashboard shows the marker once the job exists).

- [ ] **Step 4: `RingkasanEkstraksi` gains a wilayah selector**

Add a `daftarWilayah: PilihanWilayah[]` prop and a `<select>` bound to `bidang.wilayahId` (same markup pattern as the profile form's wilayah select), because `wilayah_id` is required for wage benchmarking and is no longer guessed by a regex.

Fetch the list in `IsiHasil` with a `useEffect` calling a new tiny endpoint:

```ts
// src/app/api/wilayah/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";

export async function GET() {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const supabase = await createClient();
  const { data } = await supabase.from("wilayah").select("id, nama, provinsi").order("nama");
  return NextResponse.json({ ok: true, data: { wilayah: data ?? [] } });
}
```

- [ ] **Step 5: Verify live**

```bash
npm run typecheck && npm run lint && npx next build
curl -s -b "$EMP_COOKIES" -X POST http://localhost:3000/api/jobs/publish \
  -H "Content-Type: application/json" \
  -d '{"teks_asli":"butuh 2 tukang renov dapur di Sukun, harian 150 ribu","judul_baku":"Tukang renovasi dapur","jenis_kerja":"harian","jumlah_pekerja":2,"upah_ditawarkan":150000,"satuan_upah":"harian","lokasi_teks":"Sukun, Kota Malang","wilayah_id":null,"mulai":null,"syarat_tersirat":[],"keahlian_ids":[]}'
```
Expected: `{"ok":true,"data":{"lowongan_id":"…","status":"tayang",…}}`.

- [ ] **Step 6: Commit**

```bash
git add src/component/pemberi "src/app/(employer)/employer/post" src/app/api/transcribe src/app/api/wilayah
git commit -m "feat(employer): post flow uses real AI extraction and publishes to Supabase"
```

---

### Task 13: Employer dashboard + manage-job + close endpoint

**Files:**
- Create: `src/lib/data/pemberi.ts`
- Create: `src/app/api/jobs/close/route.ts`
- Modify: `src/app/(employer)/employer/page.tsx`
- Modify: `src/app/(employer)/employer/jobs/[id]/page.tsx`

**Interfaces:**
- Produces: `dasborPemberi(pemberiId)`, `kelolaLowongan(lowonganId, pemberiId)`; `POST /api/jobs/close`.

- [ ] **Step 1: Data module**

```ts
// src/lib/data/pemberi.ts
import { createClient } from "@/lib/supabase/server-client";
import { hitungAcuanUpah } from "@/lib/engine/wage-benchmark";
import { ambilKeahlianTampil } from "./keahlian";
import type {
  AcuanTampil,
  CalonTampil,
  LowonganTampil,
  RekamJejakPekerja,
  SaringanTampil,
} from "./types";
import type { SatuanUpah, StatusKesepakatan, StatusLamaran, StatusLowongan } from "@/lib/mock/types";

function satu<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export interface RingkasLowongan {
  id: string;
  judul_baku: string;
  status: StatusLowongan;
  lokasi_teks: string | null;
  mulai: string | null;
  upah_ditawarkan: number | null;
  satuan_upah: SatuanUpah | null;
  wilayah_nama: string | null;
  acuan: AcuanTampil | null;
  jumlah_calon: number;
}

export interface RingkasKesepakatan {
  id: string;
  status: StatusKesepakatan;
  nama_pekerja: string;
  upah_disepakati: number;
  satuan: SatuanUpah;
  tanggal_bayar_dijanjikan: string;
}

export async function dasborPemberi(pemberiId: string) {
  const supabase = await createClient();

  const { data: barisLowongan } = await supabase
    .from("lowongan")
    .select(
      `id, judul_baku, status, lokasi_teks, mulai, upah_ditawarkan, satuan_upah, wilayah_id,
       wilayah:wilayah_id(nama), keahlian:lowongan_keahlian(keahlian_id), lamaran(id, status)`,
    )
    .eq("pemberi_kerja_id", pemberiId)
    .order("id");

  const lowongan: RingkasLowongan[] = await Promise.all(
    (barisLowongan ?? []).map(async (b: Record<string, unknown>) => {
      const keahlianId = (b.keahlian as { keahlian_id: string }[] | null)?.[0]?.keahlian_id ?? null;
      const wilayahId = b.wilayah_id as string | null;
      const acuan = keahlianId && wilayahId ? await hitungAcuanUpah(keahlianId, wilayahId) : null;
      return {
        id: b.id as string,
        judul_baku: (b.judul_baku as string) ?? "Lowongan",
        status: b.status as StatusLowongan,
        lokasi_teks: (b.lokasi_teks as string) ?? null,
        mulai: (b.mulai as string) ?? null,
        upah_ditawarkan: (b.upah_ditawarkan as number) ?? null,
        satuan_upah: (b.satuan_upah as SatuanUpah) ?? null,
        wilayah_nama: satu(b.wilayah as { nama: string } | null)?.nama ?? null,
        acuan: acuan
          ? {
              acuan_harian: acuan.acuan_harian,
              metode: acuan.metode,
              jumlah_laporan: acuan.jumlah_laporan,
            }
          : null,
        jumlah_calon: ((b.lamaran as unknown[]) ?? []).length,
      };
    }),
  );

  const { data: barisCalon } = await supabase
    .from("lamaran")
    .select("id, status, pekerja_id, lowongan_id, pekerja:pekerja_id(nama), lowongan:lowongan_id(judul_baku, pemberi_kerja_id)")
    .eq("status", "dilamar")
    .order("dibuat_pada", { ascending: false })
    .limit(10);

  const calonTerbaru = (barisCalon ?? [])
    .filter((c: Record<string, unknown>) => satu(c.lowongan as { pemberi_kerja_id: string } | null)?.pemberi_kerja_id === pemberiId)
    .map((c: Record<string, unknown>) => ({
      lamaran_id: c.id as string,
      lowongan_id: c.lowongan_id as string,
      nama: satu(c.pekerja as { nama: string } | null)?.nama ?? "Pekerja",
      judul_lowongan: satu(c.lowongan as { judul_baku: string } | null)?.judul_baku ?? "Lowongan",
      status: c.status as StatusLamaran,
    }));

  const { data: barisKesepakatan } = await supabase
    .from("kesepakatan_kerja")
    .select("id, status, upah_disepakati, satuan, tanggal_bayar_dijanjikan, pekerja:pekerja_id(nama)")
    .eq("pemberi_kerja_id", pemberiId)
    .in("status", ["menunggu", "berjalan"]);

  const kesepakatan: RingkasKesepakatan[] = (barisKesepakatan ?? []).map(
    (k: Record<string, unknown>) => ({
      id: k.id as string,
      status: k.status as StatusKesepakatan,
      nama_pekerja: satu(k.pekerja as { nama: string } | null)?.nama ?? "Pekerja",
      upah_disepakati: k.upah_disepakati as number,
      satuan: k.satuan as SatuanUpah,
      tanggal_bayar_dijanjikan: k.tanggal_bayar_dijanjikan as string,
    }),
  );

  return { lowongan, calonTerbaru, kesepakatan };
}

export interface KelolaLowongan {
  lowongan: LowonganTampil;
  jumlah_calon: number;
  jumlah_dilamar: number;
  jumlah_diundang: number;
}

export async function kelolaLowongan(
  lowonganId: string,
  pemberiId: string,
): Promise<KelolaLowongan | null> {
  const supabase = await createClient();

  const { data: b } = await supabase
    .from("lowongan")
    .select(
      `id, judul_baku, teks_asli, status, jenis_kerja, jumlah_pekerja, upah_ditawarkan,
       satuan_upah, lokasi_teks, mulai, syarat_tersirat, wilayah_id, pemberi_kerja_id,
       wilayah:wilayah_id(nama),
       saringan:saringan_aman(tingkat, temuan, pertanyaan_disarankan),
       keahlian:lowongan_keahlian(keahlian_id),
       lamaran(id, status)`,
    )
    .eq("id", lowonganId)
    .maybeSingle<Record<string, unknown>>();

  if (!b || b.pemberi_kerja_id !== pemberiId) return null;

  const keahlianId = (b.keahlian as { keahlian_id: string }[] | null)?.[0]?.keahlian_id ?? null;
  const wilayahId = b.wilayah_id as string | null;
  const acuan = keahlianId && wilayahId ? await hitungAcuanUpah(keahlianId, wilayahId) : null;
  const lamaran = (b.lamaran as { status: StatusLamaran }[] | null) ?? [];

  return {
    lowongan: {
      id: b.id as string,
      judul_baku: (b.judul_baku as string) ?? "Lowongan",
      teks_asli: b.teks_asli as string,
      status: b.status as StatusLowongan,
      jenis_kerja: (b.jenis_kerja as LowonganTampil["jenis_kerja"]) ?? null,
      jumlah_pekerja: b.jumlah_pekerja as number,
      upah_ditawarkan: (b.upah_ditawarkan as number) ?? null,
      satuan_upah: (b.satuan_upah as SatuanUpah) ?? null,
      lokasi_teks: (b.lokasi_teks as string) ?? null,
      mulai: (b.mulai as string) ?? null,
      syarat_tersirat: (b.syarat_tersirat as string[]) ?? [],
      wilayah_id: wilayahId,
      wilayah_nama: satu(b.wilayah as { nama: string } | null)?.nama ?? null,
      pemberi_kerja_id: b.pemberi_kerja_id as string,
      saringan: satu(b.saringan as SaringanTampil | null),
      acuan: acuan
        ? { acuan_harian: acuan.acuan_harian, metode: acuan.metode, jumlah_laporan: acuan.jumlah_laporan }
        : null,
      alasan_cocok: null,
    },
    jumlah_calon: lamaran.length,
    jumlah_dilamar: lamaran.filter((l) => l.status === "dilamar").length,
    jumlah_diundang: lamaran.filter((l) => l.status === "diundang").length,
  };
}

export async function calonUntukLowongan(
  lowonganId: string,
  pemberiId: string,
): Promise<CalonTampil[]> {
  const supabase = await createClient();

  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, pemberi_kerja_id")
    .eq("id", lowonganId)
    .maybeSingle();
  if (!lowongan || lowongan.pemberi_kerja_id !== pemberiId) return [];

  const { data: baris } = await supabase
    .from("lamaran")
    .select(
      `id, status, alasan_cocok, pekerja_id,
       pekerja:pekerja_id(nama, wilayah:wilayah_id(nama))`,
    )
    .eq("lowongan_id", lowonganId);

  const hasil: CalonTampil[] = [];

  for (const c of (baris ?? []) as Record<string, unknown>[]) {
    const pekerjaId = c.pekerja_id as string;
    const pekerja = satu(c.pekerja as { nama: string; wilayah: unknown } | null);

    const { data: kartu } = await supabase
      .from("kartu_kerja")
      .select("id, pengalaman_tahun, bidang:bidang_utama_id(nama)")
      .eq("pekerja_id", pekerjaId)
      .maybeSingle();

    const keahlian = kartu
      ? await ambilKeahlianTampil(supabase, kartu.id as string, pekerjaId, {
          hanyaDikonfirmasi: true,
        })
      : [];

    const { data: jejak } = await supabase.rpc("rekam_jejak_pekerja", { p_pekerja: pekerjaId });
    const jejakSatu = (jejak as RekamJejakPekerja[] | null)?.[0] ?? {
      pekerjaan_selesai: 0,
      rata_penilaian: 0,
      jumlah_penilai: 0,
    };

    const { data: kesepakatan } = await supabase
      .from("kesepakatan_kerja")
      .select("id")
      .eq("lowongan_id", lowonganId)
      .eq("pekerja_id", pekerjaId)
      .maybeSingle();

    hasil.push({
      lamaran_id: c.id as string,
      status: c.status as StatusLamaran,
      alasan_cocok: (c.alasan_cocok as string[]) ?? [],
      pekerja_id: pekerjaId,
      nama: pekerja?.nama ?? "Pekerja",
      wilayah_nama: satu(pekerja?.wilayah as { nama: string } | null)?.nama ?? null,
      bidang_nama: satu(kartu?.bidang as { nama: string } | null)?.nama ?? null,
      pengalaman_tahun: (kartu?.pengalaman_tahun as number) ?? null,
      keahlian,
      rekam_jejak: jejakSatu,
      kesepakatan_id: (kesepakatan?.id as string) ?? null,
    });
  }

  return hasil;
}
```

- [ ] **Step 2: Close endpoint**

```ts
// src/app/api/jobs/close/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({ lowongan_id: z.string().uuid() });

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pemberi_kerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, pemberi_kerja_id")
    .eq("id", body.lowongan_id)
    .maybeSingle();

  if (!lowongan) {
    return NextResponse.json({ ok: false, pesan: "Lowongan tidak ditemukan." }, { status: 404 });
  }
  if (lowongan.pemberi_kerja_id !== userOrResponse.id) {
    return NextResponse.json({ ok: false, pesan: "Akses ditolak." }, { status: 403 });
  }

  const { error } = await supabase
    .from("lowongan")
    .update({ status: "ditutup" })
    .eq("id", body.lowongan_id);

  if (error) {
    return NextResponse.json({ ok: false, pesan: "Gagal menutup lowongan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Rewrite the dashboard head**

```tsx
import { createClient } from "@/lib/supabase/server-client";
import { dasborPemberi } from "@/lib/data/pemberi";
import { profilPengguna } from "@/lib/data/profil";
import { formatRupiah, formatTanggal, inisialkanNamaBelakang, upahTeks } from "@/lib/mock/utils";

export default async function HalamanDasborPemberi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { profil } = await profilPengguna(user!.id);
  const { lowongan, calonTerbaru, kesepakatan } = await dasborPemberi(user!.id);

  const aktif = lowongan.filter((l) => l.status === "tayang");
  const berjalan = kesepakatan.filter((k) => k.status === "berjalan");
  const menunggu = kesepakatan.filter((k) => k.status === "menunggu");
```

Then: `Halo, Mbak Dhika` → `Halo, {profil.nama}`; ringkasan `nilai` values → `aktif.length` / `calonTerbaru.length` / `berjalan.length`; `PenandaUpahRingkas` takes `{ lowongan: RingkasLowongan }` and renders `<PenandaUpah ringkas ditawarkan={l.upah_ditawarkan!} acuan={l.acuan!} wilayahNama={l.wilayah_nama ?? "wilayah ini"} />` guarded by `l.satuan_upah === "harian" && l.acuan && l.upah_ditawarkan !== null`; job list maps `aktif` with `l.jumlah_calon`; candidate list maps `calonTerbaru` (`c.nama`, `c.judul_lowongan`, `href={`/employer/jobs/${c.lowongan_id}/candidates`}`); agreement list maps `[...menunggu, ...berjalan]` with `k.nama_pekerja` and `upahTeks(k.upah_disepakati, k.satuan)`. Delete every `mockPemberi` and `@/lib/mock` data import.

- [ ] **Step 4: Rewrite manage-job as a server component + client close button**

Create `src/app/(employer)/employer/jobs/[id]/tombol-tutup.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleX } from "lucide-react";

import { Button } from "@/component/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/component/ui/dialog";

export function TombolTutupLowongan({ lowonganId }: { lowonganId: string }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [buka, setBuka] = useState(false);

  async function tutup() {
    setSibuk(true);
    try {
      const res = await fetch("/api/jobs/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowongan_id: lowonganId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal menutup lowongan.");
      setBuka(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="flex-1">
          <CircleX aria-hidden />
          Tutup lowongan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-h3">Tutup lowongan ini?</DialogTitle>
          <DialogDescription className="text-body text-tanah-600">
            Lowongan berhenti tampil ke pekerja. Calon yang sudah masuk tetap bisa Anda hubungi
            dari halaman calon.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setBuka(false)}>
            Batal
          </Button>
          <Button variant="destructive" disabled={sibuk} onClick={tutup}>
            Ya, tutup lowongan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Convert the page: drop `"use client"`, make it `async`, fetch with `kelolaLowongan(id, user!.id)`, return the existing `KeadaanKosong` when `null`, replace `lwn.*` with `lowongan.*`, `sa` with `lowongan.saringan`, the three stat numbers with `jumlah_calon`/`jumlah_dilamar`/`jumlah_diundang`, and the inline Dialog with `{lowongan.status !== "ditutup" && <TombolTutupLowongan lowonganId={lowongan.id} />}`. Guard `formatTanggal(lowongan.mulai)` with a null check and `lowongan.jenis_kerja?.replace("_", " ") ?? "Belum disebutkan"`.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npx next build
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/pemberi.ts src/app/api/jobs/close "src/app/(employer)/employer/page.tsx" "src/app/(employer)/employer/jobs/[id]"
git commit -m "feat(employer): dashboard and manage-job read real data; close endpoint"
```

---

### Task 14: Candidates page + invite + create-agreement

**Files:**
- Create: `src/app/api/applications/invite/route.ts`
- Modify: `src/component/pemberi/KartuCalon.tsx`
- Modify: `src/app/(employer)/employer/jobs/[id]/candidates/page.tsx`
- Create: `src/app/(employer)/employer/jobs/[id]/candidates/aksi-calon.tsx`
- Delete: `src/component/pemberi/mockPemberi.ts`

**Interfaces:**
- Consumes: `calonUntukLowongan` (Task 13), `POST /api/agreements/create` (exists).
- Produces: `POST /api/applications/invite`.

- [ ] **Step 1: Invite endpoint**

```ts
// src/app/api/applications/invite/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({ lamaran_id: z.string().uuid() });

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pemberi_kerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: lamaran } = await supabase
    .from("lamaran")
    .select("id, status, lowongan:lowongan_id(pemberi_kerja_id)")
    .eq("id", body.lamaran_id)
    .maybeSingle();

  if (!lamaran) {
    return NextResponse.json({ ok: false, pesan: "Lamaran tidak ditemukan." }, { status: 404 });
  }

  const lo = Array.isArray(lamaran.lowongan) ? lamaran.lowongan[0] : lamaran.lowongan;
  if ((lo as { pemberi_kerja_id: string } | null)?.pemberi_kerja_id !== userOrResponse.id) {
    return NextResponse.json({ ok: false, pesan: "Akses ditolak." }, { status: 403 });
  }
  if (lamaran.status !== "dilamar") {
    return NextResponse.json(
      { ok: false, pesan: "Lamaran ini sudah diproses." },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("lamaran")
    .update({ status: "diundang" })
    .eq("id", body.lamaran_id);

  if (error) {
    return NextResponse.json({ ok: false, pesan: "Gagal mengirim undangan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: `KartuCalon` takes `CalonTampil`**

```tsx
import type { CalonTampil } from "@/lib/data/types";
import { inisialkanNamaBelakang, inisialNama } from "@/lib/mock/utils";
import type { StatusLamaran } from "@/lib/mock/types";

const LABEL_STATUS_LAMARAN: Record<StatusLamaran, string> = {
  dilamar: "Melamar",
  diundang: "Diundang",
  ditolak: "Tidak diteruskan",
  disepakati: "Disepakati",
};

export function KartuCalon({
  calon,
  aksi,
  className,
}: {
  calon: CalonTampil;
  aksi?: React.ReactNode;
  className?: string;
}) {
```

Substitutions in its JSX: `inisialNama(pekerja.nama)` → `inisialNama(calon.nama)`; `inisialkanNamaBelakang(pekerja.nama)` → `inisialkanNamaBelakang(calon.nama)`; `{bidang?.nama …}` → `{calon.bidang_nama ?? "Kartu Kerja belum diterbitkan"}{calon.pengalaman_tahun ? ` · pengalaman ${calon.pengalaman_tahun} tahun` : ""}`; `{wl && (…{wl.nama}…)}` → `{calon.wilayah_nama && (…{calon.wilayah_nama}…)}`; status badge → `{LABEL_STATUS_LAMARAN[calon.status]}`; skills list → `calon.keahlian.slice(0,3).map((k) => …{k.nama_tampil}… <BadgeLapis lapis={k.lapis} />)`; `lamaran.alasan_cocok` → `calon.alasan_cocok`; the rekam-jejak `<ul>` becomes:

```tsx
        <ul className="mt-1 flex flex-col gap-1">
          <li className="text-body text-tanah-700">
            · {calon.rekam_jejak.pekerjaan_selesai} pekerjaan selesai dikonfirmasi dua pihak.
          </li>
          <li className="text-body text-tanah-700">
            ·{" "}
            {calon.rekam_jejak.jumlah_penilai > 0
              ? `Rata-rata penilaian ${calon.rekam_jejak.rata_penilaian.toFixed(1).replace(".", ",")} dari ${calon.rekam_jejak.jumlah_penilai} penilai.`
              : "Belum ada penilaian dari pemberi kerja."}
          </li>
        </ul>
```

Remove all `@/lib/mock` data and `mockPemberi` imports.

- [ ] **Step 3: Candidate actions client component**

```tsx
// src/app/(employer)/employer/jobs/[id]/candidates/aksi-calon.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Handshake, Send } from "lucide-react";

import { Button } from "@/component/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/component/ui/dialog";
import { Input } from "@/component/ui/input";
import { Textarea } from "@/component/ui/textarea";
import type { CalonTampil } from "@/lib/data/types";

export function AksiCalon({ calon }: { calon: CalonTampil }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [buka, setBuka] = useState(false);
  const [lingkup, setLingkup] = useState("");
  const [upah, setUpah] = useState("");
  const [tanggalBayar, setTanggalBayar] = useState("");

  if (calon.kesepakatan_id) {
    return (
      <Button asChild size="lg" className="flex-1">
        <Link href={`/employer/agreements/${calon.kesepakatan_id}`}>
          <Handshake aria-hidden />
          Lihat kesepakatan
        </Link>
      </Button>
    );
  }

  async function undang() {
    setSibuk(true);
    try {
      const res = await fetch("/api/applications/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lamaran_id: calon.lamaran_id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim undangan.");
      toast.success("Undangan terkirim.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  async function buatKesepakatan() {
    if (!lingkup.trim() || !upah || !tanggalBayar) return;
    setSibuk(true);
    try {
      const res = await fetch("/api/agreements/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lamaran_id: calon.lamaran_id,
          lingkup: lingkup.trim(),
          upah_disepakati: Number(upah),
          satuan: "harian",
          tanggal_bayar_dijanjikan: tanggalBayar,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal membuat kesepakatan.");
      setBuka(false);
      router.push(`/employer/agreements/${json.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <>
      {calon.status === "dilamar" && (
        <Button size="lg" variant="outline" className="flex-1" disabled={sibuk} onClick={undang}>
          <Send aria-hidden />
          Undang
        </Button>
      )}
      <Button size="lg" className="flex-1" disabled={sibuk} onClick={() => setBuka(true)}>
        <Handshake aria-hidden />
        Buat kesepakatan
      </Button>

      <Dialog open={buka} onOpenChange={setBuka}>
        <DialogContent className="bg-tanah-0">
          <DialogHeader>
            <DialogTitle className="text-h3">Buat kesepakatan kerja</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lingkup" className="text-label font-semibold text-tanah-700">
                Lingkup pekerjaan
              </label>
              <Textarea
                id="lingkup"
                value={lingkup}
                onChange={(e) => setLingkup(e.target.value)}
                placeholder="mis. Pasang keramik dapur 3x4 m, alat disediakan."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="upah" className="text-label font-semibold text-tanah-700">
                Upah harian (rupiah)
              </label>
              <Input
                id="upah"
                type="number"
                min={0}
                step={1000}
                value={upah}
                onChange={(e) => setUpah(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bayar" className="text-label font-semibold text-tanah-700">
                Upah dijanjikan dibayar paling lambat
              </label>
              <Input
                id="bayar"
                type="date"
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuka(false)}>
              Batal
            </Button>
            <Button
              disabled={sibuk || !lingkup.trim() || !upah || !tanggalBayar}
              onClick={buatKesepakatan}
            >
              Buat kesepakatan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

Note: `/api/agreements/create` currently returns the full row as `data`; confirm it exposes `data.id` — it does (`.select().single()`).

- [ ] **Step 4: Rewrite the candidates page as a server component**

```tsx
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { KartuCalon } from "@/component/pemberi/KartuCalon";
import { createClient } from "@/lib/supabase/server-client";
import { calonUntukLowongan, kelolaLowongan } from "@/lib/data/pemberi";

import { AksiCalon } from "./aksi-calon";

export default async function HalamanCalonPekerja({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const kelola = await kelolaLowongan(id, user!.id);
  if (!kelola) {
    return (
      <KeadaanKosong
        ikon={Users}
        judul="Lowongan tidak ditemukan"
        penjelasan="Kembali ke dasbor untuk melihat lowongan Anda."
        labelAksi="Kembali ke dasbor"
        hrefAksi="/employer"
      />
    );
  }

  const daftarCalon = await calonUntukLowongan(id, user!.id);
```

Keep the existing header/empty-state JSX (substituting `lwn.judul_baku` → `kelola.lowongan.judul_baku`, `lwn.id` → `kelola.lowongan.id`) and replace the list body with:

```tsx
        <ul className="flex flex-col gap-5">
          {daftarCalon.map((calon) => (
            <li key={calon.lamaran_id}>
              <KartuCalon calon={calon} aksi={<AksiCalon calon={calon} />} />
              {calon.status === "diundang" && (
                <p role="status" className="mt-2 rounded-lg bg-biru-50 p-3 text-label text-biru-900">
                  Undangan terkirim. Pekerja akan melihat undangan Anda di aplikasinya.
                </p>
              )}
            </li>
          ))}
        </ul>
```

- [ ] **Step 5: Delete the mock module**

```bash
git rm src/component/pemberi/mockPemberi.ts
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npx next build
```
Expected: no remaining references to `mockPemberi`.

- [ ] **Step 7: Commit**

```bash
git add -A src/component/pemberi "src/app/(employer)/employer/jobs/[id]/candidates" src/app/api/applications/invite
git commit -m "feat(employer): candidates page on real data, invite and create-agreement wired"
```

---

### Task 15: Employer agreement + completion + ratings endpoint

**Files:**
- Create: `src/app/api/ratings/route.ts`
- Modify: `src/app/(employer)/employer/agreements/[id]/page.tsx`
- Create: `src/app/(employer)/employer/agreements/[id]/aksi-otp.tsx`
- Modify: `src/app/(employer)/employer/complete/[id]/page.tsx`
- Create: `src/app/(employer)/employer/complete/[id]/form-penilaian.tsx`

**Interfaces:**
- Consumes: `kesepakatanUntukPihak` (Task 9), `POST /api/agreements/otp`, `POST /api/jobs/complete`.
- Produces: `POST /api/ratings` body `{ kesepakatan_id, skor, catatan? }`.

- [ ] **Step 1: Ratings endpoint**

```ts
// src/app/api/ratings/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  kesepakatan_id: z.string().uuid(),
  skor: z.number().int().min(1).max(5),
  catatan: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pemberi_kerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: pekerjaan } = await supabase
    .from("pekerjaan")
    .select("id, pemberi_kerja_id, selesai_pada")
    .eq("kesepakatan_id", body.kesepakatan_id)
    .maybeSingle();

  if (!pekerjaan) {
    return NextResponse.json(
      { ok: false, pesan: "Pekerjaan belum tercatat. Konfirmasi selesai dulu." },
      { status: 404 },
    );
  }
  if (pekerjaan.pemberi_kerja_id !== userOrResponse.id) {
    return NextResponse.json({ ok: false, pesan: "Akses ditolak." }, { status: 403 });
  }
  if (!pekerjaan.selesai_pada) {
    return NextResponse.json(
      { ok: false, pesan: "Pekerjaan belum dikonfirmasi selesai oleh kedua pihak." },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("penilaian").insert({
    pekerjaan_id: pekerjaan.id,
    pemberi_kerja_id: userOrResponse.id,
    skor: body.skor,
    catatan: body.catatan ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, pesan: "Penilaian untuk pekerjaan ini sudah pernah dikirim." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan penilaian." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Employer agreement OTP client component**

Create `aksi-otp.tsx` mirroring the worker's handlers but posting `pihak: "pemberi_kerja"` nowhere (OTP route infers the party) — it needs only `kirimKode` / `verifikasiKode` from Task 9 Step 3, with props `{ kesepakatanId: string; sudahOtp: boolean }`, rendering the existing "Konfirmasi kesepakatan" section when `!terkonfirmasi` and the "Kesepakatan aktif" section plus the `/employer/complete/[id]` CTA when confirmed.

- [ ] **Step 3: Convert the employer agreement page**

Drop `"use client"`, make it `async`, fetch via `kesepakatanUntukPihak(id, user!.id)`, return `KeadaanKosong` on `null`, substitute `pekerja`/`lwn` lookups with `k.nama_pekerja` / `k.judul_lowongan`, guard `formatTanggal(k.mulai)`, use `upahTeks(k.upah_disepakati, k.satuan)`, and render `<AksiOtp kesepakatanId={k.id} sudahOtp={k.otp_pemberi_sudah || k.status === "berjalan"} />`.

- [ ] **Step 4: Convert the completion page**

Move all interactive state into `form-penilaian.tsx` (props `{ kesepakatanId: string; namaPekerja: string }`), keeping the existing three-step JSX. Its submit handler runs two calls in order:

```tsx
const resSelesai = await fetch("/api/jobs/complete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kesepakatan_id: kesepakatanId, pihak: "pemberi_kerja" }),
});
const jsonSelesai = await resSelesai.json();
if (!resSelesai.ok) throw new Error(jsonSelesai.pesan || "Gagal menandai selesai.");

const resNilai = await fetch("/api/ratings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kesepakatan_id: kesepakatanId, skor: nilai, catatan: catatan.trim() || undefined }),
});
const jsonNilai = await resNilai.json();
if (!resNilai.ok) throw new Error(jsonNilai.pesan || "Gagal mengirim penilaian.");
setTerkirim(true);
```

The page itself becomes an async server component fetching `kesepakatanUntukPihak` for the header line and passing ids down.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npx next build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ratings "src/app/(employer)/employer/agreements" "src/app/(employer)/employer/complete"
git commit -m "feat(employer): agreement OTP, completion and rating on real APIs"
```

---

## Phase D — Companion & public

### Task 16: Companion pages + register endpoint

**Files:**
- Create: `src/lib/data/pendamping.ts`
- Create: `src/app/api/companion/register/route.ts`
- Modify: `src/app/(companion)/companion/page.tsx`
- Modify: `src/app/(companion)/companion/register/page.tsx`

**Interfaces:**
- Produces: `pekerjaDidampingi(pendampingId)`; `POST /api/companion/register` body `{ nama, wilayah_id, no_hp? }` → `{ ok: true, data: { pekerja_id } }`.

- [ ] **Step 1: Data module**

```ts
// src/lib/data/pendamping.ts
import { createClient } from "@/lib/supabase/server-client";

export interface PekerjaDidampingi {
  id: string;
  nama: string;
  wilayah_nama: string | null;
  kartu_diterbitkan_pada: string | null;
  punya_kartu: boolean;
}

export async function pekerjaDidampingi(pendampingId: string): Promise<PekerjaDidampingi[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pengguna")
    .select("id, nama, wilayah:wilayah_id(nama), kartu_kerja(diterbitkan_pada)")
    .eq("didampingi_oleh", pendampingId)
    .order("nama");

  return (data ?? []).map((p: Record<string, unknown>) => {
    const wl = p.wilayah as { nama: string } | { nama: string }[] | null;
    const wlSatu = Array.isArray(wl) ? wl[0] : wl;
    const kartu = (p.kartu_kerja as { diterbitkan_pada: string | null }[] | null)?.[0] ?? null;
    return {
      id: p.id as string,
      nama: p.nama as string,
      wilayah_nama: wlSatu?.nama ?? null,
      kartu_diterbitkan_pada: kartu?.diterbitkan_pada ?? null,
      punya_kartu: !!kartu?.diterbitkan_pada,
    };
  });
}
```

- [ ] **Step 2: Register endpoint**

```ts
// src/app/api/companion/register/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiHp } from "@/lib/auth/shared";
import { z } from "zod";

const BodySchema = z.object({
  nama: z.string().trim().min(3).max(100),
  wilayah_id: z.string().uuid(),
  no_hp: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pendamping");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const service = await createServiceClient();

  // Pekerja dampingan sering belum punya HP — akun tetap dibuat atas namanya.
  const phone = body.no_hp?.replace(/\D/g, "") ? normalisasiHp(body.no_hp) : null;
  const email = `dampingan-${crypto.randomUUID()}@kitakerja.test`;

  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email,
    ...(phone ? { phone, phone_confirm: true } : {}),
    email_confirm: true,
    user_metadata: { nama: body.nama, didampingi_oleh: userOrResponse.id },
  });

  if (authError || !authUser.user) {
    const pesan = authError?.message.includes("already been registered")
      ? "Nomor HP ini sudah terdaftar. Pekerja bisa langsung masuk sendiri."
      : "Gagal membuat akun pekerja.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  const { error: penggunaError } = await service.from("pengguna").insert({
    id: authUser.user.id,
    nama: body.nama,
    no_hp: phone ?? `tanpa-hp-${authUser.user.id.slice(0, 8)}`,
    peran: "pekerja",
    wilayah_id: body.wilayah_id,
    status_verifikasi: phone ? "hp_terverifikasi" : "belum",
    didampingi_oleh: userOrResponse.id,
  });

  if (penggunaError) {
    await service.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan data pekerja." }, { status: 500 });
  }

  const { error: kartuError } = await service
    .from("kartu_kerja")
    .insert({ pekerja_id: authUser.user.id });

  if (kartuError) {
    return NextResponse.json({ ok: false, pesan: "Gagal menyiapkan kartu kerja." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: { pekerja_id: authUser.user.id } });
}
```

- [ ] **Step 3: `/companion` server component**

```tsx
import { createClient } from "@/lib/supabase/server-client";
import { pekerjaDidampingi } from "@/lib/data/pendamping";
import { profilPengguna } from "@/lib/data/profil";
import { formatTanggal, inisialNama } from "@/lib/mock/utils";

export default async function HalamanPekerjaDidampingi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { profil } = await profilPengguna(user!.id);
  const didampingi = await pekerjaDidampingi(user!.id);
```

Substitutions: `{pendampingUtama.nama} — Pendamping` → `{profil.nama} — Pendamping`; in the list, `pekerja.umur`/`wl` → `pekerja.wilayah_nama ?? "Wilayah belum diisi"`; `{kartu ? (…)}` → `{pekerja.punya_kartu ? (…)}` with `formatTanggal(pekerja.kartu_diterbitkan_pada!)`.

- [ ] **Step 4: `/companion/register` posts at step 3**

Fetch wilayah from `/api/wilayah` (Task 12 Step 4) in a `useEffect` instead of importing the mock array. Replace the final CTA with a handler:

```tsx
async function daftarkan() {
  if (sibuk) return;
  setSibuk(true);
  try {
    const res = await fetch("/api/companion/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: nama.trim(),
        wilayah_id: wilayahId,
        no_hp: noHp.trim() || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.pesan || "Gagal mendaftarkan pekerja.");
    toast.success(`${nama.trim()} berhasil didaftarkan.`);
    router.push("/companion");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
  } finally {
    setSibuk(false);
  }
}
```

The step-3 button becomes `<Button size="lg" className="w-full" disabled={sibuk} onClick={daftarkan}>` with label `Daftarkan {namaTampil}`. Keep the "Nanti saja" link. Note: the interview must be run from the worker's own login, so the old direct link to `/worker/interview` is removed — the companion helps the worker sign in afterwards.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npx next build
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/pendamping.ts src/app/api/companion "src/app/(companion)"
git commit -m "feat(companion): assisted-worker list and registration on real data"
```

---

### Task 17: `/verify/[token]` public page dynamic

**Files:**
- Modify: `src/app/(public)/verify/[token]/page.tsx`

**Interfaces:**
- Consumes: the same service-role query as `GET /api/cards/[token]`, called directly server-side (no self-fetch).

- [ ] **Step 1: Replace the data source**

```tsx
import { createServiceClient } from "@/lib/supabase/server-client";

interface KartuPublik {
  aktif_publik: boolean;
  ringkasan: string | null;
  pengalaman_tahun: number;
  diterbitkan_pada: string | null;
  bidang_utama: { nama: string } | null;
  pekerja: { nama: string; id: string } | null;
  keahlian: {
    sebutan_pekerja: string | null;
    nama_diajukan: string | null;
    level: string;
    kutipan_bukti: string;
    keahlian_id: string | null;
    keahlian: { nama_baku: string } | null;
  }[];
}

export default async function HalamanVerifikasi({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: kartu } = await supabase
    .from("kartu_kerja")
    .select(
      `aktif_publik, ringkasan, pengalaman_tahun, diterbitkan_pada,
       bidang_utama:bidang_utama_id(nama),
       pekerja:pekerja_id(id, nama),
       keahlian:kartu_keahlian(sebutan_pekerja, nama_diajukan, level, kutipan_bukti, keahlian_id, keahlian:keahlian_id(nama_baku))`,
    )
    .eq("token_publik", token)
    .maybeSingle<KartuPublik>();
```

If `!kartu || !kartu.aktif_publik`, render the existing polite "kartu tidak ditemukan" state unchanged (one uniform page for every unknown/inactive token).

Then derive the numbers and layers with the same RPCs used elsewhere:

```tsx
  const pekerjaId = kartu.pekerja!.id;
  const { data: jejak } = await supabase.rpc("rekam_jejak_pekerja", { p_pekerja: pekerjaId });
  const statistik = (jejak as { pekerjaan_selesai: number; rata_penilaian: number; jumlah_penilai: number }[] | null)?.[0]
    ?? { pekerjaan_selesai: 0, rata_penilaian: 0, jumlah_penilai: 0 };

  const { data: lapisBaris } = await supabase.rpc("lapis_keahlian_pekerja", { p_pekerja: pekerjaId });
  const petaLapis = new Map(
    ((lapisBaris ?? []) as { keahlian_id: string; lapis: LapisKepercayaan }[]).map((r) => [r.keahlian_id, r.lapis]),
  );

  const keahlian = kartu.keahlian.map((k, i) => ({
    id: `${i}`,
    nama_tampil: k.keahlian?.nama_baku ?? k.nama_diajukan ?? k.sebutan_pekerja ?? "Keahlian",
    sebutan_pekerja: k.sebutan_pekerja ?? "",
    kutipan_bukti: k.kutipan_bukti,
    lapis: (k.keahlian_id && petaLapis.get(k.keahlian_id)) || ("diklaim" as LapisKepercayaan),
  }));
```

Then swap the mock references in the existing JSX: `pekerjaUtama.nama` → `kartu.pekerja!.nama`, `kartuWarto.*` → `kartu.*`, `keahlianWarto` → `keahlian` (rendering `k.nama_tampil`), `statistikWarto.*` → `statistik.*` (guarding the rating with `statistik.jumlah_penilai > 0`), `bidangKerja.find(...)` → `kartu.bidang_utama?.nama`, and drop the completed-jobs list built from `riwayatWarto` (a stranger scanning a QR must not see per-job detail — keep only the aggregate counts, which is also what §6.5 asks for).

- [ ] **Step 2: Verify live**

```bash
npm run typecheck && npm run lint && npx next build
```
Then, using a real published token from the DB:

```bash
TOKEN=$(curl -s -b "$COOKIES" http://localhost:3000/api/cards/issue -X POST | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).data.token_publik))")
curl -s "http://localhost:3000/verify/$TOKEN" | grep -c "Kartu Kerja"
```
Expected: ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/verify"
git commit -m "feat(public): verification page reads the real published card"
```

---

## Phase E — Verification

### Task 18: Full-flow live verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm no page imports mock data any more**

```bash
grep -rn "from \"@/lib/mock\"" src/app | grep -v "/lib/mock/types" | grep -v "/lib/mock/utils"
```
Expected: no output. (`src/app/demo/**` may still use mock data — that route is demo-only and gated by `DEMO_MODE`; exclude it consciously if it appears.)

- [ ] **Step 2: Static gates**

```bash
npm run typecheck && npm run lint && npx next build
```
Expected: all clean.

- [ ] **Step 3: Seed two fresh personas**

Register one `pemberi_kerja` and one `pekerja` through `/api/auth/otp` + `/api/auth/verify` with `DEMO_OTP=123456`, storing separate cookie jars (`$EMP_COOKIES`, `$WRK_COOKIES`).

- [ ] **Step 4: Drive the full loop with curl**

1. Employer publishes: `POST /api/jobs/publish` → expect `status: "tayang"`, capture `lowongan_id`.
2. Worker lists jobs: `GET /worker/jobs` renders and contains the new title.
3. Worker applies: `POST /api/applications { lowongan_id }` → `{ ok: true }`.
4. Employer invites: `POST /api/applications/invite { lamaran_id }` → `{ ok: true }`.
5. Employer creates agreement: `POST /api/agreements/create` → capture `id`.
6. Both confirm OTP: `POST /api/agreements/otp { aksi: "verifikasi", kode_otp: "123456" }` from each cookie jar → second call returns `status: "berjalan"`.
7. Both confirm completion: `POST /api/jobs/complete` with `pihak: "pekerja"` then `pihak: "pemberi_kerja"` → second returns `sudah_selesai: true`.
8. Employer rates: `POST /api/ratings { kesepakatan_id, skor: 5 }` → `{ ok: true }`.
9. Worker history: `GET /worker/history` contains the job title and the rating.

- [ ] **Step 5: Confirm the trust layer actually flipped**

```sql
SELECT * FROM lapis_keahlian_pekerja('<worker-uuid>');
```
Expected: at least one row with `lapis = 'terverifikasi'` — proving the layer is derived from real completed work, not stored.

- [ ] **Step 6: Commit**

```bash
git commit --allow-empty -m "test: verify end-to-end employer-to-worker flow on real data"
```

---

## Self-Review

**Spec coverage.** Every route in §5.1 that was still on mock now has a task: `/pekerja/lowongan` + `[id]` (6), `/pekerja/lamaran` (7), `/pekerja/riwayat` (8), `/pekerja/kesepakatan/[id]` (9), `/pemberi` (13), `/pemberi/pasang` + `/hasil` (12), `/pemberi/lowongan/[id]` (13), `/…/calon` (14), `/pemberi/kesepakatan/[id]` + `/pemberi/selesai/[id]` (15), `/pendamping` + `/pendamping/daftarkan` (16), `/verifikasi/[token]` (17). Profile is an addition the user asked for (10). §9 endpoints that were missing are added in Tasks 5, 11, 13, 14, 15, 16.

**Known deviations, deliberate:**
- §9 says audio uploads go to Storage and only a path is sent. The existing interview flow already posts base64 and works; `/api/transcribe` follows that same shape for consistency. Moving both to Storage is a separate follow-up, not folded in here.
- The employer post/result page loses its client-side wage-comparison panel because the AI extractor does not return a `wilayah_id`; the employer now picks the wilayah explicitly, and the marker shows on the dashboard/manage-job once the row exists.
- `@/lib/mock` keeps its name while only exporting types and formatters; renaming it to `@/lib/domain` is a mechanical follow-up that would add churn to every task here.
