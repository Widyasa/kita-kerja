"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  HandHeart,
  HardHat,
  Loader2,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { cn } from "@/lib/utils";
import type { Peran } from "@/lib/mock/types";

type Langkah = "peran" | "akun";

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

const NOMOR_LANGKAH: Record<Langkah, number> = { peran: 1, akun: 2 };

export default function RegisterPage() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<Langkah>("peran");
  const [peran, setPeran] = useState<(typeof PILIHAN_PERAN)[number] | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const namaValid = nama.trim().length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;

  async function daftar(e: React.FormEvent) {
    e.preventDefault();
    if (!namaValid || !emailValid || !passwordValid || loading || !peran) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          peran: peran.peran,
          nama: nama.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Pendaftaran gagal.");

      router.push(json.redirect ?? "/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-12 sm:py-16">
      <p className="mikro text-center text-tanah-500">
        Langkah {NOMOR_LANGKAH[langkah]} dari 2
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
            {PILIHAN_PERAN.map((p, i) => {
              const Ikon = p.ikon;
              const dipilih = peran?.peran === p.peran;
              const indeksTerfokus = peran
                ? PILIHAN_PERAN.findIndex((x) => x.peran === peran.peran)
                : 0;
              return (
                <button
                  key={p.peran}
                  type="button"
                  role="radio"
                  aria-checked={dipilih}
                  tabIndex={i === indeksTerfokus ? 0 : -1}
                  onClick={() => setPeran(p)}
                  onKeyDown={(e) => {
                    const maju = e.key === "ArrowDown" || e.key === "ArrowRight";
                    const mundur = e.key === "ArrowUp" || e.key === "ArrowLeft";
                    if (!maju && !mundur) return;
                    e.preventDefault();
                    const berikut =
                      (i + (maju ? 1 : -1) + PILIHAN_PERAN.length) % PILIHAN_PERAN.length;
                    setPeran(PILIHAN_PERAN[berikut]);
                    const grup = e.currentTarget.parentElement;
                    (grup?.children[berikut] as HTMLElement | undefined)?.focus();
                  }}
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
            onClick={() => setLangkah("akun")}
          >
            Lanjut
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

      {langkah === "akun" && (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Buat akun Anda</h1>
            <p className="text-body-lg text-tanah-600">
              Sebagai <span className="font-semibold text-tanah-800">{peran?.judul}</span>,
              isi nama, email, dan kata sandi untuk mendaftar.
            </p>
          </header>

          <form className="flex flex-col gap-6" onSubmit={daftar}>
            <div className="flex flex-col gap-2">
              <label htmlFor="nama" className="text-label text-tanah-800">
                {peran?.peran === "pemberi_kerja" ? "Nama Anda atau nama usaha" : "Nama lengkap"}
              </label>
              <Input
                id="nama"
                type="text"
                autoComplete="name"
                maxLength={100}
                placeholder={
                  peran?.peran === "pemberi_kerja"
                    ? "Contoh: CV Karya Mandiri"
                    : "Contoh: Warto Sugianto"
                }
                className="h-14 text-body-lg"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-label text-tanah-800">
                Email
              </label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nama@contoh.com"
                className="h-14 text-body-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-label text-tanah-800">
                Kata sandi
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                className="h-14 text-body-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              variant="aksen"
              size="lg"
              disabled={!namaValid || !emailValid || !passwordValid || loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <UserPlus aria-hidden />
              )}
              Daftar
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setLangkah("peran")}
            disabled={loading}
          >
            Ganti peran
          </Button>
        </>
      )}
    </div>
  );
}
