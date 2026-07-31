// src/lib/data/lowongan-publik.ts
/**
 * Baca lowongan untuk PUBLIK — pengunjung tanpa akun.
 *
 * Batas yang disengaja (jangan dilonggarkan tanpa alasan):
 * - Hanya lowongan `status = 'tayang'`. RLS `lowongan_select_public` sudah
 *   menegakkan ini di basis data; filter di sini hanya penegasan.
 * - TIDAK memanggil mesin pencocokan. `alasan_cocok` butuh identitas pekerja,
 *   dan skor tidak pernah keluar dari mesin.
 * - TIDAK menyentuh tabel `pengguna` maupun RPC rekam jejak. Keduanya tertutup
 *   untuk anon (lihat 20260731000001_revoke_public_execute_rpcs.sql), dan
 *   identitas pemberi kerja memang bukan konsumsi publik.
 *
 * Acuan Upah Terang tetap dihitung: angkanya deterministik dari UMK wilayah,
 * bukan data pribadi siapa pun.
 */

import { createClient } from "@/lib/supabase/server-client";
import { hitungAcuanUpah } from "@/lib/engine/wage-benchmark";
import type { LowonganTampil, SaringanTampil } from "./types";

const KOLOM_LOWONGAN = `
  id, judul_baku, teks_asli, status, jenis_kerja, jumlah_pekerja,
  upah_ditawarkan, satuan_upah, lokasi_teks, mulai, syarat_tersirat,
  wilayah_id, pemberi_kerja_id,
  wilayah:wilayah_id(nama, provinsi),
  saringan:saringan_aman(tingkat, temuan, pertanyaan_disarankan),
  keahlian:lowongan_keahlian(keahlian_id, wajib, keahlian_baku:keahlian_id(nama_baku))
`;

interface BarisLowonganPublik {
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
  pemberi_kerja_id: string;
  wilayah:
    | { nama: string; provinsi: string }
    | { nama: string; provinsi: string }[]
    | null;
  saringan: SaringanTampil | SaringanTampil[] | null;
  keahlian:
    | {
        keahlian_id: string | null;
        wajib: boolean;
        keahlian_baku: { nama_baku: string } | { nama_baku: string }[] | null;
      }[]
    | null;
}

/** Bentuk tampilan publik: LowonganTampil tanpa alasan cocok, plus nama keahlian. */
export interface LowonganPublik extends LowonganTampil {
  provinsi_nama: string | null;
  /** nama Keahlian Baku yang diminta lowongan ini */
  keahlian_nama: string[];
}

function satu<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

async function kePublik(b: BarisLowonganPublik): Promise<LowonganPublik> {
  const keahlianId = b.keahlian?.[0]?.keahlian_id ?? null;
  const acuan =
    keahlianId && b.wilayah_id
      ? await hitungAcuanUpah(keahlianId, b.wilayah_id)
      : null;
  const wilayah = satu(b.wilayah);

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
    wilayah_nama: wilayah?.nama ?? null,
    provinsi_nama: wilayah?.provinsi ?? null,
    pemberi_kerja_id: b.pemberi_kerja_id,
    saringan: satu(b.saringan),
    acuan: acuan
      ? {
          acuan_harian: acuan.acuan_harian,
          metode: acuan.metode,
          jumlah_laporan: acuan.jumlah_laporan,
        }
      : null,
    // Publik tidak punya profil untuk dicocokkan.
    alasan_cocok: null,
    keahlian_nama: (b.keahlian ?? [])
      .map((k) => satu(k.keahlian_baku)?.nama_baku)
      .filter((n): n is string => Boolean(n)),
  };
}

export interface SaringanPublik {
  /** id wilayah */
  wilayah?: string;
  jenis?: LowonganTampil["jenis_kerja"];
  /** pencarian teks bebas pada judul & lokasi */
  q?: string;
  /** batasi jumlah hasil (dipakai section "lowongan terbaru" di beranda) */
  batas?: number;
}

export async function daftarLowonganPublik(
  filter: SaringanPublik = {},
): Promise<LowonganPublik[]> {
  const supabase = await createClient();

  let q = supabase
    .from("lowongan")
    .select(KOLOM_LOWONGAN)
    .eq("status", "tayang");

  if (filter.wilayah) q = q.eq("wilayah_id", filter.wilayah);
  if (filter.jenis) q = q.eq("jenis_kerja", filter.jenis);
  if (filter.q) {
    const aman = filter.q.replace(/[%,()]/g, " ").trim();
    if (aman) {
      q = q.or(
        `judul_baku.ilike.%${aman}%,lokasi_teks.ilike.%${aman}%,teks_asli.ilike.%${aman}%`,
      );
    }
  }

  // Tabel lowongan tidak menyimpan waktu buat, jadi urutan yang paling berguna
  // adalah "yang paling cepat mulai lebih dulu"; yang tanpa tanggal di belakang.
  q = q
    .order("mulai", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });
  if (filter.batas) q = q.limit(filter.batas);

  const { data: baris } = await q.returns<BarisLowonganPublik[]>();
  return Promise.all((baris ?? []).map(kePublik));
}

export async function detailLowonganPublik(
  lowonganId: string,
): Promise<LowonganPublik | null> {
  const supabase = await createClient();

  const { data: baris } = await supabase
    .from("lowongan")
    .select(KOLOM_LOWONGAN)
    .eq("id", lowonganId)
    .eq("status", "tayang")
    .maybeSingle<BarisLowonganPublik>();

  if (!baris) return null;
  return kePublik(baris);
}

export interface WilayahPilihan {
  id: string;
  nama: string;
  provinsi: string;
}

/**
 * Wilayah yang benar-benar punya lowongan tayang — supaya filter tidak
 * menawarkan pilihan yang pasti kosong.
 */
export async function wilayahBerlowongan(): Promise<WilayahPilihan[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("lowongan")
    .select("wilayah:wilayah_id(id, nama, provinsi)")
    .eq("status", "tayang")
    .returns<{ wilayah: WilayahPilihan | WilayahPilihan[] | null }[]>();

  const peta = new Map<string, WilayahPilihan>();
  for (const baris of data ?? []) {
    const w = satu(baris.wilayah);
    if (w) peta.set(w.id, w);
  }

  return [...peta.values()].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}
