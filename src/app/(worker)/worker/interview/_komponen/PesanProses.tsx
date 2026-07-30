import { cn } from "@/lib/utils";

/**
 * PesanProses — keadaan "sedang berpikir / menyusun" (Bagian 6.2).
 * Tiga titik berdenyut halus, BUKAN spinner generik.
 * Animasi hanya motion-safe: pengguna prefers-reduced-motion melihat
 * titik statis dengan teks yang sama.
 */
export function PesanProses({
  teks,
  className,
}: {
  teks: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center gap-4 py-6", className)}
    >
      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-3 rounded-full bg-biru-600 motion-safe:animate-bounce"
            style={{
              animationDelay: `${i * 160}ms`,
              animationDuration: "900ms",
            }}
          />
        ))}
      </div>
      <p className="text-center text-body-lg text-tanah-700">{teks}</p>
    </div>
  );
}
