"use client";

import { useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * TombolBagikan — aksi "Bagikan tautan" di halaman kartu.
 * Pakai navigator.share bila tersedia; kalau tidak, salin ke clipboard.
 * Umpan balik jelas: label tombol berubah + pesan "Tautan tersalin"
 * yang juga diumumkan ke pembaca layar (aria-live).
 */
export function TombolBagikan({
  url,
  namaPekerja,
  className,
}: {
  url: string;
  namaPekerja: string;
  className?: string;
}) {
  const [tersalin, setTersalin] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function bagikan() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Kartu Kerja ${namaPekerja}`,
          text: `Lihat Kartu Kerja ${namaPekerja} di Kita Kerja.`,
          url,
        });
        return;
      } catch {
        // Pengguna membatalkan lembar berbagi, atau share gagal —
        // lanjut ke salin tautan sebagai cadangan.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setTersalin(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setTersalin(false), 3000);
    } catch {
      // Clipboard tidak tersedia — tidak ada yang bisa dilakukan di fase statis.
    }
  }

  return (
    <span className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        onClick={bagikan}
        className={cn(
          "flex h-auto min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-center text-label leading-tight font-semibold whitespace-normal shadow-1 transition-colors duration-(--duration-fast)",
          "bg-tanah-100 text-tanah-800 hover:bg-tanah-200",
          "focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        )}
      >
        {tersalin ? (
          <Check className="size-5 shrink-0 text-aman-600" aria-hidden />
        ) : (
          <Share2 className="size-5 shrink-0" aria-hidden />
        )}
        {tersalin ? "Tautan tersalin" : "Bagikan tautan"}
      </button>
      <span aria-live="polite" className="sr-only">
        {tersalin ? "Tautan kartu tersalin ke papan klip." : ""}
      </span>
    </span>
  );
}
