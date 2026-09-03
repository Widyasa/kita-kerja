/**
 * Helper URL verifikasi Kartu Kerja — satu sumber kebenaran.
 * Pakai APP_URL dari env; fallback ke origin request bila tidak di-set
 * (development tanpa .env lengkap).
 */
export function urlVerifikasiKartu(tokenPublik: string): string {
  const base =
    process.env.APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/verify/${tokenPublik}`;
}
