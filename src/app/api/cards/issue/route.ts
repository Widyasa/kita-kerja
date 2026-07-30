import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import QRCode from "qrcode";

export async function POST() {
  const userOrResponse = await requireRole("pekerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const supabase = await createClient();

  const { data: kartu } = await supabase
    .from("kartu_kerja")
    .select("id, aktif_publik")
    .eq("pekerja_id", userOrResponse.id)
    .single();

  if (!kartu) {
    return NextResponse.json(
      { ok: false, pesan: "Kartu kerja tidak ditemukan." },
      { status: 404 }
    );
  }

  // Generate token publik baru
  const tokenPublik = crypto.randomUUID().replace(/-/g, "");
  const urlVerifikasi = `${process.env.APP_URL}/verify/${tokenPublik}`;

  // Generate QR SVG
  const qrSvg = await QRCode.toString(urlVerifikasi, { type: "svg", width: 256 });

  const { error } = await supabase
    .from("kartu_kerja")
    .update({
      token_publik: tokenPublik,
      aktif_publik: true,
      diterbitkan_pada: new Date().toISOString(),
    })
    .eq("id", kartu.id);

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menerbitkan kartu." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      token_publik: tokenPublik,
      url_verifikasi: urlVerifikasi,
      qr_svg: qrSvg,
    },
  });
}
