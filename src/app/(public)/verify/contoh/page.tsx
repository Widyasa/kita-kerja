import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Info, MapPin, ShieldCheck } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { LabelSection } from "@/component/bersama/LabelSection";
import { formatTanggal, inisialkanNamaBelakang, inisialNama } from "@/lib/mock/utils";
import {
  bidangKerja,
  keahlianBaku,
  keahlianWarto,
  kartuWarto,
  pekerjaUtama,
  statistikWarto,
  wilayah,
} from "@/lib/mock";
import type { LapisKepercayaan } from "@/lib/mock/types";

/**
 * `/verify/contoh` — contoh publik Kartu Kerja, disalin dari `/verify/[token]`
 * tapi dari data mock (bukan lookup Supabase). Beranda menautkan ke sini,
 * jadi halamannya harus selalu bisa dibuka — tidak boleh bergantung pada
 * apakah seed sudah dijalankan di project Supabase yang sedang aktif.
 * Static route ini cocok lebih dulu daripada `[token]` dinamis, jadi
 * "contoh" tidak pernah ditangkap sebagai token asli.
 */
export const metadata: Metadata = {
  title: "Contoh Kartu Kerja — Kita Kerja",
  robots: { index: false, follow: false },
};

const URUTAN_LAPIS: LapisKepercayaan[] = ["terverifikasi", "dinilai", "diklaim"];

const JUDUL_LAPIS: Record<LapisKepercayaan, string> = {
  terverifikasi: "Keahlian terverifikasi",
  dinilai: "Keahlian yang dinilai pemberi kerja",
  diklaim: "Keahlian yang dinyatakan sendiri",
};

export default function ContohKartuPage() {
  const bidangUtama = bidangKerja.find((b) => b.id === kartuWarto.bidang_utama_id);
  const wilayahPekerja = wilayah.find((w) => w.id === pekerjaUtama.wilayah_id);

  const keahlian = keahlianWarto
    .filter((k) => k.dikonfirmasi_pekerja)
    .map((k) => ({
      id: k.id,
      nama_tampil:
        keahlianBaku.find((kb) => kb.id === k.keahlian_id)?.nama_baku ??
        k.nama_diajukan ??
        k.sebutan_pekerja ??
        "Keahlian",
      lapis: k.lapis,
    }));

  return (
    <main className="mx-auto w-full max-w-5xl border-x border-tanah-200 px-14 py-16 max-lg max-lg:border-x-0 max-lg:px-4 max-lg:py-10">
      <div className="mb-10 rounded-xl bg-biru-50 p-5">
        <p className="text-body text-biru-900">
          Ini contoh Kartu Kerja untuk ditunjukkan — bukan kartu asli
          siapa pun.{" "}
          <Link
            href="/register"
            className="font-bold underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
          >
            Buat kartu Anda sendiri
          </Link>
          .
        </p>
      </div>

      {/* identitas + panel keaslian — dua kolom di desktop */}
      <div className="grid grid-cols-[1.1fr_0.9fr] items-end gap-12 max-lg:grid-cols-1 max-lg:gap-6">
        <div className="flex items-center gap-5">
          <span
            aria-hidden
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-kuning-100 text-h1 font-bold text-kuning-800 max-lg:size-16"
          >
            {inisialNama(pekerjaUtama.nama)}
          </span>
          <div>
            <LabelSection
              label={
                statistikWarto.jumlahPekerjaanSelesai > 0
                  ? "Kartu Kerja terverifikasi"
                  : "Kartu asli · belum ada riwayat terverifikasi"
              }
            />
            <h1 className="mt-3 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.04] font-extrabold tracking-[-0.025em] text-balance">
              {inisialkanNamaBelakang(pekerjaUtama.nama)}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-body-lg text-tanah-600">
              <MapPin className="size-4" aria-hidden />
              {bidangUtama?.nama ?? "—"} · {wilayahPekerja?.nama ?? "—"}
            </p>
          </div>
        </div>

        {/* panel keaslian */}
        <div className="flex items-start gap-3 rounded-xl bg-aman-50 p-5">
          <ShieldCheck className="mt-0.5 size-7 shrink-0 text-aman-600" aria-hidden />
          <div>
            <p className="text-h3 text-aman-600">Kartu ini asli dan masih berlaku</p>
            {kartuWarto.diterbitkan_pada && (
              <p className="text-label text-tanah-600">
                Diterbitkan {formatTanggal(kartuWarto.diterbitkan_pada)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* bukti angka — strip ledger rata kiri */}
      <div className="mt-14 grid grid-cols-2 divide-x-2 divide-tanah-200 border-y-2 border-tanah-200 py-8 max-lg:py-6">
        <div className="flex flex-col gap-2 pr-8 max-lg:pr-5">
          <p className="flex items-center gap-2 text-[4rem] leading-none font-extrabold tracking-[-0.03em] text-biru-600 tabular-nums max-lg:text-[3rem]">
            {statistikWarto.jumlahPekerjaanSelesai}
          </p>
          <p className="text-label flex items-center gap-1.5 text-tanah-600">
            <BriefcaseBusiness className="size-4" aria-hidden />
            pekerjaan selesai
          </p>
        </div>
        <div className="flex flex-col gap-2 px-8 max-lg:px-5">
          <p className="flex items-center gap-2 text-[4rem] leading-none font-extrabold tracking-[-0.03em] text-kuning-800 tabular-nums max-lg:text-[3rem]">
            {statistikWarto.jumlahPenilai > 0
              ? statistikWarto.rataRataPenilaian.toFixed(1).replace(".", ",")
              : "—"}
          </p>
          <p className="text-label flex items-center gap-1.5 text-tanah-600">
            <BriefcaseBusiness className="size-4" aria-hidden />
            dari {statistikWarto.jumlahPenilai} penilai
          </p>
        </div>
      </div>

      {/* keahlian dikelompokkan per lapis kepercayaan — baris ledger */}
      <section className="mt-14 flex flex-col divide-y-2 divide-tanah-200 border-y-2 border-tanah-200">
        {URUTAN_LAPIS.map((lapis) => {
          const daftar = keahlian.filter((k) => k.lapis === lapis);
          if (daftar.length === 0) return null;
          return (
            <div
              key={lapis}
              className="grid grid-cols-[0.4fr_0.6fr] gap-10 py-8 max-lg:grid-cols-1 max-lg:gap-3"
            >
              <div className="flex flex-wrap content-start items-center gap-3">
                <BadgeLapis lapis={lapis} />
                <h2 className="text-h3">{JUDUL_LAPIS[lapis]}</h2>
              </div>
              <ul className="flex flex-col divide-y divide-tanah-200">
                {daftar.map((k) => (
                  <li
                    key={k.id}
                    className="py-3 text-body font-semibold first:pt-0 last:pb-0 max-lg:py-3 max-lg:first:pt-3 max-lg:last:pb-3"
                  >
                    {k.nama_tampil}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* disclaimer jujur */}
      <div className="mt-14 flex items-start gap-3 rounded-xl border border-tanah-200 bg-tanah-0 p-5">
        <Info className="mt-0.5 size-6 shrink-0 text-tanah-500" aria-hidden />
        <p className="text-body text-tanah-700">
          Kita Kerja menampilkan riwayat yang dikonfirmasi kedua pihak. Kami
          tidak menjamin hasil pekerjaan.
        </p>
      </div>

      <p className="mt-10 border-t border-tanah-200 pt-6 text-center text-label text-tanah-500">
        Ini contoh — kartu asli dibagikan sendiri oleh pemiliknya.{" "}
        <Link
          href="/"
          className="font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
        >
          Apa itu Kita Kerja?
        </Link>
      </p>
    </main>
  );
}
