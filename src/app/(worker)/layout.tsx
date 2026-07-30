import { NavBawahPekerja } from "@/component/bersama/NavBawahPekerja";

/**
 * Layout (worker) — layar pekerja:
 * - lebar isi maks 520px (--max-worker)
 * - teks default body-lg 19px (aturan Bagian 4.3)
 * - NavBawahPekerja tetap di bawah; konten diberi padding bawah
 *   supaya tidak tertutup nav (64px + area aman)
 */
export default function LayoutPekerja({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="text-body-lg">
      <main className="mx-auto min-h-dvh w-full max-w-(--max-worker) px-4 pt-6 pb-28">
        {children}
      </main>
      <NavBawahPekerja />
    </div>
  );
}
