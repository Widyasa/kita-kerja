"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
export default function SignInPage() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [tersentuh, setTersentuh] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = emailValid(email);
  const tampilkanGalat = tersentuh && email.length > 0 && !valid;

  async function kirimOTP(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    // BUG-029 — beri alasan, jangan matikan tombol diam-diam.
    if (!valid) {
      setTersentuh(true);
      toast.error("Alamat email belum benar. Contoh: nama@email.com");
      document.getElementById("email")?.focus();
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
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim kode.");
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
        body: JSON.stringify({ email, code: kode, intent: "signin" }),
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
      {langkah === "email" ? (
        <>
          <header className="flex flex-col gap-3">
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
    </div>
  );
}
