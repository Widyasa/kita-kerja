import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  pekerjaan_id: z.string().uuid().optional(),
  keahlian_id: z.string().uuid().optional(),
  wilayah_id: z.string().uuid().optional(),
  upah_diterima: z.number().int().positive(),
  satuan: z.enum(["harian", "bulanan", "borongan", "per_jam"]),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pekerja");
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

  const { error } = await supabase.from("lapor_upah").insert({
    pekerjaan_id: body.pekerjaan_id ?? null,
    pekerja_id: userOrResponse.id,
    keahlian_id: body.keahlian_id ?? null,
    wilayah_id: body.wilayah_id ?? null,
    upah_diterima: body.upah_diterima,
    satuan: body.satuan,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal melaporkan upah." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: { pesan: "Upah berhasil dilaporkan. Terima kasih!" } });
}
