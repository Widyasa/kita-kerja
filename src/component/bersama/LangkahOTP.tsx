"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const JUMLAH_KOTAK = 6;
const DETIK_KIRIM_ULANG = 60;

/**
 * LangkahOTP — enam kotak angka (Bagian 4.5).
 * - Tempel otomatis (paste 6 angka mengisi semua kotak)
 * - Auto-advance setelah isi, backspace mundur ke kotak sebelumnya
 * - Hitung mundur kirim ulang 60 detik
 * - Target sentuh 48px+ per kotak, inputMode numeric, keyboard navigable
 */
export function LangkahOTP({
  onSelesai,
  onKirimUlang,
  className,
}: {
  /** dipanggil sekali saat 6 digit terisi lengkap */
  onSelesai?: (kode: string) => void;
  onKirimUlang?: () => void;
  className?: string;
}) {
  const [digit, setDigit] = useState<string[]>(Array(JUMLAH_KOTAK).fill(""));
  const [sisaDetik, setSisaDetik] = useState(DETIK_KIRIM_ULANG);
  const kotakRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (sisaDetik <= 0) return;
    const timer = setTimeout(() => setSisaDetik((d) => d - 1), 1000);
    return () => clearTimeout(timer);
  }, [sisaDetik]);

  function isi(digitBaru: string[], fokusKe: number) {
    setDigit(digitBaru);
    kotakRef.current[fokusKe]?.focus();
    const kode = digitBaru.join("");
    if (kode.length === JUMLAH_KOTAK && digitBaru.every((d) => d !== "")) {
      onSelesai?.(kode);
    }
  }

  function ubahSatu(i: number, nilai: string) {
    const angka = nilai.replace(/\D/g, "");
    if (!angka) {
      const baru = [...digit];
      baru[i] = "";
      setDigit(baru);
      return;
    }
    // ketik/tempel lebih dari satu angka di satu kotak → sebar
    const baru = [...digit];
    const potong = angka.slice(0, JUMLAH_KOTAK - i).split("");
    potong.forEach((a, j) => {
      baru[i + j] = a;
    });
    const fokus = Math.min(i + potong.length, JUMLAH_KOTAK - 1);
    isi(baru, fokus);
  }

  function tempel(i: number, teks: string) {
    const angka = teks.replace(/\D/g, "").slice(0, JUMLAH_KOTAK - i);
    if (!angka) return;
    const baru = [...digit];
    angka.split("").forEach((a, j) => {
      baru[i + j] = a;
    });
    isi(baru, Math.min(i + angka.length, JUMLAH_KOTAK - 1));
  }

  function tuts(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && digit[i] === "" && i > 0) {
      const baru = [...digit];
      baru[i - 1] = "";
      isi(baru, i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      kotakRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < JUMLAH_KOTAK - 1) {
      kotakRef.current[i + 1]?.focus();
    }
  }

  function kirimUlang() {
    setSisaDetik(DETIK_KIRIM_ULANG);
    setDigit(Array(JUMLAH_KOTAK).fill(""));
    kotakRef.current[0]?.focus();
    onKirimUlang?.();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div
        className="flex justify-center gap-2"
        role="group"
        aria-label="Kode 6 angka dari SMS"
      >
        {digit.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              kotakRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={JUMLAH_KOTAK - i}
            value={d}
            onChange={(e) => ubahSatu(i, e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              tempel(i, e.clipboardData.getData("text"));
            }}
            onKeyDown={(e) => tuts(i, e)}
            aria-label={`Angka ke-${i + 1}`}
            className={cn(
              "size-12 rounded-md border bg-tanah-0 text-center text-h3 font-bold shadow-1 outline-none",
              "focus-visible:border-biru-600 focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
              d ? "border-biru-600 text-biru-600" : "border-tanah-300",
            )}
          />
        ))}
      </div>

      <p className="text-center text-label text-tanah-600">
        Kode dikirim ke email Anda.{" "}
        {sisaDetik > 0 ? (
          <>
            Kirim ulang dalam{" "}
            <span className="font-bold tabular-nums">{sisaDetik} detik</span>
          </>
        ) : (
          <button
            type="button"
            onClick={kirimUlang}
            className="inline-flex min-h-12 items-center px-2 font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
          >
            Kirim ulang kode
          </button>
        )}
      </p>
    </div>
  );
}
