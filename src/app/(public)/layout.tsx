"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";

import { Button } from "@/component/ui/button";

/**
 * Layout (public) — header publik minimal:
 * logo "Kita Kerja" + tombol Masuk. Tanpa nav peran.
 *
 * Pengecualian `/verify/*`: halaman verifikasi dibuka orang asing yang baru
 * memindai QR — layout-nya diminimalkan jadi satu strip identitas agar
 * dipahami dalam 5 detik (Bagian 6.5).
 */
export default function LayoutPublik({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const halamanVerifikasi = pathname.startsWith("/verify");

  if (halamanVerifikasi) {
    return (
      <div className="min-h-dvh bg-tanah-50">
        <header className="tanpa-cetak border-b border-tanah-200 bg-tanah-0">
          <div className="mx-auto flex h-14 w-full max-w-(--max-worker) items-center justify-center px-4">
            <p className="text-label text-tanah-600">
              <span className="font-bold text-biru-600">Kita Kerja</span>
              {" · Verifikasi Kartu Kerja"}
            </p>
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="tanpa-cetak border-b border-tanah-200 bg-tanah-0">
        <div className="mx-auto flex h-16 w-full max-w-(--max-employer) items-center justify-between px-4">
          <Link
            href="/"
            className="text-h3 text-biru-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
          >
            Kita Kerja
          </Link>
          <Button asChild variant="outline">
            <Link href="/sign-in">
              <LogIn aria-hidden />
              Masuk
            </Link>
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
