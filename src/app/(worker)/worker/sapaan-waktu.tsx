"use client";

import { useEffect, useState } from "react";

/**
 * Sapaan sesuai jam lokal pekerja.
 * Teks awal "Selamat datang" dirender di server, lalu diganti setelah
 * mount supaya tidak terjadi ketidakcocokan hidrasi.
 */
export function SapaanWaktu({ nama }: { nama: string }) {
  const [sapaan, setSapaan] = useState("Selamat datang");

  useEffect(() => {
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
  }, []);

  return (
    <h1 className="text-h1 text-tanah-900">
      {sapaan}, {nama}
    </h1>
  );
}
