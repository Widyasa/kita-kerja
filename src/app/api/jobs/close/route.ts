import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({ lowongan_id: z.string().uuid() });

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
  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, pemberi_kerja_id")
    .eq("id", body.lowongan_id)
    .maybeSingle();

  if (!lowongan) {
    return NextResponse.json({ ok: false, pesan: "Lowongan tidak ditemukan." }, { status: 404 });
  }
  if (lowongan.pemberi_kerja_id !== userOrResponse.id) {
    return NextResponse.json({ ok: false, pesan: "Akses ditolak." }, { status: 403 });
  }

  const { error } = await supabase
    .from("lowongan")
    .update({ status: "ditutup" })
    .eq("id", body.lowongan_id);

  if (error) {
    return NextResponse.json({ ok: false, pesan: "Gagal menutup lowongan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
