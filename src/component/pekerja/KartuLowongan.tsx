import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";

import { PenandaUpah } from "@/component/bersama/PenandaUpah";
import { PenandaRisiko } from "@/component/bersama/PanelSaringanAman";
import { cn } from "@/lib/utils";
import type { LowonganTampil } from "@/lib/data/types";
import { upahTeks } from "@/lib/mock/utils";
import { jarakTeks } from "@/lib/engine/jarak";

/**
 * KartuLowongan (Bagian 4.5):
 * judul, wilayah, jarak, PenandaUpah ringkas, penanda tingkat Saringan Aman,
 * dan SATU baris alasan pencocokan ("Cocok karena…").
 * JANGAN PERNAH menampilkan skor angka.
 */
export function KartuLowongan({
  lowongan: lw,
  href,
  className,
}: {
  lowongan: LowonganTampil;
  /** bila diisi, seluruh kartu menjadi tautan */
  href?: string;
  className?: string;
}) {
  const isi = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-h3 text-tanah-900">{lw.judul_baku}</h3>
        {lw.saringan && <PenandaRisiko tingkat={lw.saringan.tingkat} />}
      </div>

      <p className="mt-2 flex items-center gap-2 text-body text-tanah-600">
        <MapPin className="size-5 shrink-0" aria-hidden />
        {lw.lokasi_teks ?? lw.wilayah_nama ?? "Lokasi belum diisi"}
        {lw.jarak_km !== null && (
          <span className="text-tanah-500">· {jarakTeks(lw.jarak_km)}</span>
        )}
      </p>

      {lw.upah_ditawarkan !== null && lw.satuan_upah && (
        <p className="mt-2 text-body font-semibold text-tanah-900">
          {upahTeks(lw.upah_ditawarkan, lw.satuan_upah)}
        </p>
      )}

      {lw.satuan_upah === "harian" && lw.acuan && lw.upah_ditawarkan !== null && (
        <PenandaUpah
          ringkas
          className="mt-3"
          ditawarkan={lw.upah_ditawarkan}
          acuan={lw.acuan}
          wilayahNama={lw.wilayah_nama ?? "wilayah ini"}
        />
      )}

      {lw.alasan_cocok && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-kuning-50 p-3 text-label text-tanah-800">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-kuning-600" aria-hidden />
          {lw.alasan_cocok}
        </p>
      )}
    </>
  );

  const kelas = cn(
    "block rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1",
    href &&
      "transition-shadow duration-(--duration-fast) hover:shadow-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={kelas}>
        {isi}
      </Link>
    );
  }
  return <article className={kelas}>{isi}</article>;
}
