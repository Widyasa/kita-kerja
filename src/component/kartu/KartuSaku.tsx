import { QrSvg } from "@/component/bersama/QrSvg";
import { cn } from "@/lib/utils";
import {
  bidangKerja,
  inisialNama,
  wilayah,
  type KartuKerja,
  type Pengguna,
} from "@/lib/mock";
import type { KeahlianTampil } from "@/lib/data/types";

import { namaPendekKeahlian } from "./format";

/**
 * KartuSaku (Bagian 15.3) — kartu cetak 85 × 54 mm, sebesar KTP.
 * Tiga kartu per lembar A4, garis potong putus-putus di media print
 * (kelas .kartu-saku diatur CSS cetak halaman /worker/card/print).
 *
 * Isi sesuai wireframe: KITA KERJA, avatar, nama KAPITAL, bidang, wilayah,
 * 3 keahlian, "47 pekerjaan selesai · ★ 4,8", QR >= 22mm dengan quiet zone
 * (lapis putih 2mm), "Pindai untuk memeriksa" + URL pendek.
 *
 * Komponen SERVER — QR sebagai SVG tajam dari server (QrSvg).
 * Ukuran di dalam kartu memakai mm/pt agar persis saat dicetak;
 * teks dijaga >= 9pt demi keterbacaan cetak di kartu sekecil KTP.
 */
export async function KartuSaku({
  kartu,
  pekerja,
  keahlian,
  jumlahPekerjaanSelesai,
  rataRataPenilaian,
  bidangNama,
  wilayahNama,
  className,
}: {
  kartu: KartuKerja;
  pekerja: Pengguna;
  keahlian: KeahlianTampil[];
  jumlahPekerjaanSelesai: number;
  rataRataPenilaian: number;
  /** override lookup mock — pakai ini kalau kartu berasal dari data Supabase asli */
  bidangNama?: string | null;
  wilayahNama?: string | null;
  className?: string;
}) {
  const bidang = bidangNama ?? bidangKerja.find((b) => b.id === kartu.bidang_utama_id)?.nama ?? null;
  const wl = wilayahNama ?? wilayah.find((w) => w.id === pekerja.wilayah_id)?.nama ?? null;
  const urlVerifikasi = `https://kita-kerja.example/verify/${kartu.token_publik}`;
  const urlPendek = `kk.id/v/${kartu.token_publik.slice(0, 6)}`;
  const tigaKeahlian = keahlian.slice(0, 3).map(namaPendekKeahlian).join(" · ");

  return (
    <article
      aria-label={`Kartu saku ${pekerja.nama}`}
      className={cn(
        "kartu-saku flex flex-col overflow-hidden rounded-[2mm] border border-tanah-300 bg-tanah-0 p-[3mm]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-[3mm]">
        {/* identitas */}
        <div className="min-w-0">
          <p className="text-[9pt] font-extrabold tracking-[0.14em] text-biru-700 uppercase">
            Kita Kerja
          </p>
          <div className="mt-[2mm] flex items-center gap-[2.5mm]">
            <span
              aria-hidden
              className="flex size-[12mm] shrink-0 items-center justify-center rounded-full bg-kuning-100 text-[11pt] font-bold text-kuning-800"
            >
              {inisialNama(pekerja.nama)}
            </span>
            <div>
              <h3 className="text-[12pt] leading-tight font-bold uppercase">
                {pekerja.nama}
              </h3>
              <p className="text-[10pt] leading-snug text-tanah-700">
                {bidang ?? "—"}
              </p>
              <p className="text-[10pt] leading-snug text-tanah-700">
                {wl ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* QR >= 22mm, quiet zone putih 2mm */}
        <div className="shrink-0 rounded-[1mm] bg-tanah-0 p-[2mm] ring-1 ring-tanah-200">
          <QrSvg teks={urlVerifikasi} ukuran={83} className="size-[22mm]!" />
        </div>
      </div>

      {/* 3 keahlian teratas */}
      <p className="mt-[2.5mm] text-[10pt] leading-snug font-semibold">
        {tigaKeahlian}
      </p>

      {/* bukti angka + ajakan memindai */}
      <div className="mt-auto flex items-end justify-between gap-[2mm] pt-[2mm]">
        <p className="text-[10pt] leading-snug font-bold">
          {jumlahPekerjaanSelesai} pekerjaan selesai · ★{" "}
          {rataRataPenilaian.toFixed(1).replace(".", ",")}
        </p>
        <p className="text-right text-[9pt] leading-tight text-tanah-700">
          Pindai untuk memeriksa
          <br />
          <span className="font-mono">{urlPendek}</span>
        </p>
      </div>
    </article>
  );
}
