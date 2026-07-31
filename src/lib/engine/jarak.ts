// src/lib/engine/jarak.ts
/**
 * Jarak garis lurus antar dua titik (haversine) — SELALU ditampilkan sebagai
 * perkiraan ("~X km"), bukan rute sungguhan. Tanpa panggilan API eksternal.
 */

const RADIUS_BUMI_KM = 6371;

export function jarakKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return Math.round(RADIUS_BUMI_KM * c * 10) / 10;
}

/** "3.2" → "~3 km" ; "0.4" → "kurang dari 1 km" — sama gaya dgn jarakTeks mock */
export function jarakTeks(km: number): string {
  if (km < 1) return "kurang dari 1 km";
  return `~${Math.round(km)} km`;
}
