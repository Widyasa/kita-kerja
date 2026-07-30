import { BriefcaseBusiness, Star, MapPin } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { QrSvg } from "@/component/bersama/QrSvg";
import { cn } from "@/lib/utils";
import {
  bidangKerja,
  inisialkanNamaBelakang,
  inisialNama,
  wilayah,
  type KartuKerja,
  type Pengguna,
} from "@/lib/mock";
import type { KeahlianTampil } from "@/lib/data/types";

/**
 * KartuKerjaVisual (Bagian 4.5) — representasi digital Kartu Kerja.
 * Dirancang seperti ARTEFAK bernilai (kartu fisik yang bisa dicetak),
 * bukan profil web: bingkai tegas, QR tajam, token mono, nomor seri.
 * Komponen SERVER (QR dibuat di server lewat QrSvg).
 *
 * Kontras: semua teks tanah-900/tanah-700/tanah-600 di atas tanah-0 (>= 6,9:1).
 */
export function KartuKerjaVisual({
  kartu,
  pekerja,
  keahlian,
  jumlahPekerjaanSelesai,
  rataRataPenilaian,
  jumlahPenilai,
  bidangNama,
  wilayahNama,
  className,
}: {
  kartu: KartuKerja;
  pekerja: Pengguna;
  /** sudah diurut, 3 teratas yang ditampilkan */
  keahlian: KeahlianTampil[];
  jumlahPekerjaanSelesai: number;
  rataRataPenilaian: number;
  jumlahPenilai: number;
  /** override lookup mock — pakai ini kalau kartu berasal dari data Supabase asli */
  bidangNama?: string | null;
  wilayahNama?: string | null;
  className?: string;
}) {
  const namaBidang = bidangNama ?? bidangKerja.find((b) => b.id === kartu.bidang_utama_id)?.nama ?? null;
  const namaWilayah = wilayahNama ?? wilayah.find((w) => w.id === pekerja.wilayah_id)?.nama ?? null;
  const urlVerifikasi = `https://kita-kerja.example/verify/${kartu.token_publik}`;

  return (
    <article
      aria-label={`Kartu Kerja ${pekerja.nama}`}
      className={cn(
        "overflow-hidden rounded-2xl border border-tanah-200 bg-tanah-0 shadow-3",
        className,
      )}
    >
      {/* pita kepala kartu */}
      <div className="flex items-center justify-between bg-biru-600 px-5 py-3 text-tanah-0">
        <p className="mikro">Kartu Kerja</p>
        <p className="mikro">Kita Kerja</p>
      </div>

      <div className="p-5">
        {/* identitas */}
        <div className="flex items-center gap-4">
          {/* avatar inisial hangat — tidak perlu foto asli */}
          <span
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-kuning-100 text-h2 font-bold text-kuning-800"
          >
            {inisialNama(pekerja.nama)}
          </span>
          <div>
            <h3 className="text-h2">{inisialkanNamaBelakang(pekerja.nama)}</h3>
            <p className="text-body text-tanah-600">{namaBidang ?? "—"}</p>
            {namaWilayah && (
              <p className="flex items-center gap-1 text-label text-tanah-500">
                <MapPin className="size-4" aria-hidden />
                {namaWilayah} · pengalaman {kartu.pengalaman_tahun} tahun
              </p>
            )}
          </div>
        </div>

        {/* tiga keahlian teratas */}
        <div className="mt-5">
          <p className="mikro text-tanah-500">Keahlian utama</p>
          <ul className="mt-2 flex flex-col gap-2">
            {keahlian.slice(0, 3).map((k) => (
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

        {/* bukti angka */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-tanah-50 p-3 text-center">
            <p className="flex items-center justify-center gap-1 text-h3">
              <BriefcaseBusiness className="size-5 text-biru-600" aria-hidden />
              {jumlahPekerjaanSelesai}
            </p>
            <p className="text-label text-tanah-600">pekerjaan selesai</p>
          </div>
          <div className="rounded-lg bg-tanah-50 p-3 text-center">
            <p className="flex items-center justify-center gap-1 text-h3">
              <Star className="size-5 fill-kuning-500 text-kuning-500" aria-hidden />
              {rataRataPenilaian.toFixed(1).replace(".", ",")}
            </p>
            <p className="text-label text-tanah-600">dari {jumlahPenilai} penilai</p>
          </div>
        </div>

        {/* QR + token */}
        <div className="mt-5 flex items-center gap-4 rounded-xl border border-dashed border-tanah-300 p-4">
          <QrSvg teks={urlVerifikasi} ukuran={96} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-label text-tanah-700">
              Pindai untuk memeriksa keaslian kartu ini — tanpa perlu masuk akun.
            </p>
            <p className="mt-2 font-mono text-label break-all text-tanah-500">
              {kartu.token_publik}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
