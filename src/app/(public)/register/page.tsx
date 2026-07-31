"use client";

<<<<<<< HEAD
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
=======
import { useState } from "react";
>>>>>>> feat/phone-otp-auth
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
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
import { emailValid } from "@/lib/auth/shared";
import type { Peran } from "@/lib/mock/types";

<<<<<<< HEAD
type Langkah = "peran" | "email" | "otp";
=======
type Langkah = "peran" | "email";
>>>>>>> feat/phone-otp-auth

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

<<<<<<< HEAD
const NOMOR_LANGKAH: Record<Langkah, number> = { peran: 1, email: 2, otp: 3 };

function WizardDaftar() {
  const router = useRouter();
  const params = useSearchParams();

  /**
   * BUG-016 — wizard ini tidak punya state URL: memuat ulang di langkah 2
   * mengembalikan pengguna ke langkah 1 dengan isian hilang, dan tombol
   * Back browser keluar total dari pendaftaran ke halaman sebelumnya.
   * Di Android, Back adalah gestur refleks.
   *
   * Langkah kini tersimpan di query string, jadi refresh mempertahankan
   * posisi dan Back memundurkan satu langkah. Isian tidak ikut disimpan
   * ke URL — email dan nama tidak pantas tertinggal di riwayat browser.
   */
  const langkahDariUrl = (params.get("langkah") ?? "peran") as Langkah;
  const [langkah, setLangkahState] = useState<Langkah>(
    ["peran", "email", "otp"].includes(langkahDariUrl) ? langkahDariUrl : "peran",
  );

  // Sinkronkan saat pengguna menekan Back/Forward browser.
  // Ditunda satu tick mengikuti pola SapaanWaktu, agar bukan setState
  // sinkron di dalam effect (aturan react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!["peran", "email", "otp"].includes(langkahDariUrl)) return;
    if (langkahDariUrl === langkah) return;
    const timer = setTimeout(() => setLangkahState(langkahDariUrl), 0);
    return () => clearTimeout(timer);
  }, [langkahDariUrl, langkah]);

  function setLangkah(l: Langkah) {
    setLangkahState(l);
    // Langkah OTP tidak didorong ke history: mundur ke sana setelah kode
    // kedaluwarsa hanya menampilkan layar yang tidak bisa dipakai lagi.
    if (l === "otp") {
      window.history.replaceState(null, "", `/register?langkah=${l}`);
    } else {
      window.history.pushState(null, "", `/register?langkah=${l}`);
    }
  }

  const [peran, setPeran] = useState<(typeof PILIHAN_PERAN)[number] | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [tersentuh, setTersentuh] = useState(false);
=======
const NOMOR_LANGKAH: Record<Langkah, number> = { peran: 1, email: 2 };

export default function RegisterPage() {
  const [langkah, setLangkah] = useState<Langkah>("peran");
  const [peran, setPeran] = useState<(typeof PILIHAN_PERAN)[number] | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
>>>>>>> feat/phone-otp-auth
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

<<<<<<< HEAD
  const namaValid = nama.trim().length >= 3 && nama.trim().length <= 100;
  // BUG-001 — kunci akun kini email, bukan nomor HP.
  const emailOk = emailValid(email);
  const tampilkanGalatEmail = tersentuh && email.length > 0 && !emailOk;
=======
  const namaValid = nama.trim().length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
>>>>>>> feat/phone-otp-auth

  async function kirimLink(e: React.FormEvent) {
    e.preventDefault();
<<<<<<< HEAD
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
=======
    if (!namaValid || !emailValid || loading || !peran) return;
>>>>>>> feat/phone-otp-auth
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ email }),
=======
        body: JSON.stringify({ email, intent: "register" }),
>>>>>>> feat/phone-otp-auth
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim email.");

      // Store role + name for when user confirms email
      localStorage.setItem("pendaftaran_peran", peran.peran);
      localStorage.setItem("pendaftaran_nama", nama);

      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> feat/phone-otp-auth
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
<<<<<<< HEAD
              email adalah kunci akun Anda. Kami kirim kode enam angka ke alamat
              itu — tidak perlu kata sandi.
=======
              email adalah satu-satunya kunci akun Anda. Kami kirim link
              konfirmasi lewat email.
>>>>>>> feat/phone-otp-auth
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
<<<<<<< HEAD
                Alamat email
=======
                Email
>>>>>>> feat/phone-otp-auth
              </label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
<<<<<<< HEAD
                maxLength={254}
                placeholder="Contoh: nama@email.com"
                className="h-14 text-body-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTersentuh(true)}
=======
                placeholder="nama@contoh.com"
                className="h-14 text-body-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
>>>>>>> feat/phone-otp-auth
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
<<<<<<< HEAD
            <Button type="submit" variant="aksen" size="lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
              Kirim kode ke email
=======
            <Button type="submit" variant="aksen" size="lg" disabled={!namaValid || !emailValid || loading}>
              {loading ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Mail aria-hidden />
              )}
              Kirim link konfirmasi
>>>>>>> feat/phone-otp-auth
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

<<<<<<< HEAD
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
=======
>>>>>>> feat/phone-otp-auth
    </div>
  );
}

/** useSearchParams wajib dibungkus Suspense pada App Router. */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-(--max-worker) px-4 py-12 sm:py-16">
          <p className="text-body text-tanah-600">Memuat…</p>
        </div>
      }
    >
      <WizardDaftar />
    </Suspense>
  );
}
