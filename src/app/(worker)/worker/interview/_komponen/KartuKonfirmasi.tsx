"use client";

import { useState } from "react";
import { Check, CheckCircle2, ChevronDown, Pencil, Quote } from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { cn } from "@/lib/utils";
import type { KeahlianTampil } from "@/lib/data/types";
import type { LevelKeahlian } from "@/lib/mock/types";
import { LABEL_LEVEL, PILIHAN_LEVEL } from "./penyimpanan";

/**
 * KartuKonfirmasi — varian lokal KartuKeahlian khusus layar konfirmasi
 * (Bagian 6.3). Komponen bersama KartuKeahlian tidak diubah karena dipakai
 * halaman lain; kebutuhan di sini berbeda:
 * - "Kenapa saya simpulkan begitu" TERBUKA sejak awal — kutipan bukti asli
 *   adalah fitur yang ditonjolkan (AI tidak bisa mengarang).
 * - Perbaiki = edit inline sederhana (nama + level).
 * - Keadaan "sudah diperiksa" setelah pekerja menekan Betul.
 * Pengalaman: pekerja merasa MEMERIKSA, bukan menandatangani.
 */

export function namaTampilKeahlian(k: KeahlianTampil): string {
  return k.nama_tampil;
}

export function KartuKonfirmasi({
  keahlian,
  onBetul,
  onUbahLagi,
  onSimpan,
}: {
  keahlian: KeahlianTampil;
  onBetul: () => void;
  onUbahLagi: () => void;
  onSimpan: (nama: string, level: LevelKeahlian) => void;
}) {
  // Kutipan bukti dibuka sejak awal — sengaja ditonjolkan, bukan disembunyikan
  const [buka, setBuka] = useState(true);
  const [mengedit, setMengedit] = useState(false);
  const [namaEdit, setNamaEdit] = useState(namaTampilKeahlian(keahlian));
  const [levelEdit, setLevelEdit] = useState<LevelKeahlian>(keahlian.level);

  const nama = namaTampilKeahlian(keahlian);

  const barisBadge = (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <BadgeLapis lapis={keahlian.lapis} />
      <span
        className={cn(
          "rounded-pill px-3 py-1 text-label",
          !keahlian.dikonfirmasi_pekerja && keahlian.level === "ahli"
            ? "bg-biru-100 text-biru-800"
            : "bg-tanah-100 text-tanah-700",
        )}
      >
        {LABEL_LEVEL[keahlian.level]}
      </span>
    </div>
  );

  // ---------- keadaan sudah diperiksa ----------
  if (keahlian.dikonfirmasi_pekerja && !mengedit) {
    return (
      <article className="rounded-2xl border border-aman-600/50 bg-tanah-0 p-5 shadow-1">
        <div className="min-w-0">
          <h3 className="text-h3 break-words">{nama}</h3>
          <p className="mt-1 text-body break-words text-tanah-600">
            Sebutan Anda: &ldquo;{keahlian.sebutan_pekerja}&rdquo;
          </p>
          {barisBadge}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-label text-aman-600">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden />
            Sudah diperiksa — terima kasih.
          </p>
          <Button variant="ghost" size="sm" className="self-start" onClick={onUbahLagi}>
            <Pencil aria-hidden />
            Perbaiki lagi
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
      <div className="min-w-0">
        <h3 className="text-h3 break-words">{nama}</h3>
        <p className="mt-1 text-body break-words text-tanah-600">
          Sebutan Anda: &ldquo;{keahlian.sebutan_pekerja}&rdquo;
        </p>
        {barisBadge}
      </div>

      {mengedit ? (
        // ---------- Perbaiki: edit inline sederhana (nama + level) ----------
        <div className="mt-4 flex flex-col gap-4 rounded-lg bg-tanah-50 p-4">
          <div>
            <label
              htmlFor={`nama-${keahlian.id}`}
              className="text-label text-tanah-800"
            >
              Nama keahlian
            </label>
            <Input
              id={`nama-${keahlian.id}`}
              className="mt-1"
              value={namaEdit}
              onChange={(e) => setNamaEdit(e.target.value)}
            />
          </div>
          <fieldset>
            <legend className="text-label text-tanah-800">Seberapa bisa?</legend>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {PILIHAN_LEVEL.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={levelEdit === l}
                  onClick={() => setLevelEdit(l)}
                  className={cn(
                    "min-h-12 rounded-md border text-label font-semibold transition-colors duration-(--duration-fast) focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
                    levelEdit === l
                      ? "border-biru-600 bg-biru-600 text-tanah-0"
                      : "border-tanah-300 bg-tanah-0 text-tanah-800 hover:bg-tanah-100",
                  )}
                >
                  {LABEL_LEVEL[l]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                onSimpan(namaEdit.trim() || nama, levelEdit);
                setMengedit(false);
              }}
            >
              <Check aria-hidden />
              Simpan
            </Button>
            <Button variant="ghost" onClick={() => setMengedit(false)}>
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ---------- kutipan bukti: fitur yang ditonjolkan ---------- */}
          <button
            type="button"
            aria-expanded={buka}
            onClick={() => setBuka((b) => !b)}
            className="mt-3 flex min-h-12 w-full items-center justify-between gap-2 rounded-lg bg-tanah-50 px-4 py-2 text-left text-label text-biru-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
          >
            Kenapa saya simpulkan begitu
            <ChevronDown
              className={cn(
                "size-5 shrink-0 transition-transform duration-(--duration-medium)",
                buka && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {buka && (
            <div className="mt-2 rounded-lg bg-tanah-50 px-4 pb-4">
              <blockquote className="flex items-start gap-2 text-body text-tanah-700 italic">
                <Quote className="mt-1.5 size-4 shrink-0 text-tanah-400" aria-hidden />
                <span>
                  {keahlian.sumber === "manual"
                    ? "Cerita yang Bapak/Ibu tulis sendiri"
                    : "Dari ucapan Anda saat Ngobrol Kerja"}
                  : &ldquo;{keahlian.kutipan_bukti}&rdquo;
                </span>
              </blockquote>
              <p className="mt-2 text-label font-normal text-tanah-500">
                Ini kutipan asli, bukan karangan. Kalau tidak pernah Bapak/Ibu
                ucapkan atau tulis, silakan diperbaiki.
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="aksen" onClick={onBetul}>
              <Check aria-hidden />
              Betul
            </Button>
            <Button variant="outline" onClick={() => setMengedit(true)}>
              <Pencil aria-hidden />
              Perbaiki
            </Button>
          </div>
        </>
      )}
    </article>
  );
}
