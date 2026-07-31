import { notFound } from "next/navigation";
import { Inbox, House } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { PenandaUpah } from "@/component/bersama/PenandaUpah";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { SpandukLuring } from "@/component/bersama/SpandukLuring";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";
import { PanelSaringanAman } from "@/component/bersama/PanelSaringanAman";
import { NavBawahPekerja } from "@/component/bersama/NavBawahPekerja";
import { NavPemberi } from "@/component/bersama/NavPemberi";
import { TombolRekam } from "@/component/pekerja/TombolRekam";
import { KartuPertanyaan } from "@/component/pekerja/KartuPertanyaan";
import { KartuKeahlian } from "@/component/pekerja/KartuKeahlian";
import { KartuLowongan } from "@/component/pekerja/KartuLowongan";
import { KartuKerjaVisual } from "@/component/kartu/KartuKerjaVisual";
import {
  acuanUntuk,
  keahlianBaku,
  keahlianWarto,
  kartuWarto,
  lowongan,
  pekerjaUtama,
  putaranWawancaraWarto,
  saringanAman,
  statistikWarto,
  wilayah,
  type Lowongan,
  type KartuKeahlian as TKartuKeahlianMock,
} from "@/lib/mock";
import type { KeahlianTampil, LowonganTampil } from "@/lib/data/types";

/**
 * Halaman katalog komponen — untuk juri dan pengembang.
 * Menampilkan SELURUH katalog Bagian 4.5 dengan data mock.
 * Hanya aktif bila DEMO_MODE=true; selain itu 404.
 */

/**
 * Adaptor lokal — halaman ini hanya menampilkan sampel data mock untuk QA
 * visual (bukan data pengguna asli), jadi ia mengubah bentuk mock lama
 * menjadi bentuk *Tampil yang diharapkan komponen bersama.
 */
function keahlianTampilDariMock(k: TKartuKeahlianMock): KeahlianTampil {
  return {
    id: k.id,
    keahlian_id: k.keahlian_id,
    nama_tampil:
      keahlianBaku.find((kb) => kb.id === k.keahlian_id)?.nama_baku ??
      k.nama_diajukan ??
      k.sebutan_pekerja,
    sebutan_pekerja: k.sebutan_pekerja,
    level: k.level,
    kutipan_bukti: k.kutipan_bukti,
    sumber: k.sumber,
    dikonfirmasi_pekerja: k.dikonfirmasi_pekerja,
    lapis: k.lapis,
  };
}

function lowonganTampilDariMock(l: Lowongan): LowonganTampil {
  const wl = wilayah.find((w) => w.id === l.wilayah_id);
  const sa = saringanAman.find((s) => s.lowongan_id === l.id) ?? null;
  const keahlianId = l.keahlian_ids[0];
  const acuan =
    keahlianId && l.satuan_upah === "harian"
      ? acuanUntuk(keahlianId, l.wilayah_id)
      : null;
  return {
    id: l.id,
    judul_baku: l.judul_baku,
    teks_asli: l.teks_asli,
    status: l.status,
    jenis_kerja: l.jenis_kerja,
    jumlah_pekerja: l.jumlah_pekerja,
    upah_ditawarkan: l.upah_ditawarkan,
    satuan_upah: l.satuan_upah,
    lokasi_teks: l.lokasi_teks,
    mulai: l.mulai,
    syarat_tersirat: l.syarat_tersirat,
    wilayah_id: l.wilayah_id,
    wilayah_nama: wl?.nama ?? null,
    pemberi_kerja_id: l.pemberi_kerja_id,
    saringan: sa,
    acuan,
    alasan_cocok: l.alasan_cocok,
  };
}

function Bagian({
  judul,
  deskripsi,
  children,
}: {
  judul: string;
  deskripsi: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-tanah-200 pb-12">
      <div>
        <h2 className="text-h2 text-biru-600">{judul}</h2>
        <p className="text-body text-tanah-600">{deskripsi}</p>
      </div>
      {children}
    </section>
  );
}

export default function HalamanKatalogKomponen() {
  if (process.env.DEMO_MODE !== "true") notFound();

  const wlMalang = wilayah.find((w) => w.id === "wl-kota-malang")!;
  const acuanKeramik = acuanUntuk("kb-keramik", "wl-kota-malang");
  const lwAman = lowongan.find((l) => l.id === "lw-01")!;
  const lwHati = lowongan.find((l) => l.id === "lw-10")!;
  const lwBahaya = lowongan.find((l) => l.id === "lw-13")!;
  const saAman = saringanAman.find((s) => s.lowongan_id === "lw-01")!;
  const saHati = saringanAman.find((s) => s.lowongan_id === "lw-12")!;
  const saBahaya = saringanAman.find((s) => s.lowongan_id === "lw-13")!;
  const putaran3 = putaranWawancaraWarto[2];

  return (
    <main className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-12 px-4 py-10">
      <header>
        <p className="mikro font-mono tracking-[0.18em] text-kuning-700">Demo — hanya untuk juri</p>
        <h1 className="text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.02em] text-balance">Katalog Komponen Kita Kerja</h1>
        <p className="text-body-lg text-tanah-600">
          Seluruh komponen Bagian 4.5 dengan data mock Pak Warto Sugianto.
          Besar, jelas, hangat, dan tenang.
        </p>
      </header>

      <Bagian
        judul="BadgeLapis — tiga lapis kepercayaan"
        deskripsi="Terverifikasi, Dinilai, dan Diklaim tidak pernah tampil dengan gaya yang sama. Selalu ikon + teks."
      >
        <div className="flex flex-wrap items-center gap-3">
          <BadgeLapis lapis="terverifikasi" />
          <BadgeLapis lapis="dinilai" />
          <BadgeLapis lapis="diklaim" />
        </div>
      </Bagian>

      <Bagian
        judul="PenandaUpah — tiga keadaan"
        deskripsi="Selalu menampilkan nominal acuan dan satu kalimat metode. Angka dihitung deterministik dari UMK, bukan AI."
      >
        <PenandaUpah ditawarkan={180000} acuan={acuanKeramik} wilayahNama={wlMalang.nama} />
        <PenandaUpah ditawarkan={155000} acuan={acuanKeramik} wilayahNama={wlMalang.nama} />
        <PenandaUpah ditawarkan={120000} acuan={acuanKeramik} wilayahNama={wlMalang.nama} />
      </Bagian>

      <Bagian
        judul="TombolRekam — dua mode"
        deskripsi="88px, mikrofon asli (getUserMedia + MediaRecorder) dengan gelombang simulasi bila izin ditolak. Kiri: tekan-tahan. Kanan: ketuk untuk mulai/selesai."
      >
        <div className="grid gap-8 rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1 sm:grid-cols-2">
          <TombolRekam mode="tahan" />
          <TombolRekam mode="ketuk" />
        </div>
      </Bagian>

      <Bagian
        judul="KartuPertanyaan"
        deskripsi="Satu pertanyaan per layar, indikator titik — bukan persen."
      >
        <KartuPertanyaan
          nomor={putaran3.nomor}
          total={putaranWawancaraWarto.length}
          pertanyaan={putaran3.pertanyaan}
        />
      </Bagian>

      <Bagian
        judul="KartuKeahlian"
        deskripsi="Nama baku, sebutan asli dalam tanda kutip, penanda level, BadgeLapis, kutipan bukti buka-tutup, tombol Betul & Perbaiki. Tiga contoh membawa tiga lapis berbeda."
      >
        <KartuKeahlian keahlian={keahlianWarto[0]} />
        <KartuKeahlian keahlian={keahlianWarto[4]} />
        <KartuKeahlian keahlian={keahlianWarto[5]} />
      </Bagian>

      <Bagian
        judul="KartuLowongan"
        deskripsi="Judul, wilayah, jarak, PenandaUpah ringkas, tingkat Saringan Aman, satu baris alasan — tanpa skor angka."
      >
        <KartuLowongan lowongan={lowonganTampilDariMock(lwAman)} href="/demo/component" />
        <KartuLowongan lowongan={lowonganTampilDariMock(lwHati)} href="/demo/component" />
        <KartuLowongan lowongan={lowonganTampilDariMock(lwBahaya)} href="/demo/component" />
      </Bagian>

      <Bagian
        judul="PanelSaringanAman — tiga tingkat"
        deskripsi="Pertanyaan yang disarankan adalah bagian paling menonjol. Bahasa memberdayakan, tidak pernah menyatakan pasti penipuan."
      >
        <PanelSaringanAman saringan={saAman} />
        <PanelSaringanAman saringan={saHati} />
        <PanelSaringanAman saringan={saBahaya} />
      </Bagian>

      <Bagian
        judul="KartuKerjaVisual"
        deskripsi="Artefak bernilai seperti kartu fisik: avatar inisial, tiga keahlian teratas dengan lapisnya, bukti angka, QR tajam (SVG dari server), token publik."
      >
        <KartuKerjaVisual
          kartu={kartuWarto}
          pekerja={pekerjaUtama}
          keahlian={keahlianWarto.map(keahlianTampilDariMock)}
          jumlahPekerjaanSelesai={statistikWarto.jumlahPekerjaanSelesai}
          rataRataPenilaian={statistikWarto.rataRataPenilaian}
          jumlahPenilai={statistikWarto.jumlahPenilai}
        />
      </Bagian>

      <Bagian
        judul="LangkahOTP"
        deskripsi="Enam kotak angka, tempel otomatis, auto-advance, hitung mundur kirim ulang, target sentuh 48px+."
      >
        <div className="rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1">
          <LangkahOTP />
        </div>
      </Bagian>

      <Bagian
        judul="KeadaanKosong"
        deskripsi="Selalu menjelaskan langkah berikutnya dan memberi aksi — tidak pernah hanya 'belum ada data'."
      >
        <KeadaanKosong
          ikon={Inbox}
          judul="Belum ada lamaran"
          penjelasan="Lamaran yang Anda kirim akan muncul di sini. Mulai dengan melihat lowongan yang cocok dengan Kartu Kerja Anda."
          labelAksi="Lihat lowongan cocok"
          hrefAksi="/worker/jobs"
        />
        <KeadaanKosong
          ikon={House}
          judul="Belum ada riwayat kerja"
          penjelasan="Setiap pekerjaan yang selesai dan dikonfirmasi akan tercatat otomatis dan memperkuat Kartu Kerja Anda."
          labelAksi="Pelajari cara kerjanya"
          hrefAksi="/worker"
        />
      </Bagian>

      <Bagian
        judul="SpandukLuring"
        deskripsi="Muncul otomatis saat koneksi hilang. Di bawah ini versi simulasi (paksa tampil)."
      >
        <SpandukLuring paksaTampil />
      </Bagian>

      <Bagian
        judul="Navigasi peran"
        deskripsi="NavBawahPekerja (4 tab, 64px) terpasang di layout (worker). NavPemberi: sidebar di layar lebar, bottom nav di layar sempit — terpasang di layout (employer). Contoh statis di bawah."
      >
        <div className="overflow-hidden rounded-2xl border border-tanah-200">
          <div className="flex bg-tanah-0">
            <NavPemberi />
            <p className="flex flex-1 items-center justify-center p-8 text-label text-tanah-500">
              ← sidebar NavPemberi (di layar sempit berubah jadi bottom nav)
            </p>
          </div>
        </div>
        <p className="text-label text-tanah-500">
          Catatan: NavBawahPekerja dan bottom nav NavPemberi bersifat fixed di bawah
          layar — keduanya aktif di halaman ini.
        </p>
      </Bagian>

      <NavBawahPekerja />
    </main>
  );
}
