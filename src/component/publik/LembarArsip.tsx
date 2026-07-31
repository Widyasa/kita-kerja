import { cn } from "@/lib/utils";

/**
 * Primitif tata letak untuk seluruh halaman publik.
 *
 * Bahasa visualnya "dossier / arsip": halaman dibaca seperti dokumen tercetak
 * — margin bergaris vertikal mengapit isi, dan antar-bagian dipisahkan garis
 * horizontal, bukan kartu bertumpuk. Beranda sudah memakai bahasa ini; modul
 * ini menjadikannya bisa dipakai ulang supaya `/lowongan` dan `/cara-kerja`
 * tidak menyimpang.
 *
 * Padding horizontal naik bertahap (20px → 32px → 56px) karena tablet 768px
 * dulu ikut memakai padding ponsel dan terasa sempit.
 */

export const PADDING_ARSIP = "px-5 sm:px-8 lg:px-[100px]";

export function LembarArsip({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn("bg-tanah-50", className)}>
      <div className="mx-auto w-full max-w-(--max-employer) border-x border-tanah-200 max-lg:border-x-0">
        {children}
      </div>
    </div>
  );
}

const RUANG = {
  normal: "py-14 sm:py-16 lg:py-24",
  rapat: "py-10 sm:py-12",
  /** pemanggil mengatur padding vertikalnya sendiri lewat className */
  kustom: "",
} as const;

export function SeksiArsip({
  children,
  className,
  /** bagian pertama halaman — tanpa garis pemisah di atasnya */
  awal = false,
  /** latar kertas putih, dipakai untuk memberi ritme antar-bagian */
  terang = false,
  ruang = "normal",
  ...sisa
}: Readonly<
  React.ComponentPropsWithoutRef<"section"> & {
    awal?: boolean;
    terang?: boolean;
    ruang?: keyof typeof RUANG;
  }
>) {
  return (
    <section
      className={cn(
        PADDING_ARSIP,
        RUANG[ruang],
        !awal && "border-t-2 border-tanah-200",
        terang && "bg-tanah-0",
        className,
      )}
      {...sisa}
    >
      {children}
    </section>
  );
}
