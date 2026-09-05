"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Button } from "@/component/ui/button";
import { BadgeStatusLowongan } from "@/component/pemberi/BadgeStatusLowongan";
import { formatRupiah, formatTanggal } from "@/lib/mock/utils";
import type { RingkasLowongan } from "@/lib/data/pemberi";

const BATAS_AWAL = 10;

/**
 * Daftar lowongan dengan “Muat lebih banyak” — batas awal 10 agar daftar
 * panjang tetap mudah dipindai di ponsel.
 */
export function DaftarLowongan({
  lowongan,
}: Readonly<{ lowongan: RingkasLowongan[] }>) {
  const [batas, setBatas] = useState(BATAS_AWAL);
  const tampil = lowongan.slice(0, batas);
  const masihAda = lowongan.length > batas;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {tampil.map((l) => (
          <li key={l.id}>
            <Link
              href={`/employer/jobs/${l.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-50 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-h3">{l.judul_baku}</h2>
                <BadgeStatusLowongan status={l.status} />
                <span className="ml-auto flex items-center gap-1 text-label font-semibold text-biru-600">
                  Kelola
                  <ChevronRight className="size-4" aria-hidden />
                </span>
              </div>
              <p className="text-body text-tanah-600">
                {l.lokasi_teks ?? "Lokasi belum disebutkan"} · mulai{" "}
                {l.mulai ? formatTanggal(l.mulai) : "belum ditentukan"} ·{" "}
                {l.jumlah_calon > 0 ? (
                  <span className="font-semibold text-tanah-900">
                    {l.jumlah_calon} calon masuk
                  </span>
                ) : (
                  "belum ada calon"
                )}
              </p>
              <p className="text-label text-tanah-600">
                {l.upah_ditawarkan === null || l.satuan_upah === null
                  ? "Upah belum disebutkan"
                  : `Upah ${formatRupiah(l.upah_ditawarkan)} / ${
                      l.satuan_upah === "bulanan" ? "bulan" : l.satuan_upah
                    }`}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {masihAda ? (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-label text-tanah-500">
            Menampilkan {tampil.length} dari {lowongan.length} lowongan.
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setBatas((b) => b + BATAS_AWAL)}
          >
            Muat lebih banyak
          </Button>
        </div>
      ) : (
        lowongan.length > BATAS_AWAL && (
          <p className="pt-2 text-center text-label text-tanah-500">
            Menampilkan semua {lowongan.length} lowongan.
          </p>
        )
      )}
    </div>
  );
}
