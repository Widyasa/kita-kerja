"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  CalendarDays,
  Users,
  Quote,
  Search,
  CircleX,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/component/ui/dialog";
import { PenandaRisiko } from "@/component/bersama/PanelSaringanAman";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { BadgeStatusLowongan } from "@/component/pemberi/BadgeStatusLowongan";
import { calonUntuk, lowonganDhika } from "@/component/pemberi/mockPemberi";
import {
  formatRupiah,
  formatTanggal,
  saringanAman,
  type StatusLowongan,
} from "@/lib/mock";

/**
 * /employer/jobs/[id] — kelola lowongan milik Mbak Dhika:
 * detail hasil ekstraksi, status, Saringan Aman ringkas, statistik calon,
 * aksi (tutup lowongan, lihat calon).
 */
export default function HalamanKelolaLowongan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const lwn = lowonganDhika.find((l) => l.id === id);
  const [status, setStatus] = useState<StatusLowongan | null>(lwn?.status ?? null);

  if (!lwn) {
    return (
      <KeadaanKosong
        ikon={Search}
        judul="Lowongan tidak ditemukan"
        penjelasan="Lowongan ini mungkin bukan milik Anda atau sudah dihapus. Kembali ke dasbor untuk melihat lowongan Anda."
        labelAksi="Kembali ke dasbor"
        hrefAksi="/employer"
      />
    );
  }

  const sa = saringanAman.find((s) => s.lowongan_id === lwn.id);
  const calon = calonUntuk(lwn.id);
  const jumlahDilamar = calon.filter((c) => c.lamaran.status === "dilamar").length;
  const jumlahDiundang = calon.filter((c) => c.lamaran.status === "diundang").length;
  const statusTampil = status ?? lwn.status;
  const ditutup = statusTampil === "ditutup";

  const detail: { label: string; nilai: string }[] = [
    { label: "Jenis kerja", nilai: lwn.jenis_kerja.replace("_", " ") },
    { label: "Jumlah pekerja", nilai: `${lwn.jumlah_pekerja} orang` },
    {
      label: "Upah",
      nilai: `${formatRupiah(lwn.upah_ditawarkan)} / ${lwn.satuan_upah === "harian" ? "hari" : lwn.satuan_upah.replace("_", " ")}`,
    },
    { label: "Lokasi", nilai: lwn.lokasi_teks },
    { label: "Mulai", nilai: formatTanggal(lwn.mulai) },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* kepala */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1">{lwn.judul_baku}</h1>
          <BadgeStatusLowongan status={statusTampil} />
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body text-tanah-600">
          <span className="flex items-center gap-1">
            <MapPin className="size-5" aria-hidden />
            {lwn.lokasi_teks}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-5" aria-hidden />
            Mulai {formatTanggal(lwn.mulai)}
          </span>
        </p>
      </header>

      {/* aksi utama */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href={`/employer/jobs/${lwn.id}/candidates`}>
            <Users aria-hidden />
            Lihat calon ({calon.length})
          </Link>
        </Button>
        {!ditutup && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="flex-1">
                <CircleX aria-hidden />
                Tutup lowongan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-h3">Tutup lowongan ini?</DialogTitle>
                <DialogDescription className="text-body text-tanah-600">
                  Lowongan berhenti tampil ke pekerja. Calon yang sudah masuk
                  tetap bisa Anda hubungi dari halaman calon.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Batal</Button>
                <Button variant="destructive" onClick={() => setStatus("ditutup")}>
                  Ya, tutup lowongan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {ditutup && (
        <p role="status" className="rounded-lg bg-tanah-100 p-4 text-body text-tanah-800">
          Lowongan sudah ditutup dan tidak lagi tampil ke pekerja.
        </p>
      )}

      {/* Saringan Aman ringkas */}
      {sa && (
        <section
          aria-labelledby="judul-saringan"
          className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
        >
          <div className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="size-6 text-biru-600" aria-hidden />
            <h2 id="judul-saringan" className="text-h3">
              Saringan Aman
            </h2>
            <PenandaRisiko tingkat={sa.tingkat} />
          </div>
          {sa.temuan.length === 0 ? (
            <p className="text-body text-tanah-600">
              Tidak ada tanda mencurigakan pada tulisan Anda. Pekerja melihat
              lowongan ini sebagai lowongan yang aman.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sa.temuan.map((t, i) => (
                <li key={i} className="rounded-lg bg-tanah-50 p-4">
                  <p className="flex items-start gap-2 text-body text-tanah-700 italic">
                    <Quote className="mt-1 size-4 shrink-0 text-tanah-400" aria-hidden />
                    &ldquo;{t.kutipan}&rdquo;
                  </p>
                  <p className="mt-1 text-label text-tanah-600">{t.penjelasan}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* statistik calon */}
      <section aria-labelledby="judul-statistik" className="flex flex-col gap-3">
        <h2 id="judul-statistik" className="text-h2">
          Calon
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Masuk", nilai: calon.length },
            { label: "Baru melamar", nilai: jumlahDilamar },
            { label: "Diundang", nilai: jumlahDiundang },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-tanah-200 bg-tanah-0 p-4 text-center shadow-1"
            >
              <p className="text-h2 font-bold tabular-nums">{s.nilai}</p>
              <p className="text-label text-tanah-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* detail hasil ekstraksi */}
      <section aria-labelledby="judul-detail" className="flex flex-col gap-3">
        <h2 id="judul-detail" className="text-h2">
          Detail lowongan
        </h2>
        <figure className="rounded-2xl border border-tanah-200 bg-tanah-50 p-5">
          <figcaption className="flex items-center gap-2 text-label font-semibold text-tanah-600">
            <Quote className="size-4" aria-hidden />
            Tulisan asli Anda:
          </figcaption>
          <blockquote className="mt-2 text-body text-tanah-900 italic">
            &ldquo;{lwn.teks_asli}&rdquo;
          </blockquote>
        </figure>
        <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1 sm:grid-cols-2">
          {detail.map((d) => (
            <div key={d.label}>
              <dt className="text-label text-tanah-600">{d.label}</dt>
              <dd className="text-body font-semibold capitalize">{d.nilai}</dd>
            </div>
          ))}
        </dl>
        {lwn.syarat_tersirat.length > 0 && (
          <div className="rounded-2xl border border-biru-600/30 bg-biru-50 p-5">
            <h3 className="text-body font-semibold text-biru-900">
              Syarat tersirat yang tampil ke pekerja
            </h3>
            <ul className="mt-2 flex flex-col gap-1">
              {lwn.syarat_tersirat.map((s, i) => (
                <li key={i} className="text-body text-tanah-900">
                  · {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
