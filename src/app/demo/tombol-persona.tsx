"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function TombolPersona({
  persona,
  nama,
  peran,
  satuBaris,
  ikon,
}: {
  persona: "warto" | "yanti" | "dhika" | "slamet";
  nama: string;
  peran: string;
  satuBaris: string;
  // Server Components can't pass a bare component reference (LucideIcon)
  // across the client boundary — the caller renders the icon and hands us
  // the resulting node instead.
  ikon: ReactNode;
}) {
  const router = useRouter();
  const [memuat, setMemuat] = useState(false);

  async function masuk() {
    if (memuat) return;
    setMemuat(true);
    try {
      const res = await fetch("/api/demo/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal ganti persona.");
      router.push(json.redirect);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setMemuat(false);
    }
  }

  return (
    <button
      type="button"
      onClick={masuk}
      disabled={memuat}
      className="flex min-h-14 w-full items-center gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-4 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40 disabled:opacity-60"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50 text-biru-600">
        {ikon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-body-lg font-bold">
          {nama} <span className="font-semibold text-tanah-600">· {peran}</span>
        </span>
        <span className="block text-label text-tanah-600">{satuBaris}</span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-tanah-400" aria-hidden />
    </button>
  );
}
