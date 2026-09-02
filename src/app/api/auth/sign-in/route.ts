import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { normalisasiEmail } from "@/lib/auth/shared";
import { pesanGalatMasuk, redirectSetelahMasuk } from "@/lib/auth/server";
import { z } from "zod";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export async function POST(request: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (err) {
    const pesan =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? "Format tidak valid."
        : "Format tidak valid.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  const email = normalisasiEmail(body.email);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: body.password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, pesan: pesanGalatMasuk(error?.message) },
      { status: 401 },
    );
  }

  const redirect = await redirectSetelahMasuk(data.user.id);

  if (!redirect) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { ok: false, pesan: "Akun belum terdaftar. Silakan daftar terlebih dahulu." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, redirect });
}
