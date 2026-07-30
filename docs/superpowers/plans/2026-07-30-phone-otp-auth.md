# Phone OTP Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake login pages with a real Supabase phone-OTP flow so `/sign-in` and `/register` create a session cookie and middleware allows the correct role-based redirect.

**Architecture:** Two API routes (`/api/auth/otp` to send OTP, `/api/auth/verify` to verify and upsert the `pengguna` row) plus updated client pages. The verify route uses the SSR Supabase client so the session cookie is set on the response; a service-role client handles the `pengguna` insert because no RLS INSERT policy exists. A small seed script pre-creates the demo personas so one-click sign-in works.

**Tech Stack:** Next.js 15 App Router, TypeScript, `@supabase/ssr`, `zod`, `sonner`.

## Global Constraints

- `DEMO_MODE=true` in `.env.local` for this project.
- All UI copy in Indonesian.
- Route protection must stay in `middleware.ts` (do not remove or bypass it).
- Phone numbers must be normalised to E.164 before calling Supabase.
- `pengguna.id` is `uuid` and references `auth.users(id)`.

---

## Task 1: Shared auth helpers

**Files:**
- Create: `src/lib/auth/shared.ts`

**Interfaces:**
- Produces: `normalisasiHp(phone: string): string`, `tujuanPeran(peran: string): string`

- [ ] **Step 1: Write the helper**

```ts
export function normalisasiHp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("8")) return `+62${digits}`;
  return `+${digits}`;
}

export function tujuanPeran(peran: string): string {
  if (peran === "pekerja") return "/worker";
  if (peran === "pemberi_kerja") return "/employer";
  if (peran === "pendamping") return "/companion";
  return "/";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/shared.ts
git commit -m "feat(auth): phone normalization and role-to-route helper"
```

---

## Task 2: OTP send API

**Files:**
- Create: `src/app/api/auth/otp/route.ts`

**Interfaces:**
- Consumes: `POST { phone: string }`
- Produces: `{ ok: true }` or `{ ok: false, pesan: string }`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { normalisasiHp } from "@/lib/auth/shared";
import { z } from "zod";

const BodySchema = z.object({
  phone: z.string().min(9),
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalisasiHp(body.phone),
  });

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/otp/route.ts
git commit -m "feat(auth): add OTP send API"
```

---

## Task 3: OTP verify API

**Files:**
- Create: `src/app/api/auth/verify/route.ts`

**Interfaces:**
- Consumes: `POST { phone: string, code: string, intent: "signin" | "register", role?: "pekerja" | "pemberi_kerja" | "pendamping" }`
- Produces: `{ ok: true, redirect: string }` or `{ ok: false, pesan: string }`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiHp, tujuanPeran } from "@/lib/auth/shared";
import { z } from "zod";

const BodySchema = z.object({
  phone: z.string().min(9),
  code: z.string().length(6),
  intent: z.enum(["signin", "register"]),
  role: z.enum(["pekerja", "pemberi_kerja", "pendamping"]).optional(),
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

  // Verify OTP and set the session cookie on the response.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: body.code,
    type: "sms",
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, pesan: error?.message || "Verifikasi OTP gagal." },
      { status: 401 }
    );
  }

  const user = data.user;
  const service = await createServiceClient();

  // Check existing pengguna row.
  const { data: existing } = await service
    .from("pengguna")
    .select("peran")
    .eq("id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({
      ok: true,
      redirect: tujuanPeran(existing.peran),
    });
  }

  // New user: only registration intent can create the row.
  if (body.intent !== "register" || !body.role) {
    return NextResponse.json(
      { ok: false, pesan: "Akun belum terdaftar. Silakan daftar terlebih dahulu." },
      { status: 403 }
    );
  }

  const { error: insertError } = await service.from("pengguna").insert({
    id: user.id,
    nama: phone,
    no_hp: phone,
    peran: body.role,
    status_verifikasi: "hp_terverifikasi",
  });

  if (insertError) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyimpan data pengguna." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    redirect: tujuanPeran(body.role),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/verify/route.ts
git commit -m "feat(auth): add OTP verify API with pengguna upsert"
```

---

## Task 4: Update sign-in page

**Files:**
- Modify: `src/app/(public)/sign-in/page.tsx`

**Interfaces:**
- Consumes: `/api/auth/otp`, `/api/auth/verify`

- [ ] **Step 1: Replace page content**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageSquareText } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";

const KODE_DEMO = "123456";

export default function SignInPage() {
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
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: noHp, code: kode, intent: "signin" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Verifikasi gagal.");
      router.push(json.redirect);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-12 sm:py-16">
      {langkah === "hp" ? (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Masuk ke Kita Kerja</h1>
            <p className="text-body-lg text-tanah-600">
              Tulis nomor HP Anda. Kami kirim kode lewat SMS — tidak perlu kata
              sandi.
            </p>
          </header>

          <form className="flex flex-col gap-6" onSubmit={kirimOTP}>
            <div className="flex flex-col gap-2">
              <label htmlFor="no-hp" className="text-label text-tanah-800">
                Nomor HP
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
              {loading ? <Loader2 className="animate-spin" /> : <MessageSquareText aria-hidden />}
              Kirim kode SMS
            </Button>
          </form>

          <p className="text-label text-tanah-600">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
            >
              Daftar dulu di sini
            </Link>
          </p>
        </>
      ) : (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Masukkan kode SMS</h1>
            <p className="text-body-lg text-tanah-600">
              Enam angka yang kami kirim ke{" "}
              <span className="font-semibold text-tanah-800">{noHp}</span>.
            </p>
          </header>

          <p className="rounded-xl bg-kuning-50 px-4 py-3 text-center text-body font-semibold text-kuning-800">
            Kode demo: <span className="font-mono tracking-widest">{KODE_DEMO}</span>{" "}
            — di versi demo, kode apa pun yang lengkap diterima.
          </p>

          <LangkahOTP onSelesai={verifikasiOTP} />

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setLangkah("hp")}
            disabled={loading}
          >
            <ArrowLeft aria-hidden />
            Ganti nomor HP
          </Button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(public)/sign-in/page.tsx
git commit -m "feat(auth): wire sign-in to Supabase phone OTP"
```

---

## Task 5: Update register page

**Files:**
- Modify: `src/app/(public)/register/page.tsx`

**Interfaces:**
- Consumes: `/api/auth/otp`, `/api/auth/verify`

- [ ] **Step 1: Replace page content**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  HandHeart,
  HardHat,
  Loader2,
  MessageSquareText,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";
import { cn } from "@/lib/utils";
import type { Peran } from "@/lib/mock";

const KODE_DEMO = "123456";

type Langkah = "peran" | "hp" | "otp";

const PILIHAN_PERAN: {
  peran: Peran;
  ikon: LucideIcon;
  judul: string;
  isi: string;
  tujuan: string;
}[] = [
  {
    peran: "pekerja",
    ikon: HardHat,
    judul: "Pekerja",
    isi: "Saya mencari kerja dan ingin Kartu Kerja sebagai bukti pengalaman.",
    tujuan: "/worker",
  },
  {
    peran: "pemberi_kerja",
    ikon: UsersRound,
    judul: "Pemberi Kerja",
    isi: "Saya butuh pekerja dan ingin memasang lowongan.",
    tujuan: "/employer",
  },
  {
    peran: "pendamping",
    ikon: HandHeart,
    judul: "Pendamping",
    isi: "Saya membantu pekerja lain memakai aplikasi ini.",
    tujuan: "/companion",
  },
];

const NOMOR_LANGKAH: Record<Langkah, number> = { peran: 1, hp: 2, otp: 3 };

export default function RegisterPage() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<Langkah>("peran");
  const [peran, setPeran] = useState<(typeof PILIHAN_PERAN)[number] | null>(null);
  const [noHp, setNoHp] = useState("");
  const [loading, setLoading] = useState(false);

  const hpValid = noHp.replace(/\D/g, "").length >= 9;

  async function kirimOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!hpValid || loading || !peran) return;
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
    if (loading || !peran) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: noHp,
          code: kode,
          intent: "register",
          role: peran.peran,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Verifikasi gagal.");
      router.push(json.redirect);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-12 sm:py-16">
      <p className="mikro text-center text-tanah-500">
        Langkah {NOMOR_LANGKAH[langkah]} dari 3
      </p>

      {langkah === "peran" && (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Anda mendaftar sebagai apa?</h1>
            <p className="text-body-lg text-tanah-600">
              Pilih satu. Peran menentukan tampilan beranda Anda nanti.
            </p>
          </header>

          <div className="flex flex-col gap-4" role="radiogroup" aria-label="Pilih peran">
            {PILIHAN_PERAN.map((p) => {
              const Ikon = p.ikon;
              const dipilih = peran?.peran === p.peran;
              return (
                <button
                  key={p.peran}
                  type="button"
                  role="radio"
                  aria-checked={dipilih}
                  onClick={() => setPeran(p)}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-4 rounded-xl border-2 bg-tanah-0 p-5 text-left shadow-1 outline-none",
                    "motion-safe:transition-shadow hover:shadow-2",
                    "focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
                    dipilih
                      ? "border-biru-600 bg-biru-50"
                      : "border-tanah-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-14 shrink-0 items-center justify-center rounded-full",
                      dipilih ? "bg-biru-600 text-tanah-0" : "bg-tanah-100 text-tanah-600",
                    )}
                  >
                    <Ikon className="size-7" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-h3">{p.judul}</span>
                    <span className="block text-body text-tanah-600">{p.isi}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            variant="aksen"
            size="lg"
            disabled={!peran}
            onClick={() => setLangkah("hp")}
          >
            Lanjut
            <ArrowRight aria-hidden />
          </Button>

          <p className="text-label text-tanah-600">
            Sudah punya akun?{" "}
            <Link
              href="/sign-in"
              className="font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
            >
              Masuk di sini
            </Link>
          </p>
        </>
      )}

      {langkah === "hp" && (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Nomor HP Anda</h1>
            <p className="text-body-lg text-tanah-600">
              Sebagai <span className="font-semibold text-tanah-800">{peran?.judul}</span>,
              nomor HP adalah satu-satunya kunci akun Anda. Kami kirim kode
              lewat SMS.
            </p>
          </header>

          <form className="flex flex-col gap-6" onSubmit={kirimOTP}>
            <div className="flex flex-col gap-2">
              <label htmlFor="no-hp" className="text-label text-tanah-800">
                Nomor HP
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
              {loading ? <Loader2 className="animate-spin" /> : <MessageSquareText aria-hidden />}
              Kirim kode SMS
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setLangkah("peran")}
            disabled={loading}
          >
            <ArrowLeft aria-hidden />
            Ganti peran
          </Button>
        </>
      )}

      {langkah === "otp" && (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Masukkan kode SMS</h1>
            <p className="text-body-lg text-tanah-600">
              Enam angka yang kami kirim ke{" "}
              <span className="font-semibold text-tanah-800">{noHp}</span>.
            </p>
          </header>

          <p className="rounded-xl bg-kuning-50 px-4 py-3 text-center text-body font-semibold text-kuning-800">
            Kode demo: <span className="font-mono tracking-widest">{KODE_DEMO}</span>{" "}
            — di versi demo, kode apa pun yang lengkap diterima.
          </p>

          <LangkahOTP onSelesai={verifikasiOTP} />

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setLangkah("hp")}
            disabled={loading}
          >
            <ArrowLeft aria-hidden />
            Ganti nomor HP
          </Button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(public)/register/page.tsx
git commit -m "feat(auth): wire register to Supabase phone OTP"
```

---

## Task 6: Seed demo personas

**Files:**
- Create: `scripts/seed-demo-users.ts`
- Modify: `package.json` to add a script entry (optional, but convenient)

**Interfaces:**
- Produces: idempotent auth users + `pengguna` rows for demo phone numbers

- [ ] **Step 1: Create the seed script**

```ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PERSONAS = [
  { nama: "Warto Sugianto", phone: "+6281234560001", peran: "pekerja" },
  { nama: "Yanti Puspitasari", phone: "+6281234560002", peran: "pekerja" },
  { nama: "Dhika Ramadhani", phone: "+6281234560003", peran: "pemberi_kerja" },
  { nama: "Slamet Widodo", phone: "+6281234560004", peran: "pendamping" },
  { nama: "Joko Prasetyo", phone: "+6281234560005", peran: "pekerja" },
  { nama: "Siti Aminah", phone: "+6281234560006", peran: "pekerja" },
  { nama: "Bangun Saputra", phone: "+6281234560007", peran: "pekerja" },
  { nama: "Rudi Hartono", phone: "+6281234560008", peran: "pekerja" },
  { nama: "Hadi Santoso", phone: "+6281234560009", peran: "pemberi_kerja" },
  { nama: "Rina Marlina", phone: "+6281234560010", peran: "pemberi_kerja" },
  { nama: "Eko Purnomo", phone: "+6281234560011", peran: "pemberi_kerja" },
  { nama: "Sari Wulandari", phone: "+6281234560012", peran: "pemberi_kerja" },
] as const;

async function main() {
  for (const p of PERSONAS) {
    const { data, error } = await supabase.auth.admin.createUser({
      phone: p.phone,
      phone_confirm: true,
      user_metadata: { nama: p.nama },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`Skipping existing user ${p.phone}`);
        continue;
      }
      console.error(`Failed to create ${p.phone}:`, error.message);
      continue;
    }

    if (!data.user) continue;

    const { error: dbError } = await supabase.from("pengguna").insert({
      id: data.user.id,
      nama: p.nama,
      no_hp: p.phone,
      peran: p.peran,
      status_verifikasi: "hp_terverifikasi",
    });

    if (dbError) {
      console.error(`Failed to insert pengguna ${p.phone}:`, dbError.message);
    } else {
      console.log(`Created ${p.phone} -> ${p.peran}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script in `package.json`**

```json
"seed:demo": "tsx scripts/seed-demo-users.ts"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-demo-users.ts package.json
git commit -m "feat(auth): seed demo personas as Supabase auth users"
```

---

## Task 7: Verify the flow

**Files:**
- None (manual test)

- [ ] **Step 1: Run the seed script**

```bash
npx tsx scripts/seed-demo-users.ts
```

Expected: prints `Created +6281234560001 -> pekerja` etc., or skips existing users.

- [ ] **Step 2: Add Supabase test OTP recipients**

In the Supabase dashboard, go to **Authentication → Providers → Phone → Test OTP Recipients** and add:

| Phone | Code |
|---|---|
| +6281234560001 | 123456 |
| +6281234560002 | 123456 |
| +6281234560003 | 123456 |
| +6281234560004 | 123456 |
| +6281234560005 | 123456 |
| +6281234560006 | 123456 |
| +6281234560007 | 123456 |
| +6281234560008 | 123456 |
| +6281234560009 | 123456 |
| +6281234560010 | 123456 |
| +6281234560011 | 123456 |
| +6281234560012 | 123456 |

- [ ] **Step 3: Start dev server**

```bash
npm run dev
```

- [ ] **Step 4: Test sign-in**

1. Open `http://localhost:3000/sign-in`.
2. Enter `081234560001`.
3. Enter `123456`.
4. Expected: redirected to `/worker`.

- [ ] **Step 5: Test register**

1. Open `http://localhost:3000/register`.
2. Choose **Pemberi Kerja**.
3. Enter a new number, e.g. `081299988877`.
4. Enter `123456` only if that number is also a test OTP recipient; otherwise use the real SMS code.
5. Expected: redirected to `/employer` and a new row appears in `pengguna`.

- [ ] **Step 6: Check protected route still rejects unauthenticated users**

Open `http://localhost:3000/worker` in an incognito window.
Expected: redirect to `/sign-in`.

- [ ] **Step 7: Commit after successful verification**

```bash
git commit --allow-empty -m "test(auth): verify phone OTP login and registration flow"
```

---

## Self-review checklist

- [ ] `signInWithOtp` is called before showing the OTP step.
- [ ] `verifyOtp` is called server-side so the SSR client can set the session cookie.
- [ ] `pengguna` row is created for new registrations.
- [ ] Existing sign-in users are rejected if they have no `pengguna` row.
- [ ] Middleware still enforces real sessions on `/worker`, `/employer`, `/companion`.
- [ ] Demo personas are seeded and test OTP codes are configured.
