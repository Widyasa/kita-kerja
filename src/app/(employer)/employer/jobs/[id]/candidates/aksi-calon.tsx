"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Handshake, Send } from "lucide-react";

import { Button } from "@/component/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/component/ui/dialog";
import { Input } from "@/component/ui/input";
import { Textarea } from "@/component/ui/textarea";
import type { CalonTampil } from "@/lib/data/types";

export function AksiCalon({ calon }: { calon: CalonTampil }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [buka, setBuka] = useState(false);
  const [lingkup, setLingkup] = useState("");
  const [upah, setUpah] = useState("");
  const [tanggalBayar, setTanggalBayar] = useState("");

  if (calon.kesepakatan_id) {
    return (
      <Button asChild size="lg" className="flex-1">
        <Link href={`/employer/agreements/${calon.kesepakatan_id}`}>
          <Handshake aria-hidden />
          Lihat kesepakatan
        </Link>
      </Button>
    );
  }

  async function undang() {
    setSibuk(true);
    try {
      const res = await fetch("/api/applications/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lamaran_id: calon.lamaran_id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim undangan.");
      toast.success("Undangan terkirim.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  async function buatKesepakatan() {
    if (!lingkup.trim() || !upah || !tanggalBayar) return;
    setSibuk(true);
    try {
      const res = await fetch("/api/agreements/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lamaran_id: calon.lamaran_id,
          lingkup: lingkup.trim(),
          upah_disepakati: Number(upah),
          satuan: "harian",
          tanggal_bayar_dijanjikan: tanggalBayar,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal membuat kesepakatan.");
      setBuka(false);
      router.push(`/employer/agreements/${json.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  const tanpaDasar = calon.alasan_cocok.length === 0;

  return (
    <>
      {calon.status === "dilamar" && (
        <Button size="lg" variant="outline" className="flex-1" disabled={sibuk} onClick={undang}>
          <Send aria-hidden />
          Undang
        </Button>
      )}
      <Button
        size="lg"
        variant={tanpaDasar ? "outline" : "default"}
        className="flex-1"
        disabled={sibuk}
        onClick={() => setBuka(true)}
      >
        <Handshake aria-hidden />
        Buat kesepakatan
      </Button>

      <Dialog open={buka} onOpenChange={setBuka}>
        <DialogContent className="bg-tanah-0">
          <DialogHeader>
            <DialogTitle className="text-h3">Buat kesepakatan kerja</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lingkup" className="text-label font-semibold text-tanah-700">
                Lingkup pekerjaan
              </label>
              <Textarea
                id="lingkup"
                value={lingkup}
                onChange={(e) => setLingkup(e.target.value)}
                placeholder="mis. Pasang keramik dapur 3x4 m, alat disediakan."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="upah" className="text-label font-semibold text-tanah-700">
                Upah harian (rupiah)
              </label>
              <Input
                id="upah"
                type="number"
                min={0}
                step={1000}
                value={upah}
                onChange={(e) => setUpah(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bayar" className="text-label font-semibold text-tanah-700">
                Upah dijanjikan dibayar paling lambat
              </label>
              <Input
                id="bayar"
                type="date"
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuka(false)}>
              Batal
            </Button>
            <Button
              disabled={sibuk || !lingkup.trim() || !upah || !tanggalBayar}
              onClick={buatKesepakatan}
            >
              Buat kesepakatan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
