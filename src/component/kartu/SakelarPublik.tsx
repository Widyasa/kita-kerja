"use client";

import { useState } from "react";

import { Switch } from "@/component/ui/switch";

/**
 * SakelarPublik — "Tampilkan kartu saya untuk publik".
 * Fase 2: hanya state lokal (belum ada API).
 * Konsekuensi dijelaskan SATU kalimat polos, status diumumkan aria-live.
 * Kartu milik pekerja, bukan platform.
 */
export function SakelarPublik({ aktifAwal }: { aktifAwal: boolean }) {
  const [aktif, setAktif] = useState(aktifAwal);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p id="label-sakelar-publik" className="text-h3">
          Tampilkan kartu saya untuk publik
        </p>
        <Switch
          aria-labelledby="label-sakelar-publik"
          checked={aktif}
          onCheckedChange={setAktif}
          /* BUG-037 — sakelar ini mengendalikan privasi (kartu tampil publik
           atau tidak) tapi area sentuhnya hanya 56x32px. Area diperbesar ke
           44px tanpa mengubah ukuran visual sakelarnya. */
        className="min-h-11 self-center"
        />
      </div>
      <p className="mt-2 text-body text-tanah-600">
        Saat aktif, siapa pun yang memindai QR kartu ini bisa melihat isi kartu
        Anda — dan Anda bisa mematikannya kembali kapan saja.
      </p>
      <p
        aria-live="polite"
        className="mt-3 rounded-lg bg-tanah-50 px-4 py-2 text-label text-tanah-700"
      >
        {aktif
          ? "Kartu Anda sedang tampil untuk publik."
          : "Kartu Anda sedang disembunyikan dari publik."}
      </p>
    </div>
  );
}
