import { NavBawahPekerja } from "@/component/bersama/NavBawahPekerja";

/**
 * Layout (worker) — layar pekerja, desktop-first tapi wajib responsive:
 * - desktop: kolom dokumen lebar (max-w-5xl) dengan margin bergaris
 *   vertikal kiri-kanan (bahasa visual "dossier" seperti landing)
 * - di bawah 1024px: runtuh ke kolom tunggal 520px (--max-worker)
 * - teks default body-lg 19px (aturan Bagian 4.3)
 * - NavBawahPekerja tetap di bawah; konten diberi padding bawah
 *   supaya tidak tertutup nav (64px + area aman)
 */
export default function LayoutPekerja({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="text-body-lg bg-tanah-50">
      <main className="mx-auto min-h-dvh w-full max-w-5xl border-x border-tanah-200 px-14 pt-12 pb-28 max-lg:max-w-(--max-worker) max-lg:border-x-0 max-lg:px-4 max-lg:pt-6">
        {children}
      </main>
      <NavBawahPekerja />
    </div>
  );
}
