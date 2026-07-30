import {
  CircleCheck,
  TriangleAlert,
  OctagonAlert,
  MessageCircleQuestion,
  Quote,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SaringanAman, TingkatRisiko } from "@/lib/mock";

/**
 * PanelSaringanAman (Bagian 4.5):
 * - tingkat risiko + temuan berkutipan dari teks lowongan
 * - DAFTAR PERTANYAAN YANG DISARANKAN = bagian paling menonjol
 * - Bahasa memberdayakan, tidak menakut-nakuti,
 *   TIDAK PERNAH menyatakan "pasti penipuan".
 */

const GAYA: Record<
  TingkatRisiko,
  { label: string; ikon: LucideIcon; latar: string; warnaIkon: string; sambutan: string }
> = {
  aman: {
    label: "Aman",
    ikon: CircleCheck,
    latar: "bg-aman-50",
    warnaIkon: "text-aman-600",
    sambutan: "Tidak ada tanda mencurigakan. Tetap tanyakan hal penting sebelum mulai.",
  },
  hati_hati: {
    label: "Hati-hati",
    ikon: TriangleAlert,
    latar: "bg-hati-50",
    warnaIkon: "text-hati-600",
    sambutan:
      "Ada beberapa hal yang belum jelas. Anda berhak bertanya dulu sebelum memutuskan.",
  },
  berisiko_tinggi: {
    label: "Banyak tanda bahaya",
    ikon: OctagonAlert,
    latar: "bg-bahaya-50",
    warnaIkon: "text-bahaya-600",
    sambutan:
      "Kami menemukan beberapa tanda yang perlu Anda waspadai. Tanyakan hal-hal di bawah ini dulu — pekerjaan asli tidak keberatan menjawab.",
  },
};

export function PenandaRisiko({
  tingkat,
  className,
}: {
  tingkat: TingkatRisiko;
  className?: string;
}) {
  const g = GAYA[tingkat];
  const Ikon = g.ikon;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-pill px-3 py-1 text-label",
        g.latar,
        className,
      )}
    >
      <Ikon className={cn("size-4", g.warnaIkon)} aria-hidden />
      <span className="text-tanah-900">{g.label}</span>
    </span>
  );
}

export function PanelSaringanAman({
  saringan,
  className,
}: {
  saringan: SaringanAman;
  className?: string;
}) {
  const g = GAYA[saringan.tingkat];
  const Ikon = g.ikon;

  return (
    <section
      aria-label="Saringan Aman"
      className={cn("rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1", className)}
    >
      {/* Tingkat risiko */}
      <div className={cn("flex items-start gap-3 rounded-lg p-4", g.latar)}>
        <Ikon className={cn("mt-0.5 size-6 shrink-0", g.warnaIkon)} aria-hidden />
        <div>
          <h3 className="text-h3">
            Saringan Aman: {g.label}
          </h3>
          <p className="mt-1 text-body text-tanah-900">{g.sambutan}</p>
        </div>
      </div>

      {/* Temuan berkutipan */}
      {saringan.temuan.length > 0 && (
        <div className="mt-5">
          <h4 className="text-label text-tanah-600">Yang kami temukan di teks lowongan:</h4>
          <ul className="mt-2 flex flex-col gap-3">
            {saringan.temuan.map((t, i) => (
              <li key={i} className="rounded-lg bg-tanah-50 p-4">
                <p className="flex items-start gap-2 text-body text-tanah-700 italic">
                  <Quote className="mt-1 size-4 shrink-0 text-tanah-400" aria-hidden />
                  &ldquo;{t.kutipan}&rdquo;
                </p>
                <p className="mt-1 text-label text-tanah-600 not-italic">{t.penjelasan}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pertanyaan yang disarankan — bagian paling menonjol */}
      <div className="mt-6 rounded-xl bg-biru-50 p-5">
        <h4 className="flex items-center gap-2 text-h3 text-biru-900">
          <MessageCircleQuestion className="size-6 shrink-0 text-biru-600" aria-hidden />
          Tanyakan ini dulu
        </h4>
        <p className="mt-1 text-label text-tanah-600">
          Pemberi kerja yang jujur akan senang menjawab pertanyaan ini.
        </p>
        <ol className="mt-3 flex flex-col gap-3">
          {saringan.pertanyaan_disarankan.map((q, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg bg-tanah-0 p-4 shadow-1"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-biru-600 text-body font-bold text-tanah-0">
                {i + 1}
              </span>
              <p className="text-body font-semibold text-tanah-900">{q}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
