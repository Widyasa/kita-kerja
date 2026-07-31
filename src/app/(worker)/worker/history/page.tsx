import { House, Star } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { riwayatPekerja } from "@/lib/data/riwayat";
import { formatRupiah, formatTanggal, upahTeks } from "@/lib/mock/utils";

import { GrafikPenghasilan } from "./grafik-penghasilan";
import { LaporUpah } from "./lapor-upah";

const JUMLAH_RIWAYAT_TAMPIL = 10;

/**
 * Riwayat (`/worker/history`):
 * ringkasan total → grafik penghasilan 8 bulan terakhir (Recharts)
 * → daftar pekerjaan selesai dengan penilaian dan BadgeLapis
 * → ajakan lapor upah (kecil, tidak mengganggu).
 */
export default async function HalamanRiwayat() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pekerjaan: riwayat, totalPenghasilan: totalSemua, perBulan: dataGrafik } =
    await riwayatPekerja(user!.id);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-h1 text-tanah-900">Riwayat Kerja</h1>
        <p className="mt-1 text-body-lg text-tanah-600">
          Semua pekerjaan selesai Anda tercatat di sini dan memperkuat Kartu
          Kerja.
        </p>
      </header>

      {riwayat.length === 0 ? (
        <KeadaanKosong
          ikon={House}
          judul="Belum ada riwayat kerja"
          penjelasan="Setiap pekerjaan yang selesai dan dikonfirmasi kedua pihak akan tercatat otomatis di sini. Mulai dengan melamar lowongan yang cocok."
          labelAksi="Lihat lowongan"
          hrefAksi="/worker/jobs"
        />
      ) : (
        <>
          {/* Ringkasan total */}
          <section
            aria-label="Ringkasan"
            className="grid grid-cols-2 gap-3"
          >
            <div className="rounded-2xl border border-tanah-200 bg-tanah-0 p-4 shadow-1">
              <p className="text-label text-tanah-600">Pekerjaan selesai</p>
              <p className="mt-1 text-h2 font-bold text-tanah-900">
                {riwayat.length}
              </p>
            </div>
            <div className="rounded-2xl border border-tanah-200 bg-tanah-0 p-4 shadow-1">
              <p className="text-label text-tanah-600">Total penghasilan</p>
              <p className="mt-1 text-h2 font-bold text-biru-600">
                {formatRupiah(totalSemua)}
              </p>
            </div>
          </section>

          {/* Grafik penghasilan */}
          <section
            aria-labelledby="judul-grafik"
            className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
          >
            <h2 id="judul-grafik" className="text-h2 text-tanah-900">
              Penghasilan per bulan
            </h2>
            <p className="mt-1 text-body text-tanah-600">
              Total upah yang Anda terima tiap bulan, 8 bulan terakhir.
            </p>
            <div className="mt-4">
              <GrafikPenghasilan data={dataGrafik} />
            </div>
          </section>

          {/* Daftar riwayat */}
          <section aria-labelledby="judul-daftar">
            <h2 id="judul-daftar" className="text-h2 text-tanah-900">
              Pekerjaan terbaru
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {riwayat.slice(0, JUMLAH_RIWAYAT_TAMPIL).map((p) => {
                return (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-body font-bold text-tanah-900">
                        {p.judul}
                      </h3>
                      {p.dua_pihak && <BadgeLapis lapis="terverifikasi" />}
                    </div>
                    <p className="mt-1 text-label text-tanah-600">
                      {formatTanggal(p.selesai_pada)}
                      {p.wilayah_nama ? ` · ${p.wilayah_nama}` : ""} ·{" "}
                      {upahTeks(p.upah, p.satuan)}
                    </p>
                    {p.skor !== null && (
                      <div className="mt-3 rounded-lg bg-kuning-50 p-3">
                        <p className="flex items-center gap-2 text-label font-semibold text-kuning-800">
                          <Star
                            className="size-4 shrink-0 fill-kuning-500 text-kuning-500"
                            aria-hidden
                          />
                          Dinilai {p.skor} dari 5 oleh pemberi kerja
                        </p>
                        {p.catatan && (
                          <p className="mt-1 text-label text-tanah-700 italic">
                            &ldquo;{p.catatan}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {riwayat.length > JUMLAH_RIWAYAT_TAMPIL && (
              <p className="mt-3 text-center text-label text-tanah-500">
                Menampilkan {JUMLAH_RIWAYAT_TAMPIL} pekerjaan terbaru dari{" "}
                {riwayat.length}.
              </p>
            )}
          </section>

          {/* Ajakan lapor upah — kecil, tidak mengganggu */}
          <LaporUpah
            pekerjaanTerbaru={riwayat.slice(0, 5).map((p) => ({ id: p.id, judul: p.judul }))}
          />
        </>
      )}
    </div>
  );
}
