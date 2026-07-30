"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CircleCheck,
  Flag,
  MessageSquareText,
  Smartphone,
} from "lucide-react";

import { LangkahOTP } from "@/component/bersama/LangkahOTP";
import { Button } from "@/component/ui/button";

/**
 * Aksi di bawah dokumen kesepakatan (Bagian 6.8):
 * 1. Kirim kode → 6 kotak OTP (LangkahOTP) → tanda "Kesepakatan aktif"
 *    + SATU kalimat penjelasan.
 * 2. Tombol "Pekerjaan selesai" — konfirmasi dua pihak (pemberi kerja
 *    juga harus mengonfirmasi).
 * 3. Tautan laporkan masalah.
 * Semua state client-side, tanpa panggilan API.
 */
export function AksiKesepakatan({ namaPemberi }: { namaPemberi: string }) {
  const [tahap, setTahap] = useState<"kirim" | "otp" | "aktif">("kirim");
  const [selesaiDiminta, setSelesaiDiminta] = useState(false);
  const [laporanTerkirim, setLaporanTerkirim] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      {/* Konfirmasi OTP */}
      <section
        aria-labelledby="judul-otp"
        className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
      >
        {tahap === "aktif" ? (
          <div role="status" className="text-center">
            <p className="flex items-center justify-center gap-2 text-h2 text-tanah-900">
              <BadgeCheck className="size-8 shrink-0 text-aman-600" aria-hidden />
              Kesepakatan aktif
            </p>
            <p className="mt-3 text-body text-tanah-700">
              Kesepakatan ini tercatat. Kalau upah tidak dibayar sesuai
              tanggal, Anda bisa melaporkannya dan laporan itu akan tampil di
              profil pemberi kerja.
            </p>
          </div>
        ) : (
          <>
            <h2
              id="judul-otp"
              className="flex items-center gap-2 text-h3 text-tanah-900"
            >
              <Smartphone className="size-6 shrink-0 text-biru-600" aria-hidden />
              Konfirmasi dengan kode SMS
            </h2>
            <p className="mt-2 text-body text-tanah-600">
              Kedua pihak mengonfirmasi dengan kode yang dikirim ke HP
              masing-masing. Setelah itu kesepakatan tercatat dan aktif.
            </p>
            {tahap === "kirim" ? (
              <Button
                size="lg"
                className="mt-4 w-full"
                onClick={() => setTahap("otp")}
              >
                Kirim kode ke HP saya
              </Button>
            ) : (
              <LangkahOTP
                className="mt-6"
                onSelesai={() => setTahap("aktif")}
                onKirimUlang={() => undefined}
              />
            )}
          </>
        )}
      </section>

      {/* Pekerjaan selesai — konfirmasi dua pihak */}
      <section
        aria-labelledby="judul-selesai"
        className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
      >
        <h2 id="judul-selesai" className="text-h3 text-tanah-900">
          Pekerjaan sudah selesai?
        </h2>
        {selesaiDiminta ? (
          <p
            role="status"
            className="mt-3 flex items-start gap-2 rounded-lg bg-hati-50 p-4 text-body text-tanah-800"
          >
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-hati-600" aria-hidden />
            Konfirmasi Anda tercatat. Pekerjaan baru dinyatakan selesai setelah{" "}
            {namaPemberi} juga mengonfirmasi dari sisinya — jadi kedua pihak
            setuju, bukan satu pihak saja.
          </p>
        ) : (
          <>
            <p className="mt-2 text-body text-tanah-600">
              Tekan tombol ini hanya bila pekerjaan benar-benar selesai.{" "}
              {namaPemberi} juga harus mengonfirmasi — pekerjaan tercatat
              selesai setelah kedua pihak setuju.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-4 w-full"
              onClick={() => setSelesaiDiminta(true)}
            >
              Pekerjaan selesai
            </Button>
          </>
        )}
      </section>

      {/* Laporkan masalah */}
      <section aria-label="Laporkan masalah" className="text-center">
        {laporanTerkirim ? (
          <p
            role="status"
            className="rounded-lg bg-tanah-100 p-4 text-body text-tanah-800"
          >
            Laporan Anda tercatat. Tim Kita Kerja akan menghubungi Anda lewat
            SMS untuk menanyakan kejadiannya dengan tenang.
          </p>
        ) : (
          <Button
            variant="ghost"
            className="min-h-12 text-body text-bahaya-600 underline underline-offset-4"
            onClick={() => setLaporanTerkirim(true)}
          >
            <Flag aria-hidden />
            Laporkan masalah
          </Button>
        )}
        <p className="mt-2 flex items-start justify-center gap-2 px-4 text-label text-tanah-500">
          <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden />
          Laporkan bila upah tidak dibayar sesuai tanggal atau ada masalah
          lain. Laporan akan tampil di profil pemberi kerja.
        </p>
      </section>
    </div>
  );
}
