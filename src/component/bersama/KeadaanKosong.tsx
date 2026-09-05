import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/component/ui/button";
import { cn } from "@/lib/utils";

/**
 * KeadaanKosong — setiap daftar kosong WAJIB menjelaskan langkah berikutnya,
 * bukan hanya menulis "belum ada data" (Bagian 4.5).
 * Tombol aksi opsional bila CTA sudah ada di luar komponen (mis. halaman companion).
 */
export function KeadaanKosong({
  ikon: Ikon,
  judul,
  sebagaiJudulHalaman = false,
  penjelasan,
  labelAksi,
  hrefAksi,
  onAksi,
  className,
}: {
  ikon: LucideIcon;
  judul: string;
  /**
   * BUG-038 — beberapa halaman hanya berisi keadaan kosong ini, sehingga
   * heading teratasnya jadi h2 dan halaman tidak punya h1 sama sekali.
   * Set true bila komponen ini memang judul utama halaman.
   */
  sebagaiJudulHalaman?: boolean;
  /** jelaskan langkah berikutnya dalam bahasa sederhana */
  penjelasan: string;
  labelAksi?: string;
  hrefAksi?: string;
  onAksi?: () => void;
  className?: string;
}) {
  const tampilAksi = Boolean(labelAksi);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-dashed border-tanah-300 bg-tanah-0 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-tanah-100">
        <Ikon className="size-8 text-tanah-500" aria-hidden />
      </span>
      {sebagaiJudulHalaman ? (
        <h1 className="text-h3">{judul}</h1>
      ) : (
        <h2 className="text-h3">{judul}</h2>
      )}
      <p className="max-w-sm text-body text-tanah-600">{penjelasan}</p>
      {tampilAksi &&
        (hrefAksi ? (
          <Button asChild size="lg" className="mt-2">
            <Link href={hrefAksi}>{labelAksi}</Link>
          </Button>
        ) : (
          <Button size="lg" className="mt-2" onClick={onAksi}>
            {labelAksi}
          </Button>
        ))}
    </div>
  );
}
