"use client";

import { useEffect, useState } from "react";
import { Loader2, Play, RotateCcw, Square } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Switch } from "@/component/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Kontrol interaktif panel /demo (Bagian 16) — state client-side penuh:
 * - Setel ulang data demo (konfirmasi + bersihkan storage + umpan balik)
 * - Rekaman contoh (tombol putar placeholder)
 * - Sakelar simulasi kegagalan (tersimpan di localStorage)
 */

// ============ 2. SETEL ULANG DATA DEMO ============

export function SetelUlangDataDemo() {
  const [mintaKonfirmasi, setMintaKonfirmasi] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [sedangProses, setSedangProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const setelUlang = async () => {
    setSedangProses(true);
    setGalat(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setGalat(json?.pesan ?? "Gagal menghubungi server, coba lagi.");
        setSedangProses(false);
        return;
      }
    } catch {
      setGalat("Gagal menghubungi server, coba lagi.");
      setSedangProses(false);
      return;
    }

    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      // storage diblokir — tetap beri umpan balik
    }
    setSedangProses(false);
    setMintaKonfirmasi(false);
    setSelesai(true);
  };

  if (selesai) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="rounded-xl bg-aman-50 p-4 text-body font-semibold text-aman-600"
        >
          Data demo dikembalikan ke awal.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          <RotateCcw aria-hidden />
          Muat ulang halaman
        </Button>
      </div>
    );
  }

  if (mintaKonfirmasi) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body-lg text-tanah-700">
          Yakin? Semua data percobaan di perangkat ini akan dihapus dan demo
          kembali seperti semula.
        </p>
        {galat ? (
          <p role="alert" className="text-label text-bahaya-600">
            {galat}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setMintaKonfirmasi(false)}
            disabled={sedangProses}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={setelUlang}
            disabled={sedangProses}
          >
            {sedangProses ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Ya, setel ulang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      onClick={() => setMintaKonfirmasi(true)}
    >
      <RotateCcw aria-hidden />
      Setel ulang data demo
    </Button>
  );
}

// ============ 3. REKAMAN CONTOH ============

const REKAMAN: { id: string; bahasa: string; keterangan: string }[] = [
  { id: "jv", bahasa: "Bahasa Jawa", keterangan: "Contoh jawaban Pak Warto, logat Malang." },
  { id: "su", bahasa: "Bahasa Sunda", keterangan: "Contoh jawaban logat Sunda." },
  { id: "id", bahasa: "Bahasa Indonesia", keterangan: "Contoh jawaban bahasa Indonesia baku." },
];

const LAMA_PUTAR_MS = 3000;

export function DaftarRekamanContoh() {
  const [sedangPutar, setSedangPutar] = useState<string | null>(null);

  // Hentikan "pemutaran" placeholder setelah beberapa detik
  useEffect(() => {
    if (!sedangPutar) return;
    const t = setTimeout(() => setSedangPutar(null), LAMA_PUTAR_MS);
    return () => clearTimeout(t);
  }, [sedangPutar]);

  return (
    <ul className="flex flex-col gap-3">
      {REKAMAN.map((r) => {
        const aktif = sedangPutar === r.id;
        return (
          <li
            key={r.id}
            className="flex items-center gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-4 shadow-1"
          >
            <button
              type="button"
              aria-label={aktif ? `Hentikan rekaman ${r.bahasa}` : `Putar rekaman ${r.bahasa}`}
              onClick={() => setSedangPutar(aktif ? null : r.id)}
              className={cn(
                "flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-(--duration-fast)",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
                aktif
                  ? "bg-biru-600 text-tanah-0"
                  : "bg-biru-50 text-biru-600 hover:bg-biru-100",
              )}
            >
              {aktif ? (
                <Square className="size-5" aria-hidden />
              ) : (
                <Play className="ml-0.5 size-5" aria-hidden />
              )}
            </button>
            <div>
              <p className="text-body font-semibold">{r.bahasa}</p>
              <p className="text-label text-tanah-600">
                {aktif ? "Memutar rekaman contoh…" : r.keterangan}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ============ 4. SAKELAR SIMULASI KEGAGALAN ============

const KUNCI_KUOTA = "kk-demo-kuota-habis";
const KUNCI_GAGAL = "kk-demo-ai-gagal";

export function SakelarSimulasiKegagalan() {
  const [kuotaHabis, setKuotaHabis] = useState(false);
  const [aiGagal, setAiGagal] = useState(false);
  const [dimuat, setDimuat] = useState(false);

  // Baca localStorage dari callback, bukan sinkron di badan effect
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        setKuotaHabis(localStorage.getItem(KUNCI_KUOTA) === "true");
        setAiGagal(localStorage.getItem(KUNCI_GAGAL) === "true");
      } catch {
        // storage diblokir — sakelar tetap jalan tanpa simpan
      }
      setDimuat(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const simpan = (kunci: string, nilai: boolean) => {
    try {
      localStorage.setItem(kunci, String(nilai));
    } catch {
      // abaikan
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {(
        [
          {
            id: "sakelar-kuota",
            label: "Kuota AI habis",
            penjelasan:
              "Aplikasi tetap jalan memakai isian manual dan data yang sudah ada.",
            nilai: kuotaHabis,
            ubah: (v: boolean) => {
              setKuotaHabis(v);
              simpan(KUNCI_KUOTA, v);
            },
          },
          {
            id: "sakelar-gagal",
            label: "AI gagal memproses",
            penjelasan:
              "Alur turun kelas dengan mulus: transkrip mentah tetap tersimpan dan pekerja bisa mengisi manual.",
            nilai: aiGagal,
            ubah: (v: boolean) => {
              setAiGagal(v);
              simpan(KUNCI_GAGAL, v);
            },
          },
        ] as const
      ).map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-4 shadow-1"
        >
          <Switch
            id={s.id}
            checked={s.nilai}
            disabled={!dimuat}
            onCheckedChange={s.ubah}
            aria-labelledby={`${s.id}-label`}
          />
          <div className="min-w-0">
            <label
              id={`${s.id}-label`}
              htmlFor={s.id}
              className="block cursor-pointer text-body font-semibold"
            >
              {s.label}
            </label>
            <p className="text-label text-tanah-600">{s.penjelasan}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
