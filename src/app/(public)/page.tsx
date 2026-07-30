import Link from "next/link";
import {
  ArrowRight,
  IdCard,
  MessageCircle,
  Mic,
  Printer,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { KartuKerjaVisual } from "@/component/kartu/KartuKerjaVisual";
import {
  kartuWarto,
  keahlianWarto,
  pekerjaUtama,
  statistikWarto,
} from "@/lib/mock";

/**
 * Landing `/` (Bagian 6.1) — memisahkan dua jenis pengunjung dalam 3 detik:
 * pekerja vs pemberi kerja. Menampilkan SATU contoh Kartu Kerja nyata
 * (Pak Warto) yang bisa dilihat tanpa mendaftar.
 */
export default function LandingPage() {
  const urlVerifikasiWarto = `/verify/${kartuWarto.token_publik}`;

  return (
    <div className="bg-tanah-50">
      {/* ============ HERO — dua tombol dalam 3 detik ============ */}
      <section className="mx-auto flex w-full max-w-(--max-employer) flex-col items-center gap-8 px-4 pt-16 pb-20 text-center sm:pt-20">
        <h1 className="text-display max-w-3xl text-balance text-tanah-900">
          Pengalaman Anda selama ini belum punya bukti.{" "}
          <span className="text-biru-600">Sekarang punya.</span>
        </h1>
        <p className="text-body-lg max-w-xl text-balance text-tanah-600">
          Ceritakan pekerjaan Anda dengan suara. Kita Kerja mengubahnya menjadi
          Kartu Kerja yang bisa dibawa ke mana pun.
        </p>

        <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            variant="aksen"
            size="lg"
            className="w-full motion-safe:transition-shadow hover:shadow-2 sm:w-auto sm:flex-1"
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

        <p className="text-label text-tanah-600">
          Sudah punya akun?{" "}
          <Link
            href="/sign-in"
            className="font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
          >
            Masuk di sini
          </Link>
        </p>
      </section>

      {/* ============ BAGAIMANA CARANYA — 3 langkah ============ */}
      <section className="border-y border-tanah-200 bg-tanah-0">
        <div className="mx-auto w-full max-w-(--max-employer) px-4 py-16 sm:py-20">
          <p className="mikro text-center text-kuning-700">Bagaimana caranya</p>
          <h2 className="text-h1 mt-3 text-center text-balance">
            Tiga langkah, selesai sore ini
          </h2>

          <ol className="mx-auto mt-12 grid max-w-4xl gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              {
                ikon: MessageCircle,
                judul: "Ngobrol dengan suara, 3 menit",
                isi: "Ceritakan pekerjaan Anda seperti bercerita ke tetangga. Boleh pakai bahasa daerah.",
              },
              {
                ikon: IdCard,
                judul: "Kartu Kerja Anda terbit",
                isi: "Cerita Anda menjadi kartu berisi keahlian dan riwayat yang bisa diperiksa siapa pun.",
              },
              {
                ikon: Printer,
                judul: "Cetak dan tunjukkan ke siapa pun",
                isi: "Bawa ke calon pemberi kerja. Mereka cukup memindai QR untuk memastikan kartu Anda asli.",
              },
            ].map((langkah, i) => {
              const Ikon = langkah.ikon;
              return (
                <li key={langkah.judul} className="flex flex-col items-center gap-4 text-center">
                  <span className="relative flex size-16 items-center justify-center rounded-full bg-kuning-100 text-kuning-800">
                    <Ikon className="size-7" aria-hidden />
                    <span
                      aria-hidden
                      className="absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full bg-biru-600 text-label font-bold text-tanah-0"
                    >
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="text-h3 text-balance">{langkah.judul}</h3>
                  <p className="text-body text-balance text-tanah-600">{langkah.isi}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ============ STATISTIK — momen hero kedua ============ */}
      <section className="bg-tanah-900">
        <div className="mx-auto flex w-full max-w-(--max-employer) flex-col items-center gap-6 px-4 py-20 text-center sm:py-24">
          <p className="mikro text-kuning-300">Kenapa ini penting</p>
          <p className="text-display text-kuning-300 tabular-nums">87,74 juta</p>
          <p className="text-h2 max-w-2xl text-balance text-tanah-0">
            pekerja informal di Indonesia bekerja tanpa satu pun bukti
            pengalaman.
          </p>
          <p className="text-body-lg max-w-xl text-balance text-tanah-300">
            Setiap kartu yang terbit mengubah satu orang dari &ldquo;katanya
            bisa&rdquo; menjadi &ldquo;terbukti bisa&rdquo;.
          </p>
        </div>
      </section>

      {/* ============ CONTOH KARTU NYATA — tanpa perlu daftar ============ */}
      <section className="mx-auto flex w-full max-w-(--max-employer) flex-col items-center gap-10 px-4 py-16 sm:py-20">
        <div className="flex max-w-xl flex-col gap-4 text-center">
          <p className="mikro text-kuning-700">Contoh nyata</p>
          <h2 className="text-h1 text-balance">Ini bukti yang akan Anda bawa</h2>
          <p className="text-body-lg text-balance text-tanah-600">
            Ini Kartu Kerja Pak Warto, tukang bangunan dari Malang. Lihat
            langsung — Anda tidak perlu mendaftar untuk memahaminya.
          </p>
        </div>

        <KartuKerjaVisual
          kartu={kartuWarto}
          pekerja={pekerjaUtama}
          keahlian={keahlianWarto}
          jumlahPekerjaanSelesai={statistikWarto.jumlahPekerjaanSelesai}
          rataRataPenilaian={statistikWarto.rataRataPenilaian}
          jumlahPenilai={statistikWarto.jumlahPenilai}
          className="w-full max-w-(--max-worker)"
        />

        <Button asChild variant="default" size="lg">
          <Link href={urlVerifikasiWarto}>
            <ShieldCheck aria-hidden />
            Lihat seperti yang dilihat pemindai QR
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-tanah-200 bg-tanah-0">
        <div className="mx-auto flex w-full max-w-(--max-employer) flex-col items-center gap-2 px-4 py-10 text-center">
          <p className="text-h3 text-biru-600">Kita Kerja</p>
          <p className="text-body text-tanah-600">
            Bukti pengalaman untuk pekerja informal Indonesia.
          </p>
          <p className="mikro mt-2 text-tanah-500">
            Fase demo — seluruh data pada halaman ini adalah contoh
          </p>
        </div>
      </footer>
    </div>
  );
}
