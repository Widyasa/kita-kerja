import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  sesi_id: z.string().uuid(),
  // Nomor pertanyaan yang mau diulang (1-based) — buang jawaban pertanyaan
  // ini dan semua sesudahnya, karena pertanyaan-pertanyaan itu di-generate
  // AI berdasarkan jawaban lama yang sekarang dibatalkan.
  target_nomor: z.number().int().min(1).max(6),
});

/**
 * Ulangi pertanyaan nomor N ("Rekam ulang") — mundur ke keadaan tepat
 * sebelum pertanyaan N dijawab. Jawaban N dan sesudahnya (kalau ada) dibuang.
 * Klien membatasi ini ke maksimal 1x per pertanyaan — endpoint ini sendiri
 * cuma memangkas sesi, tanpa tahu berapa kali dipakai.
 */
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

  const { data: sesi } = await supabase
    .from("sesi_wawancara")
    .select("*")
    .eq("id", body.sesi_id)
    .eq("pekerja_id", userOrResponse.id)
    .single();

  if (!sesi) {
    return NextResponse.json(
      { ok: false, pesan: "Sesi tidak ditemukan." },
      { status: 404 }
    );
  }

  if (sesi.status !== "berjalan") {
    return NextResponse.json(
      { ok: false, pesan: "Sesi sudah selesai." },
      { status: 409 }
    );
  }

  if (body.target_nomor > sesi.jumlah_putaran) {
    return NextResponse.json(
      { ok: false, pesan: "Pertanyaan itu belum pernah dijawab." },
      { status: 400 }
    );
  }

  const putaranBaru = (sesi.putaran as any[]).filter((p) => p.nomor < body.target_nomor);

  const { error } = await supabase
    .from("sesi_wawancara")
    .update({
      putaran: putaranBaru,
      jumlah_putaran: body.target_nomor - 1,
      diperbarui_pada: new Date().toISOString(),
    })
    .eq("id", body.sesi_id);

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal mengulang jawaban." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: { putaran: body.target_nomor - 1 },
  });
}
