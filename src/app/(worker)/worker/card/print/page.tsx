import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { KartuSaku } from "@/component/kartu/KartuSaku";
import { LembarA5 } from "@/component/kartu/LembarA5";
import { PanelCetak } from "@/component/kartu/PanelCetak";
import {
  kartuWarto,
  keahlianWarto,
  pekerjaUtama,
  riwayatWarto,
  statistikWarto,
} from "@/lib/mock";

export const metadata: Metadata = {
  title: "Cetak Kartu Kerja — Kita Kerja",
};

/**
 * CSS cetak (Bagian 15.3) — sengaja inline di halaman ini agar tidak
 * menyentuh berkas gaya global yang dipakai halaman lain.
 * Ukuran mm dipertahankan PERSIS di media print.
 */
const CSS_CETAK = `
.kartu-saku { width: 85mm; height: 54mm; }
.lembar-a5 { width: 148mm; min-height: 210mm; }
@page { size: A4; margin: 10mm; }
@media print {
  nav, .tanpa-cetak { display: none !important; }
  main { max-width: none !important; padding: 0 !important; }
  .kartu-saku {
    width: 85mm; height: 54mm;
    break-inside: avoid;
    border: 0.3mm dashed #A69F92;
  }
  .lembar-a5 { width: 148mm; min-height: 210mm; break-inside: avoid; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

/**
 * /worker/card/print (Bagian 15.3) — dua ukuran cetak:
 * kartu saku 85×54mm (3 per lembar A4, garis potong putus-putus) dan
 * lembar A5 (riwayat lengkap). Layar menampilkan instruksi sederhana,
 * tombol cetak, dan pratinjau; media print menyembunyikan semua navigasi.
 */
export default function HalamanCetakKartu() {
  const propertiKartu = {
    kartu: kartuWarto,
    pekerja: pekerjaUtama,
    keahlian: keahlianWarto,
    jumlahPekerjaanSelesai: statistikWarto.jumlahPekerjaanSelesai,
    rataRataPenilaian: statistikWarto.rataRataPenilaian,
  };

  return (
    <div className="flex flex-col gap-8">
      <style dangerouslySetInnerHTML={{ __html: CSS_CETAK }} />

      <header className="tanpa-cetak">
        <Link
          href="/worker/card"
          className="inline-flex min-h-12 items-center gap-2 text-label text-biru-600 underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
        >
          <ArrowLeft className="size-5" aria-hidden />
          Kembali ke kartu
        </Link>
        <h1 className="mt-2 text-h1">Cetak Kartu Kerja</h1>
        <ol className="mt-3 flex list-decimal flex-col gap-1 pl-6 text-body text-tanah-700">
          <li>Pilih ukuran: kartu saku sebesar KTP, atau lembar A5 berisi riwayat lengkap.</li>
          <li>Tekan tombol &ldquo;Cetak sekarang&rdquo;.</li>
          <li>Di jendela cetak, pilih kertas A4 dan skala 100%.</li>
          <li>Gunting mengikuti garis putus-putus, lalu simpan di dompet.</li>
        </ol>
      </header>

      <PanelCetak
        kartuSaku={
          <div className="flex flex-col items-center gap-6 sm:items-start print:gap-[8mm]">
            {[0, 1, 2].map((i) => (
              <KartuSaku key={i} {...propertiKartu} />
            ))}
          </div>
        }
        lembarA5={
          <LembarA5
            {...propertiKartu}
            riwayat={riwayatWarto}
            jumlahPenilai={statistikWarto.jumlahPenilai}
          />
        }
      />
    </div>
  );
}
