import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { ambilKeahlianTampil } from "@/lib/data/keahlian";
import { z } from "zod";

async function ambilKartuSendiri(userId: string) {
  const supabase = await createClient();
  const { data: kartu } = await supabase
    .from("kartu_kerja")
    .select("id")
    .eq("pekerja_id", userId)
    .single();
  return kartu;
}

/** Daftar keahlian yang masih menunggu diperiksa pekerja (belum dikonfirmasi). */
export async function GET() {
  const userOrResponse = await requireRole("pekerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const kartu = await ambilKartuSendiri(userOrResponse.id);
  if (!kartu) {
    return NextResponse.json(
      { ok: false, pesan: "Kartu kerja tidak ditemukan." },
      { status: 404 }
    );
  }

  const supabase = await createClient();
  const keahlian = await ambilKeahlianTampil(supabase, kartu.id, userOrResponse.id);
  const belum = keahlian.filter((k) => !k.dikonfirmasi_pekerja);

  return NextResponse.json({ ok: true, data: { keahlian: belum } });
}

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        nama: z.string().trim().min(3).max(100),
        level: z.enum(["pemula", "terampil", "ahli"]),
        cerita: z.string().trim().min(10).max(500),
      }),
    )
    .min(1)
    .max(12),
});

/** Isi manual — tambah keahlian yang ditulis sendiri pekerja (jalur non-suara). */
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

  const kartu = await ambilKartuSendiri(userOrResponse.id);
  if (!kartu) {
    return NextResponse.json(
      { ok: false, pesan: "Kartu kerja tidak ditemukan." },
      { status: 404 }
    );
  }

  const supabase = await createClient();
  const { data: keahlian, error } = await supabase
    .from("kartu_keahlian")
    .insert(
      body.items.map((item) => ({
        kartu_id: kartu.id,
        keahlian_id: null,
        nama_diajukan: item.nama,
        sebutan_pekerja: item.nama,
        level: item.level,
        kutipan_bukti: item.cerita,
        keyakinan: 1,
        sumber: "manual",
        dikonfirmasi_pekerja: false,
      })),
    )
    .select();

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyimpan keahlian." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: { keahlian } });
}
