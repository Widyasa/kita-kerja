import { ShieldCheck, Star, UserRound, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LapisKepercayaan } from "@/lib/mock";

/**
 * BadgeLapis — penanda tiga lapis kepercayaan (tabel Bagian 4.2).
 * Ketiganya WAJIB terlihat berbeda. Selalu ikon + teks.
 *
 * Kontras terverifikasi (teks 15px bold):
 * - Terverifikasi: biru-600 #2547EB di atas biru-50 #EFF4FF = 5,96:1 (AA)
 * - Dinilai:       kuning-800 #92400E di atas kuning-50 #FFFBEB = 6,87:1 (AA)
 *                  (kuning-600 di kuning-50 hanya 3,08:1 — dipakai hanya untuk ikon aksen)
 * - Diklaim:       tanah-600 #5C5649 di atas tanah-100 #F3F1ED = 6,4:1 (AA)
 *                  (spec memakai tanah-500 = 3,96:1 — digelapkan satu langkah demi AA)
 */

const GAYA: Record<
  LapisKepercayaan,
  { label: string; ikon: LucideIcon; kelas: string; arti: string }
> = {
  terverifikasi: {
    label: "Terverifikasi",
    ikon: ShieldCheck,
    kelas: "bg-biru-50 text-biru-600",
    arti: "Riwayat kerja dikonfirmasi dua pihak, tidak dapat diubah",
  },
  dinilai: {
    label: "Dinilai",
    ikon: Star,
    kelas: "bg-kuning-50 text-kuning-800",
    arti: "Ada penilaian dari pemberi kerja",
  },
  diklaim: {
    label: "Diklaim",
    ikon: UserRound,
    kelas: "bg-tanah-100 text-tanah-600",
    arti: "Dari cerita pekerja sendiri, belum ada pekerjaan yang membuktikan",
  },
};

export function BadgeLapis({
  lapis,
  className,
}: {
  lapis: LapisKepercayaan;
  className?: string;
}) {
  const g = GAYA[lapis];
  const Ikon = g.ikon;
  return (
    <span
      title={g.arti}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-pill px-3 py-1 text-label",
        g.kelas,
        className,
      )}
    >
      <Ikon className="size-4" aria-hidden />
      {g.label}
    </span>
  );
}
