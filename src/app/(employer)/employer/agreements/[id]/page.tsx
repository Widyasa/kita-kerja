import { CalendarClock, Handshake, Search } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { kesepakatanUntukPihak } from "@/lib/data/kesepakatan";
import { formatRupiah, formatTanggal } from "@/lib/mock";

import { AksiOtp } from "./aksi-otp";

/**
 * /employer/agreements/[id] — sisi pemberi kerja:
 * dokumen kesepakatan (tanggal bayar dijanjikan MENONJOL), konfirmasi OTP,
 * dan penjelasan "Kesepakatan aktif".
 */
export default async function HalamanKesepakatanPemberi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const k = await kesepakatanUntukPihak(id, user!.id);

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-3 text-h1">
          <Handshake className="size-9 shrink-0 text-biru-600" aria-hidden />
          Kesepakatan kerja
        </h1>
        <p className="text-body-lg text-tanah-600">
          dengan {k.nama_pekerja}
          {k.judul_lowongan ? ` — "${k.judul_lowongan}"` : ""}
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
              <dd className="text-body font-semibold">
                {k.mulai ? formatTanggal(k.mulai) : "Belum ditentukan"}
              </dd>
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

      <AksiOtp
        kesepakatanId={k.id}
        sudahOtp={k.otp_pemberi_sudah || k.status === "berjalan"}
      />
    </div>
  );
}
