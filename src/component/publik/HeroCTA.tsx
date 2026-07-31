"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, UsersRound } from "lucide-react";

import { Button } from "@/component/ui/button";
import { createClient } from "@/lib/supabase/browser-client";

/**
 * HeroCTA — tombol daftar + tautan "lihat-lihat/masuk" di hero beranda.
 * Disembunyikan untuk pengguna yang sudah login: mereka sudah punya akun,
 * jadi CTA "daftar" tidak relevan lagi (header sudah menampilkan tombol
 * peran mereka sendiri).
 */
export function HeroCTA() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading || user) return null;

  return (
    <>
      {/* `flex-1` HANYA dari sm ke atas: di kolom, flex-1 bekerja pada
          tinggi dan menggencet tombol 56px jadi ~28px. */}
      <div className="mt-10 flex max-w-xl flex-col gap-4 sm:flex-row">
        <Button
          asChild
          variant="aksen"
          size="lg"
          className="w-full sm:w-auto sm:flex-1 motion-safe:transition-shadow hover:shadow-2"
        >
          <Link href="/register">
            <Mic aria-hidden />
            Saya cari kerja
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full border-2 border-biru-600 text-biru-600 hover:bg-biru-50 sm:w-auto sm:flex-1"
        >
          <Link href="/register">
            <UsersRound aria-hidden />
            Saya butuh pekerja
          </Link>
        </Button>
      </div>

      <p className="text-label mt-6 text-tanah-600">
        Cuma mau lihat-lihat dulu?{" "}
        <Link
          href="/lowongan"
          className="rounded-sm font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
        >
          Buka papan lowongan
        </Link>{" "}
        — tanpa akun. Sudah punya akun?{" "}
        <Link
          href="/sign-in"
          className="rounded-sm font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
        >
          Masuk di sini
        </Link>
      </p>
    </>
  );
}
