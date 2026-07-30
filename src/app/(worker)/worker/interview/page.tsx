"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mic, PencilLine } from "lucide-react";

import { KartuPertanyaan } from "@/component/pekerja/KartuPertanyaan";
import { TombolRekam } from "@/component/pekerja/TombolRekam";
import { Button } from "@/component/ui/button";
import { putaranWawancaraWarto } from "@/lib/mock";
import { JawabanSebelumnya } from "./_komponen/JawabanSebelumnya";
import { PesanProses } from "./_komponen/PesanProses";
import {
  KUNCI_PROGRES_NGOBROL,
  type JawabanTersimpan,
  type ProgresNgobrol,
} from "./_komponen/penyimpanan";

/**
 * Ngobrol Kerja (Bagian 6.2) — layar terpenting di aplikasi.
 * Mesin keadaan sisi klien penuh (fase 2, tanpa backend):
 *
 *   pengantar ──"Mulai ngobrol"──► putaran ──rekam──► berpikir ──► putaran …
 *      │                            │  (batas keras 6 → menyusun)
 *      │ izin mic gagal             └──"Sudah cukup" (aktif setelah putaran 3)
 *      ▼                            ▼
 *    gagal (3 pilihan)          menyusun ──► /worker/interview/result
 *
 * Progres disimpan di sessionStorage — tahan refresh di tengah wawancara.
 */

type Tahap = "pengantar" | "putaran" | "berpikir" | "gagal" | "menyusun";

const TOTAL = putaranWawancaraWarto.length; // 6
const LAMA_BERPIKIR_MS = 1500;
const LAMA_MENYUSUN_MS = 2200;

export default function HalamanNgobrolKerja() {
  const router = useRouter();
  const [tahap, setTahap] = useState<Tahap>("pengantar");
  const [jawaban, setJawaban] = useState<JawabanTersimpan[]>([]);
  const [tersimpanDimuat, setTersimpanDimuat] = useState(false);

  // Pulihkan progres dari sessionStorage (tahan refresh) — baca sistem
  // eksternal lalu setState dari callback, bukan sinkron di badan effect.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const mentah = sessionStorage.getItem(KUNCI_PROGRES_NGOBROL);
        if (mentah) {
          const progres = JSON.parse(mentah) as ProgresNgobrol;
          if (Array.isArray(progres.jawaban) && progres.jawaban.length > 0) {
            const terjawab = progres.jawaban.slice(0, TOTAL);
            setJawaban(terjawab);
            setTahap(terjawab.length >= TOTAL ? "menyusun" : "putaran");
          }
        }
      } catch {
        // penyimpanan rusak / tidak tersedia → mulai dari awal
      }
      setTersimpanDimuat(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Simpan progres setiap berubah
  useEffect(() => {
    if (!tersimpanDimuat || tahap === "menyusun") return;
    try {
      if (jawaban.length > 0) {
        sessionStorage.setItem(
          KUNCI_PROGRES_NGOBROL,
          JSON.stringify({ jawaban } satisfies ProgresNgobrol),
        );
      } else {
        sessionStorage.removeItem(KUNCI_PROGRES_NGOBROL);
      }
    } catch {
      // sessionStorage penuh / diblokir — alur tetap jalan tanpa simpan
    }
  }, [jawaban, tahap, tersimpanDimuat]);

  // Minta izin mikrofon lebih dulu, lalu masuk putaran.
  // Gagal total → keadaan GAGAL (tiga pilihan, tanpa galat teknis).
  const mintaIzinLaluMulai = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("mic tidak ada");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setTahap("putaran");
    } catch {
      setTahap("gagal");
    }
  }, []);

  // Rekaman selesai (mic asli atau simulasi) → simpan transkrip mock putaran
  // ini, lalu tampilkan keadaan berpikir.
  const rekamSelesai = useCallback(
    (_blob: Blob | null, _detik: number) => {
      const putaran = putaranWawancaraWarto[jawaban.length];
      if (!putaran) return;
      setJawaban((j) => [...j, { nomor: putaran.nomor, transkrip: putaran.transkrip }]);
      setTahap("berpikir");
    },
    [jawaban.length],
  );

  // Berpikir ~1,5 dtk → transkrip muncul di "jawaban sebelumnya" dan maju ke
  // pertanyaan berikutnya. Putaran ke-6 selesai → batas keras → menyusun.
  useEffect(() => {
    if (tahap !== "berpikir") return;
    const t = setTimeout(() => {
      setTahap(jawaban.length >= TOTAL ? "menyusun" : "putaran");
    }, LAMA_BERPIKIR_MS);
    return () => clearTimeout(t);
  }, [tahap, jawaban.length]);

  // Menyusun → terbit ke halaman hasil, progres wawancara dibersihkan.
  useEffect(() => {
    if (tahap !== "menyusun") return;
    const t = setTimeout(() => {
      try {
        sessionStorage.removeItem(KUNCI_PROGRES_NGOBROL);
      } catch {
        // abaikan
      }
      router.push("/worker/interview/result");
    }, LAMA_MENYUSUN_MS);
    return () => clearTimeout(t);
  }, [tahap, router]);

  const nomorTampil = Math.min(
    jawaban.length + (tahap === "berpikir" ? 0 : 1),
    TOTAL,
  );
  const putaranTampil = putaranWawancaraWarto[nomorTampil - 1];
  // Saat berpikir, transkrip terbaru sengaja BELUM ditampilkan — ia muncul
  // tepat saat pertanyaan berikutnya tampil.
  const jawabanTampil = tahap === "berpikir" ? jawaban.slice(0, -1) : jawaban;
  const bolehSudahCukup = jawaban.length >= 3;

  // ============ MENYUSUN ============
  if (tahap === "menyusun") {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <PesanProses teks="Sebentar ya, saya susun Kartu Kerja Anda…" />
      </div>
    );
  }

  // ============ PENGANTAR + IZIN ============
  if (tahap === "pengantar") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/worker")}>
            <ArrowLeft aria-hidden />
            Kembali
          </Button>
          <p className="mikro text-tanah-500">Langkah 1 dari 3</p>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-h1">Kita ngobrol dulu ya</h1>
          <p className="text-body-lg text-tanah-700">
            Saya akan tanya beberapa hal tentang pekerjaan Bapak/Ibu. Jawab pakai
            suara saja, tidak perlu menulis.
          </p>
          <p className="text-body-lg text-tanah-700">
            Boleh pakai bahasa daerah. Kira-kira 3 menit.
          </p>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50 text-biru-600">
            <Mic className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-body font-semibold text-tanah-900">
              Kita perlu izin memakai mikrofon
            </p>
            <p className="mt-1 text-body text-tanah-600">
              Rekaman hanya untuk membuat Kartu Kerja Anda. Bisa dihapus kapan
              saja.
            </p>
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={mintaIzinLaluMulai}>
          <Mic aria-hidden />
          Mulai ngobrol
        </Button>

        {/* Jalur manual ditawarkan SEJAK AWAL, bukan setelah gagal */}
        <Button variant="link" asChild className="min-h-12 w-full">
          <Link href="/worker/interview/manual">
            Lebih suka menulis sendiri? Isi manual
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    );
  }

  // ============ GAGAL — tepat tiga pilihan, tanpa galat teknis ============
  if (tahap === "gagal") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-h1">Mikrofonnya belum bisa dipakai</h1>
          <p className="text-body-lg text-tanah-700">
            Tidak apa-apa, ini sering terjadi. Pilih salah satu di bawah ini ya.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={mintaIzinLaluMulai}>
            <Mic aria-hidden />
            Coba rekam lagi
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => setTahap("putaran")}
          >
            <ArrowRight aria-hidden />
            Lanjut ke pertanyaan berikutnya
          </Button>
          <Button size="lg" variant="ghost" className="w-full" asChild>
            <Link href="/worker/interview/manual">
              <PencilLine aria-hidden />
              Isi manual saja
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ============ PUTARAN WAWANCARA (+ BERPIKIR) ============
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/worker")}>
          <ArrowLeft aria-hidden />
          Keluar
        </Button>
      </div>

      <KartuPertanyaan
        nomor={nomorTampil}
        total={TOTAL}
        pertanyaan={putaranTampil.pertanyaan}
      />

      {jawabanTampil.length > 0 && <JawabanSebelumnya jawaban={jawabanTampil} />}

      {tahap === "berpikir" ? (
        <PesanProses teks="Sebentar ya, saya dengarkan dulu…" />
      ) : (
        <TombolRekam mode="tahan" onSelesai={rekamSelesai} className="py-2" />
      )}

      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          disabled={!bolehSudahCukup}
          onClick={() => setTahap("menyusun")}
        >
          Sudah cukup, buat kartu saya
          <ArrowRight aria-hidden />
        </Button>
        {!bolehSudahCukup && (
          <p className="text-label text-tanah-500">
            Bisa dipakai setelah 3 pertanyaan terjawab.
          </p>
        )}
      </div>
    </div>
  );
}
