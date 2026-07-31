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
  Mail,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";
import { cn } from "@/lib/utils";
import { emailValid } from "@/lib/auth/shared";
import type { Peran } from "@/lib/mock";

type Langkah = "peran" | "email" | "otp";

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

const NOMOR_LANGKAH: Record<Langkah, number> = { peran: 1, email: 2, otp: 3 };

export default function RegisterPage() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<Langkah>("peran");
  const [peran, setPeran] = useState<(typeof PILIHAN_PERAN)[number] | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [tersentuh, setTersentuh] = useState(false);
  const [loading, setLoading] = useState(false);

  const namaValid = nama.trim().length >= 3 && nama.trim().length <= 100;
  // BUG-001 — kunci akun kini email, bukan nomor HP.
  const emailOk = emailValid(email);
  const tampilkanGalatEmail = tersentuh && email.length > 0 && !emailOk;

  async function kirimOTP(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !peran) return;
    // BUG-029 — jelaskan apa yang kurang, jangan matikan tombol diam-diam.
    if (!namaValid || !emailOk) {
      setTersentuh(true);
      toast.error(
        !namaValid
          ? "Nama minimal 3 karakter, maksimal 100."
          : "Alamat email belum benar. Contoh: nama@email.com",
      );
      document.getElementById(!namaValid ? "nama" : "email")?.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
          email,
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
            onClick={() => setLangkah("email")}
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

      {langkah === "email" && (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Nama dan email Anda</h1>
            <p className="text-body-lg text-tanah-600">
              Sebagai <span className="font-semibold text-tanah-800">{peran?.judul}</span>,
              email adalah kunci akun Anda. Kami kirim kode enam angka ke alamat
              itu — tidak perlu kata sandi.
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
              <label htmlFor="email" className="text-label text-tanah-800">
                Alamat email
              </label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                placeholder="Contoh: nama@email.com"
                className="h-14 text-body-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTersentuh(true)}
                disabled={loading}
                aria-invalid={tampilkanGalatEmail || undefined}
                aria-describedby="email-bantuan"
              />
              <p
                id="email-bantuan"
                className={
                  tampilkanGalatEmail
                    ? "text-label text-bahaya-600"
                    : "text-label text-tanah-600"
                }
              >
                {tampilkanGalatEmail
                  ? "Alamat email belum benar. Contoh: nama@email.com"
                  : "Kode akan dikirim ke alamat ini. Periksa juga folder spam."}
              </p>
            </div>
            <Button type="submit" variant="aksen" size="lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
              Kirim kode ke email
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
            <h1 className="text-h1">Masukkan kode dari email</h1>
            <p className="text-body-lg text-tanah-600">
              Enam angka yang kami kirim ke{" "}
              <span className="font-semibold text-tanah-800">{email}</span>. Bila
              belum terlihat, periksa folder spam.
            </p>
          </header>

          <LangkahOTP onSelesai={verifikasiOTP} />

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setLangkah("email")}
            disabled={loading}
          >
            <ArrowLeft aria-hidden />
            Ganti alamat email
          </Button>
        </>
      )}
    </div>
  );
}
