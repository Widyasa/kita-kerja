"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const ARTI: Record<number, string> = {
  1: "Sangat kurang",
  2: "Kurang",
  3: "Cukup",
  4: "Baik",
  5: "Sangat baik",
};

/**
 * PenilaianBintang — penilaian 1–5 bintang besar (Bagian 6.x):
 * - target sentuh 56px per bintang (size-14), ikon + label angka
 * - radiogroup: keyboard navigable (panah kiri/kanan bawaan radio),
 *   focus-visible jelas
 * - hanya satu sumber kebenaran: prop `nilai` (1–5 atau null)
 */
export function PenilaianBintang({
  nilai,
  onUbah,
  className,
}: {
  nilai: number | null;
  onUbah: (n: 1 | 2 | 3 | 4 | 5) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="radiogroup"
        aria-label="Penilaian 1 sampai 5 bintang"
        className="flex flex-wrap gap-2"
      >
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const aktif = nilai !== null && n <= nilai;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={nilai === n}
              aria-label={`${n} bintang — ${ARTI[n]}`}
              onClick={() => onUbah(n)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                  e.preventDefault();
                  onUbah(Math.min(5, (nilai ?? 0) + 1) as 1 | 2 | 3 | 4 | 5);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                  e.preventDefault();
                  onUbah(Math.max(1, (nilai ?? 2) - 1) as 1 | 2 | 3 | 4 | 5);
                }
              }}
              className={cn(
                "flex size-14 cursor-pointer flex-col items-center justify-center rounded-xl border transition-colors duration-(--duration-fast)",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/50 focus-visible:ring-offset-2",
                aktif
                  ? "border-kuning-600 bg-kuning-50"
                  : "border-tanah-300 bg-tanah-0 hover:bg-tanah-50",
              )}
            >
              <Star
                className={cn(
                  "size-6",
                  aktif ? "fill-kuning-500 text-kuning-500" : "text-tanah-400",
                )}
                aria-hidden
              />
              <span className="text-label font-bold text-tanah-800">{n}</span>
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="text-body text-tanah-600">
        {nilai ? `${nilai} bintang — ${ARTI[nilai]}` : "Belum dipilih"}
      </p>
    </div>
  );
}
