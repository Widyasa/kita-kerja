import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  nama: z.string().trim().min(3).max(100).optional(),
  wilayah_id: z.string().uuid().nullable().optional(),
  kecamatan_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.nama !== undefined) patch.nama = body.nama;
  if (body.wilayah_id !== undefined) patch.wilayah_id = body.wilayah_id;
  if (body.kecamatan_id !== undefined) patch.kecamatan_id = body.kecamatan_id;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, pesan: "Tidak ada yang diubah." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pengguna").update(patch).eq("id", userOrResponse.id);

  if (error) {
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan profil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
