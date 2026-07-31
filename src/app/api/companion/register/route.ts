import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiHp } from "@/lib/auth/shared";
import { z } from "zod";

const BodySchema = z.object({
  nama: z.string().trim().min(3).max(100),
  wilayah_id: z.string().uuid(),
  no_hp: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pendamping");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const service = await createServiceClient();

  // Pekerja dampingan sering belum punya HP — akun tetap dibuat atas namanya.
  const phone = body.no_hp?.replace(/\D/g, "") ? normalisasiHp(body.no_hp) : null;
  const email = `dampingan-${crypto.randomUUID()}@kitakerja.test`;

  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email,
    ...(phone ? { phone, phone_confirm: true } : {}),
    email_confirm: true,
    user_metadata: { nama: body.nama, didampingi_oleh: userOrResponse.id },
  });

  if (authError || !authUser.user) {
    const pesan = authError?.message.includes("already been registered")
      ? "Nomor HP ini sudah terdaftar. Pekerja bisa langsung masuk sendiri."
      : "Gagal membuat akun pekerja.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  const { error: penggunaError } = await service.from("pengguna").insert({
    id: authUser.user.id,
    nama: body.nama,
    email,
    no_hp: phone ?? `tanpa-hp-${authUser.user.id.slice(0, 8)}`,
    peran: "pekerja",
    wilayah_id: body.wilayah_id,
    status_verifikasi: phone ? "hp_terverifikasi" : "belum",
    didampingi_oleh: userOrResponse.id,
  });

  if (penggunaError) {
    await service.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan data pekerja." }, { status: 500 });
  }

  const { error: kartuError } = await service
    .from("kartu_kerja")
    .insert({ pekerja_id: authUser.user.id });

  if (kartuError) {
    return NextResponse.json({ ok: false, pesan: "Gagal menyiapkan kartu kerja." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: { pekerja_id: authUser.user.id } });
}
