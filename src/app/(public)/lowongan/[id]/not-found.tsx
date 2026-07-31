import Link from "next/link";
import { FileSearch } from "lucide-react";

import { LembarArsip, SeksiArsip } from "@/component/publik/LembarArsip";
import { Button } from "@/component/ui/button";

/**
 * Lowongan bisa hilang dari halaman publik karena dua sebab yang sah:
 * sudah terisi/ditutup, atau ditarik ke moderasi. Keduanya bukan error —
 * jadi halamannya menjelaskan, bukan menyalahkan.
 */
export default function LowonganTidakDitemukan() {
  return (
    <LembarArsip>
      <SeksiArsip awal>
        <span className="flex size-16 items-center justify-center rounded-full bg-tanah-100">
          <FileSearch className="size-8 text-tanah-500" aria-hidden />
        </span>
        <h1 className="text-h1 mt-6 max-w-[22ch] text-balance">
          Lowongan ini sudah tidak tayang
        </h1>
        <p className="text-body-lg mt-4 max-w-[54ch] text-pretty text-tanah-600">
          Mungkin sudah terisi, ditutup pemberi kerjanya, atau sedang diperiksa
          ulang oleh Saringan Aman. Lowongan lain masih terbuka dan bisa Anda
          baca tanpa mendaftar.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <Link href="/lowongan">Lihat lowongan yang tayang</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </div>
      </SeksiArsip>
    </LembarArsip>
  );
}
