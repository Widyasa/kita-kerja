import type { MetadataRoute } from "next";

/**
 * BUG-031 — sebelumnya /robots.txt membalas 404.
 *
 * Selama fase demo (data pada situs masih contoh, lihat catatan footer)
 * seluruh crawler diblokir supaya kartu contoh dan akun seed tidak terindeks.
 * Saat produksi siap, set NEXT_PUBLIC_IZINKAN_INDEX=1 — area pekerja,
 * pemberi kerja, dan API tetap tertutup, dan /verify sengaja tidak diindeks
 * karena tautannya dimaksudkan dibagikan sendiri oleh pemilik kartu.
 */
export default function robots(): MetadataRoute.Robots {
  const bolehIndeks = process.env.NEXT_PUBLIC_IZINKAN_INDEX === "1";

  if (!bolehIndeks) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/worker/", "/employer/", "/companion/", "/api/", "/verify/", "/claim/"],
      },
    ],
  };
}
