"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";

const KODE_DEMO = "123456";

/**
 * Masuk `/sign-in` — dua langkah, satu tugas per layar:
 * 1. Nomor HP → 2. kode OTP 6 digit (LangkahOTP).
 * DEMO: tidak ada SMS sungguhan — kode contoh ditampilkan di layar dan
 * kode apa pun yang lengkap diterima. Setelah "berhasil" masuk sebagai
 * persona demo Pak Warto → /worker.
 */
export default function SignInPage() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<"hp" | "otp">("hp");
  const [noHp, setNoHp] = useState("");

  const hpValid = noHp.replace(/\D/g, "").length >= 9;

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

          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (hpValid) setLangkah("otp");
            }}
          >
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
              />
            </div>
            <Button type="submit" variant="aksen" size="lg" disabled={!hpValid}>
              <MessageSquareText aria-hidden />
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

          <LangkahOTP onSelesai={() => router.push("/worker")} />

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setLangkah("hp")}
          >
            <ArrowLeft aria-hidden />
            Ganti nomor HP
          </Button>
        </>
      )}
    </div>
  );
}
