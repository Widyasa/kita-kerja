"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function kirimLink(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent: "signin" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim email.");
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
  }

  return (
    <div className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-12 sm:py-16">
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
    </div>
  );
}
