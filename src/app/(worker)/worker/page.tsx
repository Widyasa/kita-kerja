import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  Handshake,
  IdCard,
  Inbox,
} from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { KartuLowongan } from "@/component/pekerja/KartuLowongan";
import { createClient } from "@/lib/supabase/server-client";
import { getDashboardPekerja } from "@/lib/data/kartu-kerja";
import { kesepakatanAktifPekerja } from "@/lib/data/kesepakatan";
import { lamaranPekerja } from "@/lib/data/lamaran";
import { daftarLowonganUntukPekerja } from "@/lib/data/lowongan";
import { formatTanggal, upahTeks } from "@/lib/mock";

import { SapaanWaktu } from "@/component/bersama/SapaanWaktu";
import { INFO_STATUS_LAMARAN } from "./status-lamaran";

/**
 * Beranda pekerja (`/worker`):
 * sapaan → status Kartu Kerja → kesepakatan aktif (menonjol, tanggal bayar)
 * → lowongan yang cocok → lamaran berjalan.
 *
 * Seluruh bagian memakai data asli Supabase.
 */
export default async function HalamanBerandaPekerja() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dashboard = await getDashboardPekerja(user!.id);
  const kartuSudahTerbit = !!dashboard.kartu?.diterbitkan_pada;

  const kesepakatanAktif = await kesepakatanAktifPekerja(user!.id);
  const lamaranPekerjaIni = await lamaranPekerja(user!.id);
  const lamaranTeratas = lamaranPekerjaIni.slice(0, 3);

  const { lowongan: lowonganCocok, idSudahDilamar: idSudahDilamarAsli } =
    await daftarLowonganUntukPekerja(user!.id);
  const teratas = lowonganCocok
    .filter((l) => !idSudahDilamarAsli.has(l.id))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-10">
      {/* Sapaan */}
      <header>
        <SapaanWaktu nama={dashboard.pengguna.nama} />
        <p className="mt-1 text-body-lg text-tanah-600">
          Ini kabar pekerjaan Anda hari ini.
        </p>
      </header>

      {/* Kesepakatan aktif — paling menonjol bila ada */}
      {kesepakatanAktif && (
        <section
          aria-labelledby="judul-kesepakatan"
          className="rounded-2xl border-2 border-biru-600 bg-biru-50 p-5 shadow-2"
        >
          <h2
            id="judul-kesepakatan"
            className="flex items-center gap-2 text-h3 text-biru-900"
          >
            <Handshake className="size-6 shrink-0 text-biru-600" aria-hidden />
            Kesepakatan sedang berjalan
          </h2>
          <p className="mt-2 text-body text-tanah-800">
            {kesepakatanAktif.judul_lowongan ?? "Pekerjaan"}
            {kesepakatanAktif.lokasi_teks ? `, ${kesepakatanAktif.lokasi_teks}` : ""} ·{" "}
            {upahTeks(kesepakatanAktif.upah_disepakati, kesepakatanAktif.satuan)}
          </p>
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-tanah-0 p-3 text-body font-bold text-tanah-900 shadow-1">
            <CalendarCheck
              className="size-5 shrink-0 text-biru-600"
              aria-hidden
            />
            Upah dijanjikan dibayar{" "}
            {formatTanggal(kesepakatanAktif.tanggal_bayar_dijanjikan)}
          </p>
          <Link
            href={`/worker/agreements/${kesepakatanAktif.id}`}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
          >
            Lihat kesepakatan
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </section>
      )}

      {/* Status Kartu Kerja */}
      <section aria-labelledby="judul-kartu">
        <h2 id="judul-kartu" className="text-h2 text-tanah-900">
          Kartu Kerja Anda
        </h2>
        {kartuSudahTerbit ? (
          <Link
            href="/worker/card"
            className="mt-3 block rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1 transition-shadow duration-(--duration-fast) hover:shadow-2 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
          >
            <p className="flex items-center gap-2 text-h3 text-tanah-900">
              <IdCard className="size-6 shrink-0 text-biru-600" aria-hidden />
              Kartu aktif
            </p>
            <p className="mt-2 text-body text-tanah-600">
              {dashboard.statistik.jumlahPekerjaanSelesai} pekerjaan selesai ·{" "}
              {dashboard.keahlian.length} keahlian · pengalaman{" "}
              {dashboard.kartu!.pengalaman_tahun} tahun
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-body font-bold text-biru-600">
              Lihat Kartu Kerja
              <ArrowRight className="size-5" aria-hidden />
            </p>
          </Link>
        ) : (
          <KeadaanKosong
            className="mt-3"
            ikon={IdCard}
            judul="Anda belum punya Kartu Kerja"
            penjelasan="Ceritakan pengalaman kerja Anda lewat Ngobrol Kerja — kira-kira 3 menit — dan Kartu Kerja Anda langsung terbit."
            labelAksi="Mulai Ngobrol Kerja"
            hrefAksi="/worker/interview"
          />
        )}
      </section>

      {/* Lowongan yang cocok */}
      <section aria-labelledby="judul-cocok">
        <h2 id="judul-cocok" className="text-h2 text-tanah-900">
          Lowongan yang cocok untuk Anda
        </h2>
        {teratas.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-4">
            {teratas.map((lw) => (
              <li key={lw.id}>
                <KartuLowongan lowongan={lw} href={`/worker/jobs/${lw.id}`} />
              </li>
            ))}
          </ul>
        ) : (
          <KeadaanKosong
            className="mt-3"
            ikon={BriefcaseBusiness}
            judul="Belum ada lowongan baru yang cocok"
            penjelasan="Lowongan baru diperiksa setiap hari. Sementara itu, Anda bisa melihat semua lowongan yang sedang tayang."
            labelAksi="Lihat semua lowongan"
            hrefAksi="/worker/jobs"
          />
        )}
        {teratas.length > 0 && (
          <Link
            href="/worker/jobs"
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
          >
            Lihat semua lowongan
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        )}
      </section>

      {/* Lamaran berjalan */}
      <section aria-labelledby="judul-lamaran">
        <h2 id="judul-lamaran" className="text-h2 text-tanah-900">
          Lamaran berjalan
        </h2>
        {lamaranTeratas.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-3">
            {lamaranTeratas.map((lm) => {
              const info = INFO_STATUS_LAMARAN[lm.status];
              return (
                <li
                  key={lm.id}
                  className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-body font-bold text-tanah-900">
                      {lm.judul_baku}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-pill px-3 py-1 text-label font-semibold ${info.kelas}`}
                    >
                      {info.label}
                    </span>
                  </div>
                  <p className="mt-2 text-label text-tanah-600">
                    {info.penjelasan}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <KeadaanKosong
            className="mt-3"
            ikon={Inbox}
            judul="Belum ada lamaran"
            penjelasan="Lamaran yang Anda kirim akan muncul di sini. Mulai dengan melihat lowongan yang cocok dengan Kartu Kerja Anda."
            labelAksi="Lihat lowongan cocok"
            hrefAksi="/worker/jobs"
          />
        )}
        {lamaranTeratas.length > 0 && (
          <Link
            href="/worker/applications"
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
          >
            Lihat semua lamaran
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        )}
      </section>
    </div>
  );
}
