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
      { ok: false, pesan: "Alamat email belum benar. Contoh: nama@email.com" },
      { status: 400 },
    );
  }

  const email = body.email;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      shouldCreateUser: body.intent === "register",
    },
  });

  if (error) {
    const p = error.message.toLowerCase();
    const pesan =
      p.includes("rate") || p.includes("too many")
        ? "Terlalu banyak permintaan kode. Tunggu beberapa menit sebelum mencoba lagi."
        : "Gagal mengirim kode ke email itu. Periksa kembali alamatnya.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, pesan: "Cek email Anda untuk link konfirmasi." });
}
