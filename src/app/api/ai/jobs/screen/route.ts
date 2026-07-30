import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { jalankanSaringan } from "@/lib/engine/screening-runner";
import { z } from "zod";

const BodySchema = z.object({
  lowongan_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pemberi_kerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format tidak valid. Kirim { lowongan_id: string }." },
      { status: 400 }
    );
  }

  // Ambil teks lowongan
  const supabase = await createClient();
  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, teks_asli, pemberi_kerja_id")
    .eq("id", body.lowongan_id)
    .single();

  if (!lowongan) {
    return NextResponse.json(
      { ok: false, pesan: "Lowongan tidak ditemukan." },
      { status: 404 }
    );
  }

  if (lowongan.pemberi_kerja_id !== userOrResponse.id) {
    return NextResponse.json(
      { ok: false, pesan: "Akses ditolak." },
      { status: 403 }
    );
  }

  const hasil = await jalankanSaringan(body.lowongan_id, lowongan.teks_asli, userOrResponse.id);

  if (hasil.tingkat === "berisiko_tinggi" && hasil.skor_risiko >= 60) {
    const service = await createServiceClient();
    await service.from("lowongan").update({ status: "moderasi" }).eq("id", body.lowongan_id);
  }

  return NextResponse.json({ ok: true, data: hasil });
}
