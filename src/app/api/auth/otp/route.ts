import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { normalisasiHp, isDemoPhone } from "@/lib/auth/shared";
import { z } from "zod";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const BodySchema = z.object({
  phone: z.string().min(9),
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

  const phone = normalisasiHp(body.phone);

  // Demo persona numbers bypass SMS so the jury flow works without a live provider.
  if (DEMO_MODE && isDemoPhone(phone)) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
