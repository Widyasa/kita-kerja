import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  lamaran_id: z.string().uuid(),
  lingkup: z.string().min(3).max(500),
  upah_disepakati: z.number().int().positive(),
  satuan: z.enum(["harian", "bulanan", "borongan", "per_jam"]),
  mulai: z.string().optional(),
  selesai: z.string().optional(),
  tanggal_bayar_dijanjikan: z.string(),
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
      { ok: false, pesan: "Format tidak valid." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Ambil lamaran
  const { data: lamaran } = await supabase
    .from("lamaran")
    .select("id, lowongan_id, pekerja_id, status, lowongan:lowongan_id(pemberi_kerja_id)")
    .eq("id", body.lamaran_id)
    .single();

  if (!lamaran) {
    return NextResponse.json(
      { ok: false, pesan: "Lamaran tidak ditemukan." },
      { status: 404 }
    );
  }

  const pemberiKerjaId = (lamaran.lowongan as any).pemberi_kerja_id;
  if (pemberiKerjaId !== userOrResponse.id) {
    return NextResponse.json(
      { ok: false, pesan: "Akses ditolak." },
      { status: 403 }
    );
  }

  if (lamaran.status !== "dilamar" && lamaran.status !== "diundang") {
    return NextResponse.json(
      { ok: false, pesan: "Lamaran tidak bisa dibuat kesepakatan." },
      { status: 400 }
    );
  }

  // Buat kesepakatan
  const { data: kesepakatan, error } = await supabase
    .from("kesepakatan_kerja")
    .insert({
      lowongan_id: lamaran.lowongan_id,
      pekerja_id: lamaran.pekerja_id,
      pemberi_kerja_id: pemberiKerjaId,
      lingkup: body.lingkup,
      upah_disepakati: body.upah_disepakati,
      satuan: body.satuan,
      mulai: body.mulai ?? null,
      selesai: body.selesai ?? null,
      tanggal_bayar_dijanjikan: body.tanggal_bayar_dijanjikan,
      status: "menunggu",
    })
    .select()
    .single();

  if (error || !kesepakatan) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal membuat kesepakatan." },
      { status: 500 }
    );
  }

  // Update lamaran jadi disepakati
  await supabase
    .from("lamaran")
    .update({ status: "disepakati" })
    .eq("id", body.lamaran_id);

  return NextResponse.json({ ok: true, data: kesepakatan });
}
