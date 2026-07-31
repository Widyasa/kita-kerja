// src/lib/data/lowongan.ts
/**
 * Baca lowongan untuk pekerja. Alasan pencocokan berupa KALIMAT
 * (mesin cocok mengembalikan skor internal — skor tidak pernah keluar dari sini).
 */

import { createClient } from "@/lib/supabase/server-client";
import { hitungAcuanUpah } from "@/lib/engine/wage-benchmark";
import { cocokkanPekerja } from "@/lib/engine/matching";
import { jarakKm } from "@/lib/engine/jarak";
import type { LowonganTampil, RekamJejakPemberi, SaringanTampil } from "./types";

const KOLOM_LOWONGAN = `
  id, judul_baku, teks_asli, status, jenis_kerja, jumlah_pekerja,
  upah_ditawarkan, satuan_upah, lokasi_teks, mulai, syarat_tersirat,
  wilayah_id, kecamatan_id, pemberi_kerja_id,
  wilayah:wilayah_id(nama),
  kecamatan:kecamatan_id(lat, lng),
  saringan:saringan_aman(tingkat, temuan, pertanyaan_disarankan),
  keahlian:lowongan_keahlian(keahlian_id)
`;

interface TitikKecamatan {
  lat: number;
  lng: number;
}

interface BarisLowongan {
  id: string;
  judul_baku: string | null;
  teks_asli: string;
  status: LowonganTampil["status"];
  jenis_kerja: LowonganTampil["jenis_kerja"];
  jumlah_pekerja: number;
  upah_ditawarkan: number | null;
  satuan_upah: LowonganTampil["satuan_upah"];
  lokasi_teks: string | null;
  mulai: string | null;
  syarat_tersirat: string[] | null;
  wilayah_id: string | null;
  kecamatan_id: string | null;
  pemberi_kerja_id: string;
  wilayah: { nama: string } | { nama: string }[] | null;
  kecamatan: TitikKecamatan | TitikKecamatan[] | null;
  saringan: SaringanTampil | SaringanTampil[] | null;
  keahlian: { keahlian_id: string }[] | null;
}

function satu<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/** Titik kecamatan (lat/lng) tempat pekerja biasa bekerja — null bila
 * pekerja belum memilih kecamatan di profilnya. Dipakai untuk perkiraan
 * jarak (ADR-0002), TIDAK PERNAH memanggil geocoding/routing sungguhan. */
async function kecamatanPekerja(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pekerjaId: string,
): Promise<TitikKecamatan | null> {
  const { data } = await supabase
    .from("pengguna")
    .select("kecamatan:kecamatan_id(lat, lng)")
    .eq("id", pekerjaId)
    .maybeSingle<{ kecamatan: TitikKecamatan | TitikKecamatan[] | null }>();

  const titik = data && satu(data.kecamatan);
  return titik ? { lat: Number(titik.lat), lng: Number(titik.lng) } : null;
}

function jarakDariPekerja(
  pekerja: TitikKecamatan | null,
  lowongan: TitikKecamatan | null,
): number | null {
  if (!pekerja || !lowongan) return null;
  return jarakKm(pekerja, { lat: Number(lowongan.lat), lng: Number(lowongan.lng) });
}

async function keLowonganTampil(
  b: BarisLowongan,
  alasan: string | null,
  pekerjaKecamatan: TitikKecamatan | null,
): Promise<LowonganTampil> {
  const keahlianId = b.keahlian?.[0]?.keahlian_id ?? null;
  const acuan =
    keahlianId && b.wilayah_id ? await hitungAcuanUpah(keahlianId, b.wilayah_id) : null;

  return {
    id: b.id,
    judul_baku: b.judul_baku ?? "Lowongan",
    teks_asli: b.teks_asli,
    status: b.status,
    jenis_kerja: b.jenis_kerja,
    jumlah_pekerja: b.jumlah_pekerja,
    upah_ditawarkan: b.upah_ditawarkan,
    satuan_upah: b.satuan_upah,
    lokasi_teks: b.lokasi_teks,
    mulai: b.mulai,
    syarat_tersirat: b.syarat_tersirat ?? [],
    wilayah_id: b.wilayah_id,
    wilayah_nama: satu(b.wilayah)?.nama ?? null,
    pemberi_kerja_id: b.pemberi_kerja_id,
    saringan: satu(b.saringan),
    acuan: acuan
      ? {
          acuan_harian: acuan.acuan_harian,
          metode: acuan.metode,
          jumlah_laporan: acuan.jumlah_laporan,
        }
      : null,
    alasan_cocok: alasan,
    jarak_km: jarakDariPekerja(pekerjaKecamatan, satu(b.kecamatan)),
  };
}

export async function daftarLowonganUntukPekerja(
  pekerjaId: string,
): Promise<{ lowongan: LowonganTampil[]; idSudahDilamar: Set<string> }> {
  const supabase = await createClient();

  const pekerjaKecamatan = await kecamatanPekerja(supabase, pekerjaId);

  const { data: baris } = await supabase
    .from("lowongan")
    .select(KOLOM_LOWONGAN)
    .eq("status", "tayang")
    .order("id")
    .returns<BarisLowongan[]>();

  const cocok = await cocokkanPekerja(pekerjaId, 50);
  const petaAlasan = new Map(cocok.map((c) => [c.id, c.alasan]));

  const { data: lamaranSaya } = await supabase
    .from("lamaran")
    .select("lowongan_id")
    .eq("pekerja_id", pekerjaId);

  const lowongan = await Promise.all(
    (baris ?? []).map((b) =>
      keLowonganTampil(b, petaAlasan.get(b.id) ?? null, pekerjaKecamatan),
    ),
  );

  return {
    lowongan,
    idSudahDilamar: new Set((lamaranSaya ?? []).map((l) => l.lowongan_id as string)),
  };
}

export interface DetailLowongan {
  lowongan: LowonganTampil;
  pemberi: {
    id: string;
    nama: string;
    status_verifikasi: "belum" | "hp_terverifikasi" | "identitas_terverifikasi";
  } | null;
  rekamJejakPemberi: RekamJejakPemberi;
  sudahMelamar: boolean;
  kesepakatanId: string | null;
}

export async function detailLowonganUntukPekerja(
  lowonganId: string,
  pekerjaId: string,
): Promise<DetailLowongan | null> {
  const supabase = await createClient();

  const pekerjaKecamatan = await kecamatanPekerja(supabase, pekerjaId);

  const { data: baris } = await supabase
    .from("lowongan")
    .select(KOLOM_LOWONGAN)
    .eq("id", lowonganId)
    .maybeSingle<BarisLowongan>();

  if (!baris) return null;

  const cocok = await cocokkanPekerja(pekerjaId, 50);
  const lowongan = await keLowonganTampil(
    baris,
    cocok.find((c) => c.id === baris.id)?.alasan ?? null,
    pekerjaKecamatan,
  );

  const { data: pemberi } = await supabase
    .from("pengguna")
    .select("id, nama, status_verifikasi")
    .eq("id", baris.pemberi_kerja_id)
    .maybeSingle();

  const { data: jejak } = await supabase.rpc("rekam_jejak_pemberi", {
    p_pemberi: baris.pemberi_kerja_id,
  });
  const jejakSatu = (jejak as RekamJejakPemberi[] | null)?.[0];

  const { data: lamaranSaya } = await supabase
    .from("lamaran")
    .select("id")
    .eq("lowongan_id", lowonganId)
    .eq("pekerja_id", pekerjaId)
    .maybeSingle();

  const { data: kesepakatan } = await supabase
    .from("kesepakatan_kerja")
    .select("id")
    .eq("lowongan_id", lowonganId)
    .eq("pekerja_id", pekerjaId)
    .maybeSingle();

  return {
    lowongan,
    pemberi: pemberi as DetailLowongan["pemberi"],
    rekamJejakPemberi: jejakSatu ?? { pekerjaan_selesai: 0, laporan_terbuka: 0 },
    sudahMelamar: !!lamaranSaya,
    kesepakatanId: (kesepakatan?.id as string) ?? null,
  };
}
