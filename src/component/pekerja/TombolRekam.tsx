"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { GelombangAudio } from "./GelombangAudio";

const MAKS_DETIK = 60;
const JARAK_BATAL_PX = 64;

type ModeRekam = "tahan" | "ketuk";

/**
 * TombolRekam (Bagian 4.5) — aksi utama di setiap layar input pekerja.
 * - Bulat 88px, kuning-600, ikon mic 32px, label di bawah.
 * - Mode "tahan": tekan-tahan (pointer down/up — mencakup sentuh DAN tetikus),
 *   lepas untuk kirim, geser ke atas untuk batal. Keyboard: tahan Spasi/Enter.
 * - Mode "ketuk": tekan sekali mulai, sekali lagi selesai — untuk pengguna
 *   yang kesulitan menahan lama.
 * - Mikrofon nyata (getUserMedia + MediaRecorder); bila izin ditolak / tidak
 *   ada mic → gelombang simulasi, hasil blob = null.
 * - Penghitung detik maks 60, cincin denyut (motion-safe), target sentuh 88px.
 */
export function TombolRekam({
  mode = "tahan",
  onSelesai,
  onBatal,
  className,
}: {
  mode?: ModeRekam;
  /** blob=null pada mode simulasi (mic tidak tersedia) */
  onSelesai?: (blob: Blob | null, detik: number) => void;
  onBatal?: () => void;
  className?: string;
}) {
  const [merekam, setMerekam] = useState(false);
  const [akanBatal, setAkanBatal] = useState(false);
  const [detik, setDetik] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [simulasi, setSimulasi] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const potonganRef = useRef<Blob[]>([]);
  const awalYRef = useRef(0);
  const mulaiWaktuRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // cermin state yang dibaca di handler/timer tanpa stale closure
  const merekamRef = useRef(false);
  const akanBatalRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const bersihkanTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const selesai = useCallback(
    (kirim: boolean) => {
      if (!merekamRef.current) return;
      bersihkanTimer();
      merekamRef.current = false;
      akanBatalRef.current = false;

      const durasi = Math.min(
        MAKS_DETIK,
        Math.max(1, Math.round((Date.now() - mulaiWaktuRef.current) / 1000)),
      );
      const rec = recorderRef.current;
      setMerekam(false);
      setAkanBatal(false);
      setDetik(0);

      const rapikanStream = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setStream(null);
      };

      if (rec && rec.state !== "inactive") {
        rec.onstop = () => {
          rapikanStream();
          if (kirim) {
            onSelesai?.(
              new Blob(potonganRef.current, { type: rec.mimeType }),
              durasi,
            );
          } else {
            onBatal?.();
          }
        };
        rec.stop();
      } else {
        rapikanStream();
        if (kirim) onSelesai?.(null, durasi); // mode simulasi
        else onBatal?.();
      }
      recorderRef.current = null;
    },
    [onSelesai, onBatal],
  );

  const mulai = useCallback(async () => {
    if (merekamRef.current) return;
    merekamRef.current = true;
    potonganRef.current = [];
    mulaiWaktuRef.current = Date.now();
    setDetik(0);
    setAkanBatal(false);
    akanBatalRef.current = false;

    let streamBaru: MediaStream | null = null;
    try {
      streamBaru = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(streamBaru);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) potonganRef.current.push(e.data);
      };
      rec.start();
      recorderRef.current = rec;
      setSimulasi(false);
    } catch {
      // izin ditolak / tidak ada mic → gelombang simulasi, rekaman dummy
      setSimulasi(true);
    }
    streamRef.current = streamBaru;
    setStream(streamBaru);
    setMerekam(true);

    timerRef.current = setInterval(() => {
      const d = Math.floor((Date.now() - mulaiWaktuRef.current) / 1000);
      setDetik(d);
      if (d >= MAKS_DETIK) selesai(true); // batas 60 detik
    }, 250);
  }, [selesai]);

  useEffect(() => () => bersihkanTimer(), []);

  function tekanTurun(e: React.PointerEvent<HTMLButtonElement>) {
    if (mode !== "tahan") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    awalYRef.current = e.clientY;
    void mulai();
  }

  function tekanGerak(e: React.PointerEvent<HTMLButtonElement>) {
    if (mode !== "tahan" || !merekamRef.current) return;
    const batal = awalYRef.current - e.clientY > JARAK_BATAL_PX;
    akanBatalRef.current = batal;
    setAkanBatal(batal);
  }

  function tekanLepas() {
    if (mode !== "tahan" || !merekamRef.current) return;
    selesai(!akanBatalRef.current);
  }

  function klik() {
    if (mode !== "ketuk") return;
    if (merekamRef.current) selesai(true);
    else void mulai();
  }

  const labelBawah = merekam
    ? mode === "tahan"
      ? akanBatal
        ? "Lepas untuk membatalkan"
        : "Lepas untuk kirim, geser ke atas untuk batal"
      : "Sedang merekam — tekan lagi untuk selesai"
    : mode === "tahan"
      ? "Tekan dan tahan untuk bicara"
      : "Tekan sekali untuk mulai, sekali lagi untuk selesai";

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* area umpan balik saat merekam */}
      <div
        aria-hidden={!merekam}
        className={cn(
          "flex w-full flex-col items-center gap-2 overflow-hidden transition-all",
          merekam ? "max-h-32 opacity-100" : "max-h-0 opacity-0",
        )}
        style={{ transitionDuration: "var(--duration-medium)" }}
      >
        <p className="text-display tabular-nums" aria-live="off">
          {detik}
          <span className="text-h3 text-tanah-500"> / {MAKS_DETIK} dtk</span>
        </p>
        <GelombangAudio stream={stream} aktif={merekam} className="w-full max-w-xs" />
        {simulasi && merekam && (
          <p className="text-label text-tanah-500">
            Mode simulasi — mikrofon tidak tersedia di perangkat ini.
          </p>
        )}
      </div>

      {/* tombol 88px + cincin denyut */}
      <div className="relative">
        {merekam && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-kuning-600/40 motion-safe:animate-ping"
          />
        )}
        <button
          type="button"
          aria-pressed={merekam}
          aria-label={merekam ? "Sedang merekam. " + labelBawah : labelBawah}
          onPointerDown={tekanTurun}
          onPointerMove={tekanGerak}
          onPointerUp={tekanLepas}
          onPointerCancel={tekanLepas}
          onClick={klik}
          onKeyDown={(e) => {
            // keyboard: mode tahan = tahan Spasi/Enter; mode ketuk = klik bawaan
            if (mode !== "tahan" || e.repeat) return;
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              void mulai();
            }
          }}
          onKeyUp={(e) => {
            if (mode !== "tahan") return;
            if ((e.key === " " || e.key === "Enter") && merekamRef.current) {
              selesai(true);
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            "relative flex size-22 cursor-pointer touch-none items-center justify-center rounded-full shadow-3 transition-colors",
            "focus-visible:outline-none focus-visible:ring-[4px] focus-visible:ring-biru-600/50 focus-visible:ring-offset-2",
            merekam
              ? "bg-bahaya-600 text-tanah-0"
              : "bg-kuning-600 text-tanah-900 hover:bg-kuning-500",
          )}
          style={{ transitionDuration: "var(--duration-fast)" }}
        >
          {merekam ? (
            akanBatal ? (
              <Trash2 className="size-8" aria-hidden />
            ) : (
              <Square className="size-8 fill-current" aria-hidden />
            )
          ) : (
            <Mic className="size-8" aria-hidden />
          )}
        </button>
      </div>

      <p
        aria-live="polite"
        className={cn(
          "max-w-xs text-center text-label",
          merekam ? "font-semibold text-tanah-900" : "text-tanah-600",
        )}
      >
        {labelBawah}
      </p>
    </div>
  );
}
