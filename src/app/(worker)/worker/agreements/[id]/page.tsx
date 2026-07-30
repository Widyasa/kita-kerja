import Link from "next/link";
import { ArrowLeft, CalendarCheck, FileSearch } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { kesepakatanUntukPihak, type KesepakatanTampil } from "@/lib/data/kesepakatan";
import { formatTanggal, upahTeks } from "@/lib/mock/utils";

import { AksiKesepakatan } from "./aksi-kesepakatan";

function Baris({ label, isi }: { label: string; isi: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-tanah-200 py-4 last:border-b-0">
      <dt className="text-label text-tanah-600">{label}</dt>
      <dd className="text-body font-semibold text-tanah-900">{isi}</dd>
    </div>
  );
}

function DokumenKesepakatan({ k }: { k: KesepakatanTampil }) {
  return (
    <article className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
      <header className="border-b border-tanah-200 pb-4">
        <p className="text-label text-tanah-600">Kesepakatan kerja antara</p>
        <p className="mt-1 text-h3 text-tanah-900">
          {k.nama_pekerja} dan {k.nama_pemberi}
        </p>
        {k.judul_lowongan && (
          <p className="mt-1 text-body text-tanah-600">{k.judul_lowongan}</p>
        )}
      </header>

      {/* Tanggal pembayaran dijanjikan — baris paling menonjol */}
      <div className="mt-4 rounded-xl bg-kuning-100 p-5 text-center shadow-1">
        <p className="flex items-center justify-center gap-2 text-body font-semibold text-tanah-800">
          <CalendarCheck className="size-5 shrink-0 text-kuning-700" aria-hidden />
          Upah dijanjikan dibayar
        </p>
        <p className="mt-1 text-display font-extrabold text-tanah-900">
          {formatTanggal(k.tanggal_bayar_dijanjikan)}
        </p>
      </div>

      <dl className="mt-2">
        <Baris label="Lingkup pekerjaan" isi={k.lingkup} />
        <Baris label="Upah" isi={upahTeks(k.upah_disepakati, k.satuan)} />
        <Baris label="Tanggal mulai" isi={k.mulai ? formatTanggal(k.mulai) : "Belum ditentukan"} />
        <Baris
          label="Tanggal selesai"
          isi={
            k.selesai
              ? formatTanggal(k.selesai)
              : "Sampai pekerjaan selesai dikonfirmasi kedua pihak"
          }
        />
      </dl>
    </article>
  );
}

/**
 * Kesepakatan Kerja (`/worker/agreements/[id]`) — Bagian 6.8:
 * dokumen sederhana yang bisa dibaca orang awam; tanggal pembayaran
 * dijanjikan adalah baris paling menonjol; di bawahnya LangkahOTP,
 * tombol "Pekerjaan selesai" (dua pihak), dan tautan laporkan masalah.
 */
export default async function HalamanKesepakatan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const k = await kesepakatanUntukPihak(id, user!.id);

  if (!k) {
    return (
      <KeadaanKosong
        ikon={FileSearch}
        judul="Kesepakatan tidak ditemukan"
        penjelasan="Tautan ini mungkin sudah tidak berlaku. Kesepakatan aktif Anda bisa dilihat dari beranda."
        labelAksi="Kembali ke beranda"
        hrefAksi="/worker"
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Navigasi kembali">
        <Link
          href="/worker"
          className="inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
        >
          <ArrowLeft className="size-5" aria-hidden />
          Beranda
        </Link>
      </nav>

      <header>
        <h1 className="text-h1 text-tanah-900">Kesepakatan Kerja</h1>
        <p className="mt-1 text-body-lg text-tanah-600">
          Baca pelan-pelan — ini catatan resmi pekerjaan Anda.
        </p>
      </header>

      <DokumenKesepakatan k={k} />

      <AksiKesepakatan
        kesepakatanId={k.id}
        namaPemberi={k.nama_pemberi}
        sudahOtp={k.otp_pekerja_sudah}
        statusAwal={k.status}
        pekerjaanSelesai={k.pekerjaan_selesai}
      />
    </div>
  );
}
