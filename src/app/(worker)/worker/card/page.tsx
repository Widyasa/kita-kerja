import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarClock,
  Eye,
  Printer,
  ShieldCheck,
  Star,
} from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { KartuKerjaVisual } from "@/component/kartu/KartuKerjaVisual";
import { ItemKeahlianKartu } from "@/component/kartu/ItemKeahlianKartu";
import { SakelarPublik } from "@/component/kartu/SakelarPublik";
import { TombolBagikan } from "@/component/kartu/TombolBagikan";
import { formatBulanTahun } from "@/component/kartu/format";
import { Button } from "@/component/ui/button";
import {
  formatTanggal,
  kartuWarto,
  keahlianWarto,
  pekerjaUtama,
  riwayatWarto,
  statistikWarto,
  wilayah,
  type LapisKepercayaan,
} from "@/lib/mock";

export const metadata: Metadata = {
  title: "Kartu Kerja Anda — Kita Kerja",
};

const URUTAN_LAPIS: {
  lapis: LapisKepercayaan;
  judul: string;
  penjelasan: string;
}[] = [
  {
    lapis: "terverifikasi",
    judul: "Terverifikasi",
    penjelasan:
      "Dibuktikan oleh pekerjaan selesai yang dikonfirmasi dua pihak — tidak dapat diubah.",
  },
  {
    lapis: "dinilai",
    judul: "Dinilai",
    penjelasan: "Sudah ada penilaian dari pemberi kerja.",
  },
  {
    lapis: "diklaim",
    judul: "Diklaim",
    penjelasan:
      "Dari cerita Anda sendiri — belum ada pekerjaan yang membuktikannya.",
  },
];

/**
 * /worker/card (Bagian 6.4) — puncak emosional produk.
 * Terasa seperti menerima sesuatu yang bernilai, bukan membuka profil.
 * Susunan: momen pembuka → kartu besar + QR → tiga aksi besar → ringkasan
 * angka → keahlian per lapis kepercayaan → riwayat terverifikasi → sakelar
 * publik dengan penjelasan konsekuensi satu kalimat.
 */
export default function HalamanKartuKerja() {
  const kartu = kartuWarto;
  const pekerja = pekerjaUtama;
  const token = kartu.token_publik;
  const urlVerifikasi = `https://kita-kerja.example/verify/${token}`;
  const namaPanggilan = pekerja.nama.split(" ")[0];

  const riwayatTerverifikasi = [...riwayatWarto]
    .filter((p) => p.dikonfirmasi_selesai_pekerja && p.dikonfirmasi_selesai_pemberi)
    .sort((a, b) => b.selesai_pada.localeCompare(a.selesai_pada))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      {/* momen pembuka */}
      <header>
        <p className="mikro text-kuning-700">
          Diterbitkan{" "}
          {kartu.diterbitkan_pada ? formatTanggal(kartu.diterbitkan_pada) : "—"}
        </p>
        <h1 className="mt-1 text-h1">
          Ini Kartu Kerja Anda, Pak {namaPanggilan}
        </h1>
        <p className="mt-2 text-body text-tanah-600">
          Semua kerja keras Anda selama {kartu.pengalaman_tahun} tahun tercatat
          rapi di sini — dan bisa Anda tunjukkan kepada siapa pun.
        </p>
      </header>

      {/* kartu besar + QR */}
      <KartuKerjaVisual
        kartu={kartu}
        pekerja={pekerja}
        keahlian={keahlianWarto}
        jumlahPekerjaanSelesai={statistikWarto.jumlahPekerjaanSelesai}
        rataRataPenilaian={statistikWarto.rataRataPenilaian}
        jumlahPenilai={statistikWarto.jumlahPenilai}
      />

      {/* tiga aksi besar 56px */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button
          asChild
          size="lg"
          className="h-auto min-h-14 px-3 py-2 text-center text-label leading-tight whitespace-normal"
        >
          <Link href="/worker/card/print">
            <Printer aria-hidden />
            Cetak kartu
          </Link>
        </Button>
        <TombolBagikan url={urlVerifikasi} namaPekerja={pekerja.nama} />
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-auto min-h-14 px-3 py-2 text-center text-label leading-tight whitespace-normal"
        >
          <a
            href={`/verify/${token}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Eye aria-hidden />
            Lihat seperti orang lain melihat
          </a>
        </Button>
      </div>

      {/* ringkasan angka */}
      <section aria-label="Ringkasan Kartu Kerja">
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-display">
              {statistikWarto.jumlahPekerjaanSelesai}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 text-label text-tanah-600">
              <BriefcaseBusiness className="size-4" aria-hidden />
              pekerjaan selesai
            </p>
          </div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-display">
              <Star
                className="size-7 fill-kuning-500 text-kuning-500"
                aria-hidden
              />
              {statistikWarto.rataRataPenilaian.toFixed(1).replace(".", ",")}
            </p>
            <p className="mt-1 text-label text-tanah-600">
              dari {statistikWarto.jumlahPenilai} penilai
            </p>
          </div>
          <div className="text-center">
            <p className="text-display">{kartu.pengalaman_tahun}</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-label text-tanah-600">
              <CalendarClock className="size-4" aria-hidden />
              tahun pengalaman
            </p>
          </div>
        </div>
      </section>

      {/* keahlian per lapis kepercayaan */}
      <section aria-label="Keahlian per lapis kepercayaan">
        <h2 className="text-h2">Keahlian Anda</h2>
        <p className="mt-1 text-body text-tanah-600">
          Setiap keahlian punya lapis kepercayaannya sendiri — tidak semua
          dibuktikan dengan cara yang sama.
        </p>
        <div className="mt-5 flex flex-col gap-8">
          {URUTAN_LAPIS.map(({ lapis, judul, penjelasan }) => {
            const daftar = keahlianWarto.filter((k) => k.lapis === lapis);
            if (daftar.length === 0) return null;
            return (
              <div key={lapis}>
                <div className="flex flex-wrap items-center gap-3">
                  <BadgeLapis lapis={lapis} />
                  <h3 className="text-h3">{judul}</h3>
                </div>
                <p className="mt-1 text-body text-tanah-600">{penjelasan}</p>
                <div className="mt-3 flex flex-col gap-3">
                  {daftar.map((k) => (
                    <ItemKeahlianKartu key={k.id} keahlian={k} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* riwayat pekerjaan terverifikasi */}
      <section aria-label="Riwayat pekerjaan terverifikasi">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-biru-600" aria-hidden />
          <h2 className="text-h2">Riwayat pekerjaan terverifikasi</h2>
        </div>
        <p className="mt-1 text-body text-tanah-600">
          Diselesaikan dan dikonfirmasi oleh kedua pihak.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {riwayatTerverifikasi.map((p) => {
            const wl = wilayah.find((w) => w.id === p.wilayah_id);
            return (
              <li
                key={p.id}
                className="rounded-xl border border-tanah-200 bg-tanah-0 px-4 py-3 text-body shadow-1"
              >
                <span className="font-semibold text-tanah-600">
                  {formatBulanTahun(p.selesai_pada)}
                </span>
                {" · "}
                {p.judul}
                {wl ? (
                  <span className="text-tanah-600"> · {wl.nama}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {/* sakelar publik */}
      <section
        aria-label="Pengaturan kartu publik"
        className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
      >
        <SakelarPublik aktifAwal={kartu.aktif_publik} />
        <p className="mikro mt-4 border-t border-tanah-200 pt-4 text-tanah-500">
          Kartu ini milik Anda, bukan milik platform.
        </p>
      </section>
    </div>
  );
}
