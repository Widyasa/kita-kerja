import type { NextConfig } from "next";

/**
 * Header keamanan dasar (BUG-007). `microphone=(self)` sengaja dipertahankan
 * karena Ngobrol Kerja merekam suara pekerja dari origin yang sama.
 * `connect-src` memuat Supabase agar auth dan query tetap jalan.
 */
const HEADER_KEAMANAN = [
  // BUG-030 — respons HTML sempat membawa `access-control-allow-origin: *`
  // dari konfigurasi hosting. Dokumen HTML tidak butuh CORS sama sekali;
  // nilainya ditimpa jadi same-origin supaya cakupannya tidak melebar
  // diam-diam bila kelak ada route yang mengembalikan data pengguna.
  { key: "Access-Control-Allow-Origin", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), payment=(), usb=(), microphone=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      // Next.js menyuntik bootstrap inline; 'unsafe-eval' diperlukan dev overlay.
      "script-src 'self' 'unsafe-inline'" +
        (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  // ffmpeg-static resolves its binary path via path.join(__dirname, ...);
  // Next's server bundler rewrites that to a "\ROOT\..." placeholder that
  // never resolves at runtime unless the package is left external.
  serverExternalPackages: ["ffmpeg-static"],
  async headers() {
    return [{ source: "/:path*", headers: HEADER_KEAMANAN }];
  },
};

export default nextConfig;
