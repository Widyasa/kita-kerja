import type { CookieOptions } from "@supabase/ssr";

/**
 * BUG-006 — cookie sesi sebelumnya bisa dibaca `document.cookie`, artinya
 * flag HttpOnly tidak terpasang. Isinya access token DAN refresh token
 * lengkap dengan email, nomor HP, dan user id — sekitar 3.400 karakter.
 * Satu celah XSS di mana pun pada domain ini langsung berarti
 * pengambilalihan sesi penuh, tanpa lapisan pertahanan kedua.
 *
 * Aman dipasang di proyek ini karena seluruh autentikasi berjalan di server:
 * `src/lib/supabase/browser-client.ts` ada tapi tidak pernah diimpor satu
 * berkas pun, jadi tidak ada kode klien yang membaca cookie ini.
 *
 * Kalau kelak ada komponen klien yang butuh sesi Supabase langsung,
 * jangan longgarkan flag ini — ambil sesinya lewat server component atau
 * route handler.
 */
export function opsiCookieAman(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: options.path ?? "/",
  };
}
