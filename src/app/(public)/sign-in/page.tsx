"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || !passwordValid || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal masuk.");
      router.push(json.redirect ?? "/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-h1">Masuk ke Kita Kerja</h1>
        <p className="text-body-lg text-tanah-600">
          Masukkan email dan kata sandi akun Anda.
        </p>
      </header>

      <form className="flex flex-col gap-6" onSubmit={masuk}>
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
            autoComplete="current-password"
            placeholder="Minimal 8 karakter"
            className="h-14 text-body-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {password.length > 0 && !passwordValid && (
            <p className="text-label text-hati-600" role="alert">
              Kata sandi minimal 8 karakter
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="aksen"
          size="lg"
          disabled={!emailValid || !passwordValid || loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <LogIn aria-hidden />
          )}
          Masuk
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
