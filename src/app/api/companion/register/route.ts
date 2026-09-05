import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiEmail, normalisasiHp } from "@/lib/auth/shared";
import { z } from "zod";

const BodySchema = z.object({
  nama: z.string().trim().min(3).max(100),
  email: z.string().email("Email tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  wilayah_id: z.string().uuid(),
  /** Opsional di profil saja — bukan kunci Auth. */
  no_hp: z.string().trim().optional(),
});

/**
 * Daftarkan pekerja oleh pendamping — selaras /api/auth/register:
 * Auth lewat email + password, bukan phone Auth Supabase.
 */
export async function POST(request: Request) {
  const userOrResponse = await requireRole("pendamping");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (err) {
    const pesan =
      err instanceof z.ZodError
        ? (err.issues[0]?.message ?? "Format tidak valid.")
        : "Format tidak valid.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  const email = normalisasiEmail(body.email);
  const domain = email.split("@")[1] ?? "";
  if (/(^|\.)kitakerja\.test$/i.test(domain)) {
    return NextResponse.json(
      {
        ok: false,
        pesan:
          "Email domain uji tidak diizinkan. Pakai email asli yang bisa diakses pekerja.",
      },
      { status: 400 },
    );
  }

  const phone = body.no_hp?.replace(/\D/g, "")
    ? normalisasiHp(body.no_hp)
    : null;

  const service = await createServiceClient();

  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      nama: body.nama,
      didampingi_oleh: userOrResponse.id,
    },
  });

  if (authError || !authUser.user) {
    const p = authError?.message.toLowerCase() ?? "";
    const pesan =
      p.includes("already") || p.includes("registered") || p.includes("exists")
        ? "Email ini sudah terdaftar. Pekerja bisa langsung masuk sendiri."
        : "Gagal membuat akun pekerja. Coba email lain atau periksa kata sandi.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  const userId = authUser.user.id;

  const { error: penggunaError } = await service.from("pengguna").insert({
    id: userId,
    nama: body.nama,
    email,
    no_hp: phone,
    peran: "pekerja",
    wilayah_id: body.wilayah_id,
    status_verifikasi: "email_terverifikasi",
    didampingi_oleh: userOrResponse.id,
  });

  if (penggunaError) {
    await service.auth.admin.deleteUser(userId);
    const p = penggunaError.message.toLowerCase();
    const pesan =
      p.includes("email") || p.includes("unique")
        ? "Email ini sudah terpakai di data pengguna."
        : "Gagal menyimpan data pekerja.";
    return NextResponse.json({ ok: false, pesan }, { status: 500 });
  }

  const { error: kartuError } = await service
    .from("kartu_kerja")
    .insert({ pekerja_id: userId });

  if (kartuError) {
    await service.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyiapkan kartu kerja." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: { pekerja_id: userId, email } });
}
