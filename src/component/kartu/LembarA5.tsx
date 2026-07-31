import { Star } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { QrSvg } from "@/component/bersama/QrSvg";
import { cn } from "@/lib/utils";
import {
  bidangKerja,
  inisialNama,
  wilayah,
  type KartuKerja,
  type LapisKepercayaan,
  type Pengguna,
} from "@/lib/mock";
import type { KeahlianTampil } from "@/lib/data/types";
import type { RiwayatPekerjaanRingkas } from "@/lib/data/kartu-kerja";

import { formatBulanTahun, formatPenilaian } from "./format";

const URUTAN_LAPIS: { lapis: LapisKepercayaan; judul: string }[] = [
  { lapis: "terverifikasi", judul: "Terverifikasi" },
  { lapis: "dinilai", judul: "Dinilai" },
  { lapis: "diklaim", judul: "Diklaim" },
];

/**
 * LembarA5 (Bagian 15.3) — lembar riwayat lengkap ukuran A5.
 * Seluruh keahlian dikelompokkan per lapis kepercayaan (tetap beda visual
 * lewat BadgeLapis), sepuluh pekerjaan terakhir, QR lebih besar (30mm).
 * Komponen SERVER — QR sebagai SVG tajam dari server.
 */
export async function LembarA5({
  kartu,
  pekerja,
  keahlian,
  riwayat,
  jumlahPekerjaanSelesai,
  rataRataPenilaian,
  jumlahPenilai,
  bidangNama,
  wilayahNama,
  className,
}: {
  kartu: KartuKerja;
  pekerja: Pengguna;
  keahlian: KeahlianTampil[];
  riwayat: RiwayatPekerjaanRingkas[];
  jumlahPekerjaanSelesai: number;
  rataRataPenilaian: number;
  jumlahPenilai: number;
  /** override lookup mock — pakai ini kalau kartu berasal dari data Supabase asli */
  bidangNama?: string | null;
  wilayahNama?: string | null;
  className?: string;
}) {
  const bidang = bidangNama ?? bidangKerja.find((b) => b.id === kartu.bidang_utama_id)?.nama ?? null;
  const wl = wilayahNama ?? wilayah.find((w) => w.id === pekerja.wilayah_id)?.nama ?? null;
  const urlVerifikasi = `https://kita-kerja.example/verify/${kartu.token_publik}`;
  const urlPendek = `kk.id/v/${kartu.token_publik.slice(0, 6)}`;
  const sepuluhTerakhir = [...riwayat]
    .sort((a, b) => b.selesai_pada.localeCompare(a.selesai_pada))
    .slice(0, 10);

  return (
    <article
      aria-label={`Lembar riwayat ${pekerja.nama}`}
      className={cn(
        "lembar-a5 flex flex-col rounded-[2mm] border border-tanah-300 bg-tanah-0 p-[8mm]",
        className,
      )}
    >
      {/* kepala lembar */}
      <div className="flex items-start justify-between gap-[6mm]">
        <div className="min-w-0">
          <p className="text-[10pt] font-extrabold tracking-[0.14em] text-biru-700 uppercase">
            Kita Kerja
          </p>
          <div className="mt-[4mm] flex items-center gap-[4mm]">
            <span
              aria-hidden
              className="flex size-[16mm] shrink-0 items-center justify-center rounded-full bg-kuning-100 text-[14pt] font-bold text-kuning-800"
            >
              {inisialNama(pekerja.nama)}
            </span>
            <div>
              <h2 className="text-[16pt] leading-tight font-bold uppercase">
                {pekerja.nama}
              </h2>
              <p className="text-[11pt] text-tanah-700">
                {bidang ?? "—"} · {wl ?? "—"} · pengalaman{" "}
                {kartu.pengalaman_tahun} tahun
              </p>
              <p className="mt-[1mm] flex items-center gap-[1.5mm] text-[11pt] font-bold">
                {jumlahPekerjaanSelesai} pekerjaan selesai ·{" "}
                <Star
                  className="size-[4mm] fill-kuning-500 text-kuning-500"
                  aria-hidden
                />
                {jumlahPenilai > 0
                  ? `${formatPenilaian(rataRataPenilaian, jumlahPenilai)} dari ${jumlahPenilai} penilai`
                  : "Belum ada penilaian"}
              </p>
            </div>
          </div>
        </div>

        {/* QR lebih besar dari kartu saku, quiet zone putih */}
        <div className="shrink-0 rounded-[1mm] bg-tanah-0 p-[2mm] ring-1 ring-tanah-200">
          <QrSvg teks={urlVerifikasi} ukuran={114} className="size-[30mm]!" />
        </div>
      </div>

      {/* seluruh keahlian per lapis kepercayaan */}
      <section className="mt-[6mm]">
        <h3 className="text-[12pt] font-bold">Keahlian</h3>
        <div className="mt-[2mm] flex flex-col gap-[3mm]">
          {URUTAN_LAPIS.map(({ lapis, judul }) => {
            const daftar = keahlian.filter((k) => k.lapis === lapis);
            if (daftar.length === 0) return null;
            return (
              <div key={lapis}>
                <div className="flex items-center gap-[2mm]">
                  <BadgeLapis lapis={lapis} />
                  <span className="text-[10pt] font-semibold text-tanah-600">
                    {judul}
                  </span>
                </div>
                <ul className="mt-[1.5mm] flex flex-col gap-[1mm]">
                  {daftar.map((k) => (
                    <li
                      key={k.id}
                      className="flex items-baseline justify-between gap-[3mm] text-[11pt]"
                    >
                      <span className="font-semibold">{k.nama_tampil}</span>
                      <span className="text-[10pt] text-tanah-600 italic">
                        &ldquo;{k.sebutan_pekerja}&rdquo;
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* sepuluh pekerjaan terakhir */}
      <section className="mt-[6mm]">
        <h3 className="text-[12pt] font-bold">10 pekerjaan terakhir</h3>
        <ul className="mt-[2mm] flex flex-col gap-[1mm]">
          {sepuluhTerakhir.map((p) => (
            <li
              key={p.id}
              className="flex items-baseline gap-[3mm] text-[10.5pt]"
            >
              <span className="w-[16mm] shrink-0 font-semibold text-tanah-600">
                {formatBulanTahun(p.selesai_pada)}
              </span>
              <span>{p.lingkup}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* kaki lembar */}
      <p className="mt-auto pt-[6mm] text-[10pt] text-tanah-700">
        Pindai QR di atas untuk memeriksa keaslian kartu ini — tanpa perlu
        masuk akun. <span className="font-mono">{urlPendek}</span>
      </p>
    </article>
  );
}
