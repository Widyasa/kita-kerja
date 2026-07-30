import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ambil peran dari tabel pengguna jika user login
  let peran: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("pengguna")
      .select("peran")
      .eq("id", user.id)
      .single();
    peran = data?.peran ?? null;
  }

  // Proteksi rute per peran
  if (pathname.startsWith("/worker")) {
    if (!user || peran !== "pekerja") {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  if (pathname.startsWith("/employer")) {
    if (!user || peran !== "pemberi_kerja") {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  if (pathname.startsWith("/companion")) {
    if (!user || peran !== "pendamping") {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  if (pathname.startsWith("/demo")) {
    if (!DEMO_MODE) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/worker/:path*",
    "/employer/:path*",
    "/companion/:path*",
    "/demo/:path*",
  ],
};
