import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { cocokkanPekerja } from "@/lib/engine/matching";
import { z } from "zod";

const BodySchema = z.object({ lowongan_id: z.string().uuid() });

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pekerja");
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
    .select("id, status")
    .eq("id", body.lowongan_id)
    .maybeSingle();

  if (!lowongan) {
    return NextResponse.json({ ok: false, pesan: "Lowongan tidak ditemukan." }, { status: 404 });
  }
  if (lowongan.status !== "tayang") {
    return NextResponse.json(
      { ok: false, pesan: "Lowongan ini sudah tidak menerima lamaran." },
      { status: 409 },
    );
  }

  const cocok = await cocokkanPekerja(userOrResponse.id, 50);
  const alasan = cocok.find((c) => c.id === body.lowongan_id)?.alasan;

  const { data: lamaran, error } = await supabase
    .from("lamaran")
    .insert({
      lowongan_id: body.lowongan_id,
      pekerja_id: userOrResponse.id,
      status: "dilamar",
      alasan_cocok: alasan ? [alasan] : [],
    })
    .select("id")
    .single();

  if (error) {
    // UNIQUE (lowongan_id, pekerja_id)
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, pesan: "Anda sudah melamar lowongan ini." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, pesan: "Gagal mengirim lamaran." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: { lamaran_id: lamaran.id } });
}
