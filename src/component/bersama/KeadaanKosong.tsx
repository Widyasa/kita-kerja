import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/component/ui/button";
import { cn } from "@/lib/utils";

/**
 * KeadaanKosong — setiap daftar kosong WAJIB menjelaskan langkah berikutnya,
 * bukan hanya menulis "belum ada data" (Bagian 4.5).
 */
export function KeadaanKosong({
  ikon: Ikon,
  judul,
  penjelasan,
  labelAksi,
  hrefAksi,
  onAksi,
  className,
}: {
  ikon: LucideIcon;
  judul: string;
  /** jelaskan langkah berikutnya dalam bahasa sederhana */
  penjelasan: string;
  labelAksi: string;
  hrefAksi?: string;
  onAksi?: () => void;
  className?: string;
}) {
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
      <h2 className="text-h3">{judul}</h2>
      <p className="max-w-sm text-body text-tanah-600">{penjelasan}</p>
      {hrefAksi ? (
        <Button asChild size="lg" className="mt-2">
          <Link href={hrefAksi}>{labelAksi}</Link>
        </Button>
      ) : (
        <Button size="lg" className="mt-2" onClick={onAksi}>
          {labelAksi}
        </Button>
      )}
    </div>
  );
}
