"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CircleCheck, Flag } from "lucide-react";

import { LangkahOTP } from "@/component/bersama/LangkahOTP";
import { Button } from "@/component/ui/button";

/**
 * Aksi di bawah dokumen kesepakatan, sisi pemberi kerja: kirim kode →
 * LangkahOTP → tanda "Kesepakatan aktif" + tautan ke konfirmasi selesai.
 * Terhubung ke /api/agreements/otp.
 */
export function AksiOtp({
  kesepakatanId,
  sudahOtp,
}: {
  kesepakatanId: string;
  sudahOtp: boolean;
}) {
  const [terkonfirmasi, setTerkonfirmasi] = useState(sudahOtp);
  const [tahap, setTahap] = useState<"kirim" | "otp">("kirim");
  const [sibuk, setSibuk] = useState(false);

  async function kirimKode() {
    setSibuk(true);
    try {
      const res = await fetch("/api/agreements/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kesepakatan_id: kesepakatanId, aksi: "kirim" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim kode.");
      setTahap("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  async function verifikasiKode(kode: string) {
    setSibuk(true);
    try {
      const res = await fetch("/api/agreements/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kesepakatan_id: kesepakatanId, aksi: "verifikasi", kode_otp: kode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Kode tidak cocok.");
      setTerkonfirmasi(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  if (terkonfirmasi) {
    return (
      <section
        aria-labelledby="judul-aktif"
        className="flex flex-col gap-4 rounded-2xl border border-aman-600/30 bg-aman-50 p-6"
      >
        <h2 id="judul-aktif" className="flex items-center gap-2 text-h3">
          <CircleCheck className="size-6 shrink-0 text-aman-600" aria-hidden />
          Kesepakatan aktif
        </h2>
        <p className="text-body text-tanah-900">
          Kedua pihak sudah mengonfirmasi dengan kode SMS. Isi kesepakatan
          di atas kini mengikat: pekerja wajib datang dan bekerja sesuai
          lingkup, Anda wajib membayar paling lambat tanggal yang dijanjikan.
        </p>
        <p className="text-body text-tanah-900">
          Setelah pekerjaan selesai, konfirmasi dan beri penilaian — penilaian
          Anda tampil di Kartu Kerja pekerja dan membantunya mendapat kerja
          berikutnya.
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/employer/complete/${kesepakatanId}`}>
            <Flag aria-hidden />
            Pekerjaan sudah selesai
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="judul-otp"
      className="flex flex-col gap-5 rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1"
    >
      <div>
        <h2 id="judul-otp" className="text-h3">
          Konfirmasi kesepakatan
        </h2>
        <p className="mt-1 text-body text-tanah-600">
          Masukkan kode 6 angka yang dikirim lewat SMS ke nomor Anda. Dengan
          memasukkan kode, Anda menyetujui isi kesepakatan di atas — termasuk
          tanggal bayar yang dijanjikan.
        </p>
      </div>
      {tahap === "kirim" ? (
        <Button size="lg" className="w-full" onClick={kirimKode} disabled={sibuk}>
          Kirim kode ke HP saya
        </Button>
      ) : (
        <LangkahOTP onSelesai={verifikasiKode} onKirimUlang={kirimKode} />
      )}
    </section>
  );
}
