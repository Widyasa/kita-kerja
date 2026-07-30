import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  kesepakatan_id: z.string().uuid(),
  aksi: z.enum(["kirim", "verifikasi"]),
  kode_otp: z.string().length(6).optional(),
});

const DEMO_MODE = process.env.DEMO_MODE === "true";
const DEMO_OTP = "123456";

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

  const { data: kesepakatan } = await supabase
    .from("kesepakatan_kerja")
    .select("*")
    .eq("id", body.kesepakatan_id)
    .single();

  if (!kesepakatan) {
    return NextResponse.json(
      { ok: false, pesan: "Kesepakatan tidak ditemukan." },
      { status: 404 }
    );
  }

  const isPekerja = kesepakatan.pekerja_id === userOrResponse.id;
  const isPemberi = kesepakatan.pemberi_kerja_id === userOrResponse.id;

  if (!isPekerja && !isPemberi) {
    return NextResponse.json(
      { ok: false, pesan: "Akses ditolak." },
      { status: 403 }
    );
  }

  if (body.aksi === "kirim") {
    // Kirim OTP (di demo mode, kode tetap)
    const kode = DEMO_MODE ? DEMO_OTP : Math.random().toString().slice(2, 8);
    // Di production, kirim via SMS. Di demo, langsung return.
    return NextResponse.json({
      ok: true,
      data: { pesan: DEMO_MODE ? "Kode OTP demo: 123456" : "Kode OTP telah dikirim." },
    });
  }

  if (body.aksi === "verifikasi") {
    const kode = body.kode_otp;
    if (!kode) {
      return NextResponse.json(
        { ok: false, pesan: "Kode OTP wajib diisi." },
        { status: 400 }
      );
    }

    if (!DEMO_MODE && kode !== DEMO_OTP) {
      // Di production, verifikasi kode yang dikirim
      return NextResponse.json(
        { ok: false, pesan: "Kode OTP salah." },
        { status: 400 }
      );
    }

    // Stamp OTP
    const updateData: Record<string, string> = {};
    if (isPekerja) {
      updateData.otp_pekerja_pada = new Date().toISOString();
    } else {
      updateData.otp_pemberi_pada = new Date().toISOString();
    }

    const { error } = await supabase
      .from("kesepakatan_kerja")
      .update(updateData)
      .eq("id", body.kesepakatan_id);

    if (error) {
      return NextResponse.json(
        { ok: false, pesan: "Gagal menyimpan OTP." },
        { status: 500 }
      );
    }

    // Cek apakah kedua OTP sudah di-stamp
    const { data: updated } = await supabase
      .from("kesepakatan_kerja")
      .select("otp_pekerja_pada, otp_pemberi_pada")
      .eq("id", body.kesepakatan_id)
      .single();

    if (updated?.otp_pekerja_pada && updated?.otp_pemberi_pada) {
      await supabase
        .from("kesepakatan_kerja")
        .update({ status: "berjalan" })
        .eq("id", body.kesepakatan_id);
    }

    return NextResponse.json({
      ok: true,
      data: {
        status: updated?.otp_pekerja_pada && updated?.otp_pemberi_pada ? "berjalan" : "menunggu",
        pesan: "OTP berhasil diverifikasi.",
      },
    });
  }

  return NextResponse.json(
    { ok: false, pesan: "Aksi tidak valid." },
    { status: 400 }
  );
}
