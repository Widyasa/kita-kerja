"use client";

import { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Quote,
  Sparkles,
  CircleHelp,
  Megaphone,
  TriangleAlert,
  CircleCheck,
  PencilLine,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { PenandaUpah } from "@/component/bersama/PenandaUpah";
import { RingkasanEkstraksi } from "@/component/pemberi/RingkasanEkstraksi";
import {
  CONTOH_TEKS_LOWONGAN,
  KUNCI_TEKS_LOWONGAN,
  ekstrakLowongan,
  hitungBelumJelas,
  hitungKelengkapan,
  saringTeks,
  type BidangLowongan,
} from "@/component/pemberi/ekstraksi";
import {
  acuanUntuk,
  formatRupiah,
  statusUpah,
  wilayah,
} from "@/lib/mock";

/**
 * /employer/post/result — Bagian 6.6 + 14:
 * - "Tulisan Anda:" sebagai konteks
 * - hasil ekstraksi sebagai bidang yang dapat diedit
 * - "Yang saya simpulkan" (syarat tersirat) dan "Yang belum jelas"
 *   (menggerakkan skor kelengkapan) — dua bagian yang MENONJOL
 * - PenandaUpah + nominal acuan SEBELUM tayang, bahasa tidak menghakimi
 * - ?moderasi=1 → keadaan MODERASI-TAHAN: apa yang perlu diperbaiki,
 *   dua jalan (perbaiki / tayangkan dengan penanda) — bukan penolakan mentah
 */

type Keadaan = "sunting" | "tayang" | "tayang_dengan_penanda";

function IsiHasil() {
  const router = useRouter();
  const params = useSearchParams();
  const moderasi = params.get("moderasi") === "1";

  const [keadaan, setKeadaan] = useState<Keadaan>("sunting");
  // Komponen ini dirender hanya di klien (dynamic ssr:false), jadi aman
  // membaca sessionStorage langsung di inisialisasi state — tanpa effect.
  const [bidang, setBidang] = useState<BidangLowongan>(() => {
    const tersimpan = sessionStorage.getItem(KUNCI_TEKS_LOWONGAN);
    const teks = tersimpan && tersimpan.trim() ? tersimpan : CONTOH_TEKS_LOWONGAN;
    return ekstrakLowongan(teks);
  });

  const belumJelas = useMemo(() => hitungBelumJelas(bidang), [bidang]);
  const kelengkapan = useMemo(() => hitungKelengkapan(bidang), [bidang]);

  const wl = wilayah.find((w) => w.id === bidang.wilayahId) ?? wilayah[0];
  const acuan = acuanUntuk(bidang.keahlianId, bidang.wilayahId);
  const upahAngka = Number(bidang.upah) || 0;
  // upah bulanan dibandingkan sebagai ekuivalen harian
  const upahHarian =
    bidang.satuanUpah === "bulanan" ? Math.round(upahAngka / 26) : upahAngka;
  const upahDiBawahAcuan =
    upahAngka > 0 &&
    bidang.satuanUpah !== "borongan" &&
    statusUpah(upahHarian, acuan.acuan_harian) !== "sesuai_acuan";
  const temuan = saringTeks(bidang.teksAsli);

  // ---------- keadaan sesudah tayang ----------
  if (keadaan === "tayang" || keadaan === "tayang_dengan_penanda") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl border border-tanah-200 bg-tanah-0 p-8 text-center shadow-1">
        <span className="flex size-16 items-center justify-center rounded-full bg-aman-50">
          <CircleCheck className="size-8 text-aman-600" aria-hidden />
        </span>
        <h1 className="text-h1">Lowongan Anda sudah tayang</h1>
        <p className="max-w-md text-body-lg text-tanah-600">
          Pekerja di sekitar {wl.nama} sekarang bisa melihat &ldquo;{bidang.judul}&rdquo;.
          Calon yang cocok akan muncul di dasbor Anda.
        </p>
        {keadaan === "tayang_dengan_penanda" && (
          <p className="max-w-md rounded-lg bg-hati-50 p-4 text-body text-tanah-900">
            Lowongan tayang dengan penanda pengingat untuk pekerja. Bagian yang
            tadi ditandai tetap bisa Anda perbaiki kapan saja.
          </p>
        )}
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/employer">Kembali ke dasbor</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-h1">Periksa dulu, lalu tayangkan</h1>
        <p className="mt-2 text-body-lg text-tanah-600">
          Ini yang saya tangkap dari tulisan Anda. Semua bisa diubah sebelum
          tayang.
        </p>
      </header>

      {/* teks asli sebagai konteks */}
      <figure className="rounded-2xl border border-tanah-200 bg-tanah-50 p-5">
        <figcaption className="flex items-center gap-2 text-label font-semibold text-tanah-600">
          <Quote className="size-4" aria-hidden />
          Tulisan Anda:
        </figcaption>
        <blockquote className="mt-2 text-body-lg text-tanah-900 italic">
          &ldquo;{bidang.teksAsli}&rdquo;
        </blockquote>
      </figure>

      {/* ---------- keadaan MODERASI-TAHAN ---------- */}
      {moderasi && (
        <section
          aria-labelledby="judul-moderasi"
          className="flex flex-col gap-5 rounded-2xl border border-bahaya-600/30 bg-bahaya-50 p-6"
        >
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-7 shrink-0 text-bahaya-600" aria-hidden />
            <div>
              <h2 id="judul-moderasi" className="text-h2">
                Lowongan ini perlu diperbaiki dulu
              </h2>
              <p className="mt-1 text-body text-tanah-900">
                Saringan Aman menemukan beberapa bagian yang bisa membuat pekerja
                curiga. Ini bukan penolakan — perbaiki bagian di bawah, atau
                tetap tayangkan dengan penanda pengingat untuk pekerja.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-label font-semibold text-tanah-700">
              Yang perlu diperbaiki:
            </h3>
            <ul className="mt-2 flex flex-col gap-3">
              {temuan.map((t, i) => (
                <li key={i} className="rounded-lg bg-tanah-0 p-4 shadow-1">
                  <p className="text-body text-tanah-700 italic">&ldquo;{t.kutipan}&rdquo;</p>
                  <p className="mt-1 text-label text-tanah-600">{t.penjelasan}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => router.replace("/employer/post/result")}
            >
              <PencilLine aria-hidden />
              Perbaiki lowongan
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => setKeadaan("tayang_dengan_penanda")}
            >
              <Megaphone aria-hidden />
              Tayangkan dengan penanda
            </Button>
          </div>
        </section>
      )}

      {/* ---------- dua bagian kecerdasan — MENONJOL ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Yang saya simpulkan */}
        <section
          aria-labelledby="judul-simpulan"
          className="flex flex-col gap-3 rounded-2xl border border-biru-600/30 bg-biru-50 p-6"
        >
          <h2 id="judul-simpulan" className="flex items-center gap-2 text-h3 text-biru-900">
            <Sparkles className="size-6 shrink-0 text-biru-600" aria-hidden />
            Yang saya simpulkan
          </h2>
          <p className="text-label text-tanah-600">
            Syarat yang tidak Anda tulis, tapi jelas dimaksudkan. Akan tampil di
            lowongan.
          </p>
          {bidang.syaratTersirat.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {bidang.syaratTersirat.map((s, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-tanah-0 px-4 py-3 text-body font-semibold text-tanah-900 shadow-1"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-tanah-0 px-4 py-3 text-body text-tanah-600 shadow-1">
              Tidak ada syarat tersirat dari tulisan ini.
            </p>
          )}
        </section>

        {/* Yang belum jelas */}
        <section
          aria-labelledby="judul-belum-jelas"
          className="flex flex-col gap-3 rounded-2xl border border-kuning-600/40 bg-kuning-50 p-6"
        >
          <h2 id="judul-belum-jelas" className="flex items-center gap-2 text-h3 text-kuning-800">
            <CircleHelp className="size-6 shrink-0 text-kuning-700" aria-hidden />
            Yang belum jelas
          </h2>
          <p className="text-label text-tanah-600">
            Lengkapi lewat bidang di bawah — kelengkapan lowongan Anda{" "}
            <span className="font-bold text-tanah-900">
              {Math.round(kelengkapan * 100)}%
            </span>
            . Lowongan yang lengkap terisi rata-rata lebih cepat.
          </p>
          {/* bilah kelengkapan */}
          <div
            role="progressbar"
            aria-valuenow={Math.round(kelengkapan * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Kelengkapan lowongan"
            className="h-3 overflow-hidden rounded-pill bg-tanah-0"
          >
            <div
              className="h-full rounded-pill bg-kuning-600 transition-all motion-safe:duration-(--duration-medium)"
              style={{ width: `${Math.max(8, kelengkapan * 100)}%` }}
            />
          </div>
          {belumJelas.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {belumJelas.map((b, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-tanah-0 px-4 py-3 text-body text-tanah-900 shadow-1"
                >
                  {b}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-tanah-0 px-4 py-3 text-body font-semibold text-aman-600 shadow-1">
              Lengkap — tidak ada yang belum jelas.
            </p>
          )}
        </section>
      </div>

      {/* ---------- bidang hasil ekstraksi yang dapat diedit ---------- */}
      <section aria-labelledby="judul-bidang" className="flex flex-col gap-4">
        <h2 id="judul-bidang" className="text-h2">
          Detail lowongan
        </h2>
        <RingkasanEkstraksi
          bidang={bidang}
          onUbah={(patch) => setBidang({ ...bidang, ...patch })}
        />
      </section>

      {/* ---------- PenandaUpah sebelum tayang — tidak menghakimi ---------- */}
      {upahDiBawahAcuan && (
        <section aria-labelledby="judul-upah" className="flex flex-col gap-3">
          <h2 id="judul-upah" className="sr-only">
            Perbandingan upah dengan acuan
          </h2>
          <PenandaUpah ditawarkan={upahHarian} acuan={acuan} wilayah={wl} />
          <p className="rounded-lg bg-hati-50 p-4 text-body text-tanah-900">
            Acuan harian untuk pekerjaan ini di {wl.nama} sekitar{" "}
            <span className="font-bold">{formatRupiah(acuan.acuan_harian)}</span>.
            Lowongan di bawah acuan biasanya lebih lama terisi. Anda tetap bebas
            menentukan upah.
          </p>
        </section>
      )}

      {/* ---------- CTA ---------- */}
      {!moderasi && (
        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={() => setKeadaan("tayang")}>
            <Megaphone aria-hidden />
            Tayangkan lowongan
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/employer/post">Kembali dan tulis ulang</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

const IsiHasilDinamis = dynamic(() => Promise.resolve(IsiHasil), {
  ssr: false,
  loading: () => (
    <p className="text-body text-tanah-600" role="status">
      Membaca tulisan Anda…
    </p>
  ),
});

export default function HalamanHasilEkstraksi() {
  return (
    <Suspense
      fallback={
        <p className="text-body text-tanah-600" role="status">
          Membaca tulisan Anda…
        </p>
      }
    >
      <IsiHasilDinamis />
    </Suspense>
  );
}
