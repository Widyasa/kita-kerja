import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleHelp,
  FileSearch,
  MapPin,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { PanelSaringanAman } from "@/component/bersama/PanelSaringanAman";
import { PenandaUpah } from "@/component/bersama/PenandaUpah";
import { createClient } from "@/lib/supabase/server-client";
import { detailLowonganUntukPekerja } from "@/lib/data/lowongan";
import { LABEL_VERIFIKASI } from "@/lib/data/types";
import {
  formatRupiah,
  formatTanggal,
  kalimatMetodeAcuan,
  upahTeks,
} from "@/lib/mock/utils";
import type { JenisKerja, SaringanAman } from "@/lib/mock/types";

import { TombolLamar } from "./tombol-lamar";

const LABEL_JENIS_KERJA: Record<JenisKerja, string> = {
  harian: "Harian",
  borongan: "Borongan",
  paruh_waktu: "Paruh waktu",
  menginap: "Menginap",
};

/**
 * Detail lowongan (`/worker/jobs/[id]`) — urutan PERSIS Bagian 6.7:
 * judul + wilayah → PenandaUpah (nominal acuan + kalimat metode)
 * → PanelSaringanAman (DI ATAS tombol lamar DAN di atas detail pekerjaan)
 * → alasan pencocokan → detail pekerjaan
 * → identitas & verifikasi pemberi kerja + rekam jejak faktual
 * → tombol lamar 56px.
 * Skor angka tidak pernah tampil.
 */
export default async function HalamanDetailLowongan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const detail = await detailLowonganUntukPekerja(id, user!.id);

  if (!detail) {
    return (
      <KeadaanKosong
        ikon={FileSearch}
        judul="Lowongan tidak ditemukan"
        penjelasan="Tautan ini mungkin sudah tidak berlaku atau lowongan sudah ditutup. Silakan lihat lowongan lain yang sedang tayang."
        labelAksi="Kembali ke daftar lowongan"
        hrefAksi="/worker/jobs"
      />
    );
  }

  const { lowongan: lw, pemberi, rekamJejakPemberi, sudahMelamar, kesepakatanId } = detail;

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Navigasi kembali">
        <Link
          href="/worker/jobs"
          className="inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
        >
          <ArrowLeft className="size-5" aria-hidden />
          Semua lowongan
        </Link>
      </nav>

      {/* 1. Judul + wilayah */}
      <header>
        <h1 className="text-h1 text-tanah-900">{lw.judul_baku}</h1>
        <p className="mt-2 flex items-center gap-2 text-body-lg text-tanah-600">
          <MapPin className="size-5 shrink-0" aria-hidden />
          {lw.lokasi_teks ?? lw.wilayah_nama ?? "Lokasi belum diisi"}
        </p>
        <p className="mt-2 text-h3 text-tanah-900">
          {lw.upah_ditawarkan !== null && lw.satuan_upah
            ? upahTeks(lw.upah_ditawarkan, lw.satuan_upah)
            : "Upah belum disebutkan"}
        </p>
      </header>

      {/* 2. PenandaUpah — nominal acuan + kalimat metode */}
      {lw.satuan_upah === "harian" && lw.acuan && lw.upah_ditawarkan !== null ? (
        <PenandaUpah
          ditawarkan={lw.upah_ditawarkan}
          acuan={lw.acuan}
          wilayahNama={lw.wilayah_nama ?? "wilayah ini"}
        />
      ) : (
        lw.acuan &&
        lw.wilayah_nama && (
          <div className="rounded-lg bg-biru-50 p-4">
            <p className="text-body text-tanah-900">
              Acuan harian Upah Terang untuk pekerjaan ini di{" "}
              {lw.wilayah_nama}:{" "}
              <span className="font-bold">
                {formatRupiah(lw.acuan.acuan_harian)} / hari
              </span>
            </p>
            <p className="mt-1 text-label text-tanah-600">
              {kalimatMetodeAcuan(lw.wilayah_nama)} Upah{" "}
              {lw.jenis_kerja
                ? LABEL_JENIS_KERJA[lw.jenis_kerja].toLowerCase()
                : "yang ditawarkan"}{" "}
              dibandingkan dengan acuan harian ini.
            </p>
          </div>
        )
      )}

      {/* 3. PanelSaringanAman — DI ATAS tombol lamar dan detail pekerjaan.
          Daftar pertanyaan yang disarankan adalah bagian paling menonjol. */}
      {/* PanelSaringanAman masih mengetik saringan penuh (SaringanAman) dari
          @/lib/mock; SaringanTampil (data layer baru) hanya membawa
          tingkat/temuan/pertanyaan_disarankan yang benar-benar dipakai
          komponen ini, jadi cast ini aman di runtime. TODO: perlonggar
          prop PanelSaringanAman ke SaringanTampil di task lanjutan. */}
      {lw.saringan && (
        <PanelSaringanAman saringan={lw.saringan as unknown as SaringanAman} />
      )}

      {/* 4. Alasan pencocokan — kalimat, bukan skor */}
      {lw.alasan_cocok && (
        <p className="flex items-start gap-2 rounded-lg bg-kuning-50 p-4 text-body text-tanah-800">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-kuning-600" aria-hidden />
          {lw.alasan_cocok}
        </p>
      )}

      {/* 5. Detail pekerjaan */}
      <section aria-labelledby="judul-detail" className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
        <h2 id="judul-detail" className="text-h2 text-tanah-900">
          Detail pekerjaan
        </h2>
        <dl className="mt-3 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-tanah-500" aria-hidden />
            <div>
              <dt className="text-label text-tanah-600">Jenis kerja</dt>
              <dd className="text-body font-semibold text-tanah-900">
                {lw.jenis_kerja ? LABEL_JENIS_KERJA[lw.jenis_kerja] : "Belum disebutkan"}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="mt-1 size-5 shrink-0 text-tanah-500" aria-hidden />
            <div>
              <dt className="text-label text-tanah-600">Jumlah pekerja dibutuhkan</dt>
              <dd className="text-body font-semibold text-tanah-900">
                {lw.jumlah_pekerja} orang
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-1 size-5 shrink-0 text-tanah-500" aria-hidden />
            <div>
              <dt className="text-label text-tanah-600">Mulai kerja</dt>
              <dd className="text-body font-semibold text-tanah-900">
                {lw.mulai ? formatTanggal(lw.mulai) : "Belum disebutkan"}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 size-5 shrink-0 text-tanah-500" aria-hidden />
            <div>
              <dt className="text-label text-tanah-600">Lokasi</dt>
              <dd className="text-body font-semibold text-tanah-900">
                {lw.lokasi_teks ?? "Belum disebutkan"}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      {/* 6. Pemberi kerja — identitas, verifikasi, rekam jejak FAKTUAL */}
      <section aria-labelledby="judul-pemberi" className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
        <h2 id="judul-pemberi" className="text-h2 text-tanah-900">
          Pemberi kerja
        </h2>
        <p className="mt-2 text-body font-bold text-tanah-900">
          {pemberi?.nama ?? "Pemberi kerja"}
        </p>
        <p className="mt-1 flex items-center gap-2 text-body text-tanah-700">
          {pemberi?.status_verifikasi === "belum" ? (
            <CircleHelp className="size-5 shrink-0 text-hati-600" aria-hidden />
          ) : (
            <ShieldCheck className="size-5 shrink-0 text-biru-600" aria-hidden />
          )}
          {LABEL_VERIFIKASI[pemberi?.status_verifikasi ?? "belum"]}
        </p>

        <h3 className="mt-4 text-label text-tanah-600">
          Rekam jejak di Kita Kerja
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          <li className="text-body text-tanah-900">
            <span className="font-bold">{rekamJejakPemberi.pekerjaan_selesai} pekerjaan</span>{" "}
            selesai dikonfirmasi dua pihak
          </li>
          <li className="flex items-center gap-2 text-body text-tanah-900">
            {rekamJejakPemberi.laporan_terbuka > 0 && (
              <TriangleAlert
                className="size-5 shrink-0 text-hati-600"
                aria-hidden
              />
            )}
            {rekamJejakPemberi.laporan_terbuka === 0 ? (
              "Tidak ada laporan masalah yang belum selesai"
            ) : (
              <span>
                <span className="font-bold">
                  {rekamJejakPemberi.laporan_terbuka} laporan masalah
                </span>{" "}
                belum selesai
              </span>
            )}
          </li>
        </ul>
      </section>

      {/* 7. Tombol lamar 56px */}
      {kesepakatanId ? (
        <div className="rounded-2xl border border-biru-600/30 bg-biru-50 p-5 text-center">
          <p className="text-body font-bold text-tanah-900">
            Lowongan ini sudah menjadi kesepakatan kerja Anda.
          </p>
          <Link
            href={`/worker/agreements/${kesepakatanId}`}
            className="mt-2 inline-flex min-h-12 items-center rounded-md px-2 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
          >
            Lihat kesepakatan
          </Link>
        </div>
      ) : (
        <TombolLamar
          lowonganId={lw.id}
          tingkat={lw.saringan?.tingkat ?? "aman"}
          pertanyaan={lw.saringan?.pertanyaan_disarankan ?? []}
          sudahMelamar={sudahMelamar}
        />
      )}
    </div>
  );
}
