"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/component/ui/button";
import type { KartuKeahlian as TKartuKeahlian } from "@/lib/mock";
import { KartuKonfirmasi } from "../_komponen/KartuKonfirmasi";
import { PesanProses } from "../_komponen/PesanProses";

/**
 * Konfirmasi profil (Bagian 6.3) — SATU keahlian per kartu, bukan formulir
 * panjang. Pekerja merasa MEMERIKSA, bukan menandatangani.
 *
 * Sumber data: keahlian yang belum dikonfirmasi (dikonfirmasi_pekerja=false)
 * milik kartu pekerja — baik hasil Ngobrol Kerja (AI) maupun isi manual,
 * keduanya masuk lewat jalur yang sama. Lapis selalu "Diklaim" di sini
 * karena belum ada pekerjaan yang membuktikannya.
 */
export default function HalamanHasilNgobrol() {
  const router = useRouter();
  const [memuat, setMemuat] = useState(true);
  const [daftar, setDaftar] = useState<TKartuKeahlian[]>([]);
  const [menerbitkan, setMenerbitkan] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cards/keahlian");
        const json = await res.json();
        if (!res.ok) throw new Error(json.pesan || "Gagal mengambil keahlian.");
        setDaftar(
          (json.data.keahlian as Omit<TKartuKeahlian, "lapis">[]).map((k) => ({
            ...k,
            lapis: "diklaim" as const,
          })),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setMemuat(false);
      }
    })();
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
          ? { ...k, nama_diajukan: nama, level, dikonfirmasi_pekerja: true }
          : k,
      ),
    );

  const terbitkan = async () => {
    const dikonfirmasi = daftar.filter((k) => k.dikonfirmasi_pekerja);
    if (dikonfirmasi.length === 0 || menerbitkan) return;
    setMenerbitkan(true);
    try {
      const resKonfirmasi = await fetch("/api/cards/keahlian/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: dikonfirmasi.map((k) => ({
            id: k.id,
            nama_diajukan: k.nama_diajukan ?? undefined,
            level: k.level,
          })),
        }),
      });
      const jsonKonfirmasi = await resKonfirmasi.json();
      if (!resKonfirmasi.ok) throw new Error(jsonKonfirmasi.pesan || "Gagal menyimpan konfirmasi.");

      const resIssue = await fetch("/api/cards/issue", { method: "POST" });
      const jsonIssue = await resIssue.json();
      if (!resIssue.ok) throw new Error(jsonIssue.pesan || "Gagal menerbitkan kartu.");

      router.push("/worker/card");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setMenerbitkan(false);
    }
  };

  const terperiksa = daftar.filter((k) => k.dikonfirmasi_pekerja).length;

  if (memuat) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <PesanProses teks="Sebentar ya, saya siapkan hasilnya…" />
      </div>
    );
  }

  if (daftar.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <h1 className="text-h2">Belum ada keahlian untuk diperiksa</h1>
        <p className="max-w-sm text-body text-tanah-600">
          Mulai dulu dengan Ngobrol Kerja atau isi manual.
        </p>
        <Button size="lg" onClick={() => router.push("/worker/interview")}>
          Mulai Ngobrol Kerja
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="mikro text-right text-tanah-500">Langkah 3 dari 3</p>
        <h1 className="text-h1">Ini yang saya dengar</h1>
        <p className="text-body-lg text-tanah-700">
          Periksa satu-satu ya. Kalau ada yang salah, bisa diperbaiki.
        </p>
      </header>

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
        <Button
          size="lg"
          variant="aksen"
          className="w-full"
          disabled={terperiksa === 0 || menerbitkan}
          onClick={terbitkan}
        >
          {menerbitkan ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Terbitkan Kartu Kerja saya
        </Button>
      </footer>
    </div>
  );
}
