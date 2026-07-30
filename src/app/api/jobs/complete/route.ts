import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  kesepakatan_id: z.string().uuid(),
  pihak: z.enum(["pekerja", "pemberi_kerja"]),
});

export async function POST(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

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

  const supabase = await createClient();

  // Panggil fungsi selesaikan_pekerjaan
  const { data, error } = await supabase.rpc("selesaikan_pekerjaan", {
    p_kesepakatan_id: body.kesepakatan_id,
    p_pihak: body.pihak,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: error.message },
      { status: 400 }
    );
  }

  // Cek apakah sudah selesai
  const { data: pekerjaan } = await supabase
    .from("pekerjaan")
    .select("selesai_pada")
    .eq("kesepakatan_id", body.kesepakatan_id)
    .single();

  return NextResponse.json({
    ok: true,
    data: {
      pekerjaan_id: data,
      sudah_selesai: !!pekerjaan?.selesai_pada,
    },
  });
}
