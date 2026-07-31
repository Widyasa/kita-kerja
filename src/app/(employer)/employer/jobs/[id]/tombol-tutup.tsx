"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleX } from "lucide-react";

import { Button } from "@/component/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/component/ui/dialog";

export function TombolTutupLowongan({ lowonganId }: { lowonganId: string }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [buka, setBuka] = useState(false);

  async function tutup() {
    setSibuk(true);
    try {
      const res = await fetch("/api/jobs/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowongan_id: lowonganId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal menutup lowongan.");
      setBuka(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="flex-1">
          <CircleX aria-hidden />
          Tutup lowongan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-h3">Tutup lowongan ini?</DialogTitle>
          <DialogDescription className="text-body text-tanah-600">
            Lowongan berhenti tampil ke pekerja. Calon yang sudah masuk tetap bisa Anda hubungi
            dari halaman calon.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setBuka(false)}>
            Batal
          </Button>
          <Button variant="destructive" disabled={sibuk} onClick={tutup}>
            Ya, tutup lowongan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
