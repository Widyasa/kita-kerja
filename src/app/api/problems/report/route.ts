import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  pekerjaan_id: z.string().uuid().optional(),
  lowongan_id: z.string().uuid().optional(),
  jenis: z.enum(["upah_tidak_dibayar", "kondisi_tidak_sesuai", "lowongan_palsu", "lainnya"]),
  keterangan: z.string().max(1000).optional(),
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

  const { error } = await supabase.from("laporan_masalah").insert({
    pekerjaan_id: body.pekerjaan_id ?? null,
    lowongan_id: body.lowongan_id ?? null,
    pelapor_id: userOrResponse.id,
    jenis: body.jenis,
    keterangan: body.keterangan ?? null,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal mengirim laporan." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: { pesan: "Laporan berhasil dikirim. Tim kami akan menindaklanjuti." },
  });
}
