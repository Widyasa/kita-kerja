import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mic, OctagonAlert, SearchX } from "lucide-react";

import { Button } from "@/component/ui/button";
import { LabelSection } from "@/component/bersama/LabelSection";
import { BarisLowongan } from "@/component/publik/BarisLowongan";
import { LembarArsip, SeksiArsip } from "@/component/publik/LembarArsip";
import { SaringanLowongan } from "@/component/publik/SaringanLowongan";
import {
  daftarLowonganPublik,
  wilayahBerlowongan,
  type LowonganPublik,
} from "@/lib/data/lowongan-publik";
import type { JenisKerja } from "@/lib/mock/types";

export const metadata: Metadata = {
  title: "Lowongan kerja informal yang sedang tayang — Kita Kerja",
  description:
    "Lihat lowongan kerja harian, borongan, dan paruh waktu di sekitar Anda. Setiap lowongan sudah diperiksa Saringan Aman dan dibandingkan dengan acuan Upah Terang. Tanpa perlu mendaftar.",
};

const JENIS_SAH: JenisKerja[] = [
  "harian",
  "borongan",
  "paruh_waktu",
  "menginap",
];

function bacaJenis(nilai: string | undefined): JenisKerja | undefined {
  return JENIS_SAH.find((j) => j === nilai);
}

/**
 * Daftar lowongan publik (`/lowongan`) — HANYA BACA.
 *
 * Ada supaya seseorang bisa menilai apakah platform ini berguna sebelum
 * menyerahkan nomor HP-nya: lowongan nyata, upah nyata, penanda Saringan Aman
 * nyata, tanpa akun. Melamar tetap butuh masuk — itu satu-satunya yang digerbang.
 *
 * Lowongan berisiko_tinggi TIDAK disembunyikan (Bagian 12) — dipindah ke
 * kelompok bawah dengan pembatas dan penjelasan.
 */
export default async function HalamanLowonganPublik({
  searchParams,
}: {
  searchParams: Promise<{ wilayah?: string; jenis?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const filter = {
    wilayah: sp.wilayah || undefined,
    jenis: bacaJenis(sp.jenis),
    q: sp.q?.trim() || undefined,
  };

  const [semua, wilayah] = await Promise.all([
    daftarLowonganPublik(filter),
    wilayahBerlowongan(),
  ]);

  const biasa = semua.filter((l) => l.saringan?.tingkat !== "berisiko_tinggi");
  const berisiko = semua.filter(
    (l) => l.saringan?.tingkat === "berisiko_tinggi",
  );

  return (
    <LembarArsip>
      {/* ============ JUDUL HALAMAN ============ */}
      <SeksiArsip awal ruang="kustom" className="pt-12 pb-10 sm:pt-16 sm:pb-12">
        <LabelSection label="Papan lowongan terbuka" />
        <div className="mt-6 grid gap-x-14 gap-y-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="max-w-[16ch] text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance text-tanah-900">
              Pekerjaan yang sedang dicari orang
            </h1>
            <p className="text-body-lg mt-5 max-w-[52ch] text-pretty text-tanah-600">
              Semua lowongan di bawah ini sudah lewat Saringan Aman, dan upahnya
              dibandingkan dengan acuan Upah Terang di wilayahnya. Anda boleh
              membaca semuanya tanpa mendaftar.
            </p>
          </div>

          <Button
            asChild
            variant="aksen"
            size="lg"
            className="w-full justify-self-start sm:w-fit lg:mb-1"
          >
            <Link href="/register">
              <Mic aria-hidden />
              Buat Kartu Kerja
            </Link>
          </Button>
        </div>
      </SeksiArsip>

      {/* ============ SARINGAN ============ */}
      <div className="px-5 sm:px-8 lg:px-[100px]">
        <SaringanLowongan
          wilayah={wilayah}
          terpilih={{ wilayah: sp.wilayah, jenis: sp.jenis, q: sp.q }}
          jumlahHasil={semua.length}
        />
      </div>

      {/* ============ DAFTAR ============ */}
      <SeksiArsip ruang="kustom" className="border-t-0 pt-4 pb-14 sm:pt-6 sm:pb-16">
        {semua.length === 0 ? (
          <TidakAdaHasil adaSaringan={Boolean(sp.wilayah || sp.jenis || sp.q)} />
        ) : (
          <>
            <ul className="divide-y divide-tanah-200">
              {biasa.map((lw) => (
                <li key={lw.id}>
                  <BarisLowongan lowongan={lw} />
                </li>
              ))}
            </ul>

            {berisiko.length > 0 && <KelompokBerisiko lowongan={berisiko} />}
          </>
        )}
      </SeksiArsip>

      {/* ============ AJAKAN ============ */}
      <SeksiArsip terang aria-labelledby="ajakan-daftar">
        <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2
              id="ajakan-daftar"
              className="text-h1 max-w-[20ch] text-balance"
            >
              Melamar butuh satu hal: bukti yang bisa diperiksa
            </h2>
            <p className="text-body-lg mt-5 max-w-[48ch] text-pretty text-tanah-600">
              Ceritakan pengalaman Anda dengan suara selama tiga menit. Kita
              Kerja mengubahnya jadi Kartu Kerja — dan dari situ Anda bisa
              melamar lowongan mana pun di halaman ini.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="aksen" size="lg">
              <Link href="/register">
                <Mic aria-hidden />
                Saya cari kerja
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/cara-kerja">
                Pelajari caranya
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </SeksiArsip>
    </LembarArsip>
  );
}

function TidakAdaHasil({ adaSaringan }: Readonly<{ adaSaringan: boolean }>) {
  return (
    <div className="flex flex-col items-start gap-4 border-y border-dashed border-tanah-300 py-14">
      <span className="flex size-14 items-center justify-center rounded-full bg-tanah-100">
        <SearchX className="size-7 text-tanah-500" aria-hidden />
      </span>
      <h2 className="text-h2 text-balance">
        {adaSaringan
          ? "Tidak ada lowongan yang cocok dengan saringan itu"
          : "Belum ada lowongan tayang hari ini"}
      </h2>
      <p className="text-body max-w-[52ch] text-pretty text-tanah-600">
        {adaSaringan
          ? "Coba longgarkan wilayah atau jenis kerjanya. Lowongan baru masuk setiap hari, jadi simpan halaman ini dan periksa lagi besok."
          : "Lowongan baru diperiksa Saringan Aman sebelum tayang, jadi daftar ini sengaja bergerak pelan. Buat Kartu Kerja Anda dulu supaya siap saat lowongan yang cocok muncul."}
      </p>
      <div className="mt-2 flex flex-wrap gap-4">
        {adaSaringan && (
          <Button asChild variant="outline" size="lg">
            <Link href="/lowongan">Lihat semua lowongan</Link>
          </Button>
        )}
        <Button asChild variant="aksen" size="lg">
          <Link href="/register">
            <Mic aria-hidden />
            Buat Kartu Kerja
          </Link>
        </Button>
      </div>
    </div>
  );
}

function KelompokBerisiko({
  lowongan,
}: Readonly<{ lowongan: LowonganPublik[] }>) {
  return (
    <section aria-labelledby="judul-berisiko" className="mt-14">
      <div className="flex items-start gap-4 border-t-2 border-bahaya-600/40 bg-bahaya-50 p-5">
        <OctagonAlert
          className="mt-0.5 size-6 shrink-0 text-bahaya-600"
          aria-hidden
        />
        <div>
          <h2 id="judul-berisiko" className="text-h3 text-tanah-900">
            Ditandai banyak tanda bahaya
          </h2>
          <p className="text-label mt-1 max-w-[62ch] text-pretty text-tanah-600">
            Lowongan berikut tetap ditampilkan karena Anda berhak memutuskan
            sendiri. Buka detailnya, baca temuan Saringan Aman, dan tanyakan
            pertanyaan yang disarankan sebelum menghubungi siapa pun.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-tanah-200">
        {lowongan.map((lw) => (
          <li key={lw.id}>
            <BarisLowongan lowongan={lw} />
          </li>
        ))}
      </ul>
    </section>
  );
}
