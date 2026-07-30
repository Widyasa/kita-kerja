import Link from "next/link";
import { ArrowRight, Inbox, MapPin } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import {
  jarakTeks,
  lamaran,
  lowongan,
  pekerjaUtama,
  upahTeks,
  wilayah,
} from "@/lib/mock";

import { INFO_STATUS_LAMARAN } from "../status-lamaran";

/**
 * Lamaran (`/worker/applications`):
 * tiap butir menjelaskan arti status DAN langkah berikutnya
 * dalam satu kalimat. KeadaanKosong informatif bila kosong.
 */
export default function HalamanLamaran() {
  const milik = lamaran.filter((l) => l.pekerja_id === pekerjaUtama.id);

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
            const lw = lowongan.find((l) => l.id === lm.lowongan_id);
            if (!lw) return null;
            const wl = wilayah.find((w) => w.id === lw.wilayah_id)!;
            const info = INFO_STATUS_LAMARAN[lm.status];
            return (
              <li
                key={lm.id}
                className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-h3 text-tanah-900">{lw.judul_baku}</h2>
                  <span
                    className={`inline-flex items-center rounded-pill px-3 py-1 text-label font-semibold ${info.kelas}`}
                  >
                    {info.label}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-body text-tanah-600">
                  <MapPin className="size-5 shrink-0" aria-hidden />
                  {wl.nama} · {jarakTeks(lw.jarak_km)}
                </p>
                <p className="mt-1 text-body font-semibold text-tanah-900">
                  {upahTeks(lw.upah_ditawarkan, lw.satuan_upah)}
                </p>
                {/* Arti status + langkah berikutnya dalam satu kalimat */}
                <p className="mt-3 rounded-lg bg-tanah-50 p-3 text-body text-tanah-800">
                  {info.penjelasan}
                </p>
                <Link
                  href={`/worker/jobs/${lw.id}`}
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
