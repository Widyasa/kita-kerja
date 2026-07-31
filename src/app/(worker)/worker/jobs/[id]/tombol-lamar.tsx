"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  MessageCircleQuestion,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/component/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/component/ui/dialog";
import type { TingkatRisiko } from "@/lib/mock";

/**
 * Tombol lamar (CTA 56px).
 * - Lowongan biasa: satu ketukan langsung mengirim lamaran.
 * - Lowongan berisiko_tinggi: SATU langkah konfirmasi tambahan (dialog)
 *   yang menampilkan kembali daftar pertanyaan yang disarankan.
 *   Tidak pernah memblokir — pekerja berhak memutuskan sendiri.
 * - Setelah terkirim: umpan balik "Lamaran terkirim" + langkah berikutnya.
 */
export function TombolLamar({
  lowonganId,
  tingkat,
  pertanyaan,
  sudahMelamar,
  punyaKartu,
}: {
  lowonganId: string;
  tingkat: TingkatRisiko;
  pertanyaan: string[];
  /** bila pekerja sudah pernah melamar lowongan ini */
  sudahMelamar: boolean;
  /** bila Kartu Kerja pekerja sudah terbit — menentukan pesan sesudah kirim */
  punyaKartu: boolean;
}) {
  const [terkirim, setTerkirim] = useState(false);
  const [dialogTerbuka, setDialogTerbuka] = useState(false);
  const [mengirim, setMengirim] = useState(false);

  async function kirimLamaran() {
    if (mengirim) return;
    setMengirim(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowongan_id: lowonganId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim lamaran.");
      setTerkirim(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setMengirim(false);
    }
  }

  if (sudahMelamar) {
    return (
      <div className="rounded-2xl border border-tanah-200 bg-tanah-50 p-5 text-center">
        <p className="flex items-center justify-center gap-2 text-body font-bold text-tanah-800">
          <CircleCheck className="size-5 shrink-0 text-aman-600" aria-hidden />
          Anda sudah melamar lowongan ini
        </p>
        <Link
          href="/worker/applications"
          className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
        >
          Pantau status lamaran
          <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    );
  }

  if (terkirim) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-aman-600/30 bg-aman-50 p-5 text-center"
      >
        <p className="flex items-center justify-center gap-2 text-h3 text-tanah-900">
          <CircleCheck className="size-6 shrink-0 text-aman-600" aria-hidden />
          Lamaran terkirim
        </p>
        {/* BUG-041 — jangan menjanjikan pemeriksaan Kartu Kerja pada pekerja
            yang kartunya belum terbit. */}
        <p className="mt-2 text-body text-tanah-700">
          {punyaKartu
            ? "Pemberi kerja akan memeriksa Kartu Kerja Anda. Anda bisa memantau statusnya di halaman Lamaran."
            : "Anda belum punya Kartu Kerja, jadi pemberi kerja belum bisa melihat bukti pengalaman Anda. Selesaikan Ngobrol Kerja agar peluang diterima lebih besar."}
        </p>
        <Button asChild size="lg" className="mt-4 w-full">
          <Link href={punyaKartu ? "/worker/applications" : "/worker/interview"}>
            {punyaKartu ? "Lihat status lamaran" : "Mulai Ngobrol Kerja"}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
        {!punyaKartu && (
          <Link
            href="/worker/applications"
            className="mt-3 inline-flex min-h-11 items-center text-body font-semibold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
          >
            Lihat status lamaran
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        disabled={mengirim}
        onClick={() => {
          if (tingkat === "berisiko_tinggi") {
            setDialogTerbuka(true);
          } else {
            void kirimLamaran();
          }
        }}
      >
        <Send aria-hidden />
        Lamar pekerjaan ini
      </Button>

      {/* Satu langkah konfirmasi untuk lowongan berisiko tinggi */}
      <Dialog open={dialogTerbuka} onOpenChange={setDialogTerbuka}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto bg-tanah-0">
          <DialogHeader>
            <DialogTitle className="text-h3 text-tanah-900">
              Baca dulu sebelum melamar
            </DialogTitle>
            <DialogDescription className="text-body text-tanah-600">
              Lowongan ini ditandai banyak tanda bahaya. Anda tetap berhak
              melamar — keputusan ada di tangan Anda. Tanyakan hal-hal ini dulu
              sebelum setuju apa pun:
            </DialogDescription>
          </DialogHeader>

          <ol className="flex flex-col gap-3">
            {pertanyaan.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg bg-biru-50 p-4"
              >
                <MessageCircleQuestion
                  className="mt-0.5 size-5 shrink-0 text-biru-600"
                  aria-hidden
                />
                <p className="text-body font-semibold text-tanah-900">{q}</p>
              </li>
            ))}
          </ol>

          <DialogFooter className="sm:flex-col">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setDialogTerbuka(false);
                void kirimLamaran();
              }}
            >
              <Send aria-hidden />
              Saya sudah membaca — tetap lamar
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setDialogTerbuka(false)}
            >
              Kembali dulu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
