import { CircleCheck, TriangleAlert, CircleAlert, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatRupiah, kalimatMetodeAcuan, statusUpah } from "@/lib/mock/utils";
import type { StatusUpah } from "@/lib/mock/types";
import type { AcuanTampil } from "@/lib/data/types";

/**
 * PenandaUpah — tiga keadaan Upah Terang (Bagian 4.5).
 * SELALU menampilkan nominal acuan + satu kalimat metode.
 * AI tidak pernah menyentuh angka — semua dari acuanUntuk() deterministik.
 *
 * Kontras: teks selalu tanah-900/tanah-600 (>= 6,9:1 di semua latar).
 * Warna semantik dibawa ikon (>= 3:1 untuk objek grafis):
 * - aman-600   #16A34A di aman-50   #F0FDF4 = 3,15:1
 * - hati-600   #D97706 di hati-50   #FFFBEB = 3,08:1
 * - bahaya-600 #DC2626 di bahaya-50 #FEF2F2 = 4,4:1
 */

const GAYA: Record<
  StatusUpah,
  { label: string; ikon: LucideIcon; latar: string; warnaIkon: string }
> = {
  sesuai_acuan: {
    label: "Sesuai acuan",
    ikon: CircleCheck,
    latar: "bg-aman-50",
    warnaIkon: "text-aman-600",
  },
  sedikit_di_bawah: {
    label: "Sedikit di bawah acuan",
    ikon: TriangleAlert,
    latar: "bg-hati-50",
    warnaIkon: "text-hati-600",
  },
  di_bawah_acuan: {
    label: "Di bawah acuan",
    ikon: CircleAlert,
    latar: "bg-bahaya-50",
    warnaIkon: "text-bahaya-600",
  },
};

interface PenandaUpahProps {
  /** upah yang ditawarkan (rupiah) */
  ditawarkan: number;
  acuan: AcuanTampil;
  wilayahNama: string;
  /** ringkas: satu baris untuk KartuLowongan; penuh: dengan kalimat metode */
  ringkas?: boolean;
  className?: string;
}

export function PenandaUpah({
  ditawarkan,
  acuan,
  wilayahNama,
  ringkas = false,
  className,
}: PenandaUpahProps) {
  const status = statusUpah(ditawarkan, acuan.acuan_harian);
  const g = GAYA[status];
  const Ikon = g.ikon;

  if (ringkas) {
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-pill px-3 py-1 text-label",
          g.latar,
          className,
        )}
      >
        <Ikon className={cn("size-4", g.warnaIkon)} aria-hidden />
        <span>
          {g.label} · acuan {formatRupiah(acuan.acuan_harian)} / hari
        </span>
      </span>
    );
  }

  return (
    <div className={cn("rounded-lg p-4", g.latar, className)}>
      <p className="flex items-center gap-2 text-body font-semibold">
        <Ikon className={cn("size-5 shrink-0", g.warnaIkon)} aria-hidden />
        {g.label}
      </p>
      <p className="mt-1 text-body text-tanah-900">
        Upah ditawarkan {formatRupiah(ditawarkan)} / hari · Acuan{" "}
        {formatRupiah(acuan.acuan_harian)} / hari
      </p>
      <p className="mt-1 text-label text-tanah-600">
        {kalimatMetodeAcuan(wilayahNama)}
        {acuan.metode === "umk_dan_lapangan"
          ? ` Ditambah ${acuan.jumlah_laporan} laporan upah nyata dari pekerja.`
          : ""}
      </p>
    </div>
  );
}
