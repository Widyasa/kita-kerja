import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiHp, tujuanPeran, isDemoPhone, DEMO_OTP, demoEmailForPhone } from "@/lib/auth/shared";
import { z } from "zod";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const BodySchema = z.object({
  phone: z.string().min(9),
  code: z.string().length(6),
  intent: z.enum(["signin", "register"]),
  role: z.enum(["pekerja", "pemberi_kerja", "pendamping"]).optional(),
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

  const supabase = await createClient();
  let userId: string;

  // Demo fallback: bypass SMS provider for seeded demo personas.
  if (DEMO_MODE && isDemoPhone(phone) && body.code === DEMO_OTP) {
    const fallbackPassword = process.env.DEMO_FALLBACK_PASSWORD;
    const email = demoEmailForPhone(phone);
    if (!fallbackPassword || !email) {
      return NextResponse.json(
        { ok: false, pesan: "Demo fallback belum dikonfigurasi." },
        { status: 500 }
      );
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: fallbackPassword,
    });
    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, pesan: error?.message || "Demo sign-in gagal." },
        { status: 401 }
      );
    }
    userId = data.user.id;
  } else {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: body.code,
      type: "sms",
    });

    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, pesan: error?.message || "Verifikasi OTP gagal." },
        { status: 401 }
      );
    }
    userId = data.user.id;
  }

  const service = await createServiceClient();

  const { data: existing } = await service
    .from("pengguna")
    .select("peran")
    .eq("id", userId)
    .single();

  if (existing) {
    return NextResponse.json({
      ok: true,
      redirect: tujuanPeran(existing.peran),
    });
  }

  if (body.intent !== "register" || !body.role) {
    return NextResponse.json(
      { ok: false, pesan: "Akun belum terdaftar. Silakan daftar terlebih dahulu." },
      { status: 403 }
    );
  }

  const { error: insertError } = await service.from("pengguna").insert({
    id: userId,
    nama: phone,
    no_hp: phone,
    peran: body.role,
    status_verifikasi: "hp_terverifikasi",
  });

  if (insertError) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyimpan data pengguna." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    redirect: tujuanPeran(body.role),
  });
}
