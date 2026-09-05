"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Mic, PencilLine } from "lucide-react";

import { LabelSection } from "@/component/bersama/LabelSection";
import { KartuPertanyaan } from "@/component/pekerja/KartuPertanyaan";
import { TombolRekam } from "@/component/pekerja/TombolRekam";
import { Button } from "@/component/ui/button";
import { JawabanSebelumnya } from "./_komponen/JawabanSebelumnya";
import { PesanProses } from "./_komponen/PesanProses";
import {
  KUNCI_PROGRES_NGOBROL,
  type JawabanTersimpan,
  type PertanyaanTersimpan,
  type ProgresNgobrol,
} from "./_komponen/penyimpanan";

/**
 * Ngobrol Kerja (Bagian 6.2) — layar terpenting di aplikasi.
 * Rekaman suara ditranskrip via Groq Whisper, lalu Gemini (text-only)
 * memutuskan pertanyaan berikutnya. Progres sesi (sesi_id + pertanyaan
 * berjalan + riwayat pertanyaan) disimpan di sessionStorage agar tahan
 * refresh; jawaban asli tersimpan di server.
 *
 *   pengantar ──"Mulai ngobrol"──► mulai sesi (API) ──► putaran ──rekam──►
 *   berpikir (transkrip+jawab via API) ──► putaran … (batas keras 6 → menyusun)
 *      │ izin mic gagal                              └──"Sudah cukup" (aktif setelah putaran 3)
 *      ▼
 *    gagal (3 pilihan)                            menyusun ──► /worker/interview/result
 *
 * "Ulangi pertanyaan ini" ada di tiap item panel Jawaban sebelumnya (bukan
 * cuma jawaban terakhir) — mengulang pertanyaan N membuang jawaban N dan
 * semua sesudahnya, karena pertanyaan-pertanyaan itu di-generate AI
 * berdasarkan jawaban lama yang sekarang dibatalkan. Maks 1x per nomor.
 */

type Tahap = "pengantar" | "putaran" | "berpikir" | "gagal" | "menyusun";

const TOTAL_MAKS = 6;
const LAMA_BERPIKIR_MIN_MS = 900;

async function blobKeBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let biner = "";
  for (let i = 0; i < bytes.length; i++) biner += String.fromCharCode(bytes[i]);
  return btoa(biner);
}

export default function HalamanNgobrolKerja() {
  const router = useRouter();
  const [tahap, setTahap] = useState<Tahap>("pengantar");
  const [memuatAwal, setMemuatAwal] = useState(true);
  const [sesiId, setSesiId] = useState<string | null>(null);
  const [pertanyaan, setPertanyaan] = useState("");
  const [putaran, setPutaran] = useState(0);
  const [jawaban, setJawaban] = useState<JawabanTersimpan[]>([]);
  const [riwayatPertanyaan, setRiwayatPertanyaan] = useState<PertanyaanTersimpan[]>([]);
  const [mengirim, setMengirim] = useState(false);
  // Nomor pertanyaan yang sudah pernah diulang — maks 1x per nomor.
  const [sudahDiulang, setSudahDiulang] = useState<Set<number>>(new Set());
  /** Pesan gagal AI (model/kuota/dll.) — tampilkan CTA isi manual, bukan toast saja. */
  const [galatAi, setGalatAi] = useState<string | null>(null);

  // Pulihkan progres sesi dari sessionStorage (tahan refresh).
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const mentah = sessionStorage.getItem(KUNCI_PROGRES_NGOBROL);
        if (mentah) {
          const progres = JSON.parse(mentah) as ProgresNgobrol;
          if (progres.sesiId) {
            setSesiId(progres.sesiId);
            setPertanyaan(progres.pertanyaan);
            setPutaran(progres.putaran);
            setJawaban(progres.jawaban ?? []);
            setRiwayatPertanyaan(progres.riwayatPertanyaan ?? []);
            setSudahDiulang(new Set(progres.sudahDiulang ?? []));
            setTahap("putaran");
          }
        }
      } catch {
        // penyimpanan rusak / tidak tersedia → mulai dari awal
      }
      setMemuatAwal(false);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Simpan progres setiap berubah
  useEffect(() => {
    if (memuatAwal || !sesiId || tahap === "menyusun") return;
    try {
      sessionStorage.setItem(
        KUNCI_PROGRES_NGOBROL,
        JSON.stringify({
          sesiId,
          pertanyaan,
          putaran,
          jawaban,
          riwayatPertanyaan,
          sudahDiulang: Array.from(sudahDiulang),
        } satisfies ProgresNgobrol),
      );
    } catch {
      // sessionStorage penuh / diblokir — alur tetap jalan tanpa simpan
    }
  }, [sesiId, pertanyaan, putaran, jawaban, riwayatPertanyaan, sudahDiulang, tahap, memuatAwal]);

  const bersihkanProgres = () => {
    try {
      sessionStorage.removeItem(KUNCI_PROGRES_NGOBROL);
    } catch {
      // abaikan
    }
  };

  // Minta izin mikrofon, lalu mulai sesi wawancara di server.
  const mintaIzinLaluMulai = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("mic tidak ada");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setTahap("gagal");
      return;
    }

    try {
      const res = await fetch("/api/ai/interview/start", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal memulai wawancara.");
      setSesiId(json.data.sesi_id);
      setPertanyaan(json.data.pertanyaan);
      // 0 jawaban terjawab — ini pertanyaan pertama (beda makna dari
      // `putaran` di respons /answer, yang berarti jumlah jawaban terjawab).
      setPutaran(0);
      setJawaban([]);
      setRiwayatPertanyaan([{ nomor: 1, teks: json.data.pertanyaan }]);
      setSudahDiulang(new Set());
      setTahap("putaran");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }, []);

  const selesaikanWawancara = useCallback(
    async (idSesi: string) => {
      setTahap("menyusun");
      try {
        const res = await fetch("/api/ai/interview/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sesi_id: idSesi }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.pesan || "Gagal menyusun Kartu Kerja.");
        bersihkanProgres();
        router.push("/worker/interview/result");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setTahap("putaran");
      }
    },
    [router],
  );

  // Rekaman selesai → kirim audio ke server untuk ditranskrip + dijawab.
  const rekamSelesai = useCallback(
    async (blob: Blob | null, _detik: number) => {
      if (!sesiId || mengirim) return;
      if (!blob) {
        toast.error("Rekaman tidak tersedia di perangkat ini. Coba lagi atau pakai jalur isi manual.");
        return;
      }

      setMengirim(true);
      setTahap("berpikir");
      setGalatAi(null);
      const mulai = Date.now();
      try {
        const audio_base64 = await blobKeBase64(blob);
        const res = await fetch("/api/ai/interview/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sesi_id: sesiId,
            audio_base64,
            mime_type: blob.type || "audio/webm",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.pesan || "Gagal mengirim jawaban.");

        const data = json.data as {
          transkrip: string;
          pertanyaan: string;
          putaran: number;
          sudah_cukup: boolean;
        };

        setJawaban((j) => [...j, { nomor: data.putaran, transkrip: data.transkrip }]);
        setRiwayatPertanyaan((r) => [
          ...r.filter((p) => p.nomor !== data.putaran + 1),
          { nomor: data.putaran + 1, teks: data.pertanyaan },
        ]);
        setPertanyaan(data.pertanyaan);
        setPutaran(data.putaran);

        // jaga jeda "berpikir" minimal supaya tidak terasa berkedip
        const sisa = LAMA_BERPIKIR_MIN_MS - (Date.now() - mulai);
        if (sisa > 0) await new Promise((r) => setTimeout(r, sisa));

        if (data.sudah_cukup || data.putaran >= TOTAL_MAKS) {
          await selesaikanWawancara(sesiId);
        } else {
          setTahap("putaran");
        }
      } catch (err) {
        const pesan =
          err instanceof Error ? err.message : "Terjadi kesalahan.";
        toast.error(pesan);
        setGalatAi(pesan);
        setTahap("putaran");
      } finally {
        setMengirim(false);
      }
    },
    [sesiId, mengirim, selesaikanWawancara],
  );

  // "Ulangi pertanyaan ini" — bisa dipilih dari pertanyaan mana pun yang
  // sudah dijawab, bukan cuma yang terakhir. Membuang jawaban nomor itu dan
  // semua sesudahnya (pertanyaan-pertanyaan itu di-generate dari jawaban
  // lama yang sekarang dibatalkan), lalu kembali merekam dari situ.
  // Maks 1x per nomor (dilacak di klien via `sudahDiulang`).
  const ulangiPertanyaanNomor = useCallback(
    async (nomor: number) => {
      if (!sesiId || mengirim || sudahDiulang.has(nomor)) return;
      const teksPertanyaan = riwayatPertanyaan.find((p) => p.nomor === nomor)?.teks;
      if (!teksPertanyaan) return;

      setMengirim(true);
      try {
        const res = await fetch("/api/ai/interview/undo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sesi_id: sesiId, target_nomor: nomor }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.pesan || "Gagal mengulang pertanyaan.");

        setJawaban((j) => j.filter((x) => x.nomor < nomor));
        setRiwayatPertanyaan((r) => r.filter((p) => p.nomor <= nomor));
        setPertanyaan(teksPertanyaan);
        setPutaran(nomor - 1);
        setSudahDiulang((s) => new Set(s).add(nomor));
        setTahap("putaran");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setMengirim(false);
      }
    },
    [sesiId, mengirim, sudahDiulang, riwayatPertanyaan],
  );

  const bolehSudahCukup = putaran >= 3 && !mengirim;

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
      <div className="flex flex-col gap-12">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/worker")}>
            <ArrowLeft aria-hidden />
            Kembali
          </Button>
          <LabelSection label="Langkah 1 dari 3" />
        </div>

        <div className="grid grid-cols-[1.05fr_0.95fr] items-start gap-14 max-lg:grid-cols-1 max-lg:gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.04] font-extrabold tracking-[-0.025em] text-balance">
              Kita ngobrol dulu ya
            </h1>
            <p className="max-w-[42ch] text-body-lg text-balance text-tanah-700">
              Saya akan tanya beberapa hal tentang pekerjaan Bapak/Ibu. Jawab
              pakai suara saja, tidak perlu menulis. Kira-kira 3 menit.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:border-l lg:border-tanah-200 lg:pl-14">
            <div className="flex items-start gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50 text-biru-600">
                <Mic className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-body font-semibold text-tanah-900">
                  Kita perlu izin memakai mikrofon
                </p>
                <p className="mt-1 text-body text-tanah-600">
                  Rekaman hanya untuk membuat Kartu Kerja Anda. Bisa dihapus
                  kapan saja.
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
        </div>
      </div>
    );
  }

  // ============ GAGAL — tepat tiga pilihan, tanpa galat teknis ============
  if (tahap === "gagal") {
    return (
      <div className="grid grid-cols-[1.05fr_0.95fr] items-start gap-14 max-lg:grid-cols-1 max-lg:gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.04] font-extrabold tracking-[-0.025em] text-balance">
            Mikrofonnya belum bisa dipakai
          </h1>
          <p className="max-w-[42ch] text-body-lg text-balance text-tanah-700">
            Tidak apa-apa, ini sering terjadi. Pilih salah satu di bawah ini
            ya.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:border-l lg:border-tanah-200 lg:pl-14">
          <Button size="lg" className="w-full" onClick={mintaIzinLaluMulai}>
            <Mic aria-hidden />
            Coba rekam lagi
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
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/worker")}>
          <ArrowLeft aria-hidden />
          Keluar
        </Button>
      </div>

      <div className="grid grid-cols-[1.1fr_0.9fr] items-start gap-14 max-lg:grid-cols-1 max-lg:gap-8">
        <div className="flex flex-col gap-6">
          <KartuPertanyaan
            nomor={Math.min(putaran + 1, TOTAL_MAKS)}
            total={TOTAL_MAKS}
            pertanyaan={pertanyaan}
          />

          {tahap === "berpikir" ? (
            <PesanProses teks="Sebentar ya, saya dengarkan dulu…" />
          ) : (
            <TombolRekam mode="tahan" onSelesai={rekamSelesai} className="py-2" />
          )}

          {galatAi && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-hati-600/25 bg-hati-50 p-4"
            >
              <p className="text-body text-tanah-900">{galatAi}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/worker/interview/manual">
                  <PencilLine aria-hidden />
                  Isi manual saja
                </Link>
              </Button>
            </div>
          )}

          <div className="flex flex-col items-start gap-1">
            <Button
              variant="ghost"
              disabled={!bolehSudahCukup}
              onClick={() => sesiId && selesaikanWawancara(sesiId)}
            >
              Sudah cukup, buat kartu saya
              <ArrowRight aria-hidden />
            </Button>
            {putaran < 3 && (
              <p className="text-label text-tanah-500">
                Bisa dipakai setelah 3 pertanyaan terjawab.
              </p>
            )}
          </div>
        </div>

        {/* jawaban terekam — panel ledger di kolom kanan (desktop),
            mengalir di bawah tombol rekam (HP); tiap item bisa "Ulangi" */}
        {jawaban.length > 0 && (
          <aside className="lg:border-l lg:border-tanah-200 lg:pl-14">
            <JawabanSebelumnya
              jawaban={jawaban}
              nomorSudahDiulang={sudahDiulang}
              onUlangi={tahap === "putaran" ? ulangiPertanyaanNomor : undefined}
              ulangiNonaktif={mengirim}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
