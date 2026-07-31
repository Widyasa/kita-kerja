import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home, LogIn } from "lucide-react";

import { Button } from "@/component/ui/button";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
};

/**
 * BUG-021 — sebelumnya URL tak dikenal menampilkan halaman bawaan Next.js
 * berbahasa Inggris ("This page could not be found.") tanpa navigasi apa pun,
 * sehingga pengguna buntu. Diganti halaman berbahasa Indonesia dengan jalan
 * keluar yang jelas. Judul halaman dibuat h1 (BUG-038), bukan angka "404".
 */
export default function HalamanTidakDitemukan() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-5 py-16">
      <p className="text-label font-bold tracking-wide text-tanah-600 uppercase">
        Kesalahan 404
      </p>

      <h1 className="text-h1 text-balance">Halaman tidak ditemukan</h1>

      <p className="text-body-lg text-tanah-700">
        Maaf, halaman yang Anda cari tidak ada atau sudah dipindahkan. Coba
        periksa kembali tautannya, atau kembali ke beranda.
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row">
        <Button asChild variant="aksen" size="lg" className="min-h-14 shrink-0">
          <Link href="/">
            <Home aria-hidden />
            Kembali ke beranda
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="min-h-14 shrink-0 border-2 border-biru-600 text-biru-600 hover:bg-biru-50"
        >
          <Link href="/sign-in">
            <LogIn aria-hidden />
            Masuk ke akun
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </main>
  );
}
