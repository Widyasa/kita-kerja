import Link from "next/link";
import {
  BriefcaseBusiness,
  Users,
  Handshake,
  SquarePlus,
  Inbox,
  Clock,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { PenandaUpah } from "@/component/bersama/PenandaUpah";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { SapaanWaktu } from "@/component/bersama/SapaanWaktu";
import { BadgeStatusLowongan } from "@/component/pemberi/BadgeStatusLowongan";
import { createClient } from "@/lib/supabase/server-client";
import { dasborPemberi, type RingkasLowongan } from "@/lib/data/pemberi";
import { profilPengguna } from "@/lib/data/profil";
import { formatRupiah, formatTanggal, inisialkanNamaBelakang, upahTeks } from "@/lib/mock/utils";
import type { StatusLamaran } from "@/lib/mock/types";

const LABEL_STATUS_LAMARAN: Record<StatusLamaran, string> = {
  dilamar: "Melamar",
  diundang: "Diundang",
  ditolak: "Tidak diteruskan",
  disepakati: "Disepakati",
};

/**
 * /employer — dasbor pemberi kerja.
 * Ringkasan (lowongan aktif, calon masuk, kesepakatan berjalan),
 * daftar lowongan aktif, calon terbaru, kesepakatan menunggu konfirmasi.
 * Server component — seluruh isi diturunkan dari data Supabase.
 */

function PenandaUpahRingkas({ lowongan: l }: { lowongan: RingkasLowongan }) {
  if (l.satuan_upah !== "harian" || !l.acuan || l.upah_ditawarkan === null) {
    if (l.upah_ditawarkan === null || l.satuan_upah === null) return null;
    return (
      <p className="text-label text-tanah-600">
        Upah {formatRupiah(l.upah_ditawarkan)} /{" "}
        {l.satuan_upah === "bulanan" ? "bulan" : l.satuan_upah}
      </p>
    );
  }
  return (
    <PenandaUpah
      ringkas
      ditawarkan={l.upah_ditawarkan}
      acuan={l.acuan}
      wilayahNama={l.wilayah_nama ?? "wilayah ini"}
    />
  );
}

export default async function HalamanDasborPemberi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { profil } = await profilPengguna(user!.id);
  const { lowongan, calonTerbaru, kesepakatan } = await dasborPemberi(user!.id);

  const aktif = lowongan.filter((l) => l.status === "tayang");
  const berjalan = kesepakatan.filter((k) => k.status === "berjalan");
  const menunggu = kesepakatan.filter((k) => k.status === "menunggu");

  const ringkasan = [
    { label: "Lowongan aktif", nilai: aktif.length, ikon: BriefcaseBusiness },
    { label: "Calon masuk", nilai: calonTerbaru.length, ikon: Users },
    { label: "Kesepakatan berjalan", nilai: berjalan.length, ikon: Handshake },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* sapaan */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SapaanWaktu nama={profil.nama} />
          <p className="text-body-lg text-tanah-600">
            Ini kabar lowongan dan pekerja Anda hari ini.
          </p>
        </div>
        <Button asChild size="lg" variant="aksen">
          <Link href="/employer/post">
            <SquarePlus aria-hidden />
            Pasang lowongan
          </Link>
        </Button>
      </header>

      {/* ringkasan */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ringkasan.map((r) => {
          const Ikon = r.ikon;
          return (
            <div
              key={r.label}
              className="flex items-center gap-4 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50">
                <Ikon className="size-6 text-biru-600" aria-hidden />
              </span>
              <div>
                <p className="text-h2 font-bold tabular-nums">{r.nilai}</p>
                <p className="text-label text-tanah-600">{r.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* lowongan aktif */}
      <section aria-labelledby="judul-lowongan" className="flex flex-col gap-4">
        <h2 id="judul-lowongan" className="text-h2">
          Lowongan Anda
        </h2>
        {aktif.length === 0 ? (
          <KeadaanKosong
            ikon={Inbox}
            judul="Belum ada lowongan yang tayang"
            penjelasan="Tulis kebutuhan Anda seperti mengirim pesan biasa — kami yang merapikan jadi lowongan."
            labelAksi="Pasang lowongan sekarang"
            hrefAksi="/employer/post"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {aktif.map((l) => {
              return (
                <li key={l.id}>
                  <Link
                    href={`/employer/jobs/${l.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-h3">{l.judul_baku}</h3>
                      <BadgeStatusLowongan status={l.status} />
                      <span className="ml-auto flex items-center gap-1 text-label font-semibold text-biru-600">
                        Kelola
                        <ChevronRight className="size-4" aria-hidden />
                      </span>
                    </div>
                    <p className="text-body text-tanah-600">
                      {l.lokasi_teks} · mulai {l.mulai ? formatTanggal(l.mulai) : "belum ditentukan"} ·{" "}
                      {l.jumlah_calon > 0 ? (
                        <span className="font-semibold text-tanah-900">
                          {l.jumlah_calon} calon masuk
                        </span>
                      ) : (
                        "belum ada calon"
                      )}
                    </p>
                    <PenandaUpahRingkas lowongan={l} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* calon terbaru */}
      <section aria-labelledby="judul-calon" className="flex flex-col gap-4">
        <h2 id="judul-calon" className="text-h2">
          Calon terbaru
        </h2>
        {calonTerbaru.length === 0 ? (
          <KeadaanKosong
            ikon={Users}
            judul="Belum ada calon baru"
            penjelasan="Calon akan muncul di sini begitu ada pekerja yang melamar ke lowongan Anda."
            labelAksi="Lihat lowongan saya"
            hrefAksi={aktif[0] ? `/employer/jobs/${aktif[0].id}` : "/employer/post"}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {calonTerbaru.map((c) => {
              return (
                <li key={c.lamaran_id}>
                  <Link
                    href={`/employer/jobs/${c.lowongan_id}/candidates`}
                    className="flex items-center gap-4 rounded-2xl border border-tanah-200 bg-tanah-0 p-4 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-kuning-100 text-body font-bold text-kuning-800">
                      {c.nama.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-semibold">
                        {inisialkanNamaBelakang(c.nama)}
                        <span className="ml-2 text-label font-semibold text-biru-600">
                          {LABEL_STATUS_LAMARAN[c.status]}
                        </span>
                      </p>
                      <p className="truncate text-label text-tanah-600">
                        untuk “{c.judul_lowongan}”
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-tanah-400" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* kesepakatan menunggu konfirmasi */}
      <section aria-labelledby="judul-kesepakatan" className="flex flex-col gap-4">
        <h2 id="judul-kesepakatan" className="text-h2">
          Kesepakatan
        </h2>
        {menunggu.length === 0 && berjalan.length === 0 ? (
          <KeadaanKosong
            ikon={Handshake}
            judul="Belum ada kesepakatan"
            penjelasan="Bila Anda dan pekerja sudah sepakat, buat kesepakatan dari daftar calon agar janji upah dan tanggal bayar tercatat jelas."
            labelAksi="Lihat calon"
            hrefAksi={aktif[0] ? `/employer/jobs/${aktif[0].id}/candidates` : "/employer/post"}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {[...menunggu, ...berjalan].map((k) => {
              return (
                <li key={k.id}>
                  <Link
                    href={`/employer/agreements/${k.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-tanah-200 bg-tanah-0 p-4 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50">
                      {k.status === "menunggu" ? (
                        <Clock className="size-6 text-hati-600" aria-hidden />
                      ) : (
                        <Handshake className="size-6 text-biru-600" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-semibold">
                        {inisialkanNamaBelakang(k.nama_pekerja)}
                        {k.status === "menunggu" && (
                          <span className="ml-2 text-label font-semibold text-hati-600">
                            menunggu konfirmasi
                          </span>
                        )}
                      </p>
                      <p className="text-label text-tanah-600">
                        Bayar dijanjikan {formatTanggal(k.tanggal_bayar_dijanjikan)} ·{" "}
                        {upahTeks(k.upah_disepakati, k.satuan)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-tanah-400" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

    </div>
  );
}
