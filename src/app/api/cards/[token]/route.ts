import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabase = await createServiceClient();

  // Explicit column list — jangan expose ID internal
  const { data: kartu } = await supabase
    .from("kartu_kerja")
    .select(`
      token_publik,
      aktif_publik,
      ringkasan,
      pengalaman_tahun,
      kesediaan,
      jangkauan_km,
      alat_dimiliki,
      bahasa_terdeteksi,
      diterbitkan_pada,
      bidang_utama:bidang_utama_id(nama),
      pekerja:pekerja_id(nama),
      keahlian:kartu_keahlian(
        sebutan_pekerja,
        level,
        kutipan_bukti,
        sumber,
        keahlian:keahlian_id(nama_baku)
      )
    `)
    .eq("token_publik", token)
    .single();

  // Token tidak aktif & tidak dikenal balas data yang sama (security)
  if (!kartu || !kartu.aktif_publik) {
    return NextResponse.json(
      {
        ok: false,
        data: {
          aktif: false,
          pesan: "Kartu kerja tidak ditemukan atau tidak aktif.",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      aktif: true,
      pekerja: kartu.pekerja,
      ringkasan: kartu.ringkasan,
      bidang_utama: kartu.bidang_utama,
      pengalaman_tahun: kartu.pengalaman_tahun,
      kesediaan: kartu.kesediaan,
      jangkauan_km: kartu.jangkauan_km,
      alat_dimiliki: kartu.alat_dimiliki,
      bahasa_terdeteksi: kartu.bahasa_terdeteksi,
      keahlian: kartu.keahlian,
      diterbitkan_pada: kartu.diterbitkan_pada,
    },
  });
}
