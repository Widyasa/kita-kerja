"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const JUMLAH_BAR = 32;

/**
 * GelombangAudio — kanvas amplitudo (Bagian 4.5).
 * - Mode nyata: membaca AnalyserNode dari MediaStream mikrofon.
 * - Mode simulasi: animasi bar halus bila tidak ada stream (izin ditolak /
 *   tidak ada mic), supaya pengguna tetap tahu "rekaman" berjalan.
 * - prefers-reduced-motion: gambar satu bingkai statis, tanpa animasi.
 */
export function GelombangAudio({
  stream = null,
  aktif,
  className,
}: {
  /** stream mikrofon nyata; null → mode simulasi */
  stream?: MediaStream | null;
  aktif: boolean;
  className?: string;
}) {
  const kanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const kanvas = kanvasRef.current;
    if (!kanvas || !aktif) return;
    const ctx = kanvas.getContext("2d");
    if (!ctx) return;

    const kurangGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = window.devicePixelRatio || 1;
    const lebar = kanvas.clientWidth;
    const tinggi = kanvas.clientHeight;
    kanvas.width = lebar * dpr;
    kanvas.height = tinggi * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let sumber: MediaStreamAudioSourceNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;

    if (stream) {
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      sumber = audioCtx.createMediaStreamSource(stream);
      sumber.connect(analyser);
      data = new Uint8Array(analyser.frequencyBinCount);
    }

    const gambarBar = (nilai: number[]) => {
      ctx.clearRect(0, 0, lebar, tinggi);
      const jarak = lebar / JUMLAH_BAR;
      const lebarBar = Math.max(3, jarak * 0.55);
      ctx.fillStyle = "#d97706"; // kuning-600
      nilai.forEach((v, i) => {
        const h = Math.max(4, v * (tinggi - 8));
        ctx.beginPath();
        ctx.roundRect(i * jarak + (jarak - lebarBar) / 2, (tinggi - h) / 2, lebarBar, h, 3);
        ctx.fill();
      });
    };

    let t = 0;
    const bingkai = () => {
      const nilai: number[] = [];
      if (analyser && data) {
        analyser.getByteFrequencyData(data);
        for (let i = 0; i < JUMLAH_BAR; i++) {
          const idx = Math.floor((i / JUMLAH_BAR) * data.length);
          nilai.push(data[idx] / 255);
        }
      } else {
        t += 0.06;
        for (let i = 0; i < JUMLAH_BAR; i++) {
          // gelombang sinus berlapis — halus, bukan acak kasar
          nilai.push(
            0.25 +
              0.2 * Math.sin(t + i * 0.55) +
              0.15 * Math.sin(t * 1.7 + i * 0.3) +
              0.1 * Math.sin(t * 0.6 + i),
          );
        }
      }
      gambarBar(nilai);
      if (!kurangGerak) raf = requestAnimationFrame(bingkai);
    };
    bingkai(); // bila kurangGerak: satu bingkai statis saja

    return () => {
      cancelAnimationFrame(raf);
      sumber?.disconnect();
      void audioCtx?.close();
    };
  }, [stream, aktif]);

  return (
    <canvas
      ref={kanvasRef}
      aria-hidden
      className={cn("h-16 w-full", !aktif && "opacity-30", className)}
    />
  );
}
