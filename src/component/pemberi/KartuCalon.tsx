import { MapPin, ClipboardList, MessageCircleHeart } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { cn } from "@/lib/utils";
import {
  bidangKerja,
  inisialkanNamaBelakang,
  inisialNama,
  keahlianBaku,
  wilayah,
} from "@/lib/mock";
import { LABEL_STATUS_LAMARAN, type CalonPemberi } from "./mockPemberi";

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
  calon: CalonPemberi;
  aksi?: React.ReactNode;
  className?: string;
}) {
  const { pekerja, kartu, keahlian, lamaran, rekamJejak } = calon;
  const bidang = bidangKerja.find((b) => b.id === kartu?.bidang_utama_id);
  const wl = wilayah.find((w) => w.id === pekerja.wilayah_id);

  return (
    <article
      aria-label={`Calon pekerja ${pekerja.nama}`}
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
          {inisialNama(pekerja.nama)}
        </span>
        <div className="min-w-0">
          <h3 className="text-h3">{inisialkanNamaBelakang(pekerja.nama)}</h3>
          <p className="text-body text-tanah-600">
            {bidang?.nama ?? "Kartu Kerja belum diterbitkan"}
            {kartu ? ` · pengalaman ${kartu.pengalaman_tahun} tahun` : ""}
          </p>
          {wl && (
            <p className="flex items-center gap-1 text-label text-tanah-500">
              <MapPin className="size-4" aria-hidden />
              {wl.nama}
            </p>
          )}
        </div>
        <span className="ml-auto inline-flex w-fit items-center rounded-pill bg-tanah-100 px-3 py-1 text-label font-semibold text-tanah-600">
          {LABEL_STATUS_LAMARAN[lamaran.status]}
        </span>
      </div>

      {/* keahlian per lapis kepercayaan */}
      {keahlian.length > 0 && (
        <div>
          <p className="mikro text-tanah-500">Keahlian</p>
          <ul className="mt-2 flex flex-col gap-2">
            {keahlian.slice(0, 3).map((k) => {
              const baku = keahlianBaku.find((b) => b.id === k.keahlian_id);
              return (
                <li
                  key={k.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-tanah-50 px-3 py-2"
                >
                  <span className="text-body font-semibold">
                    {baku?.nama_baku ?? k.nama_diajukan ?? k.sebutan_pekerja}
                  </span>
                  <BadgeLapis lapis={k.lapis} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* alasan pencocokan — SELALU dijelaskan */}
      <div className="rounded-lg bg-biru-50 p-4">
        <p className="flex items-center gap-2 text-body font-semibold text-biru-900">
          <MessageCircleHeart className="size-5 shrink-0 text-biru-600" aria-hidden />
          Cocok karena…
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {lamaran.alasan_cocok.map((alasan, i) => (
            <li key={i} className="text-body text-tanah-900">
              · {alasan}
            </li>
          ))}
        </ul>
      </div>

      {/* rekam jejak faktual — tanpa skor angka */}
      <div>
        <p className="flex items-center gap-2 text-label font-semibold text-tanah-600">
          <ClipboardList className="size-4" aria-hidden />
          Rekam jejak
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {rekamJejak.map((r, i) => (
            <li key={i} className="text-body text-tanah-700">
              · {r}
            </li>
          ))}
        </ul>
      </div>

      {aksi && <div className="flex flex-col gap-2 sm:flex-row">{aksi}</div>}
    </article>
  );
}
