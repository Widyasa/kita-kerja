import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  email: z.string().email(),
  intent: z.enum(["signin", "register"]),
});

export async function POST(request: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format tidak valid." },
      { status: 400 }
    );
  }

  const email = body.email;
  const supabase = await createClient();

  // Send magic link for email confirmation
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      shouldCreateUser: body.intent === "register",
    },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, pesan: "Cek email Anda untuk link konfirmasi." });
}
