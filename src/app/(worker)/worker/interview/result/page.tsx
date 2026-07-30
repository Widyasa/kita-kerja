"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/component/ui/button";
import {
  kartuWarto,
  keahlianWarto,
  type KartuKeahlian as TKartuKeahlian,
} from "@/lib/mock";
import { KartuKonfirmasi } from "../_komponen/KartuKonfirmasi";
import {
  KUNCI_KEAHLIAN_MANUAL,
  KUNCI_PROGRES_NGOBROL,
  type KeahlianManualTersimpan,
} from "../_komponen/penyimpanan";

/**
 * Konfirmasi profil (Bagian 6.3) — SATU keahlian per kartu, bukan formulir
 * panjang. Pekerja merasa MEMERIKSA, bukan menandatangani.
 *
 * Sumber data:
 * - Dari Ngobrol Kerja → profil hasil ekstrasi Warto (mock). Lapis ditampilkan
 *   "Diklaim" karena ini keahlian hasil obrolan yang belum dibuktikan riwayat.
 * - Dari jalur manual (sessionStorage) → keahlian yang ditulis sendiri.
 */
export default function HalamanHasilNgobrol() {
  const router = useRouter();
  const [dariManual, setDariManual] = useState(false);
  const [daftar, setDaftar] = useState<TKartuKeahlian[]>(() =>
    keahlianWarto.map((k) => ({
      ...k,
      lapis: "diklaim" as const,
      dikonfirmasi_pekerja: false,
    })),
  );

  // Bila pekerja datang dari jalur manual, tampilkan keahlian tulisannya.
  // Baca sessionStorage (sistem eksternal) lalu setState dari callback.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const mentah = sessionStorage.getItem(KUNCI_KEAHLIAN_MANUAL);
        if (!mentah) return;
        const manual = JSON.parse(mentah) as KeahlianManualTersimpan[];
        if (!Array.isArray(manual) || manual.length === 0) return;
        setDaftar(
          manual.map((m) => ({
            id: m.id,
            kartu_id: "kk-baru",
            keahlian_id: null,
            nama_diajukan: m.nama,
            sebutan_pekerja: m.nama,
            level: m.level,
            kutipan_bukti: m.cerita,
            keyakinan: 1,
            sumber: "manual" as const,
            dikonfirmasi_pekerja: false,
            lapis: "diklaim" as const,
          })),
        );
        setDariManual(true);
      } catch {
        // penyimpanan rusak → tampilkan hasil wawancara mock
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const tandai = (id: string, nilai: boolean) =>
    setDaftar((d) =>
      d.map((k) => (k.id === id ? { ...k, dikonfirmasi_pekerja: nilai } : k)),
    );

  const simpanPerbaikan = (
    id: string,
    nama: string,
    level: TKartuKeahlian["level"],
  ) =>
    setDaftar((d) =>
      d.map((k) =>
        k.id === id
          ? {
              ...k,
              keahlian_id: null,
              nama_diajukan: nama,
              level,
              dikonfirmasi_pekerja: true,
            }
          : k,
      ),
    );

  const terbitkan = () => {
    try {
      sessionStorage.removeItem(KUNCI_PROGRES_NGOBROL);
      sessionStorage.removeItem(KUNCI_KEAHLIAN_MANUAL);
    } catch {
      // abaikan
    }
    router.push("/worker/card");
  };

  const terperiksa = daftar.filter((k) => k.dikonfirmasi_pekerja).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="mikro text-right text-tanah-500">Langkah 3 dari 3</p>
        <h1 className="text-h1">Ini yang saya dengar</h1>
        <p className="text-body-lg text-tanah-700">
          Periksa satu-satu ya. Kalau ada yang salah, bisa diperbaiki.
        </p>
      </header>

      {/* Ringkasan profil */}
      <section
        aria-label="Ringkasan"
        className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
      >
        <p className="mikro text-biru-600">Ringkasan</p>
        <p className="mt-2 text-body-lg text-tanah-900">
          {dariManual
            ? "Keahlian di bawah ini Bapak/Ibu tulis sendiri."
            : kartuWarto.ringkasan}
        </p>
        {!dariManual && (
          <p className="mt-1 text-body text-tanah-600">
            Pengalaman {kartuWarto.pengalaman_tahun} tahun · Konstruksi · Malang
            Raya
          </p>
        )}
      </section>

      {/* Satu keahlian per kartu */}
      <div className="flex flex-col gap-4">
        {daftar.map((k) => (
          <KartuKonfirmasi
            key={k.id}
            keahlian={k}
            onBetul={() => tandai(k.id, true)}
            onUbahLagi={() => tandai(k.id, false)}
            onSimpan={(nama, level) => simpanPerbaikan(k.id, nama, level)}
          />
        ))}
      </div>

      <footer className="flex flex-col gap-2 pt-2">
        <p className="text-center text-label text-tanah-600" aria-live="polite">
          Sudah diperiksa {terperiksa} dari {daftar.length} keahlian
        </p>
        <Button size="lg" variant="aksen" className="w-full" onClick={terbitkan}>
          Terbitkan Kartu Kerja saya
        </Button>
      </footer>
    </div>
  );
}
