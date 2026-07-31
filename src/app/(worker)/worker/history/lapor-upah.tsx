"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/component/ui/dialog";
import type { SatuanUpah } from "@/lib/mock/types";

const LABEL_SATUAN: Record<SatuanUpah, string> = {
  harian: "per hari",
  bulanan: "per bulan",
  borongan: "borongan",
  per_jam: "per jam",
};

export function LaporUpah({
  pekerjaanTerbaru,
}: {
  /** riwayat pekerjaan terbaru untuk dipilih (opsional, boleh kosong) */
  pekerjaanTerbaru: { id: string; judul: string }[];
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [pekerjaanId, setPekerjaanId] = useState("");
  const [upah, setUpah] = useState("");
  const [satuan, setSatuan] = useState<SatuanUpah>("harian");
  const [mengirim, setMengirim] = useState(false);

  const kirim = async () => {
    const nilai = Number(upah);
    if (!nilai || nilai <= 0 || mengirim) return;
    setMengirim(true);
    try {
      const res = await fetch("/api/wages/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pekerjaan_id: pekerjaanId || undefined,
          upah_diterima: Math.round(nilai),
          satuan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal melaporkan upah.");
      toast.success(json.data?.pesan ?? "Upah berhasil dilaporkan. Terima kasih!");
      setTerbuka(false);
      setUpah("");
      setPekerjaanId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setMengirim(false);
    }
  };

  return (
    <Dialog open={terbuka} onOpenChange={setTerbuka}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-12 w-full items-start gap-2 rounded-lg bg-tanah-100 p-4 text-left text-label text-tanah-600 transition-colors duration-(--duration-fast) hover:bg-tanah-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
        >
          <Megaphone className="mt-0.5 size-4 shrink-0" aria-hidden />
          Upah yang Anda laporkan memperbaiki acuan untuk pekerja lain — ketuk untuk lapor
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-h3">Laporkan upah yang Anda terima</DialogTitle>
          <DialogDescription className="text-body text-tanah-600">
            Angka ini membantu acuan upah jadi lebih akurat untuk pekerja lain di daerah Anda.
          </DialogDescription>
        </DialogHeader>

        {pekerjaanTerbaru.length > 0 && (
          <div className="flex flex-col gap-2">
            <label htmlFor="lu-pekerjaan" className="text-label text-tanah-800">
              Pekerjaan (boleh dikosongkan)
            </label>
            <select
              id="lu-pekerjaan"
              value={pekerjaanId}
              onChange={(e) => setPekerjaanId(e.target.value)}
              className="h-12 w-full rounded-md border border-input bg-tanah-0 px-4 text-body shadow-1 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">— Tidak terkait pekerjaan tertentu —</option>
              {pekerjaanTerbaru.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.judul}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="lu-upah" className="text-label text-tanah-800">
            Upah yang diterima (rupiah)
          </label>
          <Input
            id="lu-upah"
            type="number"
            min={1}
            step={1000}
            inputMode="numeric"
            value={upah}
            onChange={(e) => setUpah(e.target.value)}
            placeholder="mis. 150000"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="lu-satuan" className="text-label text-tanah-800">
            Satuan
          </label>
          <select
            id="lu-satuan"
            value={satuan}
            onChange={(e) => setSatuan(e.target.value as SatuanUpah)}
            className="h-12 w-full rounded-md border border-input bg-tanah-0 px-4 text-body shadow-1 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {(Object.keys(LABEL_SATUAN) as SatuanUpah[]).map((s) => (
              <option key={s} value={s}>
                {LABEL_SATUAN[s]}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button size="lg" className="w-full" disabled={!upah || mengirim} onClick={kirim}>
            <Send aria-hidden />
            Kirim laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
