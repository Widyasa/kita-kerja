/**
 * LabelSection — label section gaya arsip dokumen: garis pendek + teks mono.
 * Dipakai lintas halaman (landing, kartu, verifikasi, wawancara) agar bahasa
 * visual "dossier" konsisten.
 */
export function LabelSection({ label }: Readonly<{ label: string }>) {
  return (
    <p className="mikro flex items-center gap-3 font-mono tracking-[0.18em] text-kuning-700">
      <span aria-hidden className="h-px w-8 bg-kuning-700/50" />
      {label}
    </p>
  );
}
