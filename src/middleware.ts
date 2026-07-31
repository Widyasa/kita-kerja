import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { opsiCookieAman } from "@/lib/supabase/cookie-options";

const DEMO_MODE = process.env.DEMO_MODE === "true";

/**
 * Rute yang tidak pernah butuh sesi. Middleware berhenti lebih awal di sini
 * supaya halaman publik — terutama /verify yang dipindai lewat QR — tidak
 * membayar satu panggilan getUser() ke Supabase (BUG-042).
 */
const RUTE_PUBLIK = ["/verify", "/claim"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (RUTE_PUBLIK.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const res = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // BUG-006 — cookie sesi wajib HttpOnly; middleware ikut menulisnya
          // saat token diperbarui, jadi flag-nya harus dipasang di sini juga.
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, opsiCookieAman(options));
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Query peran hanya untuk rute yang benar-benar memeriksanya, supaya
  // halaman publik tidak membayar round-trip tambahan ke database.
  const butuhPeran =
    pathname.startsWith("/worker") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/companion");

  let peran: string | null = null;
  if (user && butuhPeran) {
    const { data } = await supabase
      .from("pengguna")
      .select("peran")
      .eq("id", user.id)
      .single();
    peran = data?.peran ?? null;
  }

  /**
   * BUG-015 — sebelumnya pengguna dilempar ke /sign-in polos: tanpa
   * parameter tujuan dan tanpa penjelasan kenapa. Setelah berhasil masuk
   * mereka mendarat di beranda peran, bukan halaman yang tadi dibuka.
   * Sekarang tujuan asal dan alasannya ikut dibawa.
   */
  function keSignIn(alasan: "sesi" | "peran") {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect", pathname + request.nextUrl.search);
    url.searchParams.set("alasan", alasan);
    return NextResponse.redirect(url);
  }

  // Proteksi rute per peran
  if (pathname.startsWith("/worker")) {
    if (!user) return keSignIn("sesi");
    if (peran !== "pekerja") return keSignIn("peran");
  }

  if (pathname.startsWith("/employer")) {
    if (!user) return keSignIn("sesi");
    if (peran !== "pemberi_kerja") return keSignIn("peran");
  }

  if (pathname.startsWith("/companion")) {
    if (!user) return keSignIn("sesi");
    if (peran !== "pendamping") return keSignIn("peran");
  }

  if (pathname.startsWith("/demo")) {
    if (!DEMO_MODE) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return res;
}

/**
 * BUG-014 — sesi sempat putus ~5 menit setelah masuk padahal JWT berlaku
 * 1 jam, dan cookie basi tertinggal di browser.
 *
 * Penyebabnya: saat Supabase memperbarui token dari dalam Server Component,
 * `cookieStore.set` melempar dan ditelan `catch {}` di server-client, jadi
 * token hasil refresh tidak pernah tersimpan. Permintaan berikutnya memakai
 * refresh token yang sudah dipakai, lalu sesi ditolak.
 *
 * Middleware adalah satu-satunya tempat yang boleh menulis cookie pada
 * setiap permintaan, jadi matcher-nya diperluas ke seluruh route (kecuali
 * aset statis) supaya penyegaran token selalu ikut tersimpan.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
