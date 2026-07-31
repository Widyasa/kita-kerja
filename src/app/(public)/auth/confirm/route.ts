import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { tujuanPeran } from "@/lib/auth/shared";

/**
 * Confirmation handler: magic link redirect from email.
 * Supabase redirects here with token in URL, exchange for session.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=no_code", request.url));
  }

  const supabase = await createClient();

  // Exchange code for session
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  if (!data.user) {
    return NextResponse.redirect(new URL("/sign-in?error=no_user", request.url));
  }

  const userId = data.user.id;
  const service = await createServiceClient();

  // Check if user exists in pengguna table
  const { data: existing } = await service
    .from("pengguna")
    .select("peran")
    .eq("id", userId)
    .single();

  if (!existing) {
    // New user — redirect to role choice
    return NextResponse.redirect(new URL("/register?step=email", request.url));
  }

  // Existing user — redirect to dashboard
  const redirect = tujuanPeran(existing.peran);
  return NextResponse.redirect(new URL(redirect, request.url));
}
