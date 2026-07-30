"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * SpandukLuring — tampil saat koneksi hilang (Bagian 4.5).
 * Copy persis dari spec. Prop `paksaTampil` hanya untuk halaman katalog demo.
 */
export function SpandukLuring({ paksaTampil = false }: { paksaTampil?: boolean }) {
  const [luring, setLuring] = useState(false);

  useEffect(() => {
    const sinkron = () => setLuring(!navigator.onLine);
    sinkron();
    window.addEventListener("online", sinkron);
    window.addEventListener("offline", sinkron);
    return () => {
      window.removeEventListener("online", sinkron);
      window.removeEventListener("offline", sinkron);
    };
  }, []);

  if (!luring && !paksaTampil) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-lg bg-tanah-800 px-4 py-3 text-tanah-0"
    >
      <WifiOff className="size-5 shrink-0 text-kuning-400" aria-hidden />
      <p className="text-label font-semibold">
        Koneksi terputus. Rekaman Anda disimpan dan akan dikirim otomatis.
      </p>
    </div>
  );
}
