"use client";

import { useEffect, useState } from "react";

/**
 * Sapaan sesuai jam lokal pengguna.
 * Teks awal "Selamat datang" dirender di server, lalu diganti setelah
 * mount supaya tidak terjadi ketidakcocokan hidrasi.
 *
 * BUG-035 — dipakai bersama oleh dasbor pekerja dan pemberi kerja. Sebelumnya
 * pekerja disapa "Selamat sore, ..." sementara pemberi kerja "Halo, ..."
 * karena komponen ini hanya ada di route group (worker).
 */
export function SapaanWaktu({ nama }: { nama: string }) {
  const [sapaan, setSapaan] = useState("Selamat datang");

  useEffect(() => {
    // Ditunda satu tick agar bukan setState sinkron di dalam effect
    // (aturan react-hooks/set-state-in-effect); semantik tetap sama.
    const timer = setTimeout(() => {
      const jam = new Date().getHours();
      setSapaan(
        jam < 11
          ? "Selamat pagi"
          : jam < 15
            ? "Selamat siang"
            : jam < 19
              ? "Selamat sore"
              : "Selamat malam",
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <h1 className="text-h1 text-tanah-900">
      {sapaan}, {nama}
    </h1>
  );
}
