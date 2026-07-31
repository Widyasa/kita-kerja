import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Lock,
  MapPin,
  Mic,
  Users,
} from "lucide-react";

import { PanelSaringanAman } from "@/component/bersama/PanelSaringanAman";
import { PenandaUpah } from "@/component/bersama/PenandaUpah";
import { LabelSection } from "@/component/bersama/LabelSection";
import { LABEL_JENIS_KERJA } from "@/component/pemberi/ekstraksi";
import { LembarArsip, SeksiArsip } from "@/component/publik/LembarArsip";
import { Button } from "@/component/ui/button";
import { detailLowonganPublik } from "@/lib/data/lowongan-publik";
import {
  formatRupiah,
  formatTanggal,
  kalimatMetodeAcuan,
  upahTeks,
} from "@/lib/mock/utils";
import type { SaringanAman } from "@/lib/mock/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lw = await detailLowonganPublik(id);
  if (!lw) return { title: "Lowongan tidak ditemukan — Kita Kerja" };

  const lokasi = lw.lokasi_teks ?? lw.wilayah_nama;
  return {
    title: `${lw.judul_baku}${lokasi ? ` di ${lokasi}` : ""} — Kita Kerja`,
    description:
      lw.upah_ditawarkan !== null && lw.satuan_upah
        ? `${upahTeks(lw.upah_ditawarkan, lw.satuan_upah)}. Sudah diperiksa Saringan Aman dan dibandingkan dengan acuan Upah Terang.`
        : "Lowongan kerja informal yang sudah diperiksa Saringan Aman di Kita Kerja.",
  };
}

/**
 * Detail lowongan publik (`/lowongan/[id]`) — HANYA BACA.
 *
 * Urutan mengikuti Bagian 6.7 seperti halaman pekerja: upah dulu, lalu
 * Saringan Aman DI ATAS ajakan bertindak, baru detail pekerjaan. Alasannya
 * sama — orang harus melihat peringatan sebelum melihat tombol.
 *
 * Bedanya dengan `/worker/jobs/[id]`:
 * - tidak ada identitas maupun rekam jejak pemberi kerja (tabel `pengguna` dan
 *   RPC rekam jejak memang tertutup untuk anon — itu disengaja, bukan celah);
 * - tidak ada tombol lamar; melamar butuh Kartu Kerja, jadi CTA-nya mendaftar.
 */
export default async function HalamanDetailLowonganPublik({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lw = await detailLowonganPublik(id);
  if (!lw) notFound();

  const lokasi = lw.lokasi_teks ?? lw.wilayah_nama ?? "Lokasi belum diisi";
  const adaUpah = lw.upah_ditawarkan !== null && lw.satuan_upah !== null;

  const rincian = [
    lw.jenis_kerja && {
      ikon: Users,
      label: "Jenis kerja",
      nilai: `${LABEL_JENIS_KERJA[lw.jenis_kerja]}${
        lw.jumlah_pekerja > 1 ? ` · butuh ${lw.jumlah_pekerja} orang` : ""
      }`,
    },
    lw.mulai && {
      ikon: CalendarDays,
      label: "Mulai kerja",
      nilai: formatTanggal(lw.mulai),
    },
    {
      ikon: MapPin,
      label: "Lokasi",
      nilai: lw.provinsi_nama ? `${lokasi} · ${lw.provinsi_nama}` : lokasi,
    },
  ].filter(Boolean) as {
    ikon: typeof Users;
    label: string;
    nilai: string;
  }[];

  return (
    <LembarArsip>
      {/* ============ JUDUL ============ */}
      <SeksiArsip awal ruang="kustom" className="pt-8 pb-10 sm:pt-10 sm:pb-12">
        <nav aria-label="Navigasi kembali">
          <Link
            href="/lowongan"
            className="text-label -ml-2 inline-flex min-h-12 items-center gap-2 rounded-md px-2 font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
          >
            <ArrowLeft className="size-5" aria-hidden />
            Semua lowongan
          </Link>
        </nav>

        <h1 className="mt-6 max-w-[20ch] text-[clamp(1.875rem,3.6vw,3rem)] leading-[1.06] font-extrabold tracking-[-0.03em] text-balance text-tanah-900">
          {lw.judul_baku}
        </h1>

        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {rincian.map((r) => (
            <div key={r.label}>
              <dt className="mikro text-tanah-500">{r.label}</dt>
              <dd className="text-body mt-2 flex items-start gap-2 text-tanah-900">
                <r.ikon
                  className="mt-1 size-5 shrink-0 text-tanah-500"
                  aria-hidden
                />
                <span className="min-w-0">{r.nilai}</span>
              </dd>
            </div>
          ))}
          <div>
            <dt className="mikro text-tanah-500">Upah ditawarkan</dt>
            <dd
              className={
                adaUpah
                  ? "text-h2 mt-2 tabular-nums text-tanah-900"
                  : "text-body mt-2 text-tanah-600"
              }
            >
              {adaUpah
                ? upahTeks(lw.upah_ditawarkan!, lw.satuan_upah!)
                : "Belum disebutkan"}
            </dd>
          </div>
        </dl>
      </SeksiArsip>

      {/* ============ UPAH TERANG ============ */}
      {lw.acuan && (
        <SeksiArsip ruang="rapat" aria-labelledby="judul-upah">
          <LabelSection label="Upah Terang" />
          <h2 id="judul-upah" className="sr-only">
            Perbandingan upah dengan acuan wilayah
          </h2>
          {lw.satuan_upah === "harian" && lw.upah_ditawarkan !== null ? (
            <PenandaUpah
              className="mt-5"
              ditawarkan={lw.upah_ditawarkan}
              acuan={lw.acuan}
              wilayahNama={lw.wilayah_nama ?? "wilayah ini"}
            />
          ) : (
            <div className="mt-5 rounded-lg bg-biru-50 p-4">
              <p className="text-body text-tanah-900">
                Acuan harian untuk pekerjaan seperti ini di{" "}
                {lw.wilayah_nama ?? "wilayah ini"}:{" "}
                <span className="font-bold tabular-nums">
                  {formatRupiah(lw.acuan.acuan_harian)} / hari
                </span>
              </p>
              <p className="text-label mt-1 text-tanah-600">
                {kalimatMetodeAcuan(lw.wilayah_nama ?? "wilayah ini")} Angka ini
                dihitung dari UMK, bukan dari AI.
              </p>
            </div>
          )}
        </SeksiArsip>
      )}

      {/* ============ SARINGAN AMAN — selalu di atas ajakan bertindak ============ */}
      {lw.saringan && (
        <SeksiArsip ruang="rapat" terang>
          <LabelSection label="Saringan Aman" />
          {/* PanelSaringanAman masih mengetik SaringanAman penuh dari @/lib/mock;
              SaringanTampil hanya membawa tingkat/temuan/pertanyaan_disarankan —
              persis field yang dipakai komponen ini, jadi cast aman di runtime. */}
          <PanelSaringanAman
            className="mt-5"
            saringan={lw.saringan as unknown as SaringanAman}
          />
        </SeksiArsip>
      )}

      {/* ============ RINCIAN PEKERJAAN ============ */}
      <SeksiArsip ruang="rapat" aria-labelledby="judul-rincian">
        <LabelSection label="Rincian pekerjaan" />
        <h2 id="judul-rincian" className="text-h1 mt-4 text-balance">
          Apa yang diminta
        </h2>

        <div className="mt-8 grid gap-x-14 gap-y-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h3 className="mikro text-tanah-500">Keahlian yang dicari</h3>
            {lw.keahlian_nama.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {lw.keahlian_nama.map((nama) => (
                  <li
                    key={nama}
                    className="text-label rounded-pill border border-biru-200 bg-biru-50 px-4 py-1.5 text-biru-900"
                  >
                    {nama}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body mt-4 text-tanah-600">
                Pemberi kerja belum menyebut keahlian tertentu.
              </p>
            )}

            {lw.syarat_tersirat.length > 0 && (
              <>
                <h3 className="mikro mt-10 text-tanah-500">
                  Syarat yang tersirat di teksnya
                </h3>
                <ul className="mt-4 divide-y divide-tanah-200 border-y border-tanah-200">
                  {lw.syarat_tersirat.map((s) => (
                    <li
                      key={s}
                      className="text-body flex items-start gap-3 py-3 text-tanah-800"
                    >
                      <ClipboardList
                        className="mt-1 size-5 shrink-0 text-tanah-500"
                        aria-hidden
                      />
                      <span className="min-w-0">{s}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Teks asli — arsip: ditampilkan apa adanya supaya pembaca bisa
              memeriksa sendiri temuan Saringan Aman terhadap sumbernya. */}
          <div>
            <h3 className="mikro text-tanah-500">
              Teks asli dari pemberi kerja
            </h3>
            <blockquote className="mt-4 border border-tanah-200 bg-tanah-50 p-5 sm:p-6">
              <p className="text-body whitespace-pre-line text-pretty text-tanah-800 italic">
                {lw.teks_asli}
              </p>
            </blockquote>
            <p className="text-label mt-3 text-tanah-600">
              Kita Kerja tidak mengubah kalimat pemberi kerja. Judul dan
              keahlian di atas adalah hasil pembacaan otomatis dari teks ini.
            </p>
          </div>
        </div>
      </SeksiArsip>

      {/* ============ GERBANG — apa yang butuh masuk ============ */}
      <SeksiArsip terang aria-labelledby="judul-gerbang">
        <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-label flex items-center gap-2 font-bold text-tanah-600">
              <Lock className="size-5 shrink-0 text-tanah-500" aria-hidden />
              Butuh Kartu Kerja
            </p>
            <h2 id="judul-gerbang" className="text-h1 mt-4 max-w-[22ch] text-balance">
              Melamar dan melihat rekam jejak pemberi kerja butuh akun
            </h2>
            <p className="text-body-lg mt-5 max-w-[50ch] text-pretty text-tanah-600">
              Setelah punya Kartu Kerja, Anda bisa melihat berapa pekerjaan yang
              sudah diselesaikan pemberi kerja ini, apakah ada laporan terbuka
              terhadapnya, dan melamar langsung dari halaman ini.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild variant="aksen" size="lg">
              <Link href="/register">
                <Mic aria-hidden />
                Buat Kartu Kerja
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sudah punya akun</Link>
            </Button>
          </div>
        </div>
      </SeksiArsip>
    </LembarArsip>
  );
}
