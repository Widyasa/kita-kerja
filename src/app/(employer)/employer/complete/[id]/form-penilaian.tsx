"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CircleCheck, Flag, Lock, Send } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Textarea } from "@/component/ui/textarea";
import { PenilaianBintang } from "@/component/pemberi/PenilaianBintang";

/**
 * Konfirmasi pekerjaan selesai + penilaian 1–5, sisi pemberi kerja.
 * Penilaian permanen dan tampil di Kartu Kerja pekerja — dijelaskan dengan
 * jelas SEBELUM pemberi kerja mengirim. Terhubung ke /api/jobs/complete
 * lalu /api/ratings (dalam urutan itu).
 */
export function FormPenilaian({
  kesepakatanId,
  namaPekerja,
}: {
  kesepakatanId: string;
  namaPekerja: string;
}) {
  const [selesai, setSelesai] = useState(false);
  const [nilai, setNilai] = useState<number | null>(null);
  const [catatan, setCatatan] = useState("");
  const [terkirim, setTerkirim] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  async function kirim() {
    if (!selesai || nilai === null) return;
    setSibuk(true);
    try {
      const resSelesai = await fetch("/api/jobs/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kesepakatan_id: kesepakatanId, pihak: "pemberi_kerja" }),
      });
      const jsonSelesai = await resSelesai.json();
      if (!resSelesai.ok) throw new Error(jsonSelesai.pesan || "Gagal menandai selesai.");

      const resNilai = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kesepakatan_id: kesepakatanId,
          skor: nilai,
          catatan: catatan.trim() || undefined,
        }),
      });
      const jsonNilai = await resNilai.json();
      if (!resNilai.ok) throw new Error(jsonNilai.pesan || "Gagal mengirim penilaian.");
      setTerkirim(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

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
    <div className="flex flex-col gap-8">
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
        disabled={!selesai || nilai === null || sibuk}
        onClick={kirim}
      >
        <Send aria-hidden />
        Kirim penilaian
      </Button>
    </div>
  );
}
