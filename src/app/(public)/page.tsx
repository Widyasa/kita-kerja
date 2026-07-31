import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mic, ShieldCheck, UsersRound } from "lucide-react";

import { LabelSection } from "@/component/bersama/LabelSection";
import { Button } from "@/component/ui/button";
import { KartuKerjaVisual } from "@/component/kartu/KartuKerjaVisual";
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
 * (Pak Warto) yang bisa dilihat tanpa mendaftar.
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
export default function LandingPage() {
  const urlVerifikasiWarto = `/verify/${kartuWarto.token_publik}`;

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
    <div className="bg-tanah-50">
      {/* Ledger page — margin bergaris vertikal mengapit seluruh dokumen */}
      <div className="mx-auto w-full max-w-(--max-employer) border-x border-tanah-200 max-lg:border-x-0">
        {/* ============ HERO — dua tombol dalam 3 detik ============ */}
        <section className="grid grid-cols-[1.05fr_0.95fr] items-center gap-12 px-14 pt-24 pb-28 max-lg:grid-cols-1 max-lg:gap-14 max-lg:px-5 max-lg:pt-16 max-lg:pb-20">
          <div className="relative z-10">
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

            <div className="mt-10 flex max-w-xl gap-4 max-lg:flex-col">
              <Button
                asChild
                variant="aksen"
                size="lg"
                className="flex-1 motion-safe:transition-shadow hover:shadow-2"
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
                className="flex-1 border-2 border-biru-600 text-biru-600 hover:bg-biru-50"
              >
                <Link href="/register">
                  <UsersRound aria-hidden />
                  Saya butuh pekerja
                </Link>
              </Button>
            </div>

            <p className="text-label mt-6 text-tanah-600">
              Sudah punya akun?{" "}
              <Link
                href="/sign-in"
                className="font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
              >
                Masuk di sini
              </Link>
            </p>
          </div>

          {/* Kolase foto (desktop): tiga foto kerja nyata, diselipkan
              bertumpuk dengan rotasi bervariasi seperti isi map arsip */}
          <div className="relative mr-4 max-lg:hidden">
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

          {/* Kolase foto (HP): foto utama penuh, dua foto kecil di bawahnya */}
          <div className="grid grid-cols-2 gap-4 lg:hidden">
            <FotoArsip
              src="/ilustrasi/hero-1.jpg"
              alt="Dua pekerja konstruksi berompi oranye bekerja di antara tulangan besi"
              rasio="aspect-[3/2]"
              sizes="100vw"
              prioritas
              className="col-span-2 rotate-[1.5deg]"
            />
            <FotoArsip
              src="/ilustrasi/hero-2.jpg"
              alt="Pekerja kebersihan membersihkan jendela dengan kain kuning"
              rasio="aspect-square"
              sizes="50vw"
              className="rotate-[-2deg]"
            />
            <FotoArsip
              src="/ilustrasi/hero-3.jpg"
              alt="Teknisi berhelm kuning memperbaiki panel listrik"
              rasio="aspect-square"
              sizes="50vw"
              className="rotate-[2deg]"
            />
          </div>
        </section>

        {/* ============ STATISTIK — angka sebagai arsip, bukan banner ============ */}
        <section className="border-t-2 border-tanah-200 px-14 py-24 max-lg:px-5 max-lg:py-16">
          <LabelSection label="Kenapa ini penting" />
          <div className="mt-12 grid grid-cols-[auto_1px_1fr] items-end gap-14 max-lg:grid-cols-1 max-lg:gap-8">
            <div>
              <p className="text-[clamp(4.5rem,9vw,8.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] text-biru-600 tabular-nums">
                87,74
              </p>
              <p className="text-h2 mt-4 max-w-[18ch] text-balance">
                juta pekerja informal di Indonesia
              </p>
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
        </section>

        {/* ============ BAGAIMANA CARANYA — baris ledger bernomor ============ */}
        <section className="border-t-2 border-tanah-200 bg-tanah-0 px-14 py-24 max-lg:px-5 max-lg:py-16">
          <div className="grid grid-cols-[0.85fr_1.15fr] gap-16 max-lg:grid-cols-1 max-lg:gap-10">
            <div>
              <LabelSection label="Bagaimana caranya" />
              <h2 className="text-h1 mt-4 max-w-[20ch] text-balance">
                Tiga langkah, selesai sore ini
              </h2>
              <p className="text-body-lg mt-6 max-w-[36ch] text-balance text-tanah-600">
                Tanpa formulir panjang, tanpa istilah rumit. Semua bisa
                dilakukan dari ponsel — bahkan sambil istirahat di lokasi
                kerja.
              </p>
            </div>

            <ol className="divide-y divide-tanah-200 border-y border-tanah-200">
              {langkah.map((l, i) => (
                <li
                  key={l.judul}
                  className="grid grid-cols-[auto_1fr] items-baseline gap-8 py-8 max-lg:gap-5"
                >
                  <span
                    aria-hidden
                    className="font-mono text-[2.75rem] leading-none font-bold tracking-[-0.03em] text-kuning-700 tabular-nums"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-h3 text-balance">{l.judul}</h3>
                    <p className="text-body mt-2 text-balance text-tanah-600">
                      {l.isi}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============ CONTOH KARTU NYATA — artefak diselipkan, bukan dipajang di tengah ============ */}
        <section className="border-t-2 border-tanah-200 px-14 py-24 max-lg:px-5 max-lg:py-16">
          <div className="grid grid-cols-[0.8fr_1.2fr] items-center gap-14 max-lg:grid-cols-1 max-lg:gap-12">
            <div className="flex flex-col items-start gap-6">
              <LabelSection label="Contoh nyata" />
              <h2 className="text-h1 text-balance">
                Ini bukti yang akan Anda bawa
              </h2>
              <p className="text-body-lg text-balance text-tanah-600">
                Ini Kartu Kerja Pak Warto, tukang bangunan dari Malang. Lihat
                langsung — Anda tidak perlu mendaftar untuk memahaminya.
              </p>
              <Button asChild variant="default" size="lg">
                <Link href={urlVerifikasiWarto}>
                  <ShieldCheck aria-hidden />
                  Lihat seperti yang dilihat pemindai QR
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>

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
  );
}
