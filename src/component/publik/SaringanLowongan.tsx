import Link from "next/link";
import { Search, X } from "lucide-react";

import { Button } from "@/component/ui/button";
import { LABEL_JENIS_KERJA } from "@/component/pemberi/ekstraksi";
import type { WilayahPilihan } from "@/lib/data/lowongan-publik";
import type { JenisKerja } from "@/lib/mock/types";

/**
 * Penyaring daftar lowongan publik.
 *
 * Sengaja `<form method="get">` tanpa JavaScript: halaman ini dibuka pekerja
 * di ponsel murah dengan jaringan buruk, dan hasil penyaringan harus bisa
 * di-bookmark serta dibagikan sebagai URL. Tidak ada auto-submit on-change —
 * satu tombol eksplisit lebih mudah dipakai satu tangan.
 */

const GAYA_KENDALI =
  "h-12 w-full rounded-lg border border-tanah-300 bg-tanah-0 px-4 text-body text-tanah-900 " +
  "focus-visible:border-biru-600 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none";

export function SaringanLowongan({
  wilayah,
  terpilih,
  jumlahHasil,
}: Readonly<{
  wilayah: WilayahPilihan[];
  terpilih: { wilayah?: string; jenis?: string; q?: string };
  jumlahHasil: number;
}>) {
  const adaSaringan = Boolean(
    terpilih.wilayah || terpilih.jenis || terpilih.q,
  );

  return (
    <form
      method="get"
      action="/lowongan"
      className="border-y border-tanah-200 bg-tanah-0 p-5 sm:p-6"
      aria-label="Saring lowongan"
    >
      {/* Empat kolom baru muat di >=1024px. Di tablet 768px keempatnya
          menggencet select sampai nama wilayah terpotong, jadi di sana
          dipakai dua kolom. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label
            htmlFor="saring-q"
            className="mikro block text-tanah-500"
          >
            Cari pekerjaan
          </label>
          <input
            id="saring-q"
            name="q"
            type="search"
            defaultValue={terpilih.q ?? ""}
            placeholder="Tukang bangunan, ART, sopir…"
            className={`mt-2 ${GAYA_KENDALI} placeholder:text-tanah-500`}
          />
        </div>

        <div>
          <label
            htmlFor="saring-wilayah"
            className="mikro block text-tanah-500"
          >
            Wilayah
          </label>
          <select
            id="saring-wilayah"
            name="wilayah"
            defaultValue={terpilih.wilayah ?? ""}
            className={`mt-2 ${GAYA_KENDALI}`}
          >
            <option value="">Semua wilayah</option>
            {wilayah.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nama}, {w.provinsi}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="saring-jenis"
            className="mikro block text-tanah-500"
          >
            Jenis kerja
          </label>
          <select
            id="saring-jenis"
            name="jenis"
            defaultValue={terpilih.jenis ?? ""}
            className={`mt-2 ${GAYA_KENDALI}`}
          >
            <option value="">Semua jenis</option>
            {(Object.keys(LABEL_JENIS_KERJA) as JenisKerja[]).map((j) => (
              <option key={j} value={j}>
                {LABEL_JENIS_KERJA[j]}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full sm:col-span-2 sm:w-fit lg:col-span-1"
        >
          <Search aria-hidden />
          Saring
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-label text-tanah-600" aria-live="polite">
          {/* Penjelasan panjang untuk hasil kosong ada di keadaan kosong di
              bawah — baris ini cukup jadi penghitung. */}
          {jumlahHasil === 0
            ? "Belum ada hasil"
            : `${jumlahHasil} lowongan sedang tayang${
                adaSaringan ? " dengan saringan ini" : ""
              }`}
        </p>

        {adaSaringan && (
          <Link
            href="/lowongan"
            className="inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-label font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden />
            Hapus saringan
          </Link>
        )}
      </div>
    </form>
  );
}
