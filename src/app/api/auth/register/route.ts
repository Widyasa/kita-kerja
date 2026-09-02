import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiEmail, tujuanPeran } from "@/lib/auth/shared";
import { pesanGalatMasuk } from "@/lib/auth/server";
import { z } from "zod";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  peran: z.enum(["pekerja", "pemberi_kerja", "pendamping"]),
  nama: z.string().trim().min(3).max(100),
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
  const service = await createServiceClient();

  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    const p = authError?.message.toLowerCase() ?? "";
    const pesan = p.includes("already") || p.includes("registered") || p.includes("exists")
      ? "Email ini sudah terdaftar. Silakan masuk."
      : "Pendaftaran gagal. Coba lagi atau gunakan email lain.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  const userId = authUser.user.id;

  const { error: insertError } = await service.from("pengguna").insert({
    id: userId,
    nama: body.nama,
    email,
    peran: body.peran,
    status_verifikasi: "email_terverifikasi",
  });

  if (insertError) {
    await service.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyimpan data pengguna." },
      { status: 500 },
    );
  }

  if (body.peran === "pekerja") {
    const { error: kartuError } = await service.from("kartu_kerja").insert({
      pekerja_id: userId,
    });
    if (kartuError) {
      await service.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { ok: false, pesan: "Gagal menyiapkan kartu kerja." },
        { status: 500 },
      );
    }
  }

  const supabase = await createClient();
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: body.password,
  });

  if (signInErr || !signInData.user) {
    return NextResponse.json(
      { ok: false, pesan: pesanGalatMasuk(signInErr?.message) },
      { status: 401 },
    );
  }

  const redirect =
    body.peran === "pekerja" ? "/worker/interview" : tujuanPeran(body.peran);

  return NextResponse.json({ ok: true, redirect });
}
