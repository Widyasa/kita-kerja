import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarClock,
  Eye,
  IdCard,
  Printer,
  ShieldCheck,
  Star,
} from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { LabelSection } from "@/component/bersama/LabelSection";
import { KartuKerjaVisual } from "@/component/kartu/KartuKerjaVisual";
import { ItemKeahlianKartu } from "@/component/kartu/ItemKeahlianKartu";
import { SakelarPublik } from "@/component/kartu/SakelarPublik";
import { TombolBagikan } from "@/component/kartu/TombolBagikan";
import { formatBulanTahun } from "@/component/kartu/format";
import { Button } from "@/component/ui/button";
import { createClient } from "@/lib/supabase/server-client";
import { getDashboardPekerja } from "@/lib/data/kartu-kerja";
import { formatTanggal, upahTeks } from "@/lib/mock/utils";
import type { LapisKepercayaan } from "@/lib/mock/types";
import { urlVerifikasiKartu } from "@/lib/kartu/url";

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
 *
 * Data asli dari Supabase (pengguna + kartu_kerja yang login). Pekerja baru
 * belum punya kartu yang terbit — ditangani sebagai halaman kosong yang
 * mengarahkan ke Ngobrol Kerja, bukan menampilkan kartu artefak kosong.
 */
export default async function HalamanKartuKerja() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dashboard = await getDashboardPekerja(user!.id);
  const { kartu, pengguna: pekerja } = dashboard;

  if (!kartu || !kartu.diterbitkan_pada) {
    return (
      <KeadaanKosong
        className="mt-6"
        ikon={IdCard}
        sebagaiJudulHalaman
        judul="Anda belum punya Kartu Kerja"
        penjelasan="Ceritakan pengalaman kerja Anda lewat Ngobrol Kerja — kira-kira 3 menit — dan Kartu Kerja Anda langsung terbit di sini."
        labelAksi="Mulai Ngobrol Kerja"
        hrefAksi="/worker/interview"
      />
    );
  }

  const token = kartu.token_publik;
  const urlVerifikasi = urlVerifikasiKartu(token);
  const namaPanggilan = pekerja.nama.split(" ")[0];

  const riwayatTerverifikasi = dashboard.riwayat;

  return (
    <div className="flex flex-col gap-16">
      {/* momen pembuka + kartu artefak — dua kolom di desktop */}
      <section className="grid grid-cols-[0.9fr_1.1fr] items-center gap-14 max-lg:grid-cols-1 max-lg:gap-10">
        <div>
          <LabelSection
            label={`Diterbitkan ${formatTanggal(kartu.diterbitkan_pada)}`}
          />
          <h1 className="mt-5 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.04] font-extrabold tracking-[-0.025em] text-balance">
            Ini Kartu Kerja Anda, {namaPanggilan}
          </h1>
          <p className="mt-4 max-w-[40ch] text-body-lg text-balance text-tanah-600">
            Semua kerja keras Anda selama {kartu.pengalaman_tahun} tahun
            tercatat rapi di sini — dan bisa Anda tunjukkan kepada siapa pun.
          </p>

          {/* tiga aksi besar — bertumpuk di kolom narasi (desktop),
              sejajar di HP tetap mudah dijangkau */}
          <div className="mt-10 flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="h-auto min-h-14 w-full px-4 py-2 text-label text-white whitespace-normal"
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
              className="h-auto min-h-14 w-full border-2 border-biru-600 px-4 py-2 text-label whitespace-normal text-biru-600 hover:bg-biru-50"
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
        </div>

        {/* kartu sebagai artefak fisik yang diselipkan miring */}
        <div className="lg:rotate-[1.25deg] lg:translate-x-2 motion-safe:lg:transition-transform motion-safe:lg:hover:rotate-0">
          <KartuKerjaVisual
            kartu={kartu}
            pekerja={pekerja}
            keahlian={dashboard.keahlian}
            jumlahPekerjaanSelesai={dashboard.statistik.jumlahPekerjaanSelesai}
            rataRataPenilaian={dashboard.statistik.rataRataPenilaian}
            jumlahPenilai={dashboard.statistik.jumlahPenilai}
            bidangNama={dashboard.bidangNama}
            wilayahNama={dashboard.wilayahNama}
            className="w-full"
          />
        </div>
      </section>

      {/* ringkasan angka — strip ledger rata kiri */}
      <section aria-label="Ringkasan Kartu Kerja">
        <div className="grid grid-cols-3 divide-x-2 divide-tanah-200 border-y-2 border-tanah-200 py-8 max-lg:py-6">
          <div className="px-8 first:pl-0 max-lg:px-3">
            <p className="text-[3.5rem] leading-none font-extrabold tracking-[-0.03em] text-biru-600 tabular-nums max-lg:text-[2.75rem]">
              {dashboard.statistik.jumlahPekerjaanSelesai}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-label text-tanah-600">
              <BriefcaseBusiness className="size-4" aria-hidden />
              pekerjaan selesai
            </p>
          </div>
          <div className="px-8 max-lg:px-3">
            <p className="text-[3.5rem] leading-none font-extrabold tracking-[-0.03em] text-kuning-800 tabular-nums max-lg:text-[2.75rem]">
              {dashboard.statistik.jumlahPenilai > 0
                ? dashboard.statistik.rataRataPenilaian.toFixed(1).replace(".", ",")
                : "—"}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-label text-tanah-600">
              <Star className="size-4 fill-kuning-500 text-kuning-500" aria-hidden />
              dari {dashboard.statistik.jumlahPenilai} penilai
            </p>
          </div>
          <div className="px-8 max-lg:px-3">
            <p className="text-[3.5rem] leading-none font-extrabold tracking-[-0.03em] tabular-nums max-lg:text-[2.75rem]">
              {kartu.pengalaman_tahun}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-label text-tanah-600">
              <CalendarClock className="size-4" aria-hidden />
              tahun pengalaman
            </p>
          </div>
        </div>
      </section>

      {/* keahlian per lapis kepercayaan — baris ledger dua kolom */}
      <section aria-label="Keahlian per lapis kepercayaan">
        <LabelSection label="Keahlian Anda" />
        <h2 className="text-h1 mt-4 max-w-[24ch] text-balance">
          Setiap keahlian punya lapis kepercayaannya sendiri
        </h2>
        <p className="mt-3 max-w-[52ch] text-body-lg text-balance text-tanah-600">
          Tidak semua dibuktikan dengan cara yang sama.
        </p>
        <div className="mt-10 flex flex-col divide-y-2 divide-tanah-200 border-y-2 border-tanah-200">
          {URUTAN_LAPIS.map(({ lapis, judul, penjelasan }) => {
            const daftar = dashboard.keahlian.filter((k) => k.lapis === lapis);
            if (daftar.length === 0) return null;
            return (
              <div
                key={lapis}
                className="grid grid-cols-[0.4fr_0.6fr] gap-10 py-10 max-lg:grid-cols-1 max-lg:gap-4 max-lg:py-8"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <BadgeLapis lapis={lapis} />
                    <h3 className="text-h3">{judul}</h3>
                  </div>
                  <p className="mt-2 text-body text-balance text-tanah-600">
                    {penjelasan}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {daftar.map((k) => (
                    <ItemKeahlianKartu key={k.id} keahlian={k} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* riwayat pekerjaan terverifikasi — ledger tanggal kiri */}
      <section aria-label="Riwayat pekerjaan terverifikasi">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-biru-600" aria-hidden />
          <h2 className="text-h2">Riwayat pekerjaan terverifikasi</h2>
        </div>
        <p className="mt-2 text-body text-tanah-600">
          Diselesaikan dan dikonfirmasi oleh kedua pihak.
        </p>
        {riwayatTerverifikasi.length > 0 ? (
          <ul className="mt-6 flex flex-col divide-y divide-tanah-200 border-y border-tanah-200">
            {riwayatTerverifikasi.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[10rem_1fr] items-baseline gap-6 py-4 max-lg:grid-cols-1 max-lg:gap-0.5"
              >
                <span className="font-mono text-label font-bold tracking-[0.04em] text-tanah-600 tabular-nums">
                  {formatBulanTahun(p.selesai_pada)}
                </span>
                <span className="text-body">
                  {p.lingkup}
                  <span className="text-tanah-600">
                    {" "}
                    · {upahTeks(p.upah_disepakati, p.satuan as "harian" | "bulanan" | "borongan" | "per_jam")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-body text-tanah-600">
            Belum ada pekerjaan yang selesai lewat aplikasi.
          </p>
        )}
      </section>

      {/* sakelar publik */}
      <section
        aria-label="Pengaturan kartu publik"
        className="rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1"
      >
        <SakelarPublik aktifAwal={kartu.aktif_publik} />
        <p className="mikro mt-4 border-t border-tanah-200 pt-4 text-tanah-500">
          Kartu ini milik Anda, bukan milik platform.
        </p>
      </section>
    </div>
  );
}
