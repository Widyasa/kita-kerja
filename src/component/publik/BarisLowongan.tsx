import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";

import { PenandaRisiko } from "@/component/bersama/PanelSaringanAman";
import { PenandaUpah } from "@/component/bersama/PenandaUpah";
import { LABEL_JENIS_KERJA } from "@/component/pemberi/ekstraksi";
import { cn } from "@/lib/utils";
import { formatTanggal, upahTeks } from "@/lib/mock/utils";
import type { LowonganPublik } from "@/lib/data/lowongan-publik";

/**
 * Satu baris lowongan di daftar publik.
 *
 * Sengaja BUKAN kartu: daftar publik dibaca seperti baris ledger dalam arsip —
 * dipisahkan garis tipis, bukan kotak bertumpuk. Kartu sudah dipakai di dalam
 * aplikasi (`KartuLowongan`); di permukaan publik kartu akan mengulang bentuk
 * yang sama berkali-kali tanpa menambah makna.
 *
 * Tidak menampilkan alasan pencocokan — publik belum punya profil untuk
 * dicocokkan — dan tidak pernah menampilkan skor angka apa pun.
 */
export function BarisLowongan({
  lowongan: lw,
  className,
}: Readonly<{ lowongan: LowonganPublik; className?: string }>) {
  const lokasi = lw.lokasi_teks ?? lw.wilayah_nama ?? "Lokasi belum diisi";
  const adaUpah = lw.upah_ditawarkan !== null && lw.satuan_upah !== null;

  return (
    <Link
      href={`/lowongan/${lw.id}`}
      className={cn(
        "group grid grid-cols-1 items-start gap-x-10 gap-y-5 rounded-lg py-7",
        "sm:grid-cols-[minmax(0,1fr)_auto]",
        "focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-h3 text-balance text-tanah-900 underline-offset-4 group-hover:text-biru-600 group-hover:underline">
          {lw.judul_baku}
        </h3>

        <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-tanah-600">
          <li className="flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-tanah-500" aria-hidden />
            <span className="truncate">{lokasi}</span>
          </li>
          {lw.jenis_kerja && (
            <li className="flex items-center gap-2">
              <Users className="size-4 shrink-0 text-tanah-500" aria-hidden />
              {LABEL_JENIS_KERJA[lw.jenis_kerja]}
              {lw.jumlah_pekerja > 1 && ` · ${lw.jumlah_pekerja} orang`}
            </li>
          )}
          {lw.mulai && (
            <li className="flex items-center gap-2">
              <CalendarDays
                className="size-4 shrink-0 text-tanah-500"
                aria-hidden
              />
              Mulai {formatTanggal(lw.mulai)}
            </li>
          )}
        </ul>

        {lw.keahlian_nama.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {lw.keahlian_nama.map((nama) => (
              <li
                key={nama}
                className="rounded-pill border border-tanah-200 bg-tanah-0 px-3 py-1 text-label text-tanah-700"
              >
                {nama}
              </li>
            ))}
          </ul>
        )}

        {lw.satuan_upah === "harian" &&
          lw.acuan &&
          lw.upah_ditawarkan !== null && (
            <PenandaUpah
              ringkas
              className="mt-4"
              ditawarkan={lw.upah_ditawarkan}
              acuan={lw.acuan}
              wilayahNama={lw.wilayah_nama ?? "wilayah ini"}
            />
          )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:flex-col sm:items-end sm:text-right">
        <p
          className={cn(
            "text-h3 tabular-nums text-tanah-900",
            !adaUpah && "text-label font-semibold text-tanah-500",
          )}
        >
          {adaUpah
            ? upahTeks(lw.upah_ditawarkan!, lw.satuan_upah!)
            : "Upah belum disebutkan"}
        </p>

        {lw.saringan && <PenandaRisiko tingkat={lw.saringan.tingkat} />}

        <span className="ml-auto flex items-center gap-1 text-label font-bold text-biru-600 sm:ml-0 sm:mt-1">
          Lihat detail
          <ArrowUpRight
            className="size-4 motion-safe:transition-transform motion-safe:duration-(--duration-fast) motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
