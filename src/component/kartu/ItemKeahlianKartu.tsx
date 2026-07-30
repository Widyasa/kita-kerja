"use client";

import { useState } from "react";
import { ChevronDown, Quote } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { cn } from "@/lib/utils";
import {
  keahlianBaku,
  type KartuKeahlian,
  type LevelKeahlian,
} from "@/lib/mock";

const LABEL_LEVEL: Record<LevelKeahlian, string> = {
  pemula: "Pemula",
  terampil: "Terampil",
  ahli: "Ahli",
};

/**
 * ItemKeahlianKartu — satu keahlian di halaman kartu (mode lihat, bukan
 * konfirmasi). Nama baku, sebutan asli dalam tanda kutip, BadgeLapis,
 * penanda level, dan kutipan bukti yang dapat dibuka-tutup.
 * Kutipan bukti ditonjolkan — bukti AI tidak mengarang (Bagian 6.3/6.4).
 */
export function ItemKeahlianKartu({
  keahlian,
  className,
}: {
  keahlian: KartuKeahlian;
  className?: string;
}) {
  const [buka, setBuka] = useState(false);
  const baku = keahlian.keahlian_id
    ? keahlianBaku.find((k) => k.id === keahlian.keahlian_id)
    : null;
  const namaTampil =
    baku?.nama_baku ?? keahlian.nama_diajukan ?? keahlian.sebutan_pekerja;

  return (
    <article
      className={cn(
        "rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-h3">{namaTampil}</h3>
          <p className="mt-1 text-body text-tanah-600">
            Sebutan Anda: &ldquo;{keahlian.sebutan_pekerja}&rdquo; ·{" "}
            {LABEL_LEVEL[keahlian.level]}
          </p>
        </div>
        <BadgeLapis lapis={keahlian.lapis} />
      </div>

      <button
        type="button"
        aria-expanded={buka}
        onClick={() => setBuka((b) => !b)}
        className="mt-3 flex min-h-12 w-full items-center justify-between gap-2 rounded-lg bg-tanah-50 px-4 py-2 text-left text-label text-biru-600 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
      >
        Lihat bukti dari ucapan Anda
        <ChevronDown
          className={cn(
            "size-5 shrink-0 motion-safe:transition-transform motion-safe:duration-(--duration-medium) motion-safe:ease-(--ease-default)",
            buka && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {buka && (
        <blockquote className="mt-2 flex items-start gap-2 rounded-lg bg-tanah-50 px-4 py-3 text-body text-tanah-700 italic">
          <Quote className="mt-1.5 size-4 shrink-0 text-tanah-400" aria-hidden />
          <span>
            Dari ucapan Anda saat Ngobrol Kerja: &ldquo;{keahlian.kutipan_bukti}
            &rdquo;
          </span>
        </blockquote>
      )}
    </article>
  );
}
