import { createClient } from "@/lib/supabase/server-client";
import type { SatuanUpah, StatusKesepakatan } from "@/lib/mock/types";

export interface KesepakatanTampil {
  id: string;
  lingkup: string;
  upah_disepakati: number;
  satuan: SatuanUpah;
  mulai: string | null;
  selesai: string | null;
  tanggal_bayar_dijanjikan: string;
  status: StatusKesepakatan;
  otp_pekerja_sudah: boolean;
  otp_pemberi_sudah: boolean;
  judul_lowongan: string | null;
  pekerja_id: string;
  pemberi_kerja_id: string;
  nama_pekerja: string;
  nama_pemberi: string;
  pekerjaan_selesai: boolean;
}

interface Baris {
  id: string;
  lingkup: string;
  upah_disepakati: number;
  satuan: SatuanUpah;
  mulai: string | null;
  selesai: string | null;
  tanggal_bayar_dijanjikan: string;
  status: StatusKesepakatan;
  otp_pekerja_pada: string | null;
  otp_pemberi_pada: string | null;
  pekerja_id: string;
  pemberi_kerja_id: string;
  lowongan: { judul_baku: string | null } | { judul_baku: string | null }[] | null;
  pekerja: { nama: string } | { nama: string }[] | null;
  pemberi: { nama: string } | { nama: string }[] | null;
}

function satu<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function kesepakatanUntukPihak(
  kesepakatanId: string,
  penggunaId: string,
): Promise<KesepakatanTampil | null> {
  const supabase = await createClient();

  const { data: b } = await supabase
    .from("kesepakatan_kerja")
    .select(
      `id, lingkup, upah_disepakati, satuan, mulai, selesai, tanggal_bayar_dijanjikan,
       status, otp_pekerja_pada, otp_pemberi_pada, pekerja_id, pemberi_kerja_id,
       lowongan:lowongan_id(judul_baku),
       pekerja:pekerja_id(nama),
       pemberi:pemberi_kerja_id(nama)`,
    )
    .eq("id", kesepakatanId)
    .maybeSingle<Baris>();

  if (!b) return null;
  if (b.pekerja_id !== penggunaId && b.pemberi_kerja_id !== penggunaId) return null;

  const { data: pekerjaan } = await supabase
    .from("pekerjaan")
    .select("selesai_pada")
    .eq("kesepakatan_id", kesepakatanId)
    .maybeSingle();

  return {
    id: b.id,
    lingkup: b.lingkup,
    upah_disepakati: b.upah_disepakati,
    satuan: b.satuan,
    mulai: b.mulai,
    selesai: b.selesai,
    tanggal_bayar_dijanjikan: b.tanggal_bayar_dijanjikan,
    status: b.status,
    otp_pekerja_sudah: !!b.otp_pekerja_pada,
    otp_pemberi_sudah: !!b.otp_pemberi_pada,
    judul_lowongan: satu(b.lowongan)?.judul_baku ?? null,
    pekerja_id: b.pekerja_id,
    pemberi_kerja_id: b.pemberi_kerja_id,
    nama_pekerja: satu(b.pekerja)?.nama ?? "Pekerja",
    nama_pemberi: satu(b.pemberi)?.nama ?? "Pemberi kerja",
    pekerjaan_selesai: !!pekerjaan?.selesai_pada,
  };
}
