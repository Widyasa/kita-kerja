import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        nama_tampil: z.string().trim().min(1).max(100).optional(),
        level: z.enum(["pemula", "terampil", "ahli"]).optional(),
      }),
    )
    .min(1)
    .max(12),
});

/**
 * Tandai keahlian sebagai diperiksa pekerja (langkah "Betul"/"Perbaiki" di
 * halaman hasil Ngobrol Kerja) — RLS kartu_keahlian_update_own memastikan
 * hanya baris milik kartu sendiri yang bisa diubah.
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

  for (const item of body.items) {
    const patch: Record<string, unknown> = { dikonfirmasi_pekerja: true };
    if (item.nama_tampil) patch.nama_diajukan = item.nama_tampil;
    if (item.level) patch.level = item.level;

    const { error } = await supabase
      .from("kartu_keahlian")
      .update(patch)
      .eq("id", item.id);

    if (error) {
      return NextResponse.json(
        { ok: false, pesan: "Gagal menyimpan konfirmasi keahlian." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
