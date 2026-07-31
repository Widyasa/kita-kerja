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
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [loading, setLoading] = useState(false);

  const namaValid = nama.trim().length >= 3 && nama.trim().length <= 100;
  // BUG-019 — sebelumnya cukup ">= 9 digit", sehingga "00000000000" dan
  // nomor 25 digit sama-sama lolos ke tahap kirim SMS. Sekarang mengikuti
  // pola nomor seluler Indonesia: 08xx / 628xx / +628xx, 9–13 digit.
  const hpValid = /^(?:\+?62|0)8[1-9][0-9]{6,10}$/.test(noHp.replace(/[\s-]/g, ""));

  async function kirimOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!namaValid || !hpValid || loading || !peran) return;
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
          nama,
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
            {PILIHAN_PERAN.map((p, i) => {
              const Ikon = p.ikon;
              const dipilih = peran?.peran === p.peran;
              // BUG-025 — radiogroup sebelumnya tidak merespons tombol panah
              // dan ketiga opsi sama-sama masuk urutan Tab. Pola ARIA
              // mensyaratkan satu perhentian Tab lalu berpindah dengan panah
              // (roving tabindex).
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
            <h1 className="text-h1">Nama dan nomor HP Anda</h1>
            <p className="text-body-lg text-tanah-600">
              Sebagai <span className="font-semibold text-tanah-800">{peran?.judul}</span>,
              nomor HP adalah satu-satunya kunci akun Anda. Kami kirim kode
              lewat SMS.
            </p>
          </header>

          <form className="flex flex-col gap-6" onSubmit={kirimOTP}>
            <div className="flex flex-col gap-2">
              <label htmlFor="nama" className="text-label text-tanah-800">
                {peran?.peran === "pemberi_kerja" ? "Nama Anda atau nama usaha" : "Nama lengkap"}
              </label>
              <Input
                id="nama"
                type="text"
                autoComplete="name"
                maxLength={100}
                /* BUG-034 — placeholder sebelumnya selalu "Contoh: Warto
                   Sugianto" (nama pekerja di kartu demo), termasuk saat
                   mendaftar sebagai Pemberi Kerja. */
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
              <label htmlFor="no-hp" className="text-label text-tanah-800">
                Nomor HP
              </label>
              <Input
                id="no-hp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={16}
                placeholder="Contoh: 0812 3456 0001"
                className="h-14 text-body-lg"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" variant="aksen" size="lg" disabled={!namaValid || !hpValid || loading}>
              {loading ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <MessageSquareText aria-hidden />
              )}
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
