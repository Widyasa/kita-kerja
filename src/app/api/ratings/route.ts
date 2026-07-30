import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  kesepakatan_id: z.string().uuid(),
  skor: z.number().int().min(1).max(5),
  catatan: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pemberi_kerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: pekerjaan } = await supabase
    .from("pekerjaan")
    .select("id, pemberi_kerja_id, selesai_pada")
    .eq("kesepakatan_id", body.kesepakatan_id)
    .maybeSingle();

  if (!pekerjaan) {
    return NextResponse.json(
      { ok: false, pesan: "Pekerjaan belum tercatat. Konfirmasi selesai dulu." },
      { status: 404 },
    );
  }
  if (pekerjaan.pemberi_kerja_id !== userOrResponse.id) {
    return NextResponse.json({ ok: false, pesan: "Akses ditolak." }, { status: 403 });
  }
  if (!pekerjaan.selesai_pada) {
    return NextResponse.json(
      { ok: false, pesan: "Pekerjaan belum dikonfirmasi selesai oleh kedua pihak." },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("penilaian").insert({
    pekerjaan_id: pekerjaan.id,
    pemberi_kerja_id: userOrResponse.id,
    skor: body.skor,
    catatan: body.catatan ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, pesan: "Penilaian untuk pekerjaan ini sudah pernah dikirim." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan penilaian." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
