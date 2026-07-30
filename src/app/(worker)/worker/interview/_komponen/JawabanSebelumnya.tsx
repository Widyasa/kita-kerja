"use client";

import { useState } from "react";
import { ChevronDown, Quote } from "lucide-react";

import { cn } from "@/lib/utils";
import type { JawabanTersimpan } from "./penyimpanan";

/**
 * JawabanSebelumnya — transkrip asli jawaban pekerja, dapat dibuka-tutup
 * (Bagian 6.2: "agar pengguna merasa didengar"). Terbuka sejak awal supaya
 * transkrip yang baru muncul langsung terlihat setelah keadaan berpikir.
 */
export function JawabanSebelumnya({
  jawaban,
}: {
  jawaban: JawabanTersimpan[];
}) {
  const [buka, setBuka] = useState(true);

  return (
    <section
      aria-label="Jawaban sebelumnya"
      className="rounded-xl border border-tanah-200 bg-tanah-0 p-4 shadow-1"
    >
      <button
        type="button"
        aria-expanded={buka}
        onClick={() => setBuka((b) => !b)}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-label text-tanah-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
      >
        Jawaban sebelumnya ({jawaban.length})
        <ChevronDown
          className={cn(
            "size-5 shrink-0 transition-transform duration-(--duration-medium)",
            buka && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {buka && (
        <ol className="mt-1 flex flex-col gap-3">
          {jawaban.map((j) => (
            <li
              key={j.nomor}
              className="flex items-start gap-2 rounded-lg bg-tanah-50 px-4 py-3"
            >
              <Quote className="mt-1.5 size-4 shrink-0 text-tanah-400" aria-hidden />
              <div>
                <p className="mikro text-tanah-500">Pertanyaan {j.nomor}</p>
                <p className="text-body text-tanah-700 italic">
                  &ldquo;{j.transkrip}&rdquo;
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
