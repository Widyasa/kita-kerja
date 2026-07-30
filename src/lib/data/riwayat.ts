/**
 * Riwayat pekerjaan selesai + penghasilan per bulan.
 * pekerjaan tidak menyimpan judul/upah — semuanya lewat kesepakatan_kerja.
 */

import { createClient } from "@/lib/supabase/server-client";
import type { SatuanUpah } from "@/lib/mock/types";

export interface PekerjaanTampil {
  id: string;
  judul: string;
  selesai_pada: string;
  upah: number;
  satuan: SatuanUpah;
  wilayah_nama: string | null;
  dua_pihak: boolean;
  skor: number | null;
  catatan: string | null;
}

export interface TitikBulan {
  bulan: string;
  total: number;
}

interface Baris {
  id: string;
  selesai_pada: string | null;
  dikonfirmasi_selesai_pekerja: boolean;
  dikonfirmasi_selesai_pemberi: boolean;
  kesepakatan:
    | {
        lingkup: string;
        upah_disepakati: number;
        satuan: SatuanUpah;
        lowongan: { judul_baku: string | null; wilayah: { nama: string } | { nama: string }[] | null } | null;
      }
    | null;
  penilaian: { skor: number; catatan: string | null }[] | null;
}

const NAMA_BULAN = new Intl.DateTimeFormat("id-ID", { month: "short" });

export async function riwayatPekerja(pekerjaId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pekerjaan")
    .select(
      `id, selesai_pada, dikonfirmasi_selesai_pekerja, dikonfirmasi_selesai_pemberi,
       kesepakatan:kesepakatan_id(lingkup, upah_disepakati, satuan,
         lowongan:lowongan_id(judul_baku, wilayah:wilayah_id(nama))),
       penilaian(skor, catatan)`,
    )
    .eq("pekerja_id", pekerjaId)
    .not("selesai_pada", "is", null)
    .order("selesai_pada", { ascending: false })
    .returns<Baris[]>();

  const pekerjaan: PekerjaanTampil[] = (data ?? []).flatMap((b) => {
    const ks = Array.isArray(b.kesepakatan) ? b.kesepakatan[0] : b.kesepakatan;
    if (!ks || !b.selesai_pada) return [];
    const lo = Array.isArray(ks.lowongan) ? ks.lowongan[0] : ks.lowongan;
    const wl = lo && (Array.isArray(lo.wilayah) ? lo.wilayah[0] : lo.wilayah);
    const nilai = b.penilaian?.[0] ?? null;
    return [
      {
        id: b.id,
        judul: lo?.judul_baku ?? ks.lingkup,
        selesai_pada: b.selesai_pada,
        upah: ks.upah_disepakati,
        satuan: ks.satuan,
        wilayah_nama: wl?.nama ?? null,
        dua_pihak: b.dikonfirmasi_selesai_pekerja && b.dikonfirmasi_selesai_pemberi,
        skor: nilai?.skor ?? null,
        catatan: nilai?.catatan ?? null,
      },
    ];
  });

  const perBulanPeta = new Map<string, number>();
  for (const p of pekerjaan) {
    const kunci = p.selesai_pada.slice(0, 7);
    perBulanPeta.set(kunci, (perBulanPeta.get(kunci) ?? 0) + p.upah);
  }
  const perBulan: TitikBulan[] = [...perBulanPeta.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([kunci, total]) => ({
      bulan: NAMA_BULAN.format(new Date(`${kunci}-02`)),
      total,
    }));

  return {
    pekerjaan,
    totalPenghasilan: pekerjaan.reduce((a, p) => a + p.upah, 0),
    perBulan,
  };
}
