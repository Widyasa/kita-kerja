import {
  CircleDashed,
  Megaphone,
  CircleCheck,
  CircleOff,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusLowongan } from "@/lib/mock";

/**
 * BadgeStatusLowongan — status lowongan untuk pemberi kerja.
 * Selalu ikon + teks, warna mengikuti token semantik.
 */
const GAYA: Record<
  StatusLowongan,
  { label: string; ikon: LucideIcon; kelas: string }
> = {
  draf: {
    label: "Draf",
    ikon: CircleDashed,
    kelas: "bg-tanah-100 text-tanah-600",
  },
  moderasi: {
    label: "Perlu diperbaiki",
    ikon: TriangleAlert,
    kelas: "bg-bahaya-50 text-bahaya-600",
  },
  tayang: {
    label: "Tayang",
    ikon: Megaphone,
    kelas: "bg-aman-50 text-aman-600",
  },
  terisi: {
    label: "Terisi",
    ikon: CircleCheck,
    kelas: "bg-biru-50 text-biru-600",
  },
  ditutup: {
    label: "Ditutup",
    ikon: CircleOff,
    kelas: "bg-tanah-100 text-tanah-600",
  },
};

export function BadgeStatusLowongan({
  status,
  className,
}: {
  status: StatusLowongan;
  className?: string;
}) {
  const g = GAYA[status];
  const Ikon = g.ikon;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-pill px-3 py-1 text-label font-semibold",
        g.kelas,
        className,
      )}
    >
      <Ikon className="size-4" aria-hidden />
      {g.label}
    </span>
  );
}
