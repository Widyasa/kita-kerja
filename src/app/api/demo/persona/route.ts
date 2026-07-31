import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { tujuanPeran } from "@/lib/auth/shared";
import { z } from "zod";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const PERSONA_EMAIL: Record<string, string> = {
  warto: "warto@kitakerja.test",
  yanti: "yanti@kitakerja.test",
  dhika: "dhika@kitakerja.test",
  slamet: "slamet@kitakerja.test",
};

const BodySchema = z.object({
  persona: z.enum(["warto", "yanti", "dhika", "slamet"]),
});

export async function POST(request: Request) {
  if (!DEMO_MODE) {
    return NextResponse.json({ ok: false, pesan: "Tidak ditemukan." }, { status: 404 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const fallbackPassword = process.env.DEMO_FALLBACK_PASSWORD;
  if (!fallbackPassword) {
    return NextResponse.json({ ok: false, pesan: "Demo fallback belum dikonfigurasi." }, { status: 500 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: PERSONA_EMAIL[body.persona],
    password: fallbackPassword,
  });

  if (error || !data.user) {
    return NextResponse.json({ ok: false, pesan: "Gagal masuk sebagai persona ini." }, { status: 401 });
  }

  const service = await createServiceClient();
  const { data: pengguna } = await service
    .from("pengguna")
    .select("peran")
    .eq("id", data.user.id)
    .single();

  const peran = pengguna?.peran ?? "pekerja";
  let redirect = tujuanPeran(peran);

  // Pekerja tanpa Kartu Kerja terbit diarahkan ke Ngobrol Kerja — sama seperti
  // alur verifikasi OTP biasa (lihat src/app/api/auth/verify/route.ts).
  if (peran === "pekerja") {
    const { data: kartu } = await service
      .from("kartu_kerja")
      .select("diterbitkan_pada")
      .eq("pekerja_id", data.user.id)
      .maybeSingle();
    if (!kartu?.diterbitkan_pada) redirect = "/worker/interview";
  }

  return NextResponse.json({ ok: true, redirect });
}
