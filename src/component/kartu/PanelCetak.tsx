"use client";

import { useState } from "react";
import { CreditCard, FileText, Printer } from "lucide-react";

import { Button } from "@/component/ui/button";
import { cn } from "@/lib/utils";

type Ukuran = "saku" | "a5";

/**
 * PanelCetak — pengendali halaman cetak (client):
 * - Dua pilihan ukuran besar (toggle): kartu saku 85×54mm atau lembar A5.
 * - Tombol "Cetak sekarang" 56px memanggil window.print().
 * - Pratinjau menerima hasil render server (KartuSaku / LembarA5 berisi
 *   QrSvg dari server) lewat props — komponen server tetap di server.
 * Seluruh kontrol dibungkus .tanpa-cetak agar hilang saat mencetak.
 */
export function PanelCetak({
  kartuSaku,
  lembarA5,
}: {
  kartuSaku: React.ReactNode;
  lembarA5: React.ReactNode;
}) {
  const [ukuran, setUkuran] = useState<Ukuran>("saku");

  const pilihan: { id: Ukuran; ikon: typeof CreditCard; judul: string; keterangan: string }[] = [
    {
      id: "saku",
      ikon: CreditCard,
      judul: "Kartu saku",
      keterangan: "85 × 54 mm — sebesar KTP, 3 kartu per lembar",
    },
    {
      id: "a5",
      ikon: FileText,
      judul: "Lembar A5",
      keterangan: "Riwayat lengkap — semua keahlian + 10 pekerjaan terakhir",
    },
  ];

  return (
    <div>
      {/* pilihan ukuran */}
      <div
        role="group"
        aria-label="Pilih ukuran cetak"
        className="tanpa-cetak grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {pilihan.map(({ id, ikon: Ikon, judul, keterangan }) => (
          <button
            key={id}
            type="button"
            aria-pressed={ukuran === id}
            onClick={() => setUkuran(id)}
            className={cn(
              "flex min-h-14 cursor-pointer flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-colors duration-(--duration-fast)",
              "focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:ring-offset-2 focus-visible:outline-none",
              ukuran === id
                ? "border-biru-600 bg-biru-50 text-biru-800"
                : "border-tanah-300 bg-tanah-0 text-tanah-800 hover:bg-tanah-100",
            )}
          >
            <span className="flex items-center gap-2 text-button font-semibold">
              <Ikon className="size-5" aria-hidden />
              {judul}
            </span>
            <span className="text-label text-tanah-600">{keterangan}</span>
          </button>
        ))}
      </div>

      {/* tombol cetak */}
      <div className="tanpa-cetak mt-4">
        <Button
          size="lg"
          className="w-full"
          onClick={() => window.print()}
        >
          <Printer aria-hidden />
          Cetak sekarang
        </Button>
      </div>

      {/* pratinjau */}
      <div className="mt-8">
        <p aria-live="polite" className="tanpa-cetak mikro mb-4 text-tanah-500">
          Pratinjau {ukuran === "saku" ? "kartu saku (3 per lembar A4)" : "lembar A5"} — seperti yang akan tercetak
        </p>
        <div className="overflow-x-auto">{ukuran === "saku" ? kartuSaku : lembarA5}</div>
      </div>
    </div>
  );
}
