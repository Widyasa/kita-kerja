import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mic, ShieldCheck, UsersRound } from "lucide-react";

import { LabelSection } from "@/component/bersama/LabelSection";
import { Button } from "@/component/ui/button";
import { KartuKerjaVisual } from "@/component/kartu/KartuKerjaVisual";
import { BarisLowongan } from "@/component/publik/BarisLowongan";
import { LembarArsip, SeksiArsip } from "@/component/publik/LembarArsip";
import { daftarLowonganPublik } from "@/lib/data/lowongan-publik";
import {
  bidangKerja,
  kartuWarto,
  keahlianBaku,
  keahlianWarto,
  pekerjaUtama,
  statistikWarto,
  type KartuKeahlian,
  wilayah,
} from "@/lib/mock";
import type { KeahlianTampil } from "@/lib/data/types";

/**
 * Adaptor lokal — halaman ini hanya menampilkan Kartu Kerja CONTOH
 * (bukan data pengguna asli), jadi ia mengubah bentuk mock lama
 * KartuKeahlian menjadi KeahlianTampil yang diharapkan KartuKerjaVisual.
 */
function keahlianTampilDariMock(k: KartuKeahlian): KeahlianTampil {
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

/**
 * Foto arsip — dicetak seperti foto fisik: bingkai kertas tanah-0,
 * garis tepi tipis, bayangan dalam, dan rotasi kecil yang bervariasi
 * (ditentukan pemanggil lewat className).
 */
function FotoArsip({
  src,
  alt,
  rasio,
  sizes,
  prioritas = false,
  className = "",
}: Readonly<{
  src: string;
  alt: string;
  rasio: string;
  sizes: string;
  prioritas?: boolean;
  className?: string;
}>) {
  return (
    <figure
      className={`rounded-lg border border-tanah-200 bg-tanah-0 p-2 shadow-3 ${className}`}
    >
      <span className={`relative block overflow-hidden rounded-md ${rasio}`}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={prioritas}
          sizes={sizes}
          className="object-cover"
        />
      </span>
    </figure>
  );
}

/**
 * Landing `/` (Bagian 6.1) — memisahkan dua jenis pengunjung dalam 3 detik:
 * pekerja vs pemberi kerja. Menampilkan SATU contoh Kartu Kerja nyata
 * (Pak Warto) yang bisa dilihat tanpa mendaftar, lalu lowongan yang benar-benar
 * sedang tayang supaya janji halaman ini bisa langsung diperiksa.
 *
 * Gaya visual: "dossier / arsip" — halaman dibaca seperti dokumen tercetak.
 * Canvas desktop (1440px) sebagai basis desain: margin bergaris vertikal
 * mengapit seluruh halaman, pemisah antar-section berupa garis horizontal
 * tipis (bukan kartu bertumpuk), kolom asimetris, kolase foto kerja nyata
 * yang diselipkan seperti foto dalam map arsip, dan Kartu Kerja tampil
 * seperti artefak fisik. Di bawah 1024px seluruh kolom asimetris runtuh
 * menjadi satu kolom tanpa mengubah urutan baca.
 *
 * Palet (Biru Amanah / Kuning Kerja / Tanah) dan skala tipografi tidak
 * berubah — hanya komposisi dan layout. Foto: Unsplash, disimpan lokal
 * di `public/ilustrasi/`.
 */
export default async function LandingPage() {
  const urlVerifikasiWarto = `/verify/${kartuWarto.token_publik}`;
  const lowonganTerbaru = await daftarLowonganPublik({ batas: 3 });

  const langkah = [
    {
      judul: "Ngobrol dengan suara, 3 menit",
      isi: "Ceritakan pekerjaan Anda seperti bercerita ke tetangga. Boleh pakai bahasa daerah.",
    },
    {
      judul: "Kartu Kerja Anda terbit",
      isi: "Cerita Anda menjadi kartu berisi keahlian dan riwayat yang bisa diperiksa siapa pun.",
    },
    {
      judul: "Cetak dan tunjukkan ke siapa pun",
      isi: "Bawa ke calon pemberi kerja. Mereka cukup memindai QR untuk memastikan kartu Anda asli.",
    },
  ];

  const tautanHalaman = [
    { label: "Beranda", href: "/" },
    { label: "Lowongan", href: "/lowongan" },
    { label: "Cara kerja", href: "/cara-kerja" },
    { label: "Daftar", href: "/register" },
    { label: "Masuk", href: "/sign-in" },
    { label: "Contoh verifikasi kartu", href: urlVerifikasiWarto },
  ];

  const tautanPeran = [
    { label: "Saya cari kerja", href: "/register" },
    { label: "Saya butuh pekerja", href: "/register" },
  ];

  /**
   * BUG-017 — keempat tautan ini sebelumnya `href="#"` sehingga diklik hanya
   * melompat ke atas halaman. Pada produk yang menjual kepercayaan, tautan
   * mati membuat situs terasa belum jadi.
   *
   * Sekarang hanya ditampilkan yang URL-nya benar-benar disetel lewat env.
   * Selama belum ada, seluruh bagian "Media sosial" disembunyikan.
   */
  const tautanSosial = [
    { label: "Instagram", href: process.env.NEXT_PUBLIC_URL_INSTAGRAM },
    { label: "TikTok", href: process.env.NEXT_PUBLIC_URL_TIKTOK },
    { label: "WhatsApp", href: process.env.NEXT_PUBLIC_URL_WHATSAPP },
    { label: "YouTube", href: process.env.NEXT_PUBLIC_URL_YOUTUBE },
  ].filter((t): t is { label: string; href: string } => Boolean(t.href));

  return (
    <LembarArsip>
      {/* ============ HERO — dua tombol dalam 3 detik ============ */}
      <SeksiArsip
        awal
        ruang="kustom"
        className="grid grid-cols-1 items-center gap-12 pt-16 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-24 lg:pb-28"
      >
        <div className="masuk relative z-10">
          <LabelSection label="Portal kerja informal Indonesia" />
          <h1 className="mt-6 max-w-[15ch] text-[clamp(2.25rem,4.6vw,4.25rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance text-tanah-900">
            Pengalaman Anda{" "}
            <span className="text-biru-600">
              belum punya{" "}
              <span className="relative inline-block isolate">
                <span
                  aria-hidden
                  className="absolute right-0 bottom-[0.08em] left-0 -z-10 h-[0.14em] rounded-full bg-kuning-200"
                />
                bukti.
              </span>
            </span>{" "}
            Sekarang punya.
          </h1>
          <p className="text-body-lg mt-8 max-w-[44ch] text-balance text-tanah-600">
            Ceritakan pekerjaan Anda dengan suara. Kita Kerja mengubahnya
            menjadi Kartu Kerja yang bisa dibawa ke mana pun — dan dipercaya
            siapa pun.
          </p>

          {/* `flex-1` HANYA dari sm ke atas: di kolom, flex-1 bekerja pada
              tinggi dan menggencet tombol 56px jadi ~28px. */}
          <div className="mt-10 flex max-w-xl flex-col gap-4 sm:flex-row">
            <Button
              asChild
              variant="aksen"
              size="lg"
              className="w-full sm:w-auto sm:flex-1 motion-safe:transition-shadow hover:shadow-2"
            >
              <Link href="/register">
                <Mic aria-hidden />
                Saya cari kerja
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-2 border-biru-600 text-biru-600 hover:bg-biru-50 sm:w-auto sm:flex-1"
            >
              <Link href="/register">
                <UsersRound aria-hidden />
                Saya butuh pekerja
              </Link>
            </Button>
          </div>

          <p className="text-label mt-6 text-tanah-600">
            Cuma mau lihat-lihat dulu?{" "}
            <Link
              href="/lowongan"
              className="rounded-sm font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
            >
              Buka papan lowongan
            </Link>{" "}
            — tanpa akun. Sudah punya akun?{" "}
            <Link
              href="/sign-in"
              className="rounded-sm font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
            >
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Kolase foto (desktop): tiga foto kerja nyata, diselipkan
            bertumpuk dengan rotasi bervariasi seperti isi map arsip */}
        <div
          className="masuk relative mr-4 max-lg:hidden"
          style={{ "--tunda": "120ms" } as React.CSSProperties}
        >
          <FotoArsip
            src="/ilustrasi/hero-1.jpg"
            alt="Dua pekerja konstruksi berompi oranye bekerja di antara tulangan besi"
            rasio="aspect-[4/5]"
            sizes="(min-width: 1024px) 32vw, 100vw"
            prioritas
            className="ml-16 w-[76%] rotate-[1.5deg]"
          />
          <FotoArsip
            src="/ilustrasi/hero-2.jpg"
            alt="Pekerja kebersihan membersihkan jendela dengan kain kuning"
            rasio="aspect-square"
            sizes="(min-width: 1024px) 18vw, 50vw"
            className="absolute -bottom-10 left-0 w-[46%] rotate-[-3deg]"
          />
          <FotoArsip
            src="/ilustrasi/hero-3.jpg"
            alt="Teknisi berhelm kuning memperbaiki panel listrik"
            rasio="aspect-[4/3]"
            sizes="(min-width: 1024px) 16vw, 50vw"
            className="absolute -top-8 -right-2 w-[42%] rotate-[2.5deg]"
          />
        </div>

        {/* Kolase foto (HP & tablet): foto utama penuh, dua foto kecil di bawahnya */}
        <div
          className="masuk grid grid-cols-2 gap-4 lg:hidden"
          style={{ "--tunda": "120ms" } as React.CSSProperties}
        >
          <FotoArsip
            src="/ilustrasi/hero-1.jpg"
            alt="Dua pekerja konstruksi berompi oranye bekerja di antara tulangan besi"
            rasio="aspect-[3/2]"
            sizes="(min-width: 640px) 90vw, 100vw"
            prioritas
            className="col-span-2 rotate-[1.5deg]"
          />
          <FotoArsip
            src="/ilustrasi/hero-2.jpg"
            alt="Pekerja kebersihan membersihkan jendela dengan kain kuning"
            rasio="aspect-square"
            sizes="(min-width: 640px) 45vw, 50vw"
            className="rotate-[-2deg]"
          />
          <FotoArsip
            src="/ilustrasi/hero-3.jpg"
            alt="Teknisi berhelm kuning memperbaiki panel listrik"
            rasio="aspect-square"
            sizes="(min-width: 640px) 45vw, 50vw"
            className="rotate-[2deg]"
          />
        </div>
      </SeksiArsip>

      {/* ============ STATISTIK — angka sebagai arsip, bukan banner ============ */}
      <SeksiArsip aria-labelledby="judul-statistik">
        <LabelSection label="Kenapa ini penting" />
        <div className="mt-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-[auto_1px_1fr] lg:gap-14">
          <div>
            <p className="text-[clamp(4rem,9vw,8.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] text-biru-600 tabular-nums">
              87,74
            </p>
            <h2
              id="judul-statistik"
              className="text-h2 mt-4 max-w-[18ch] text-balance"
            >
              juta pekerja informal di Indonesia
            </h2>
          </div>
          <span
            aria-hidden
            className="w-px self-stretch bg-tanah-300 max-lg:hidden"
          />
          <p className="text-body-lg text-balance text-tanah-600 lg:pb-4">
            <strong className="font-bold text-tanah-900">
              Bekerja tanpa satu pun bukti pengalaman.
            </strong>{" "}
            Setiap pindah tempat, reputasi kembali ke nol. Setiap kartu yang
            terbit mengubah satu orang dari &ldquo;katanya bisa&rdquo; menjadi
            &ldquo;terbukti bisa&rdquo;.
          </p>
        </div>
      </SeksiArsip>

      {/* ============ BAGAIMANA CARANYA — baris ledger bernomor ============ */}
      <SeksiArsip terang aria-labelledby="judul-langkah">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <LabelSection label="Bagaimana caranya" />
            <h2
              id="judul-langkah"
              className="text-h1 mt-4 max-w-[20ch] text-balance"
            >
              Tiga langkah, selesai sore ini
            </h2>
            <p className="text-body-lg mt-6 max-w-[36ch] text-balance text-tanah-600">
              Tanpa formulir panjang, tanpa istilah rumit. Semua bisa dilakukan
              dari ponsel — bahkan sambil istirahat di lokasi kerja.
            </p>
            <Link
              href="/cara-kerja"
              className="text-label mt-6 inline-flex min-h-12 items-center gap-2 rounded-md font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
            >
              Penjelasan lengkapnya
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ol className="divide-y divide-tanah-200 border-y border-tanah-200">
            {langkah.map((l, i) => (
              <li
                key={l.judul}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-5 py-8 sm:gap-8"
              >
                <span
                  aria-hidden
                  className="font-mono text-[clamp(2rem,5vw,2.75rem)] leading-none font-bold tracking-[-0.03em] text-kuning-700 tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-h3 text-balance">{l.judul}</h3>
                  <p className="text-body mt-2 text-pretty text-tanah-600">
                    {l.isi}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </SeksiArsip>

      {/* ============ CONTOH KARTU NYATA — artefak diselipkan, bukan dipajang di tengah ============ */}
      <SeksiArsip aria-labelledby="judul-contoh">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="flex flex-col items-start gap-6">
            <LabelSection label="Contoh nyata" />
            <h2 id="judul-contoh" className="text-h1 text-balance">
              Ini bukti yang akan Anda bawa
            </h2>
            <p className="text-body-lg text-balance text-tanah-600">
              Ini Kartu Kerja Pak Warto, tukang bangunan dari Malang. Lihat
              langsung — Anda tidak perlu mendaftar untuk memahaminya.
            </p>
            {/* Label panjang + `whitespace-nowrap` bawaan tombol = meluber di
                360px. Di layar sempit tombol boleh melebar dan teksnya membungkus. */}
            <Button
              asChild
              variant="default"
              size="lg"
              className="h-auto min-h-14 w-full py-3 text-center whitespace-normal sm:w-auto"
            >
              <Link href={urlVerifikasiWarto}>
                <ShieldCheck aria-hidden />
                Lihat seperti yang dilihat pemindai QR
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="lg:-translate-y-2 lg:translate-x-2 lg:rotate-[-1.25deg]">
            <KartuKerjaVisual
              kartu={kartuWarto}
              pekerja={pekerjaUtama}
              keahlian={keahlianWarto.map(keahlianTampilDariMock)}
              jumlahPekerjaanSelesai={statistikWarto.jumlahPekerjaanSelesai}
              rataRataPenilaian={statistikWarto.rataRataPenilaian}
              jumlahPenilai={statistikWarto.jumlahPenilai}
              className="w-full"
            />
          </div>
        </div>
      </SeksiArsip>

      {/* ============ LOWONGAN YANG BENAR-BENAR TAYANG ============
          Halaman ini berjanji "pekerjaan nyata"; bagian ini membiarkan
          pengunjung memeriksa janji itu sebelum menyerahkan nomor HP-nya.
          Disembunyikan kalau memang belum ada yang tayang — daftar kosong
          di beranda melemahkan janjinya, bukan menjelaskannya. */}
      {lowonganTerbaru.length > 0 && (
        <SeksiArsip terang aria-labelledby="judul-lowongan">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <div>
              <LabelSection label="Sedang dicari sekarang" />
              <h2
                id="judul-lowongan"
                className="text-h1 mt-4 max-w-[22ch] text-balance"
              >
                Pekerjaan yang sedang terbuka
              </h2>
            </div>
            <Link
              href="/lowongan"
              className="text-label inline-flex min-h-12 items-center gap-2 rounded-md font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
            >
              Lihat semua lowongan
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-8 divide-y divide-tanah-200 border-y border-tanah-200">
            {lowonganTerbaru.map((lw) => (
              <li key={lw.id}>
                <BarisLowongan lowongan={lw} />
              </li>
            ))}
          </ul>
        </SeksiArsip>
      )}

      {/* ============ FOOTER — kolofon dokumen ============ */}
      <footer className="border-t border-tanah-200 bg-tanah-0 px-5 pt-16 pb-10 sm:px-8 lg:px-14">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-10">
          <div className="max-lg:col-span-2">
            <p className="text-h3 text-biru-600">Kita Kerja</p>
            <p className="text-body mt-2 max-w-[32ch] text-balance text-tanah-600">
              Bukti pengalaman untuk pekerja informal Indonesia.
            </p>
          </div>

          <nav aria-label="Halaman">
            <p className="mikro text-tanah-500">Halaman</p>
            <ul className="mt-4 space-y-2">
              {tautanHalaman.map((t) => (
                <li key={t.label}>
                  <Link
                    href={t.href}
                    className="text-body inline-block rounded-sm py-1 text-tanah-600 underline-offset-4 hover:text-biru-600 hover:underline focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Untuk siapa">
            <p className="mikro text-tanah-500">Untuk siapa</p>
            <ul className="mt-4 space-y-2">
              {tautanPeran.map((t) => (
                <li key={t.label}>
                  <Link
                    href={t.href}
                    className="text-body inline-block rounded-sm py-1 text-tanah-600 underline-offset-4 hover:text-biru-600 hover:underline focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

<<<<<<< HEAD
            <div className="lg:-translate-y-2 lg:translate-x-2 lg:rotate-[-1.25deg]">
              <KartuKerjaVisual
                bidangNama={bidangKerja.find((b) => b.id === kartuWarto.bidang_utama_id)?.nama ?? null}
                wilayahNama={wilayah.find((w) => w.id === pekerjaUtama.wilayah_id)?.nama ?? null}
                kartu={kartuWarto}
                pekerja={pekerjaUtama}
                keahlian={keahlianWarto.map(keahlianTampilDariMock)}
                jumlahPekerjaanSelesai={statistikWarto.jumlahPekerjaanSelesai}
                rataRataPenilaian={statistikWarto.rataRataPenilaian}
                jumlahPenilai={statistikWarto.jumlahPenilai}
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* ============ FOOTER — kolofon dokumen ============ */}
        <footer className="border-t border-tanah-200 bg-tanah-0 px-14 pt-16 pb-10 max-lg:px-5">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 max-lg:grid-cols-2 max-lg:gap-8">
            <div>
              <p className="text-h3 text-biru-600">Kita Kerja</p>
              <p className="text-body mt-2 max-w-[32ch] text-balance text-tanah-600">
                Bukti pengalaman untuk pekerja informal Indonesia.
              </p>
            </div>

            <nav aria-label="Halaman">
              <p className="mikro text-tanah-500">Halaman</p>
              <ul className="mt-4 space-y-2">
                {tautanHalaman.map((t) => (
                  <li key={t.label}>
                    <Link
                      href={t.href}
                      className="inline-flex min-h-11 items-center text-body text-tanah-600 underline-offset-4 hover:text-biru-600 hover:underline focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Untuk siapa">
              <p className="mikro text-tanah-500">Untuk siapa</p>
              <ul className="mt-4 space-y-2">
                {tautanPeran.map((t) => (
                  <li key={t.label}>
                    <Link
                      href={t.href}
                      className="inline-flex min-h-11 items-center text-body text-tanah-600 underline-offset-4 hover:text-biru-600 hover:underline focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {tautanSosial.length > 0 && (
              <nav aria-label="Media sosial">
                <p className="mikro text-tanah-500">Media sosial</p>
                <ul className="mt-4 space-y-2">
                  {tautanSosial.map((t) => (
                    <li key={t.label}>
                      <a
                        href={t.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center text-body text-tanah-600 underline-offset-4 hover:text-biru-600 hover:underline focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
                      >
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          <div className="mt-14 flex items-baseline justify-between gap-4 border-t border-tanah-200 pt-6 max-lg:flex-col max-lg:gap-2">
            <p className="mikro text-tanah-500">
              Fase demo — seluruh data pada halaman ini adalah contoh
            </p>
            <p className="mikro text-tanah-500">© 2026 Kita Kerja</p>
          </div>
        </footer>
      </div>
    </div>
=======
          <nav aria-label="Media sosial">
            <p className="mikro text-tanah-500">Media sosial</p>
            <ul className="mt-4 space-y-2">
              {tautanSosial.map((t) => (
                <li key={t.label}>
                  <a
                    href={t.href}
                    className="text-body inline-block rounded-sm py-1 text-tanah-600 underline-offset-4 hover:text-biru-600 hover:underline focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-2 border-t border-tanah-200 pt-6 sm:flex-row sm:items-baseline sm:gap-4">
          <p className="mikro text-tanah-500">
            Fase demo — sebagian data pada halaman ini adalah contoh
          </p>
          <p className="mikro text-tanah-500">© 2026 Kita Kerja</p>
        </div>
      </footer>
    </LembarArsip>
>>>>>>> feat/phone-otp-auth
  );
}
