import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { opsiCookieAman } from "./cookie-options";

/** Client RLS-aware untuk server (route handlers, server actions, middleware). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            // BUG-006 — paksa HttpOnly/Secure/SameSite pada cookie sesi.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, opsiCookieAman(options))
            );
          } catch {
            // ignored when called from a Server Component
          }
        },
      },
    }
  );
}

/** Service-role client untuk seed, admin ops, bypass RLS. NEVER expose to browser. */
export async function createServiceClient() {
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
