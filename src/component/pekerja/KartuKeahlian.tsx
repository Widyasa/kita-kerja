"use client";

import { useState } from "react";
import { Check, Pencil, ChevronDown, Quote } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/utils";
import { keahlianBaku, type KartuKeahlian as TKartuKeahlian, type LevelKeahlian } from "@/lib/mock";

const LABEL_LEVEL: Record<LevelKeahlian, string> = {
  pemula: "Pemula",
  terampil: "Terampil",
  ahli: "Ahli",
};

const GAYA_LEVEL: Record<LevelKeahlian, string> = {
  pemula: "bg-tanah-100 text-tanah-600",
  terampil: "bg-tanah-100 text-tanah-700",
  ahli: "bg-biru-100 text-biru-800",
};

/**
 * KartuKeahlian (Bagian 4.5):
 * - Nama baku h3, sebutan asli dalam tanda kutip
 * - Penanda level + BadgeLapis (tiga lapis beda visual)
 * - Kutipan bukti dapat dibuka-tutup ("Kenapa saya simpulkan begitu")
 * - Tombol Betul & Perbaiki (min 48px)
 */
export function KartuKeahlian({
  keahlian,
  onBetul,
  onPerbaiki,
  className,
}: {
  keahlian: TKartuKeahlian;
  onBetul?: () => void;
  onPerbaiki?: () => void;
  className?: string;
}) {
  const [buka, setBuka] = useState(false);
  const baku = keahlian.keahlian_id
    ? keahlianBaku.find((k) => k.id === keahlian.keahlian_id)
    : null;
  const namaTampil = baku?.nama_baku ?? keahlian.nama_diajukan ?? keahlian.sebutan_pekerja;

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
            Sebutan Anda: &ldquo;{keahlian.sebutan_pekerja}&rdquo;
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <BadgeLapis lapis={keahlian.lapis} />
          <span
            className={cn(
              "rounded-pill px-3 py-1 text-label",
              GAYA_LEVEL[keahlian.level],
            )}
          >
            {LABEL_LEVEL[keahlian.level]}
          </span>
        </div>
      </div>

      {/* kutipan bukti buka-tutup */}
      <button
        type="button"
        aria-expanded={buka}
        onClick={() => setBuka((b) => !b)}
        className="mt-3 flex min-h-12 w-full items-center justify-between gap-2 rounded-lg bg-tanah-50 px-4 py-2 text-left text-label text-biru-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
      >
        Kenapa saya simpulkan begitu
        <ChevronDown
          className={cn(
            "size-5 shrink-0 transition-transform duration-(--duration-medium)",
            buka && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {buka && (
        <blockquote className="mt-2 flex items-start gap-2 rounded-lg bg-tanah-50 px-4 pb-4 text-body italic text-tanah-700">
          <Quote className="mt-1.5 size-4 shrink-0 text-tanah-400" aria-hidden />
          <span>
            Dari ucapan Anda saat Ngobrol Kerja: &ldquo;{keahlian.kutipan_bukti}&rdquo;
          </span>
        </blockquote>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="aksen" onClick={onBetul}>
          <Check aria-hidden />
          Betul
        </Button>
        <Button variant="outline" onClick={onPerbaiki}>
          <Pencil aria-hidden />
          Perbaiki
        </Button>
      </div>
    </article>
  );
}
