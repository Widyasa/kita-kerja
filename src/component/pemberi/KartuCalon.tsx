import Link from "next/link";
import {
  MapPin,
  ClipboardList,
  MessageCircleHeart,
  TriangleAlert,
  IdCard,
} from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { cn } from "@/lib/utils";
import { inisialkanNamaBelakang, inisialNama } from "@/lib/mock/utils";
import type { StatusLamaran } from "@/lib/mock/types";
import type { CalonTampil } from "@/lib/data/types";

const LABEL_STATUS_LAMARAN: Record<StatusLamaran, string> = {
  dilamar: "Melamar",
  diundang: "Diundang",
  ditolak: "Tidak diteruskan",
  disepakati: "Disepakati",
};

/**
 * KartuCalon — pratinjau Kartu Kerja calon untuk pemberi kerja.
 * - Nama (nama belakang disingkat), bidang, wilayah
 * - Keahlian per lapis kepercayaan (BadgeLapis)
 * - Alasan pencocokan SELALU dijelaskan ("Cocok karena…") — tanpa skor angka
 * - Rekam jejak faktual pekerja
 * - Aksi (Undang / buat kesepakatan) diserahkan lewat prop `aksi`
 */
export function KartuCalon({
  calon,
  aksi,
  className,
}: {
  calon: CalonTampil;
  aksi?: React.ReactNode;
  className?: string;
}) {
  const adaDasar = calon.alasan_cocok.length > 0;

  return (
    <article
      aria-label={`Calon pekerja ${calon.nama}`}
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1",
        className,
      )}
    >
      {/* identitas */}
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-kuning-100 text-h2 font-bold text-kuning-800"
        >
          {inisialNama(calon.nama)}
        </span>
        <div className="min-w-0">
          <h3 className="text-h3">{inisialkanNamaBelakang(calon.nama)}</h3>
          <p className="text-body text-tanah-600">
            {calon.bidang_nama ?? "Kartu Kerja belum diterbitkan"}
            {calon.pengalaman_tahun ? ` · pengalaman ${calon.pengalaman_tahun} tahun` : ""}
          </p>
          {calon.wilayah_nama && (
            <p className="flex items-center gap-1 text-label text-tanah-500">
              <MapPin className="size-4" aria-hidden />
              {calon.wilayah_nama}
            </p>
          )}
        </div>
        <span className="ml-auto inline-flex w-fit items-center rounded-pill bg-tanah-100 px-3 py-1 text-label font-semibold text-tanah-600">
          {LABEL_STATUS_LAMARAN[calon.status]}
        </span>
      </div>

      {/* keahlian per lapis kepercayaan */}
      {calon.keahlian.length > 0 && (
        <div>
          <p className="mikro text-tanah-500">Keahlian</p>
          <ul className="mt-2 flex flex-col gap-2">
            {calon.keahlian.slice(0, 3).map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-tanah-50 px-3 py-2"
              >
                <span className="text-body font-semibold">{k.nama_tampil}</span>
                <BadgeLapis lapis={k.lapis} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {calon.token_publik && (
        <Link
          href={`/verify/${calon.token_publik}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-md px-1 text-label font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
        >
          <IdCard className="size-4" aria-hidden />
          Lihat Kartu Kerja lengkap
        </Link>
      )}

      {/* alasan pencocokan — SELALU dijelaskan.
          BUG-039: sebelumnya kotak ini tetap dirender walau alasan_cocok
          kosong, sehingga pemberi kerja hanya melihat label "Cocok karena…"
          tanpa isi — padahal halaman menjanjikan "Setiap calon dijelaskan
          kenapa cocok". Sekarang keadaan kosong dijelaskan apa adanya.
          Issue #42: tanpa dasar pencocokan pakai latar hati (peringatan),
          bukan biru, agar bobot visual di atas CTA. */}
      <div
        className={cn(
          "rounded-lg p-4",
          adaDasar ? "bg-biru-50" : "border border-hati-600/25 bg-hati-50",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-2 text-body font-semibold",
            adaDasar ? "text-biru-900" : "text-tanah-900",
          )}
        >
          {adaDasar ? (
            <MessageCircleHeart className="size-5 shrink-0 text-biru-600" aria-hidden />
          ) : (
            <TriangleAlert className="size-5 shrink-0 text-hati-600" aria-hidden />
          )}
          {adaDasar ? "Cocok karena…" : "Belum ada dasar pencocokan"}
        </p>
        {adaDasar ? (
          <ul className="mt-2 flex flex-col gap-1">
            {calon.alasan_cocok.map((alasan, i) => (
              <li key={i} className="text-body text-tanah-900">
                · {alasan}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-body text-tanah-900">
            {calon.keahlian.length === 0
              ? "Pekerja ini belum menerbitkan Kartu Kerja, jadi keahliannya belum bisa dicocokkan. Tanyakan langsung pengalamannya sebelum memutuskan."
              : "Keahlian pekerja ini belum bertumpang tindih dengan kebutuhan lowongan. Tanyakan langsung pengalamannya sebelum memutuskan."}
          </p>
        )}
      </div>

      {/* rekam jejak faktual — tanpa skor angka */}
      <div>
        <p className="flex items-center gap-2 text-label font-semibold text-tanah-600">
          <ClipboardList className="size-4" aria-hidden />
          Rekam jejak
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          <li className="text-body text-tanah-700">
            · {calon.rekam_jejak.pekerjaan_selesai} pekerjaan selesai dikonfirmasi dua pihak.
          </li>
          <li className="text-body text-tanah-700">
            ·{" "}
            {calon.rekam_jejak.jumlah_penilai > 0
              ? `Rata-rata penilaian ${calon.rekam_jejak.rata_penilaian.toFixed(1).replace(".", ",")} dari ${calon.rekam_jejak.jumlah_penilai} penilai.`
              : "Belum ada penilaian dari pemberi kerja."}
          </li>
        </ul>
      </div>

      {aksi && <div className="flex flex-col gap-2 sm:flex-row">{aksi}</div>}
    </article>
  );
}
