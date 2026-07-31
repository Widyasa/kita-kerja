"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/component/ui/button";
import { Textarea } from "@/component/ui/textarea";
import { TombolRekam } from "@/component/pekerja/TombolRekam";
import { KUNCI_TEKS_LOWONGAN } from "@/component/pemberi/ekstraksi";

/**
 * /employer/post — Bagian 6.6: SATU kotak teks besar. TIDAK ADA formulir.
 * Contoh yang bisa ditiru (sekali ketuk mengisi kotak) + alternatif rekam
 * suara. Teks ketikan dibawa ke halaman hasil lewat sessionStorage.
 */

const CONTOH = [
  "butuh 2 tukang buat renov dapur, mulai senin, borongan, daerah Sukun",
  "cari ART 3x seminggu, ada bayi, Rungkut",
  "butuh montir panggilan buat motor matic",
];

export default function HalamanPasangLowongan() {
  const router = useRouter();
  const [teks, setTeks] = useState("");
  const [dariSuara, setDariSuara] = useState(false);
  const [transkrip, setTranskrip] = useState(false);

  function lanjut() {
    sessionStorage.setItem(KUNCI_TEKS_LOWONGAN, teks.trim());
    router.push("/employer/post/result");
  }

  async function rekamSelesai(blob: Blob | null) {
    if (!blob) {
      toast.error("Rekaman tidak tersedia di perangkat ini. Silakan ketik saja.");
      return;
    }
    setTranskrip(true);
    try {
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let biner = "";
      for (let i = 0; i < bytes.length; i++) biner += String.fromCharCode(bytes[i]);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_base64: btoa(biner), mime_type: blob.type || "audio/webm" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal menuliskan rekaman.");
      setTeks(json.data.teks);
      setDariSuara(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setTranskrip(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header>
        <h1 className="text-h1">Butuh pekerja? Tulis saja seperti biasa</h1>
        <p className="mt-2 text-body-lg text-tanah-600">
          Tidak perlu formulir. Tulis seperti Anda mengirim pesan WhatsApp.
        </p>
      </header>

      {/* SATU kotak teks besar — min 160px, body-lg */}
      <div className="flex flex-col gap-2">
        <label htmlFor="teks-lowongan" className="text-label font-semibold text-tanah-700">
          Kebutuhan Anda
        </label>
        <Textarea
          id="teks-lowongan"
          value={teks}
          onChange={(e) => {
            setTeks(e.target.value);
            setDariSuara(false);
          }}
          placeholder={CONTOH[0]}
          className="min-h-40 text-body-lg"
          rows={4}
        />
        {dariSuara && (
          <p role="status" className="text-label text-tanah-600">
            Hasil tulisan dari rekaman suara Anda — silakan periksa dan ubah bila
            perlu.
          </p>
        )}
      </div>

      {/* alternatif rekam suara */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-6 shadow-1">
        <p className="text-body-lg font-semibold">Atau rekam suara saja</p>
        <TombolRekam mode="ketuk" onSelesai={rekamSelesai} />
        {transkrip && (
          <p role="status" className="text-label text-tanah-600">
            Menuliskan rekaman Anda…
          </p>
        )}
      </div>

      {/* contoh yang bisa ditiru */}
      <div>
        <p className="text-body font-semibold text-tanah-700">
          Contoh yang bisa ditiru — ketuk untuk memakai:
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {CONTOH.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => {
                  setTeks(c);
                  setDariSuara(false);
                }}
                className="min-h-12 w-full rounded-lg bg-tanah-100 px-4 py-3 text-left text-body text-tanah-800 italic transition-colors duration-(--duration-fast) hover:bg-tanah-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
              >
                &ldquo;{c}&rdquo;
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA 56px */}
      <Button
        size="lg"
        className="w-full"
        disabled={!teks.trim()}
        onClick={lanjut}
      >
        Lanjut
        <ArrowRight aria-hidden />
      </Button>
    </div>
  );
}
