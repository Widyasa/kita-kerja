import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { tujuanPeran } from "@/lib/auth/shared";
import { z } from "zod";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const BodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  intent: z.enum(["signin", "register"]),
  role: z.enum(["pekerja", "pemberi_kerja", "pendamping"]).optional(),
  nama: z.string().trim().min(3).max(100).optional(),
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

  // Verify OTP code via Supabase
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: body.code,
    type: "email",
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, pesan: error?.message || "Verifikasi kode gagal." },
      { status: 401 }
    );
  }

  const userId = data.user.id;

  const service = await createServiceClient();

  const { data: existing } = await service
    .from("pengguna")
    .select("peran")
    .eq("id", userId)
    .single();

  if (existing) {
    let redirect = tujuanPeran(existing.peran);
    if (existing.peran === "pekerja") {
      const { data: kartu } = await service
        .from("kartu_kerja")
        .select("diterbitkan_pada")
        .eq("pekerja_id", userId)
        .maybeSingle();
      if (!kartu?.diterbitkan_pada) redirect = "/worker/interview";
    }
    return NextResponse.json({ ok: true, redirect });
  }

  if (body.intent !== "register" || !body.role) {
    return NextResponse.json(
      { ok: false, pesan: "Akun belum terdaftar. Silakan daftar terlebih dahulu." },
      { status: 403 }
    );
  }

  const { error: insertError } = await service.from("pengguna").insert({
    id: userId,
    nama: body.nama?.trim() || email,
    no_hp: email,
    peran: body.role,
    status_verifikasi: "hp_terverifikasi",
  });

  if (insertError) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyimpan data pengguna." },
      { status: 500 }
    );
  }

  // Setiap pekerja butuh tepat satu baris kartu_kerja (kolom lain pakai
  // default DB — kosong sampai Ngobrol Kerja/isi manual menerbitkannya).
  if (body.role === "pekerja") {
    const { error: kartuError } = await service.from("kartu_kerja").insert({
      pekerja_id: userId,
    });

    if (kartuError) {
      return NextResponse.json(
        { ok: false, pesan: "Gagal menyiapkan kartu kerja." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    redirect: body.role === "pekerja" ? "/worker/interview" : tujuanPeran(body.role),
  });
}
