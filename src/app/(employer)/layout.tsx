import { NavPemberi } from "@/component/bersama/NavPemberi";

/**
 * Layout (employer) — dasbor pemberi kerja:
 * - lebar isi maks 1120px (--max-employer), teks default body 17px
 * - NavPemberi: sidebar lebar di >= lg, bottom nav di layar sempit
 *   (konten diberi padding bawah agar tidak tertutup bottom nav)
 */
export default function LayoutPemberi({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh text-body">
      <NavPemberi />
      <main className="mx-auto w-full max-w-(--max-employer) flex-1 px-4 pt-6 pb-28 lg:px-8 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
