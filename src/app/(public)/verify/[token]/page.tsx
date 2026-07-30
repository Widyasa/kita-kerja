import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Info,
  MapPin,
  ShieldCheck,
  ShieldQuestion,
  Star,
} from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import {
  bidangKerja,
  formatTanggal,
  inisialkanNamaBelakang,
  inisialNama,
  kartuWarto,
  keahlianBaku,
  keahlianWarto,
  pekerjaUtama,
  riwayatWarto,
  statistikWarto,
  wilayah,
  type KartuKeahlian,
  type LapisKepercayaan,
} from "@/lib/mock";

/**
 * Verifikasi publik `/verify/[token]` (Bagian 6.5).
 * Dibuka orang asing yang baru memindai QR dari selembar kertas — harus
 * dipahami dalam 5 detik, tanpa login, tanpa membocorkan data pribadi:
 * TIDAK PERNAH menampilkan nomor HP, alamat lengkap, atau audio.
 * Nama belakang diinisialkan. Token apa pun selain token kartu aktif
 * mendapat SATU halaman sopan yang seragam (kasus tidak dibedakan).
 */
export const metadata: Metadata = {
  title: "Verifikasi Kartu Kerja — Kita Kerja",
  robots: { index: false, follow: false },
};

const formatterBulan = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "numeric",
});

const URUTAN_LAPIS: LapisKepercayaan[] = ["terverifikasi", "dinilai", "diklaim"];

const JUDUL_LAPIS: Record<LapisKepercayaan, string> = {
  terverifikasi: "Keahlian terverifikasi",
  dinilai: "Keahlian yang dinilai pemberi kerja",
  diklaim: "Keahlian yang dinyatakan sendiri",
};

function namaKeahlian(k: KartuKeahlian): string {
  return (
    keahlianBaku.find((b) => b.id === k.keahlian_id)?.nama_baku ??
    k.nama_diajukan ??
    k.sebutan_pekerja
  );
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Hanya token kartu yang aktif publik yang menampilkan kartu.
  // Token lain APA PUN → halaman seragam yang sopan (jangan bedakan kasus).
  if (token !== kartuWarto.token_publik || !kartuWarto.aktif_publik) {
    return (
      <main className="mx-auto flex w-full max-w-(--max-worker) flex-col items-center gap-6 px-4 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-tanah-100 text-tanah-600">
          <ShieldQuestion className="size-8" aria-hidden />
        </span>
        <h1 className="text-h1 text-balance">
          Kartu tidak ditemukan atau sudah dinonaktifkan pemiliknya
        </h1>
        <p className="text-body-lg max-w-md text-balance text-tanah-600">
          Periksa kembali tautan yang Anda pindai, atau minta pemilik kartu
          membagikan tautan terbarunya.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-md px-4 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
        >
          Apa itu Kita Kerja?
        </Link>
      </main>
    );
  }

  const bidang = bidangKerja.find((b) => b.id === kartuWarto.bidang_utama_id);
  const wl = wilayah.find((w) => w.id === pekerjaUtama.wilayah_id);

  // Maksimal 5 pekerjaan terakhir yang DIKONFIRMASI KEDUA PIHAK,
  // tanpa nama pemberi kerja — yang ditampilkan: bulan, keahlian, lokasi.
  const pekerjaanTerakhir = riwayatWarto
    .filter((p) => p.dikonfirmasi_selesai_pekerja && p.dikonfirmasi_selesai_pemberi)
    .sort((a, b) => b.selesai_pada.localeCompare(a.selesai_pada))
    .slice(0, 5);

  return (
    <main className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-10 sm:py-12">
      {/* identitas — nama belakang diinisialkan */}
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-kuning-100 text-h2 font-bold text-kuning-800"
        >
          {inisialNama(pekerjaUtama.nama)}
        </span>
        <div>
          <h1 className="text-h1">{inisialkanNamaBelakang(pekerjaUtama.nama)}</h1>
          <p className="flex items-center gap-1.5 text-body text-tanah-600">
            <MapPin className="size-4" aria-hidden />
            {bidang?.nama ?? "—"} · {wl?.nama ?? "—"}
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

      {/* bukti angka — display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-tanah-0 p-5 text-center shadow-1">
          <p className="flex items-center gap-2 text-display text-biru-600 tabular-nums">
            <BriefcaseBusiness className="size-8" aria-hidden />
            {statistikWarto.jumlahPekerjaanSelesai}
          </p>
          <p className="text-label text-tanah-600">pekerjaan selesai</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-tanah-0 p-5 text-center shadow-1">
          <p className="flex items-center gap-2 text-display text-kuning-800 tabular-nums">
            <Star className="size-8 fill-kuning-500 text-kuning-500" aria-hidden />
            {statistikWarto.rataRataPenilaian.toFixed(1).replace(".", ",")}
          </p>
          <p className="text-label text-tanah-600">
            dari {statistikWarto.jumlahPenilai} penilai
          </p>
        </div>
      </div>

      {/* keahlian dikelompokkan per lapis kepercayaan */}
      <section className="flex flex-col gap-6">
        {URUTAN_LAPIS.map((lapis) => {
          const daftar = keahlianWarto.filter((k) => k.lapis === lapis);
          if (daftar.length === 0) return null;
          return (
            <div key={lapis} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <BadgeLapis lapis={lapis} />
                <h2 className="text-h3">{JUDUL_LAPIS[lapis]}</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {daftar.map((k) => (
                  <li
                    key={k.id}
                    className="rounded-lg bg-tanah-0 px-4 py-3 text-body font-semibold shadow-1"
                  >
                    {namaKeahlian(k)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* pekerjaan terakhir yang dikonfirmasi — tanpa nama pemberi kerja */}
      <section className="flex flex-col gap-3">
        <h2 className="text-h3">Pekerjaan terakhir yang dikonfirmasi</h2>
        <ul className="flex flex-col divide-y divide-tanah-200 rounded-xl bg-tanah-0 shadow-1">
          {pekerjaanTerakhir.map((p) => {
            const nama = keahlianBaku.find((b) => b.id === p.keahlian_id)?.nama_baku ?? "Pekerjaan";
            const lokasiKecil = p.judul.split(",").pop()?.trim();
            const wlKerja = wilayah.find((w) => w.id === p.wilayah_id);
            return (
              <li key={p.id} className="flex flex-col gap-0.5 px-4 py-3">
                <span className="text-body font-semibold">{nama}</span>
                <span className="text-label text-tanah-600">
                  {formatterBulan.format(new Date(p.selesai_pada))}
                  {lokasiKecil ? ` · ${lokasiKecil}` : ""}
                  {wlKerja ? `, ${wlKerja.nama}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* disclaimer jujur */}
      <div className="flex items-start gap-3 rounded-xl border border-tanah-200 bg-tanah-0 p-5">
        <Info className="mt-0.5 size-6 shrink-0 text-tanah-500" aria-hidden />
        <p className="text-body text-tanah-700">
          Kita Kerja menampilkan riwayat yang dikonfirmasi kedua pihak. Kami
          tidak menjamin hasil pekerjaan.
        </p>
      </div>

      <p className="text-center text-label text-tanah-500">
        Halaman ini dibagikan sendiri oleh pemilik kartu dan bisa dinonaktifkan
        kapan saja.{" "}
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
