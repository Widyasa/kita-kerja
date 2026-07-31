import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({ lamaran_id: z.string().uuid() });

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
  const { data: lamaran } = await supabase
    .from("lamaran")
    .select("id, status, lowongan:lowongan_id(pemberi_kerja_id)")
    .eq("id", body.lamaran_id)
    .maybeSingle();

  if (!lamaran) {
    return NextResponse.json({ ok: false, pesan: "Lamaran tidak ditemukan." }, { status: 404 });
  }

  const lo = Array.isArray(lamaran.lowongan) ? lamaran.lowongan[0] : lamaran.lowongan;
  if ((lo as { pemberi_kerja_id: string } | null)?.pemberi_kerja_id !== userOrResponse.id) {
    return NextResponse.json({ ok: false, pesan: "Akses ditolak." }, { status: 403 });
  }
  if (lamaran.status !== "dilamar") {
    return NextResponse.json(
      { ok: false, pesan: "Lamaran ini sudah diproses." },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("lamaran")
    .update({ status: "diundang" })
    .eq("id", body.lamaran_id);

  if (error) {
    return NextResponse.json({ ok: false, pesan: "Gagal mengirim undangan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
