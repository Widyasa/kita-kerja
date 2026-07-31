"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle,
  HandHeart,
  HardHat,
  Loader2,
  Mail,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { cn } from "@/lib/utils";
import type { Peran } from "@/lib/mock/types";

type Langkah = "peran" | "email";

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

const NOMOR_LANGKAH: Record<Langkah, number> = { peran: 1, email: 2 };

export default function RegisterPage() {
  const [langkah, setLangkah] = useState<Langkah>("peran");
  const [peran, setPeran] = useState<(typeof PILIHAN_PERAN)[number] | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const namaValid = nama.trim().length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function kirimLink(e: React.FormEvent) {
    e.preventDefault();
    if (!namaValid || !emailValid || loading || !peran) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent: "register" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim email.");

      localStorage.setItem("pendaftaran_peran", peran.peran);
      localStorage.setItem("pendaftaran_nama", nama);

      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-12 sm:py-16">
        <header className="flex flex-col gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-hijau-50">
            <CheckCircle className="size-8 text-hijau-600" aria-hidden />
          </div>
          <h1 className="text-h1">Cek email Anda</h1>
          <p className="text-body-lg text-tanah-600">
            Kami kirim link konfirmasi ke{" "}
            <span className="font-semibold text-tanah-800">{email}</span>. Klik
            link untuk menyelesaikan pendaftaran.
          </p>
        </header>

        <div className="rounded-lg bg-biru-50 p-5">
          <p className="text-body text-biru-900">
            Link berlaku 24 jam. Periksa folder spam jika tidak melihat email.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSent(false);
            setEmail("");
            setNama("");
          }}
        >
          Gunakan email lain
        </Button>
      </div>
    );
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
            onClick={() => setLangkah("email")}
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

      {langkah === "email" && (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Nama dan email Anda</h1>
            <p className="text-body-lg text-tanah-600">
              Sebagai <span className="font-semibold text-tanah-800">{peran?.judul}</span>,
              email adalah satu-satunya kunci akun Anda. Kami kirim link
              konfirmasi lewat email.
            </p>
          </header>

          <form className="flex flex-col gap-6" onSubmit={kirimLink}>
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
            <Button type="submit" variant="aksen" size="lg" disabled={!namaValid || !emailValid || loading}>
              {loading ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Mail aria-hidden />
              )}
              Kirim link konfirmasi
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
