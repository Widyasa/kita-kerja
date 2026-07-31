"use client";

<<<<<<< HEAD
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";
import { emailValid } from "@/lib/auth/shared";

/**
 * BUG-001 — masuk memakai kode OTP yang dikirim ke email.
 *
 * Sebelumnya alur ini memakai nomor HP dan, karena DEMO_MODE menerima kode
 * apa pun, siapa saja yang tahu nomor HP seseorang bisa masuk ke akunnya.
 * Spanduk "Kode demo: 123456" yang memberitahukan celah itu juga dihapus.
 */
function FormMasuk() {
  const router = useRouter();
  const params = useSearchParams();
  // BUG-015 — tujuan asal dan alasan dibawa middleware saat pengguna
  // ditendang keluar, supaya bisa dikembalikan ke halaman semula dan
  // diberi tahu kenapa diminta masuk lagi.
  const tujuan = params.get("redirect");
  const alasan = params.get("alasan");
  const [langkah, setLangkah] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [tersentuh, setTersentuh] = useState(false);
=======
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";

export default function SignInPage() {
  const [email, setEmail] = useState("");
>>>>>>> feat/phone-otp-auth
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

<<<<<<< HEAD
  const valid = emailValid(email);
  const tampilkanGalat = tersentuh && email.length > 0 && !valid;
=======
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
>>>>>>> feat/phone-otp-auth

  async function kirimLink(e: React.FormEvent) {
    e.preventDefault();
<<<<<<< HEAD
    if (loading) return;
    // BUG-029 — beri alasan, jangan matikan tombol diam-diam.
    if (!valid) {
      setTersentuh(true);
      toast.error("Alamat email belum benar. Contoh: nama@email.com");
      document.getElementById("email")?.focus();
      return;
    }
=======
    if (!emailValid || loading) return;
>>>>>>> feat/phone-otp-auth
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim kode.");
      setLangkah("otp");
=======
        body: JSON.stringify({ email, intent: "signin" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim email.");
      setSent(true);
>>>>>>> feat/phone-otp-auth
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

<<<<<<< HEAD
  async function verifikasiOTP(kode: string) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: kode, intent: "signin" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Verifikasi gagal.");
      // Hanya path internal yang diikuti, supaya tidak bisa dipakai
      // sebagai open redirect.
      const aman = tujuan && tujuan.startsWith("/") && !tujuan.startsWith("//");
      router.push(aman ? tujuan : json.redirect);
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
            link untuk masuk.
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
<<<<<<< HEAD
      {langkah === "email" ? (
        <>
          <header className="flex flex-col gap-3">
            {alasan === "sesi" && (
              <p role="status" className="rounded-xl bg-hati-50 px-4 py-3 text-body text-hati-800">
                Sesi Anda sudah berakhir. Silakan masuk lagi untuk melanjutkan.
              </p>
            )}
            {alasan === "peran" && (
              <p role="status" className="rounded-xl bg-hati-50 px-4 py-3 text-body text-hati-800">
                Halaman itu bukan untuk peran akun Anda. Masuk dengan akun yang sesuai.
              </p>
            )}
            <h1 className="text-h1">Masuk ke Kita Kerja</h1>
            <p className="text-body-lg text-tanah-600">
              Tulis alamat email Anda. Kami kirim kode enam angka ke email itu —
              tidak perlu kata sandi.
            </p>
          </header>

          <form className="flex flex-col gap-6" onSubmit={kirimOTP}>
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
                aria-invalid={tampilkanGalat || undefined}
                aria-describedby="email-bantuan"
              />
              <p
                id="email-bantuan"
                className={
                  tampilkanGalat ? "text-label text-bahaya-600" : "text-label text-tanah-600"
                }
              >
                {tampilkanGalat
                  ? "Alamat email belum benar. Contoh: nama@email.com"
                  : "Kode akan dikirim ke alamat ini. Periksa juga folder spam."}
              </p>
            </div>
            <Button type="submit" variant="aksen" size="lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
              Kirim kode ke email
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
      <header className="flex flex-col gap-3">
        <h1 className="text-h1">Masuk ke Kita Kerja</h1>
        <p className="text-body-lg text-tanah-600">
          Tulis email Anda. Kami kirim link konfirmasi — tidak perlu kata sandi.
        </p>
      </header>

      <form className="flex flex-col gap-6" onSubmit={kirimLink}>
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
        <Button type="submit" variant="aksen" size="lg" disabled={!emailValid || loading}>
          {loading ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Mail aria-hidden />
          )}
          Kirim link konfirmasi
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
>>>>>>> feat/phone-otp-auth
    </div>
  );
}

/** useSearchParams wajib dibungkus Suspense pada App Router. */
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-(--max-worker) px-4 py-12 sm:py-16">
          <p className="text-body text-tanah-600">Memuat…</p>
        </div>
      }
    >
      <FormMasuk />
    </Suspense>
  );
}
