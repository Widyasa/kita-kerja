import Link from "next/link";
import { ArrowRight, Inbox, MapPin } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { lamaranPekerja } from "@/lib/data/lamaran";
import { upahTeks } from "@/lib/mock/utils";

import { INFO_STATUS_LAMARAN } from "../status-lamaran";

/**
 * Lamaran (`/worker/applications`):
 * tiap butir menjelaskan arti status DAN langkah berikutnya
 * dalam satu kalimat. KeadaanKosong informatif bila kosong.
 */
export default async function HalamanLamaran() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const milik = await lamaranPekerja(user!.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-h1 text-tanah-900">Lamaran Anda</h1>
        <p className="mt-1 text-body-lg text-tanah-600">
          Pantau status tiap lamaran dan apa langkah Anda berikutnya.
        </p>
      </header>

      {milik.length === 0 ? (
        <KeadaanKosong
          ikon={Inbox}
          judul="Belum ada lamaran"
          penjelasan="Lamaran yang Anda kirim akan muncul di sini beserta statusnya. Mulai dengan melihat lowongan yang cocok dengan Kartu Kerja Anda."
          labelAksi="Lihat lowongan cocok"
          hrefAksi="/worker/jobs"
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {milik.map((lm) => {
            const info = INFO_STATUS_LAMARAN[lm.status];
            return (
              <li
                key={lm.id}
                className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-h3 text-tanah-900">{lm.judul_baku}</h2>
                  <span
                    className={`inline-flex items-center rounded-pill px-3 py-1 text-label font-semibold ${info.kelas}`}
                  >
                    {info.label}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-body text-tanah-600">
                  <MapPin className="size-5 shrink-0" aria-hidden />
                  {lm.lokasi_teks ?? lm.wilayah_nama ?? "Lokasi belum diisi"}
                </p>
                {lm.upah_ditawarkan !== null && lm.satuan_upah && (<p className="mt-1 text-body font-semibold text-tanah-900">{upahTeks(lm.upah_ditawarkan, lm.satuan_upah)}</p>)}
                {/* Arti status + langkah berikutnya dalam satu kalimat */}
                <p className="mt-3 rounded-lg bg-tanah-50 p-3 text-body text-tanah-800">
                  {info.penjelasan}
                </p>
                <Link
                  href={`/worker/jobs/${lm.lowongan_id}`}
                  className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
                >
                  Lihat lowongan
                  <ArrowRight className="size-5" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
