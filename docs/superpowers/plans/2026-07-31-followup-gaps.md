# Follow-up Gaps (Keahlian Resolver, Lapor Upah, Jarak, Claim Flow, Demo Panel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close five real, verified gaps left after the dynamic-pages plan (PR #27): jobs published via `/employer/post` never get real `keahlian_ids` (blocks matching + trust-layer flips); `lapor upah` has no working UI; job distance ("jarak") is never computed or shown; a phone-less worker registered by a pendamping has no way to claim their own account; and the `/demo` jury panel is a static mockup with no real backend behind any of its four controls.

**Architecture:** Five mostly-independent slices sharing one existing pattern (`src/lib/data/*.ts` read modules + Zod-validated route handlers + RLS-aware `createClient`). The distance and demo-panel slices each need one new migration. Every write path re-checks ownership/role server-side; DEMO_MODE-gated code paths `notFound()`/403 when the flag is off, matching the existing `/demo` page's own guard.

**Tech Stack:** Next.js 15 App Router + TypeScript, Supabase (Postgres + Auth), Zod, existing `@/lib/data`, `@/lib/engine`, `@/lib/ai` modules — no new dependencies.

## Global Constraints

- Every mutating route re-checks `requireRole`/`requireSession` server-side (middleware is not sufficient alone) — established pattern throughout the codebase.
- Never surface raw Postgres/Gemini errors to the client — map to a `{ok:false, pesan}` Indonesian string.
- AI never touches wage numbers (Global constraint carried from the dynamic-pages plan) — the keahlian resolver only matches skill *names*, never wages.
- Distances are always displayed as approximations (`"~7 km"`), never claimed as exact — per ADR-0002.
- `DEMO_MODE` gating: any new demo-only route/page must `notFound()` (pages) or return 404 (API routes) when `process.env.DEMO_MODE !== "true"`, matching `src/app/demo/page.tsx`'s existing guard.
- No test framework exists in this repo. Verification is `npm run typecheck && npm run lint && npx next build`, plus live checks against the real Supabase project via the Supabase MCP tools (`execute_sql`, `apply_migration`) where a task touches the database — same standard as the previous plan.
- Reuse existing helpers — do not duplicate `satu()`, `formatRupiah`, `ambilKeahlianTampil`, etc. Follow the file-per-responsibility pattern already established in `src/lib/data/`.

---

## Task 1: Keahlian name→uuid resolver, wired into job publish

**Files:**
- Create: `src/lib/engine/keahlian-resolver.ts`
- Modify: `src/app/(employer)/employer/post/result/page.tsx`

**Interfaces:**
- Produces: `resolveKeahlianIds(supabase: SupabaseClient, namaNama: string[]): Promise<string[]>` — takes AI-suggested skill-name strings (e.g. `["pasang keramik", "las listrik"]`), returns matched `keahlian_baku.id` uuids (best-effort, skips unmatched names, never throws).
- Consumes: `keahlian_baku` table (`id`, `nama_baku`, `alias text[]`), already seeded.

- [ ] **Step 1: Write the resolver**

```ts
// src/lib/engine/keahlian-resolver.ts
/**
 * Cocokkan nama keahlian bebas (dari ekstraksi AI) ke keahlian_baku.id —
 * pencocokan nama, BUKAN AI: deterministik, tidak pernah mengarang upah/id.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

function normalisasi(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function resolveKeahlianIds(
  supabase: SupabaseClient,
  namaNama: string[]
): Promise<string[]> {
  if (namaNama.length === 0) return [];

  const { data: semua } = await supabase
    .from("keahlian_baku")
    .select("id, nama_baku, alias");

  if (!semua) return [];

  const hasil = new Set<string>();

  for (const nama of namaNama) {
    const target = normalisasi(nama);
    if (!target) continue;

    // 1. cocok persis (nama_baku atau salah satu alias)
    let cocok = semua.find(
      (k) =>
        normalisasi(k.nama_baku) === target ||
        (k.alias ?? []).some((a: string) => normalisasi(a) === target)
    );

    // 2. cocok sebagian (target mengandung nama_baku, atau sebaliknya)
    if (!cocok) {
      cocok = semua.find((k) => {
        const baku = normalisasi(k.nama_baku);
        if (target.includes(baku) || baku.includes(target)) return true;
        return (k.alias ?? []).some((a: string) => {
          const al = normalisasi(a);
          return target.includes(al) || al.includes(target);
        });
      });
    }

    if (cocok) hasil.add(cocok.id);
  }

  return [...hasil];
}
```

- [ ] **Step 2: Wire into the publish call**

Read the CURRENT `src/app/(employer)/employer/post/result/page.tsx` in full first — it already tracks `keahlianDisarankan` (skill-name strings surfaced read-only, per the earlier fix) and sends `keahlian_ids: []` unconditionally in `tayangkan()`. Change `tayangkan()` to resolve names to ids before sending:

Since resolution needs a Supabase client and this is a client component, add a tiny new route instead of calling Supabase directly from the browser:

- [ ] **Step 2a: Create `src/app/api/keahlian/resolve/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { resolveKeahlianIds } from "@/lib/engine/keahlian-resolver";
import { z } from "zod";

const BodySchema = z.object({
  nama: z.array(z.string()).max(20),
});

export async function POST(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format tidak valid." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const ids = await resolveKeahlianIds(supabase, body.nama);

  return NextResponse.json({ ok: true, data: { keahlian_ids: ids } });
}
```

- [ ] **Step 2b: Call it from `tayangkan()` before publish**

In `src/app/(employer)/employer/post/result/page.tsx`, inside `tayangkan()`, before the `fetch("/api/jobs/publish", ...)` call, add:

```ts
let keahlianIds: string[] = [];
if (keahlianDisarankan.length > 0) {
  try {
    const resResolve = await fetch("/api/keahlian/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: keahlianDisarankan }),
    });
    const jsonResolve = await resResolve.json();
    if (resResolve.ok) keahlianIds = jsonResolve.data.keahlian_ids;
  } catch {
    // resolusi keahlian gagal → tetap lanjut publish tanpa keahlian_ids,
    // jangan blokir penerbitan lowongan karena ini
  }
}
```

Then change the publish body's `keahlian_ids: []` to `keahlian_ids: keahlianIds`.

(Exact variable name for the skill-name-strings state may differ slightly from `keahlianDisarankan` depending on what the prior task named it — read the file first and match the real name.)

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint
```

Then live-verify against the real Supabase project: publish a test job whose free text mentions a real `keahlian_baku.nama_baku` (e.g. "butuh tukang batu"), and confirm via `mcp__supabase__execute_sql` that a `lowongan_keahlian` row now exists for the resulting `lowongan_id`:

```sql
select lk.lowongan_id, kb.nama_baku
from lowongan_keahlian lk
join keahlian_baku kb on kb.id = lk.keahlian_id
where lk.lowongan_id = '<the published job id>';
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/engine/keahlian-resolver.ts src/app/api/keahlian/resolve/route.ts "src/app/(employer)/employer/post/result/page.tsx"
git commit -m "feat(employer): resolve AI-suggested skill names to real keahlian_baku ids on publish"
```

---

## Task 2: Lapor Upah — wire the existing endpoint to a real UI

**Files:**
- Create: `src/app/(worker)/worker/history/lapor-upah.tsx`
- Modify: `src/app/(worker)/worker/history/page.tsx`

**Interfaces:**
- Consumes: `POST /api/wages/report` (already exists — `{pekerjaan_id?, keahlian_id?, wilayah_id?, upah_diterima, satuan}` → `{ok:true, data:{pesan}}`).
- Consumes (read): needs the worker's own `keahlian` list and `wilayah_id` to pre-fill the form sensibly — reuse `getDashboardPekerja` (already fetched by the page one level up, or re-fetch minimally).

- [ ] **Step 1: Read the current history page and confirm what data it already has in scope**

`src/app/(worker)/worker/history/page.tsx` already computes `riwayat` (an array of completed jobs, each with an `id` usable as `pekerjaan_id`). It does NOT currently have the worker's `wilayah_id` or confirmed `keahlian` in scope — check if it's easy to add via the existing `getDashboardPekerja`/`riwayatPekerja` calls already made on this page, or add a minimal additional read. Prefer the simplest option: the dialog only needs `upah_diterima` and `satuan` as required fields; `pekerjaan_id`, `keahlian_id`, `wilayah_id` are all optional on the endpoint, so the client component can work with ZERO extra data — just let the worker optionally pick which completed job (from the same `riwayat` list already on the page) the report relates to.

- [ ] **Step 2: Create the dialog component**

```tsx
// src/app/(worker)/worker/history/lapor-upah.tsx
"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/component/ui/dialog";
import type { SatuanUpah } from "@/lib/mock/types";

const LABEL_SATUAN: Record<SatuanUpah, string> = {
  harian: "per hari",
  bulanan: "per bulan",
  borongan: "borongan",
  per_jam: "per jam",
};

export function LaporUpah({
  pekerjaanTerbaru,
}: {
  /** riwayat pekerjaan terbaru untuk dipilih (opsional, boleh kosong) */
  pekerjaanTerbaru: { id: string; judul: string }[];
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [pekerjaanId, setPekerjaanId] = useState("");
  const [upah, setUpah] = useState("");
  const [satuan, setSatuan] = useState<SatuanUpah>("harian");
  const [mengirim, setMengirim] = useState(false);

  const kirim = async () => {
    const nilai = Number(upah);
    if (!nilai || nilai <= 0 || mengirim) return;
    setMengirim(true);
    try {
      const res = await fetch("/api/wages/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pekerjaan_id: pekerjaanId || undefined,
          upah_diterima: Math.round(nilai),
          satuan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal melaporkan upah.");
      toast.success(json.data?.pesan ?? "Upah berhasil dilaporkan. Terima kasih!");
      setTerbuka(false);
      setUpah("");
      setPekerjaanId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setMengirim(false);
    }
  };

  return (
    <Dialog open={terbuka} onOpenChange={setTerbuka}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-12 w-full items-start gap-2 rounded-lg bg-tanah-100 p-4 text-left text-label text-tanah-600 transition-colors duration-(--duration-fast) hover:bg-tanah-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
        >
          <Megaphone className="mt-0.5 size-4 shrink-0" aria-hidden />
          Upah yang Anda laporkan memperbaiki acuan untuk pekerja lain — ketuk untuk lapor
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-h3">Laporkan upah yang Anda terima</DialogTitle>
          <DialogDescription className="text-body text-tanah-600">
            Angka ini membantu acuan upah jadi lebih akurat untuk pekerja lain di daerah Anda.
          </DialogDescription>
        </DialogHeader>

        {pekerjaanTerbaru.length > 0 && (
          <div className="flex flex-col gap-2">
            <label htmlFor="lu-pekerjaan" className="text-label text-tanah-800">
              Pekerjaan (boleh dikosongkan)
            </label>
            <select
              id="lu-pekerjaan"
              value={pekerjaanId}
              onChange={(e) => setPekerjaanId(e.target.value)}
              className="h-12 w-full rounded-md border border-input bg-tanah-0 px-4 text-body shadow-1 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">— Tidak terkait pekerjaan tertentu —</option>
              {pekerjaanTerbaru.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.judul}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="lu-upah" className="text-label text-tanah-800">
            Upah yang diterima (rupiah)
          </label>
          <Input
            id="lu-upah"
            type="number"
            min={1}
            step={1000}
            inputMode="numeric"
            value={upah}
            onChange={(e) => setUpah(e.target.value)}
            placeholder="mis. 150000"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="lu-satuan" className="text-label text-tanah-800">
            Satuan
          </label>
          <select
            id="lu-satuan"
            value={satuan}
            onChange={(e) => setSatuan(e.target.value as SatuanUpah)}
            className="h-12 w-full rounded-md border border-input bg-tanah-0 px-4 text-body shadow-1 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {(Object.keys(LABEL_SATUAN) as SatuanUpah[]).map((s) => (
              <option key={s} value={s}>
                {LABEL_SATUAN[s]}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button size="lg" className="w-full" disabled={!upah || mengirim} onClick={kirim}>
            <Send aria-hidden />
            Kirim laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Wire into the history page**

In `src/app/(worker)/worker/history/page.tsx`, replace the existing static `<p>` "Ajakan lapor upah" block with:

```tsx
<LaporUpah pekerjaanTerbaru={riwayat.slice(0, 5).map((p) => ({ id: p.id, judul: p.judul }))} />
```

Add the import: `import { LaporUpah } from "./lapor-upah";`. Remove the now-unused `Megaphone` import from `lucide-react` if nothing else in the file uses it (check first).

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run lint
```

Live-verify: as the test worker from the previous plan's E2E run, POST a wage report through this new dialog (or replicate via curl to `/api/wages/report` as before) and confirm a `lapor_upah` row appears:

```sql
select * from lapor_upah where pekerja_id = '<test worker id>' order by dibuat_pada desc limit 1;
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(worker)/worker/history/lapor-upah.tsx" "src/app/(worker)/worker/history/page.tsx"
git commit -m "feat(worker): wire lapor-upah to a real dialog instead of decorative text"
```

---

## Task 3: Kecamatan table + seed + migration (foundation for distance)

**Files:**
- Create: `supabase/migrations/20260731000003_kecamatan_and_distance.sql`
- Modify: `supabase/seed.ts`

**Interfaces:**
- Produces: `kecamatan` table (`id uuid`, `nama text`, `wilayah_id uuid references wilayah`, `lat numeric`, `lng numeric`), `lowongan.kecamatan_id uuid references kecamatan` (nullable), `pengguna.kecamatan_id uuid references kecamatan` (nullable, worker's own location).

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260731000003_kecamatan_and_distance.sql
-- Kecamatan-centroid table for offline distance approximation (ADR-0002).
-- No live geocoding call — workers and employers pick from a seeded list.

CREATE TABLE IF NOT EXISTS kecamatan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  wilayah_id uuid NOT NULL REFERENCES wilayah(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  UNIQUE (nama, wilayah_id)
);

ALTER TABLE lowongan ADD COLUMN IF NOT EXISTS kecamatan_id uuid REFERENCES kecamatan(id);
ALTER TABLE pengguna ADD COLUMN IF NOT EXISTS kecamatan_id uuid REFERENCES kecamatan(id);

-- Publicly readable list, same as wilayah/keahlian_baku — no RLS needed
-- (matches the existing no-RLS pattern on reference/taxonomy tables).

CREATE INDEX IF NOT EXISTS idx_kecamatan_wilayah ON kecamatan(wilayah_id);
```

Apply via `mcp__supabase__apply_migration` (name: `kecamatan_and_distance`).

- [ ] **Step 2: Seed kecamatan rows for the existing seeded wilayah**

Read `supabase/seed.ts`'s `wilayahData` array first (Kota Malang, Kabupaten Malang, Kota Surabaya, Kabupaten Sidoarjo, Kota Yogyakarta, Kabupaten Sleman) — add a new `kecamatanData` array with 3-4 real kecamatan per wilayah (real names, approximate real-world centroid lat/lng — e.g. Sukun/Blimbing/Klojen/Lowokwaru for Kota Malang; Rungkut/Gubeng/Wonokromo for Kota Surabaya; etc. — use approximate publicly-known coordinates, precision to 2-3 decimal places is enough since this is only ever displayed as "~X km"), and a seeding step that inserts them after `wilayahData`:

```ts
const kecamatanData: { nama: string; wilayah_nama: string; lat: number; lng: number }[] = [
  { nama: "Sukun", wilayah_nama: "Kota Malang", lat: -7.995, lng: 112.612 },
  { nama: "Blimbing", wilayah_nama: "Kota Malang", lat: -7.943, lng: 112.635 },
  { nama: "Klojen", wilayah_nama: "Kota Malang", lat: -7.983, lng: 112.629 },
  { nama: "Lowokwaru", wilayah_nama: "Kota Malang", lat: -7.936, lng: 112.605 },
  { nama: "Rungkut", wilayah_nama: "Kota Surabaya", lat: -7.335, lng: 112.766 },
  { nama: "Gubeng", wilayah_nama: "Kota Surabaya", lat: -7.276, lng: 112.752 },
  { nama: "Wonokromo", wilayah_nama: "Kota Surabaya", lat: -7.310, lng: 112.738 },
  { nama: "Krian", wilayah_nama: "Kabupaten Sidoarjo", lat: -7.379, lng: 112.567 },
  { nama: "Sidoarjo", wilayah_nama: "Kabupaten Sidoarjo", lat: -7.447, lng: 112.718 },
  { nama: "Gamping", wilayah_nama: "Kabupaten Sleman", lat: -7.786, lng: 110.325 },
  { nama: "Sleman", wilayah_nama: "Kabupaten Sleman", lat: -7.719, lng: 110.357 },
];
```

Add a seeding loop after the wilayah loop (follow the exact same pattern as the existing `bidangKerjaData`/`wilayahData` loops — insert, log, populate a `kecamatanMap: Map<string, string>` keyed by `` `${nama}|${wilayah_nama}` `` for later use if needed).

- [ ] **Step 3: Run the seed script and verify**

```bash
npx tsx supabase/seed.ts
```

Expected: existing wilayah/bidang/keahlian rows skip or re-insert idempotently (matches current script behavior — don't change that), new `kecamatan` rows print `✅ Kecamatan: <nama>`.

Verify via `mcp__supabase__execute_sql`:
```sql
select count(*) from kecamatan;
```
Expect 11 (or however many you seeded).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260731000003_kecamatan_and_distance.sql supabase/seed.ts
git commit -m "feat(db): kecamatan-centroid table for offline distance approximation"
```

---

## Task 4: Distance calculation + kecamatan picker on worker profile + job list/detail display

**Files:**
- Create: `src/lib/engine/jarak.ts`
- Modify: `src/lib/data/profil.ts`
- Modify: `src/app/api/profile/route.ts`
- Modify: `src/app/(worker)/worker/profile/profil-form.tsx`
- Modify: `src/app/(worker)/worker/profile/page.tsx`
- Modify: `src/lib/data/lowongan.ts`
- Modify: `src/component/pekerja/KartuLowongan.tsx`
- Modify: `src/app/(worker)/worker/jobs/[id]/page.tsx`

**Interfaces:**
- Produces: `jarakKm(a: {lat:number;lng:number}, b: {lat:number;lng:number}): number` (haversine).
- Consumes: worker's own `kecamatan_id` (from `pengguna`), job's `kecamatan_id` (from `lowongan`) — both nullable; distance only computes/displays when BOTH are set.

- [ ] **Step 1: Write the haversine helper**

```ts
// src/lib/engine/jarak.ts
/**
 * Jarak garis lurus antar dua titik (haversine) — SELALU ditampilkan sebagai
 * perkiraan ("~X km"), bukan rute sungguhan. Tanpa panggilan API eksternal.
 */

const RADIUS_BUMI_KM = 6371;

export function jarakKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return Math.round(RADIUS_BUMI_KM * c * 10) / 10;
}

/** "3.2" → "~3 km" ; "0.4" → "kurang dari 1 km" — sama gaya dgn jarakTeks mock */
export function jarakTeks(km: number): string {
  if (km < 1) return "kurang dari 1 km";
  return `~${Math.round(km)} km`;
}
```

- [ ] **Step 2: Add kecamatan to the worker's own profile**

Read `src/lib/data/profil.ts` and `src/app/api/profile/route.ts` in full first (both already exist from the dynamic-pages plan). Add `kecamatan_id`/`kecamatan_nama` to `ProfilPengguna` (read side, joined the same way `wilayah` already is), and add `kecamatan_id: z.string().uuid().nullable().optional()` to the PATCH endpoint's `BodySchema`, patched through the same way `wilayah_id` already is.

Add a kecamatan `<select>` to `profil-form.tsx`, populated from a new `GET /api/kecamatan?wilayah_id=` route (mirror the existing `GET /api/wilayah/route.ts` exactly, filtering by `?wilayah_id=` query param since kecamatan list should narrow once a wilayah is picked — read `/api/wilayah/route.ts` first to match its exact response envelope).

- [ ] **Step 2a: Create `src/app/api/kecamatan/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";

export async function GET(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const { searchParams } = new URL(request.url);
  const wilayahId = searchParams.get("wilayah_id");

  const supabase = await createClient();
  let query = supabase.from("kecamatan").select("id, nama, wilayah_id").order("nama");
  if (wilayahId) query = query.eq("wilayah_id", wilayahId);

  const { data } = await query;

  return NextResponse.json({ ok: true, data: { kecamatan: data ?? [] } });
}
```

- [ ] **Step 3: Set `kecamatan_id` at job publish time**

`/employer/post` currently has no kecamatan picker either. Add the SAME kecamatan `<select>` pattern to `src/component/pemberi/RingkasanEkstraksi.tsx` (which already has a wilayah select from the dynamic-pages plan — read it first), bound to a new `kecamatanId` field on `BidangLowongan` (in `src/component/pemberi/ekstraksi.ts`, add `kecamatanId: string` to the interface). Thread it through `/api/jobs/publish`'s `BodySchema` (add `kecamatan_id: z.string().uuid().nullable()`) and its insert into `lowongan`.

- [ ] **Step 4: Compute distance in the job data layer**

In `src/lib/data/lowongan.ts`, `keLowonganTampil` (or wherever `LowonganTampil` is constructed) needs the WORKER's own `kecamatan` (lat/lng) to compute against each job's `kecamatan` (lat/lng). Read the current `daftarLowonganUntukPekerja`/`detailLowonganUntukPekerja` signatures first — both already take `pekerjaId`. Add one query at the top of each function fetching the worker's `kecamatan:kecamatan_id(lat, lng)` via `pengguna`, then pass that into the per-row mapping to compute `jarak_km: number | null` (null if either side lacks a kecamatan) using `jarakKm()`. Add `jarak_km: number | null` to `LowonganTampil` in `src/lib/data/types.ts`.

- [ ] **Step 5: Display it**

In `KartuLowongan.tsx` and `worker/jobs/[id]/page.tsx`, render `jarakTeks(lw.jarak_km)` next to the location line when `lw.jarak_km !== null`, matching wherever the old mock `jarakTeks(lw.jarak_km)` call used to sit (both files already import location-related pieces from Task 6 of the prior plan — read them first, the old mock `jarakTeks` import from `@/lib/mock` should be dropped in favor of the new one from `@/lib/engine/jarak`).

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npx next build 2>&1 | tail -40
```

Live-verify: set a `kecamatan_id` on the test worker's profile and on a freshly-published test job (different kecamatan, ideally same wilayah for a sane distance), confirm the job list/detail page renders a `"~X km"` line, and confirm a job/worker pair with either side missing `kecamatan_id` renders with NO distance line (not a crash, not "~0 km").

- [ ] **Step 7: Commit**

```bash
git add src/lib/engine/jarak.ts src/lib/data/profil.ts src/app/api/profile/route.ts \
  "src/app/(worker)/worker/profile/profil-form.tsx" "src/app/(worker)/worker/profile/page.tsx" \
  src/lib/data/lowongan.ts src/lib/data/types.ts src/component/pekerja/KartuLowongan.tsx \
  "src/app/(worker)/worker/jobs/[id]/page.tsx" src/app/api/kecamatan/route.ts \
  src/component/pemberi/RingkasanEkstraksi.tsx src/component/pemberi/ekstraksi.ts \
  src/app/api/jobs/publish/route.ts
git commit -m "feat(jobs): compute and display approximate distance via kecamatan centroids"
```

---

## Task 5: Claim flow — bind a phone to a pendamping-registered account

**Files:**
- Create: `src/app/api/auth/claim/route.ts`
- Create: `src/app/(public)/claim/[id]/page.tsx`
- Modify: `src/app/(companion)/companion/page.tsx`

**Interfaces:**
- Produces: `POST /api/auth/claim` — `{pengguna_id: string, phone: string, code: string}` → verifies OTP against the NEW phone, then updates that `pengguna` row's `no_hp` and clears `didampingi_oleh`, and signs the caller's browser into that account.
- Consumes: same demo-mode OTP fallback pattern as `/api/auth/verify` (read it first).

**Context:** a pendamping-registered worker has a synthetic `no_hp` (`"tanpa-hp-<uuid8>"`) and no real phone. This flow lets that SAME worker (in person, on a real phone) claim the account: enter the worker's name/pengguna_id (via a link the pendamping can share, or by picking from the companion list), verify a real phone via OTP, and take over.

- [ ] **Step 1: Read the current auth flow files first**

Read `src/app/api/auth/verify/route.ts`, `src/app/api/auth/otp/route.ts`, and `src/lib/auth/shared.ts` in full — the claim endpoint reuses the exact same OTP-send (`/api/auth/otp` is generic, already works for any phone) and DEMO_MODE-fallback verification pattern, just with a different "what happens after verification succeeds" branch.

- [ ] **Step 2: Create the claim endpoint**

```ts
// src/app/api/auth/claim/route.ts
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiHp, DEMO_OTP } from "@/lib/auth/shared";
import { z } from "zod";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const BodySchema = z.object({
  pengguna_id: z.string().uuid(),
  phone: z.string().min(9),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format tidak valid." },
      { status: 400 }
    );
  }

  const phone = normalisasiHp(body.phone);
  const service = await createServiceClient();

  // Pastikan akun target genuinely didampingi (belum pernah punya HP asli)
  const { data: target } = await service
    .from("pengguna")
    .select("id, no_hp, didampingi_oleh, peran")
    .eq("id", body.pengguna_id)
    .single();

  if (!target) {
    return NextResponse.json(
      { ok: false, pesan: "Akun tidak ditemukan." },
      { status: 404 }
    );
  }

  if (!target.didampingi_oleh) {
    return NextResponse.json(
      { ok: false, pesan: "Akun ini sudah tidak didampingi — tidak perlu diklaim." },
      { status: 409 }
    );
  }

  // Nomor HP baru tidak boleh sudah dipakai akun lain
  const { data: bentrok } = await service
    .from("pengguna")
    .select("id")
    .eq("no_hp", phone)
    .neq("id", body.pengguna_id)
    .maybeSingle();

  if (bentrok) {
    return NextResponse.json(
      { ok: false, pesan: "Nomor ini sudah terdaftar di akun lain." },
      { status: 409 }
    );
  }

  const supabase = await createClient();
  let userId: string;

  if (DEMO_MODE && body.code === DEMO_OTP) {
    const fallbackPassword = process.env.DEMO_FALLBACK_PASSWORD;
    if (!fallbackPassword) {
      return NextResponse.json(
        { ok: false, pesan: "Demo fallback belum dikonfigurasi." },
        { status: 500 }
      );
    }

    // Set phone + password langsung di auth user milik akun yang diklaim
    const { error: updateAuthErr } = await service.auth.admin.updateUserById(
      body.pengguna_id,
      { phone, password: fallbackPassword, phone_confirm: true }
    );
    if (updateAuthErr) {
      return NextResponse.json(
        { ok: false, pesan: "Gagal memverifikasi nomor." },
        { status: 500 }
      );
    }

    const { data: authUser } = await service.auth.admin.getUserById(body.pengguna_id);
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: authUser.user?.email ?? "",
      password: fallbackPassword,
    });
    if (signInErr || !signInData.user) {
      return NextResponse.json(
        { ok: false, pesan: "Gagal masuk setelah klaim." },
        { status: 401 }
      );
    }
    userId = signInData.user.id;
  } else {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: body.code,
      type: "sms",
    });
    if (error || !data.user || data.user.id !== body.pengguna_id) {
      return NextResponse.json(
        { ok: false, pesan: "Verifikasi OTP gagal." },
        { status: 401 }
      );
    }
    userId = data.user.id;
  }

  const { error: updateErr } = await service
    .from("pengguna")
    .update({ no_hp: phone, didampingi_oleh: null, status_verifikasi: "hp_terverifikasi" })
    .eq("id", userId);

  if (updateErr) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyelesaikan klaim akun." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, redirect: "/worker" });
}
```

- [ ] **Step 3: Create the claim page**

```tsx
// src/app/(public)/claim/[id]/page.tsx
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandHeart, MessageSquareText, Loader2 } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";

const KODE_DEMO = "123456";

export default function HalamanKlaimAkun({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [langkah, setLangkah] = useState<"hp" | "otp">("hp");
  const [noHp, setNoHp] = useState("");
  const [loading, setLoading] = useState(false);

  const hpValid = noHp.replace(/\D/g, "").length >= 9;

  async function kirimOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!hpValid || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: noHp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim OTP.");
      setLangkah("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function verifikasiOTP(kode: string) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pengguna_id: id, phone: noHp, code: kode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Klaim gagal.");
      toast.success("Akun berhasil diklaim — sekarang milik Anda sepenuhnya.");
      router.push(json.redirect ?? "/worker");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-12 sm:py-16">
      <div className="flex items-start gap-4 rounded-xl border border-biru-200 bg-biru-50 p-5">
        <HandHeart className="mt-1 size-8 shrink-0 text-biru-600" aria-hidden />
        <p className="text-body-lg text-biru-800">
          Akun ini sekarang milik Anda sepenuhnya. Masukkan nomor HP Anda untuk mengambil alih.
        </p>
      </div>

      {langkah === "hp" ? (
        <form className="flex flex-col gap-6" onSubmit={kirimOTP}>
          <div className="flex flex-col gap-2">
            <label htmlFor="no-hp" className="text-label text-tanah-800">
              Nomor HP Anda
            </label>
            <Input
              id="no-hp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Contoh: 0812 3456 0001"
              className="h-14 text-body-lg"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" variant="aksen" size="lg" disabled={!hpValid || loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <MessageSquareText aria-hidden />}
            Kirim kode SMS
          </Button>
        </form>
      ) : (
        <>
          <p className="rounded-xl bg-kuning-50 px-4 py-3 text-center text-body font-semibold text-kuning-800">
            Kode demo: <span className="font-mono tracking-widest">{KODE_DEMO}</span>
          </p>
          <LangkahOTP onSelesai={verifikasiOTP} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Surface the claim link from the companion list**

In `src/app/(companion)/companion/page.tsx`, in the "Belum punya Kartu Kerja" branch (or unconditionally, next to each didampingi worker), add a small share/copy affordance for `/claim/${pekerja.id}` — reuse the existing pattern from `TombolBagikan` (`src/component/kartu/TombolBagikan.tsx`) if it fits, or a simple `<Link>`+copy button. Read the current file first and match its existing card layout.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint
```

Live-verify: use the companion-register endpoint from the prior plan to create a phone-less worker, note their `pengguna.id`, then POST to `/api/auth/claim` with a fresh phone + demo code, and confirm via `mcp__supabase__execute_sql` that `no_hp` changed and `didampingi_oleh` is now null:

```sql
select no_hp, didampingi_oleh, status_verifikasi from pengguna where id = '<claimed id>';
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/claim/route.ts "src/app/(public)/claim/[id]/page.tsx" "src/app/(companion)/companion/page.tsx"
git commit -m "feat(auth): claim flow for phone-less pendamping-registered workers"
```

---

## Task 6: Demo panel — real persona switch + seed data alignment

**Files:**
- Modify: `supabase/seed.ts`
- Create: `src/app/api/demo/persona/route.ts`
- Modify: `src/app/demo/page.tsx`

**Interfaces:**
- Produces: `POST /api/demo/persona` — `{persona: "warto"|"yanti"|"dhika"|"slamet"}` → signs the caller's browser into that seeded account (DEMO_MODE only).

- [ ] **Step 1: Align seed personas with the demo panel's narrative names**

Read `supabase/seed.ts`'s `testUsers` array (currently `warto`/`budi`/`ani`). The demo page's copy already references "Pak Warto" (pekerja, full card), "Bu Yanti" (new pekerja, no card), "Mbak Dhika" (pemberi_kerja), "Pak Slamet" (pendamping) — matching the narrative names used throughout the rest of the app's mock/demo copy. Rename `budi`→`dhika` (keep `pemberi_kerja` role, update `nama`/`email`/`phone` to match), rename `ani`→`slamet` (keep `pendamping` role), and add a new 4th entry:

```ts
{ email: "yanti@kitakerja.test", phone: "+6281234567893", nama: "Yanti Puspitasari", peran: "pekerja", wilayah_nama: "Kota Surabaya" },
```

Yanti gets a `pengguna` row (via the existing loop) but must NOT get a `kartu_kerja` row (the existing Warto-only kartu-seeding block already only targets `wartoId` — leave that as-is, just don't add a parallel block for Yanti).

- [ ] **Step 2: Re-run seed and verify**

```bash
npx tsx supabase/seed.ts
```

Verify via `mcp__supabase__execute_sql`:
```sql
select p.nama, p.peran, k.id is not null as punya_kartu
from pengguna p left join kartu_kerja k on k.pekerja_id = p.id
where p.no_hp in ('+6281234567890','+6281234567891','+6281234567892','+6281234567893');
```
Expect Warto→true, Dhika/Slamet/Yanti→false (kartu_kerja) — note Dhika/Slamet aren't pekerja so a false there is meaningless, just confirm Warto=true and Yanti=false.

- [ ] **Step 3: Create the persona-switch endpoint**

```ts
// src/app/api/demo/persona/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { tujuanPeran } from "@/lib/auth/shared";
import { z } from "zod";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const PERSONA_EMAIL: Record<string, string> = {
  warto: "warto@kitakerja.test",
  yanti: "yanti@kitakerja.test",
  dhika: "dhika@kitakerja.test",
  slamet: "slamet@kitakerja.test",
};

const BodySchema = z.object({
  persona: z.enum(["warto", "yanti", "dhika", "slamet"]),
});

export async function POST(request: Request) {
  if (!DEMO_MODE) {
    return NextResponse.json({ ok: false, pesan: "Tidak ditemukan." }, { status: 404 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const fallbackPassword = process.env.DEMO_FALLBACK_PASSWORD;
  if (!fallbackPassword) {
    return NextResponse.json({ ok: false, pesan: "Demo fallback belum dikonfigurasi." }, { status: 500 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: PERSONA_EMAIL[body.persona],
    password: fallbackPassword,
  });

  if (error || !data.user) {
    return NextResponse.json({ ok: false, pesan: "Gagal masuk sebagai persona ini." }, { status: 401 });
  }

  const service = await import("@/lib/supabase/server-client").then((m) => m.createServiceClient());
  const { data: pengguna } = await service.from("pengguna").select("peran").eq("id", data.user.id).single();

  return NextResponse.json({ ok: true, redirect: tujuanPeran(pengguna?.peran ?? "pekerja") });
}
```

- [ ] **Step 4: Wire the demo page's persona buttons to it**

`src/app/demo/page.tsx`'s `PERSONA` array currently has plain `<Link href="...">` navigation. This page is a server component — the persona-switch buttons need to be client-side (POST then navigate). Extract a small client component:

```tsx
// src/app/demo/tombol-persona.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

export function TombolPersona({
  persona,
  nama,
  peran,
  satuBaris,
  ikon: Ikon,
}: {
  persona: "warto" | "yanti" | "dhika" | "slamet";
  nama: string;
  peran: string;
  satuBaris: string;
  ikon: LucideIcon;
}) {
  const router = useRouter();
  const [memuat, setMemuat] = useState(false);

  async function masuk() {
    if (memuat) return;
    setMemuat(true);
    try {
      const res = await fetch("/api/demo/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal ganti persona.");
      router.push(json.redirect);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setMemuat(false);
    }
  }

  return (
    <button
      type="button"
      onClick={masuk}
      disabled={memuat}
      className="flex min-h-14 w-full items-center gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-4 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40 disabled:opacity-60"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50 text-biru-600">
        <Ikon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-body-lg font-bold">
          {nama} <span className="font-semibold text-tanah-600">· {peran}</span>
        </span>
        <span className="block text-label text-tanah-600">{satuBaris}</span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-tanah-400" aria-hidden />
    </button>
  );
}
```

In `src/app/demo/page.tsx`, change the `PERSONA` array's `href` field to a `persona` key (`"warto" | "yanti" | "dhika" | "slamet"`), and replace the `<Link href={p.href}>...</Link>` block with `<TombolPersona persona={p.persona} nama={p.nama} peran={p.peran} satuBaris={p.satuBaris} ikon={p.ikon} />`.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint
```

Live-verify (dev server reachable at localhost:3000): visit `/demo`, click each persona button, confirm the redirect lands on the correct role home and the session cookie actually changed accounts (check via `/api/profile`-style read, or just visually confirm the name shown matches).

- [ ] **Step 6: Commit**

```bash
git add supabase/seed.ts src/app/api/demo/persona/route.ts src/app/demo/page.tsx src/app/demo/tombol-persona.tsx
git commit -m "feat(demo): real persona switch via seeded accounts, align seed names with demo copy"
```

---

## Task 7: Demo panel — real data reset scoped to demo personas

**Files:**
- Create: `src/app/api/demo/reset/route.ts`
- Modify: `src/app/demo/kontrol-interaktif.tsx`

**Interfaces:**
- Produces: `POST /api/demo/reset` (DEMO_MODE only) — deletes/resets only rows touching the 4 demo persona ids, never other accounts' data.

**Context:** the reset must be narrowly scoped — it runs against the REAL shared Supabase project, and other real accounts (including anyone who registered through the live app, e.g. the E2E test accounts from the prior plan) must be completely untouched. Scope every delete to rows where `pekerja_id`/`pemberi_kerja_id`/`pelapor_id` is one of the 4 known demo persona ids.

- [ ] **Step 1: Create the reset endpoint**

```ts
// src/app/api/demo/reset/route.ts
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server-client";

const DEMO_MODE = process.env.DEMO_MODE === "true";
const DEMO_EMAILS = [
  "warto@kitakerja.test",
  "yanti@kitakerja.test",
  "dhika@kitakerja.test",
  "slamet@kitakerja.test",
];

export async function POST() {
  if (!DEMO_MODE) {
    return NextResponse.json({ ok: false, pesan: "Tidak ditemukan." }, { status: 404 });
  }

  const service = await createServiceClient();

  const { data: personas } = await service
    .from("pengguna")
    .select("id, no_hp")
    .in(
      "no_hp",
      ["+6281234567890", "+6281234567891", "+6281234567892", "+6281234567893"]
    );

  const ids = (personas ?? []).map((p) => p.id);
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, pesan: "Persona demo belum di-seed." }, { status: 500 });
  }

  // Urutan hapus mengikuti arah FK (anak dulu, baru induk) supaya tidak
  // tertahan constraint — semua di-scope ke id 4 persona demo saja.
  await service.from("lapor_upah").delete().in("pekerja_id", ids);
  await service.from("laporan_masalah").delete().in("pelapor_id", ids);
  await service.from("penilaian").delete().in("pemberi_kerja_id", ids);
  await service
    .from("pekerjaan")
    .delete()
    .or(`pekerja_id.in.(${ids.join(",")}),pemberi_kerja_id.in.(${ids.join(",")})`);
  await service
    .from("kesepakatan_kerja")
    .delete()
    .or(`pekerja_id.in.(${ids.join(",")}),pemberi_kerja_id.in.(${ids.join(",")})`);
  await service.from("lamaran").delete().in("pekerja_id", ids);

  const { data: lowonganDemo } = await service
    .from("lowongan")
    .select("id")
    .in("pemberi_kerja_id", ids);
  const lowonganIds = (lowonganDemo ?? []).map((l) => l.id);
  if (lowonganIds.length > 0) {
    await service.from("lowongan_keahlian").delete().in("lowongan_id", lowonganIds);
    await service.from("saringan_aman").delete().in("lowongan_id", lowonganIds);
    await service.from("lowongan").delete().in("id", lowonganIds);
  }

  // Kartu Kerja Warto: hapus keahlian tambahan hasil percobaan, bukan 2 asli
  const warto = personas?.find((p) => p.no_hp === "+6281234567890");
  if (warto) {
    const { data: kartu } = await service
      .from("kartu_kerja")
      .select("id")
      .eq("pekerja_id", warto.id)
      .single();
    if (kartu) {
      await service
        .from("kartu_keahlian")
        .delete()
        .eq("kartu_id", kartu.id)
        .not("sebutan_pekerja", "in", '("Tukang Batu","Tukang Plester")');
    }
  }

  // Yanti: kartu_kerja tidak seharusnya ada — hapus kalau percobaan menciptakannya
  const yanti = personas?.find((p) => p.no_hp === "+6281234567893");
  if (yanti) {
    await service.from("kartu_kerja").delete().eq("pekerja_id", yanti.id);
  }

  return NextResponse.json({ ok: true, data: { pesan: "Data demo dikembalikan ke awal." } });
}
```

- [ ] **Step 2: Wire the existing reset button to also call this endpoint**

In `src/app/demo/kontrol-interaktif.tsx`'s `SetelUlangDataDemo`, the `setelUlang` function currently only clears browser storage. Make it `async` and call the new endpoint first, keep the storage-clearing as-is, only show the "selesai" state after the network call succeeds (add a loading/error state matching the file's existing style — read the current component's structure and extend it minimally, don't rewrite the whole file).

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint
```

Live-verify: create some throwaway state touching a demo persona (e.g. sign in as Dhika via `/demo`, publish a test job), call `/api/demo/reset`, confirm via `mcp__supabase__execute_sql` that the test job is gone and Warto's `kartu_keahlian` still has exactly the 2 seeded rows — and separately confirm the unrelated E2E test accounts from the prior plan (phone `081300000201`/`081300000202`) are completely untouched.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/demo/reset/route.ts src/app/demo/kontrol-interaktif.tsx
git commit -m "feat(demo): reset endpoint scoped to the 4 seeded demo personas only"
```

---

## Task 8: Demo panel — failure simulation actually forces degraded AI states

**Files:**
- Modify: `src/lib/ai/gemini-client.ts`
- Modify: `src/lib/ai/quota.ts`
- Modify: `src/app/demo/kontrol-interaktif.tsx`

**Interfaces:**
- Consumes: two cookies (not localStorage — localStorage isn't visible server-side) — `kk-demo-kuota-habis` and `kk-demo-ai-gagal` — read by `checkQuota`/`callGemini` ONLY when `DEMO_MODE === true`.

**Context:** the existing toggles write to `localStorage`, which the SERVER can never read. Server-side AI calls need a signal the server can see — switch both toggles to cookies (same effect for the UI, `document.cookie` instead of `localStorage`), and check them in `gemini-client.ts`/`quota.ts`.

- [ ] **Step 1: Switch the toggles from localStorage to cookies**

In `src/app/demo/kontrol-interaktif.tsx`'s `SakelarSimulasiKegagalan`, replace the `localStorage.getItem`/`setItem` calls with `document.cookie` reads/writes:

```ts
function bacaCookie(nama: string): boolean {
  return document.cookie.split("; ").some((c) => c === `${nama}=true`);
}

function tulisCookie(nama: string, nilai: boolean) {
  document.cookie = `${nama}=${nilai}; path=/; max-age=${nilai ? 86400 : 0}`;
}
```

Replace every `localStorage.getItem(KUNCI_KUOTA)`/`setItem` call with `bacaCookie`/`tulisCookie` equivalents, keeping the rest of the component's structure (state, effect timing) unchanged.

- [ ] **Step 2: Check the cookies server-side in quota.ts**

In `src/lib/ai/quota.ts`, `checkQuota` needs access to the incoming request's cookies. Since it's called from `callGemini` (which doesn't currently receive the request), add an optional param threaded through:

Read `src/lib/ai/gemini-client.ts`'s `callGemini` and `CallGeminiOptions` in full first. Add `demoPaksaKuotaHabis?: boolean` to `CallGeminiOptions`, and at the top of `callGemini`, before the existing quota check:

```ts
if (process.env.DEMO_MODE === "true" && demoPaksaKuotaHabis) {
  return { ok: false, kode: "kuota", pesan_pengguna: "Kuota AI hari ini sudah penuh (simulasi demo)." };
}
```

Each API route that calls `callGemini` (`/api/ai/interview/start`, `/answer`, `/finish`, `/api/ai/jobs/extract`, `/api/ai/jobs/screen`) needs to read the cookie and pass it through. Add a tiny shared helper instead of repeating cookie-reading in every route:

```ts
// add to src/lib/ai/gemini-client.ts, exported
import { cookies } from "next/headers";

export async function demoSimulasiAktif(): Promise<{ kuotaHabis: boolean; aiGagal: boolean }> {
  if (process.env.DEMO_MODE !== "true") return { kuotaHabis: false, aiGagal: false };
  const jar = await cookies();
  return {
    kuotaHabis: jar.get("kk-demo-kuota-habis")?.value === "true",
    aiGagal: jar.get("kk-demo-ai-gagal")?.value === "true",
  };
}
```

- [ ] **Step 3: Wire the "AI gagal" simulation too**

Still in `callGemini`, add a second check right before the real `client.models.generateContent` call:

```ts
if (process.env.DEMO_MODE === "true" && demoPaksaAiGagal) {
  return { ok: false, kode: "gagal", pesan_pengguna: "AI tidak bisa menjawab saat ini. Silakan gunakan jalur manual." };
}
```

Add `demoPaksaAiGagal?: boolean` alongside `demoPaksaKuotaHabis` in `CallGeminiOptions`.

- [ ] **Step 4: Thread it through each caller**

In each of the 5 route files that call `callGemini`, add near the top:

```ts
const { kuotaHabis, aiGagal } = await demoSimulasiAktif();
```

and pass `demoPaksaKuotaHabis: kuotaHabis, demoPaksaAiGagal: aiGagal` into the `callGemini({...})` call. Read each of the 5 files first — they already exist and this is a small, mechanical addition to each.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint
```

Live-verify (dev server reachable): toggle "Kuota AI habis" on `/demo`, then attempt a real AI call (e.g. start a Ngobrol Kerja session) and confirm it returns the simulated kuota-habis message instead of actually calling Gemini. Toggle it off, toggle "AI gagal" on, confirm the same for that path. Toggle both off before finishing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/gemini-client.ts src/lib/ai/quota.ts src/app/demo/kontrol-interaktif.tsx \
  src/app/api/ai/interview/start/route.ts src/app/api/ai/interview/answer/route.ts \
  src/app/api/ai/interview/finish/route.ts src/app/api/ai/jobs/extract/route.ts \
  src/app/api/ai/jobs/screen/route.ts
git commit -m "feat(demo): failure-simulation toggles actually force degraded AI states server-side"
```

---

## Task 9: Demo panel — sample recordings feed the real interview pipeline

**Files:**
- Create: `public/demo-audio/README.md`
- Modify: `src/app/demo/kontrol-interaktif.tsx`
- Modify: `src/app/(worker)/worker/interview/page.tsx`

**Interfaces:**
- Produces: a "pakai rekaman contoh" affordance on the interview page (DEMO_MODE only) that fetches a static `.wav` file from `public/demo-audio/{id}.wav` and feeds it through the EXACT SAME `rekamSelesai` path a real microphone recording uses — no separate code path to keep in sync.

**Context — read before starting:** this task builds the WIRING only. It cannot fabricate authentic Javanese/Sundanese speech content — that requires real human recordings. The plan produces the mechanism; a human must drop three real `.wav` files into `public/demo-audio/` (`jv.wav`, `su.wav`, `id.wav`) afterward for the feature to be meaningful in a live demo. Build and verify the wiring using any placeholder `.wav` (even silence or a synthesized test tone, same technique used in the prior plan's live verification) — the plumbing is what's being tested, not the audio content.

- [ ] **Step 1: Document the requirement**

```md
# public/demo-audio/README.md

Drop three real audio recordings here before a live demo — the "rekaman
contoh" button on /worker/interview reads these files directly, no build
step needed:

- `jv.wav` — Bahasa Jawa, logat Malang (example: Pak Warto answering "apa
  keahlian utama Anda?")
- `su.wav` — Bahasa Sunda
- `id.wav` — Bahasa Indonesia baku

Any standard audio format ffmpeg can decode works (wav/mp3/m4a/ogg) — the
answer route already transcodes via `src/lib/audio/transcode.ts`. Keep
each under ~30s / a few MB. These are never committed with real content —
add real files locally before a demo, don't commit voice recordings of
real people to a public repo unless you have consent to do so.
```

- [ ] **Step 2: Add the "pakai rekaman contoh" control to the interview page**

Read `src/app/(worker)/worker/interview/page.tsx` in full first — it already has `rekamSelesai(blob: Blob | null, _detik: number)` wired to real microphone recordings via `TombolRekam`. Add a DEMO_MODE-only button next to `TombolRekam` (in the "putaran" tahap JSX) that fetches one of the three sample files and calls the SAME `rekamSelesai` function with the fetched blob:

```tsx
{process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    disabled={mengirim}
    onClick={async () => {
      const res = await fetch("/demo-audio/id.wav");
      if (!res.ok) {
        toast.error("Rekaman contoh belum tersedia — tambahkan file di public/demo-audio/.");
        return;
      }
      const blob = await res.blob();
      rekamSelesai(blob, 5);
    }}
  >
    Pakai rekaman contoh
  </Button>
)}
```

Note: `DEMO_MODE` is currently only read server-side (`process.env.DEMO_MODE`); this button needs a client-visible flag. Add `NEXT_PUBLIC_DEMO_MODE` to `.env.local` mirroring `DEMO_MODE`'s value (Next.js only exposes `NEXT_PUBLIC_*` vars to the client bundle — this is required, not optional, for the button to conditionally render).

- [ ] **Step 3: Wire the demo panel's existing "play" buttons to actually preview the files**

In `src/app/demo/kontrol-interaktif.tsx`'s `DaftarRekamanContoh`, replace the placeholder 3-second timer with an actual `<audio>` element playing `/demo-audio/${r.id}.wav`, so a jury member can preview what will be used (this is a much smaller, self-contained change — read the current component and swap the `setTimeout` simulation for a real `HTMLAudioElement.play()`/`onended` pair).

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run lint
```

Live-verify with a placeholder file: drop any short `.wav` at `public/demo-audio/id.wav` (synthesize one via the same Windows-SAPI technique used earlier in this project's history if convenient, or any short silent/tone wav), start a Ngobrol Kerja session, click "Pakai rekaman contoh", confirm it goes through transcode→Groq→Gemini exactly like a real recording does (the transcript will be empty/nonsense for a silent placeholder — that's expected and fine, this step only proves the wiring, not real transcription quality). Delete the placeholder file afterward — do not commit it.

- [ ] **Step 5: Commit**

```bash
git add public/demo-audio/README.md "src/app/(worker)/worker/interview/page.tsx" src/app/demo/kontrol-interaktif.tsx .env.local.example 2>/dev/null || true
git add public/demo-audio/README.md "src/app/(worker)/worker/interview/page.tsx" src/app/demo/kontrol-interaktif.tsx
git commit -m "feat(demo): sample recordings feed the real interview pipeline (requires real audio files added locally before a live demo)"
```

(If `.env.local.example` doesn't exist in this repo, skip adding it — just note in the PR description that `NEXT_PUBLIC_DEMO_MODE=true` needs to be added to `.env.local` alongside the existing `DEMO_MODE=true`.)

---

## Task 10: Demo panel — log_ai monitoring page

**Files:**
- Create: `src/app/demo/monitor/page.tsx`

**Interfaces:**
- Consumes: `log_ai` table (already exists, already populated by every `callGemini` call via the existing `logAi` helper).

- [ ] **Step 1: Write the monitoring page**

```tsx
// src/app/demo/monitor/page.tsx
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server-client";

const LABEL_STATUS: Record<string, string> = {
  sukses: "Sukses",
  gagal: "Gagal",
  kuota_habis: "Kuota habis",
  ditolak_validasi: "Ditolak validasi",
};

const KELAS_STATUS: Record<string, string> = {
  sukses: "bg-aman-50 text-aman-600",
  gagal: "bg-bahaya-50 text-bahaya-600",
  kuota_habis: "bg-hati-50 text-hati-600",
  ditolak_validasi: "bg-hati-50 text-hati-600",
};

/**
 * /demo/monitor — jawaban ke juri untuk pertanyaan skalabilitas: data, bukan klaim.
 * Aktif hanya bila DEMO_MODE=true, sama seperti /demo.
 */
export default async function HalamanMonitorAI() {
  if (process.env.DEMO_MODE !== "true") notFound();

  const supabase = await createServiceClient();
  const { data: log } = await supabase
    .from("log_ai")
    .select("id, jenis, model, latensi_ms, status, catatan, dibuat_pada")
    .order("dibuat_pada", { ascending: false })
    .limit(100);

  const { data: kuotaHariIni } = await supabase
    .from("kuota_harian")
    .select("terpakai")
    .eq("tanggal", new Date().toISOString().slice(0, 10))
    .maybeSingle();

  const baris = log ?? [];
  const sukses = baris.filter((b) => b.status === "sukses").length;
  const latensiRata =
    baris.length > 0
      ? Math.round(baris.reduce((a, b) => a + (b.latensi_ms ?? 0), 0) / baris.length)
      : 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <p className="mikro text-kuning-700">Demo — hanya untuk juri</p>
        <h1 className="text-h1">Monitor Panggilan AI</h1>
        <p className="text-body-lg text-tanah-700">
          100 panggilan Gemini terbaru — bukti kuota dan degradasi berjenjang bekerja, bukan klaim.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-tanah-200 bg-tanah-0 p-4 shadow-1">
          <p className="text-h2 font-bold tabular-nums">{kuotaHariIni?.terpakai ?? 0}</p>
          <p className="text-label text-tanah-600">Kuota terpakai hari ini</p>
        </div>
        <div className="rounded-2xl border border-tanah-200 bg-tanah-0 p-4 shadow-1">
          <p className="text-h2 font-bold tabular-nums">
            {baris.length > 0 ? Math.round((sukses / baris.length) * 100) : 0}%
          </p>
          <p className="text-label text-tanah-600">Tingkat sukses (100 terakhir)</p>
        </div>
        <div className="rounded-2xl border border-tanah-200 bg-tanah-0 p-4 shadow-1">
          <p className="text-h2 font-bold tabular-nums">{latensiRata}ms</p>
          <p className="text-label text-tanah-600">Latensi rata-rata</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-tanah-200 bg-tanah-0 shadow-1">
        <table className="w-full text-left text-label">
          <thead className="border-b border-tanah-200 bg-tanah-50">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Latensi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.id} className="border-b border-tanah-100 last:border-0">
                <td className="px-4 py-2 whitespace-nowrap">
                  {new Date(b.dibuat_pada).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2">{b.jenis}</td>
                <td className="px-4 py-2 font-mono">{b.model}</td>
                <td className="px-4 py-2 tabular-nums">{b.latensi_ms ?? "—"}ms</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-pill px-2 py-0.5 text-label font-semibold ${
                      KELAS_STATUS[b.status] ?? "bg-tanah-100 text-tanah-700"
                    }`}
                  >
                    {LABEL_STATUS[b.status] ?? b.status}
                  </span>
                </td>
                <td className="max-w-xs truncate px-4 py-2 text-tanah-500" title={b.catatan ?? ""}>
                  {b.catatan ?? "—"}
                </td>
              </tr>
            ))}
            {baris.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-tanah-500">
                  Belum ada panggilan AI tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Link it from the demo panel**

In `src/app/demo/page.tsx`, add a second prominent link below the existing "Buka Katalog Komponen" link, pointing to `/demo/monitor`, matching that link's visual style (same button classes, different icon — e.g. `Activity` from lucide-react).

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint && npx next build 2>&1 | tail -40
```

Live-verify: visit `/demo/monitor` with `DEMO_MODE=true`, confirm real `log_ai` rows render (there should be plenty from all the AI calls made across this plan and the prior one); confirm the page 404s when `DEMO_MODE` is unset/false (can't easily flip env live — code-review the `notFound()` guard matches `/demo/page.tsx`'s exact pattern instead).

- [ ] **Step 4: Commit**

```bash
git add src/app/demo/monitor/page.tsx src/app/demo/page.tsx
git commit -m "feat(demo): live log_ai monitoring page for the scalability answer"
```

---

## Self-review checklist

- [ ] Every new mutating route re-checks role/session server-side, not just relying on middleware.
- [ ] `/api/demo/*` and `/demo/*` routes/pages all 404 when `DEMO_MODE` is not `"true"`.
- [ ] The reset endpoint (Task 7) never touches a row outside the 4 known demo persona ids — verified against the unrelated E2E test accounts from the prior plan.
- [ ] Distance (Task 4) never renders when either side lacks a `kecamatan_id` — no `"~0 km"` or crash.
- [ ] The claim endpoint (Task 5) rejects claiming an account that isn't actually `didampingi_oleh` someone, and rejects a phone number already in use by another account.
- [ ] No task reintroduces a raw Postgres/Gemini error string into a client-facing `pesan`.
- [ ] Task 9's sample-recording feature ships with zero real audio content committed — only the README instructing a human to add real files locally.
