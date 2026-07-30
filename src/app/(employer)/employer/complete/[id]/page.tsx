"use client";

import { use, useState } from "react";
import Link from "next/link";
import { CircleCheck, Flag, Lock, Search, Send } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Textarea } from "@/component/ui/textarea";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { PenilaianBintang } from "@/component/pemberi/PenilaianBintang";
import {
  cariKesepakatanDhika,
  kesepakatanDhika,
} from "@/component/pemberi/mockPemberi";
import {
  formatRupiah,
  formatTanggal,
  inisialkanNamaBelakang,
  pengguna,
} from "@/lib/mock";

/**
 * /employer/complete/[id] — konfirmasi pekerjaan selesai + penilaian 1–5.
 * Penilaian permanen dan tampil di Kartu Kerja pekerja — dijelaskan dengan
 * jelas SEBELUM pemberi kerja mengirim.
 */
export default function HalamanKonfirmasiSelesai({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const k = cariKesepakatanDhika(id) ?? kesepakatanDhika[0];
  const [selesai, setSelesai] = useState(false);
  const [nilai, setNilai] = useState<number | null>(null);
  const [catatan, setCatatan] = useState("");
  const [terkirim, setTerkirim] = useState(false);

  if (!k) {
    return (
      <KeadaanKosong
        ikon={Search}
        judul="Kesepakatan tidak ditemukan"
        penjelasan="Kembali ke dasbor untuk melihat kesepakatan Anda."
        labelAksi="Kembali ke dasbor"
        hrefAksi="/employer"
      />
    );
  }

  const pekerja = pengguna.find((p) => p.id === k.pekerja_id);
  const namaPekerja = pekerja ? inisialkanNamaBelakang(pekerja.nama) : "pekerja";

  if (terkirim) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl border border-tanah-200 bg-tanah-0 p-8 text-center shadow-1">
        <span className="flex size-16 items-center justify-center rounded-full bg-aman-50">
          <CircleCheck className="size-8 text-aman-600" aria-hidden />
        </span>
        <h1 className="text-h1">Penilaian terkirim</h1>
        <p className="max-w-md text-body-lg text-tanah-600">
          Terima kasih. Penilaian {nilai} bintang untuk {namaPekerja} kini tampil
          di Kartu Kerjanya dan membantunya mendapat pekerjaan berikutnya.
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/employer">Kembali ke dasbor</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">Konfirmasi pekerjaan selesai</h1>
        <p className="text-body-lg text-tanah-600">
          {namaPekerja} · upah {formatRupiah(k.upah_disepakati)} /{" "}
          {k.satuan === "harian" ? "hari" : "bulan"} · dibayar dijanjikan{" "}
          {formatTanggal(k.tanggal_bayar_dijanjikan)}
        </p>
      </header>

      {/* langkah 1: konfirmasi selesai */}
      <section
        aria-labelledby="judul-selesai"
        className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1"
      >
        <h2 id="judul-selesai" className="text-h3">
          1. Pekerjaan sudah selesai?
        </h2>
        <button
          type="button"
          role="switch"
          aria-checked={selesai}
          onClick={() => setSelesai((s) => !s)}
          className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 text-button font-semibold transition-colors duration-(--duration-fast) focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/50 focus-visible:ring-offset-2 ${
            selesai
              ? "border-aman-600 bg-aman-50 text-tanah-900"
              : "border-tanah-300 bg-tanah-0 text-tanah-700 hover:bg-tanah-50"
          }`}
        >
          {selesai ? (
            <CircleCheck className="size-6 text-aman-600" aria-hidden />
          ) : (
            <Flag className="size-6 text-tanah-500" aria-hidden />
          )}
          {selesai ? "Ya, pekerjaan sudah selesai" : "Tandai pekerjaan selesai"}
        </button>
      </section>

      {/* langkah 2: penilaian bintang besar */}
      <section
        aria-labelledby="judul-penilaian"
        className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1"
      >
        <h2 id="judul-penilaian" className="text-h3">
          2. Bagaimana hasil kerja {namaPekerja}?
        </h2>
        <PenilaianBintang nilai={nilai} onUbah={setNilai} />
      </section>

      {/* langkah 3: catatan opsional */}
      <section
        aria-labelledby="judul-catatan"
        className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1"
      >
        <h2 id="judul-catatan" className="text-h3">
          3. Catatan (boleh dikosongkan)
        </h2>
        <Textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="mis. Rapi dan datang tepat waktu."
          aria-label="Catatan penilaian (opsional)"
          className="min-h-28"
        />
      </section>

      {/* penjelasan permanen — WAJIB sebelum kirim */}
      <p className="flex items-start gap-3 rounded-xl bg-kuning-50 p-4 text-body text-tanah-900">
        <Lock className="mt-0.5 size-6 shrink-0 text-kuning-700" aria-hidden />
        <span>
          Penilaian tidak bisa diubah setelah dikirim — ini yang membuatnya
          dipercaya. Penilaian Anda akan tampil di Kartu Kerja {namaPekerja}.
        </span>
      </p>

      <Button
        size="lg"
        className="w-full"
        disabled={!selesai || nilai === null}
        onClick={() => setTerkirim(true)}
      >
        <Send aria-hidden />
        Kirim penilaian
      </Button>
    </div>
  );
}
