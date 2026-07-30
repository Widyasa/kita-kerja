import { NavBawahPendamping } from "./nav-bawah-pendamping";

/**
 * Layout (companion) — layar pendamping (Pak Slamet):
 * - lebar isi maks 520px (--max-worker), sama seperti layar pekerja
 * - teks default body-lg 19px (aturan Bagian 4.3)
 * - NavBawahPendamping tetap di bawah; konten diberi padding bawah
 *   supaya tidak tertutup nav (64px + area aman)
 */
export default function LayoutPendamping({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="text-body-lg">
      <main className="mx-auto min-h-dvh w-full max-w-(--max-worker) px-4 pt-6 pb-28">
        {children}
      </main>
      <NavBawahPendamping />
    </div>
  );
}
