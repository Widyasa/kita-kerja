import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Handshake,
  Mic,
  Printer,
  Search,
  ShieldQuestion,
  UsersRound,
} from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { LabelSection } from "@/component/bersama/LabelSection";
import { LembarArsip, SeksiArsip } from "@/component/publik/LembarArsip";
import { Button } from "@/component/ui/button";
import type { LapisKepercayaan } from "@/lib/mock/types";

export const metadata: Metadata = {
  title: "Cara kerja Kita Kerja — dari cerita jadi bukti",
  description:
    "Bagaimana pengalaman yang diceritakan dengan suara berubah menjadi Kartu Kerja yang bisa diperiksa siapa pun: Ngobrol Kerja, lapis kepercayaan, Saringan Aman, dan Upah Terang.",
};

const LANGKAH = [
  {
    ikon: Mic,
    judul: "Ngobrol Kerja",
    ringkas: "Tiga menit bercerita, bukan mengisi formulir",
    isi: "Anda ditanya seperti tetangga bertanya: pernah kerja apa, di mana, berapa lama. Jawab dengan suara dalam bahasa Indonesia. Kalau tidak mau bicara, ada jalur ketik yang isinya sama.",
  },
  {
    ikon: Printer,
    judul: "Kartu Kerja terbit",
    ringkas: "Cerita berubah jadi daftar keahlian yang bisa dibaca orang lain",
    isi: "Setiap keahlian yang ditemukan Anda konfirmasi dulu — yang tidak Anda akui tidak masuk kartu. Kartunya bisa dicetak seukuran saku, dan punya QR yang bisa dipindai siapa pun tanpa akun.",
  },
  {
    ikon: Search,
    judul: "Lihat lowongan yang cocok",
    ringkas: "Alasannya kalimat, bukan angka",
    isi: "Lowongan diurutkan menurut kecocokan dengan keahlian Anda, dan setiap lowongan menjelaskan alasannya dalam satu kalimat. Skor tidak pernah ditampilkan — angka yang tidak bisa Anda bantah bukan penjelasan.",
  },
  {
    ikon: Handshake,
    judul: "Kesepakatan Kerja",
    ringkas: "Dua pihak menyetujui, keduanya menilai",
    isi: "Isi pekerjaan dan upahnya dikunci lewat kode OTP di kedua sisi. Setelah selesai dan dikonfirmasi dua pihak, pekerjaan itu naik jadi bukti di Kartu Kerja Anda — dan tidak bisa dihapus sepihak.",
  },
];

const LAPIS: { lapis: LapisKepercayaan; judul: string; isi: string }[] = [
  {
    lapis: "terverifikasi",
    judul: "Ada pekerjaan selesai yang membuktikannya",
    isi: "Minimal satu pekerjaan yang dikonfirmasi dua pihak, dan lowongannya memang meminta keahlian ini. Lapis paling kuat, dan satu-satunya yang tidak bisa dibuat sendiri.",
  },
  {
    lapis: "dinilai",
    judul: "Ada penilaian dari pemberi kerja",
    isi: "Sudah ada penilaian pada pekerjaan yang terhubung ke keahlian ini, tetapi belum memenuhi syarat lapis Terverifikasi.",
  },
  {
    lapis: "diklaim",
    judul: "Baru dari cerita Anda sendiri",
    isi: "Datang dari Ngobrol Kerja atau ditulis manual, lalu Anda konfirmasi. Belum ada pekerjaan selesai yang membuktikan. Ditampilkan apa adanya — tidak disamarkan supaya terlihat lebih kuat.",
  },
];

const PERLINDUNGAN = [
  {
    ikon: ShieldQuestion,
    nama: "Saringan Aman",
    isi: "Setiap lowongan dibaca dan pola yang mencurigakan ditandai — misalnya minta uang di muka, atau upah jauh di atas kewajaran tanpa penjelasan. Kita Kerja tidak pernah menyatakan sebuah lowongan pasti penipuan. Yang diberikan adalah temuan berkutipan dari teks aslinya, plus daftar pertanyaan yang sebaiknya Anda tanyakan lebih dulu.",
    tautan: { label: "Lihat penandanya di daftar lowongan", href: "/lowongan" },
  },
  {
    ikon: Calculator,
    nama: "Upah Terang",
    isi: "Acuan upah harian dihitung dari UMK wilayah dibagi 26 hari kerja, lalu disesuaikan dengan jenis pekerjaannya. Rumusnya tetap dan bisa diperiksa. AI tidak pernah menyentuh angka upah — kalau upah yang ditawarkan di bawah acuan, Anda melihatnya sebelum melamar, bukan sesudah bekerja.",
    tautan: null,
  },
  {
    ikon: UsersRound,
    nama: "Pendamping",
    isi: "Belum punya ponsel pintar? Petugas kelurahan atau karang taruna bisa mendaftarkan Anda lewat akun mereka sendiri. Kartu dan akunnya tetap milik Anda — begitu Anda punya nomor sendiri, Anda bisa mengambil alih aksesnya.",
    tautan: null,
  },
];

/**
 * `/cara-kerja` — penjelas publik.
 *
 * Ada karena beranda hanya punya ruang untuk janji, sementara yang bikin orang
 * percaya justru mekanismenya: dari mana lapis kepercayaan datang, kenapa skor
 * tidak pernah ditampilkan, dan kenapa angka upah tidak boleh disentuh AI.
 * Halaman ini menjawab itu tanpa meminta akun.
 */
export default function HalamanCaraKerja() {
  return (
    <LembarArsip>
      {/* ============ JUDUL ============ */}
      <SeksiArsip awal>
        <LabelSection label="Cara kerja" />
        <h1 className="mt-6 max-w-[18ch] text-[clamp(2rem,4.4vw,4rem)] leading-[1.03] font-extrabold tracking-[-0.03em] text-balance text-tanah-900">
          Dari cerita, jadi bukti yang bisa diperiksa
        </h1>
        <p className="text-body-lg mt-6 max-w-[58ch] text-pretty text-tanah-600">
          Kita Kerja tidak menilai siapa pun. Yang dilakukannya satu hal:
          mengubah pengalaman yang selama ini hanya diceritakan dari mulut ke
          mulut menjadi catatan yang bisa dicek orang lain — termasuk oleh orang
          yang belum pernah bertemu Anda.
        </p>
      </SeksiArsip>

      {/* ============ EMPAT LANGKAH — urutan nyata, jadi nomornya berguna ============ */}
      <SeksiArsip terang aria-labelledby="judul-langkah">
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <h2 id="judul-langkah" className="text-h1 max-w-[16ch] text-balance">
              Empat langkah, dari suara sampai bukti
            </h2>
            <p className="text-body-lg mt-5 max-w-[38ch] text-pretty text-tanah-600">
              Urutannya tetap. Anda boleh berhenti di langkah mana pun — Kartu
              Kerja tetap milik Anda meski belum pernah melamar sekali pun.
            </p>
          </div>

          <ol className="divide-y divide-tanah-200 border-y border-tanah-200">
            {LANGKAH.map((l, i) => (
              <li
                key={l.judul}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6 gap-y-3 py-8 sm:gap-x-8"
              >
                <span
                  aria-hidden
                  className="font-mono text-[clamp(2rem,5vw,2.75rem)] leading-none font-bold tracking-[-0.03em] text-kuning-700 tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-h3 flex flex-wrap items-center gap-x-3 text-balance">
                    <l.ikon
                      className="size-5 shrink-0 text-biru-600"
                      aria-hidden
                    />
                    {l.judul}
                  </h3>
                  <p className="text-label mt-1 text-tanah-600">{l.ringkas}</p>
                  <p className="text-body mt-3 max-w-[62ch] text-pretty text-tanah-800">
                    {l.isi}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </SeksiArsip>

      {/* ============ LAPIS KEPERCAYAAN ============ */}
      <SeksiArsip aria-labelledby="judul-lapis">
        <LabelSection label="Lapis kepercayaan" />
        <h2 id="judul-lapis" className="text-h1 mt-4 max-w-[24ch] text-balance">
          Setiap keahlian membawa satu lapis — dan lapisnya jujur
        </h2>
        <p className="text-body-lg mt-5 max-w-[58ch] text-pretty text-tanah-600">
          Lapis tidak pernah disimpan sebagai data; ia dihitung ulang dari
          riwayat pekerjaan setiap kali kartu dibuka. Artinya tidak ada yang
          bisa menaikkan lapisnya sendiri — termasuk kami.
        </p>

        <dl className="mt-10 divide-y divide-tanah-200 border-y border-tanah-200">
          {LAPIS.map((l) => (
            <div
              key={l.lapis}
              className="grid gap-x-10 gap-y-3 py-7 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
            >
              <dt>
                <BadgeLapis lapis={l.lapis} />
              </dt>
              <dd className="min-w-0">
                <p className="text-h3 text-balance text-tanah-900">{l.judul}</p>
                <p className="text-body mt-2 max-w-[62ch] text-pretty text-tanah-600">
                  {l.isi}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </SeksiArsip>

      {/* ============ PERLINDUNGAN ============ */}
      <SeksiArsip terang aria-labelledby="judul-perlindungan">
        <h2
          id="judul-perlindungan"
          className="text-h1 max-w-[24ch] text-balance"
        >
          Tiga hal yang bekerja tanpa Anda minta
        </h2>

        <div className="mt-10 flex flex-col divide-y divide-tanah-200 border-y border-tanah-200">
          {PERLINDUNGAN.map((p) => (
            <article
              key={p.nama}
              className="grid gap-x-10 gap-y-4 py-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]"
            >
              <h3 className="text-h3 flex items-center gap-3 text-tanah-900">
                <p.ikon className="size-6 shrink-0 text-biru-600" aria-hidden />
                {p.nama}
              </h3>
              <div className="min-w-0">
                <p className="text-body max-w-[64ch] text-pretty text-tanah-800">
                  {p.isi}
                </p>
                {p.tautan && (
                  <Link
                    href={p.tautan.href}
                    className="text-label mt-4 inline-flex min-h-12 items-center gap-2 rounded-md font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
                  >
                    {p.tautan.label}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </SeksiArsip>

      {/* ============ AJAKAN ============ */}
      <SeksiArsip aria-labelledby="judul-ajakan">
        <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 id="judul-ajakan" className="text-h1 max-w-[20ch] text-balance">
              Mulai dari mana pun yang paling masuk akal buat Anda
            </h2>
            <p className="text-body-lg mt-5 max-w-[48ch] text-pretty text-tanah-600">
              Kalau ingin melihat dulu, buka papan lowongan — semuanya bisa
              dibaca tanpa akun. Kalau sudah siap, tiga menit bercerita sudah
              cukup untuk menerbitkan kartu pertama Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="aksen" size="lg">
              <Link href="/register">
                <Mic aria-hidden />
                Buat Kartu Kerja
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/lowongan">
                Lihat lowongan
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </SeksiArsip>
    </LembarArsip>
  );
}
