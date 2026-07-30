import { cn } from "@/lib/utils";

/**
 * KartuPertanyaan (Bagian 4.5) — satu pertanyaan AI per layar.
 * Teks h3, latar biru-50, sudut 20px, indikator "Pertanyaan 3 dari 6"
 * + indikator titik (BUKAN persen).
 */
export function KartuPertanyaan({
  nomor,
  total,
  pertanyaan,
  className,
}: {
  /** 1-based */
  nomor: number;
  total: number;
  pertanyaan: string;
  className?: string;
}) {
  return (
    <section
      aria-label={`Pertanyaan ${nomor} dari ${total}`}
      className={cn("rounded-xl bg-biru-50 p-6", className)}
    >
      <p className="mikro text-biru-600">
        Pertanyaan {nomor} dari {total}
      </p>
      <h3 className="mt-2 text-h3 text-tanah-900">{pertanyaan}</h3>

      <div className="mt-4 flex items-center gap-2" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-2.5 rounded-full transition-colors duration-(--duration-medium)",
              i < nomor ? "bg-biru-600" : "bg-biru-200",
              i === nomor - 1 && "ring-2 ring-biru-600/30 ring-offset-1",
            )}
          />
        ))}
      </div>
      <span className="sr-only">
        Langkah {nomor} dari {total}
      </span>
    </section>
  );
}
