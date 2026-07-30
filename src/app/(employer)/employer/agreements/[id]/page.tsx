"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CircleCheck,
  Handshake,
  Search,
  Flag,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";
import {
  cariKesepakatanDhika,
  kesepakatanDhika,
} from "@/component/pemberi/mockPemberi";
import {
  formatRupiah,
  formatTanggal,
  inisialkanNamaBelakang,
  lowongan,
  pengguna,
} from "@/lib/mock";

/**
 * /employer/agreements/[id] — sisi pemberi kerja:
 * dokumen kesepakatan (tanggal bayar dijanjikan MENONJOL), LangkahOTP untuk
 * konfirmasi, dan penjelasan "Kesepakatan aktif".
 */
export default function HalamanKesepakatanPemberi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const k = cariKesepakatanDhika(id) ?? kesepakatanDhika[0];
  const [terkonfirmasi, setTerkonfirmasi] = useState(k.status === "berjalan");

  if (!k) {
    return (
      <KeadaanKosong
        ikon={Search}
        judul="Kesepakatan tidak ditemukan"
        penjelasan="Kembali ke dasbor untuk melihat kesepakatan Anda."
        labelAksi="Kembali ke dasbor"
        hrefAksi="/employer"
      />
    );
  }

  const pekerja = pengguna.find((p) => p.id === k.pekerja_id);
  const lwn = lowongan.find((l) => l.id === k.lowongan_id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-3 text-h1">
          <Handshake className="size-9 shrink-0 text-biru-600" aria-hidden />
          Kesepakatan kerja
        </h1>
        <p className="text-body-lg text-tanah-600">
          dengan {pekerja ? inisialkanNamaBelakang(pekerja.nama) : "pekerja"}
          {lwn ? ` — “${lwn.judul_baku}”` : ""}
        </p>
      </header>

      {/* dokumen kesepakatan */}
      <section
        aria-labelledby="judul-dokumen"
        className="flex flex-col gap-4 rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1"
      >
        <h2 id="judul-dokumen" className="text-h3">
          Isi kesepakatan
        </h2>
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-label text-tanah-600">Lingkup pekerjaan</dt>
            <dd className="text-body text-tanah-900">{k.lingkup}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-label text-tanah-600">Upah disepakati</dt>
              <dd className="text-body font-semibold">
                {formatRupiah(k.upah_disepakati)} /{" "}
                {k.satuan === "harian" ? "hari" : "bulan"}
              </dd>
            </div>
            <div>
              <dt className="text-label text-tanah-600">Mulai kerja</dt>
              <dd className="text-body font-semibold">{formatTanggal(k.mulai)}</dd>
            </div>
          </div>
        </dl>

        {/* tanggal bayar dijanjikan — MENONJOL */}
        <div className="rounded-xl border-2 border-biru-600 bg-biru-50 p-5">
          <p className="flex items-center gap-2 text-label font-semibold text-biru-900">
            <CalendarClock className="size-5" aria-hidden />
            Upah dijanjikan dibayar paling lambat
          </p>
          <p className="mt-1 text-h2 font-bold text-biru-900">
            {formatTanggal(k.tanggal_bayar_dijanjikan)}
          </p>
          <p className="mt-1 text-label text-tanah-600">
            Tanggal ini tercatat dan tidak bisa diubah sepihak — ini yang membuat
            pekerja berani menerima pekerjaan Anda.
          </p>
        </div>
      </section>

      {/* konfirmasi OTP atau penjelasan kesepakatan aktif */}
      {terkonfirmasi ? (
        <section
          aria-labelledby="judul-aktif"
          className="flex flex-col gap-4 rounded-2xl border border-aman-600/30 bg-aman-50 p-6"
        >
          <h2 id="judul-aktif" className="flex items-center gap-2 text-h3">
            <CircleCheck className="size-6 shrink-0 text-aman-600" aria-hidden />
            Kesepakatan aktif
          </h2>
          <p className="text-body text-tanah-900">
            Kedua pihak sudah mengonfirmasi dengan kode SMS. Isi kesepakatan
            di atas kini mengikat: pekerja wajib datang dan bekerja sesuai
            lingkup, Anda wajib membayar paling lambat tanggal yang dijanjikan.
          </p>
          <p className="text-body text-tanah-900">
            Setelah pekerjaan selesai, konfirmasi dan beri penilaian — penilaian
            Anda tampil di Kartu Kerja pekerja dan membantunya mendapat kerja
            berikutnya.
          </p>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={`/employer/complete/${k.id}`}>
              <Flag aria-hidden />
              Pekerjaan sudah selesai
            </Link>
          </Button>
        </section>
      ) : (
        <section
          aria-labelledby="judul-otp"
          className="flex flex-col gap-5 rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1"
        >
          <div>
            <h2 id="judul-otp" className="text-h3">
              Konfirmasi kesepakatan
            </h2>
            <p className="mt-1 text-body text-tanah-600">
              Masukkan kode 6 angka yang dikirim lewat SMS ke nomor Anda. Dengan
              memasukkan kode, Anda menyetujui isi kesepakatan di atas — termasuk
              tanggal bayar yang dijanjikan.
            </p>
          </div>
          <LangkahOTP onSelesai={() => setTerkonfirmasi(true)} />
        </section>
      )}
    </div>
  );
}
