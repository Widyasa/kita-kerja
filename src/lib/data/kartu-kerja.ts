/**
 * Data pekerja asli dari Supabase — pengganti mock Pak Warto di
 * /worker dan /worker/card. Server-only (dipanggil dari Server Component).
 *
 * Lapis kepercayaan keahlian butuh join pekerjaan → kesepakatan_kerja →
 * lowongan_keahlian yang RLS-nya belum mengizinkan pekerja membaca lowongan
 * pihak lain (lihat proyek jobs/agreements berikutnya). Sampai itu selesai,
 * setiap keahlian ditampilkan "diklaim" — sesuai kenyataan: belum ada
 * pekerjaan yang tercatat lewat aplikasi untuk memverifikasinya.
 */

import { createClient } from "@/lib/supabase/server-client";
import type { KartuKeahlian, KartuKerja, Pengguna } from "@/lib/mock/types";

export interface RiwayatPekerjaanRingkas {
  id: string;
  lingkup: string;
  selesai_pada: string;
  upah_disepakati: number;
  satuan: string;
}

export interface DashboardPekerja {
  pengguna: Pengguna;
  wilayahNama: string | null;
  kartu: KartuKerja | null;
  bidangNama: string | null;
  keahlian: KartuKeahlian[];
  statistik: {
    jumlahPekerjaanSelesai: number;
    rataRataPenilaian: number;
    jumlahPenilai: number;
  };
  riwayat: RiwayatPekerjaanRingkas[];
}

export async function getDashboardPekerja(userId: string): Promise<DashboardPekerja> {
  const supabase = await createClient();

  const { data: penggunaRow } = await supabase
    .from("pengguna")
    .select("id, nama, no_hp, peran, wilayah_id, url_foto, status_verifikasi, didampingi_oleh")
    .eq("id", userId)
    .single();

  const pengguna = penggunaRow as Pengguna;

  let wilayahNama: string | null = null;
  if (pengguna.wilayah_id) {
    const { data: wl } = await supabase
      .from("wilayah")
      .select("nama")
      .eq("id", pengguna.wilayah_id)
      .single();
    wilayahNama = wl?.nama ?? null;
  }

  const { data: kartuRow } = await supabase
    .from("kartu_kerja")
    .select(
      "id, pekerja_id, token_publik, aktif_publik, ringkasan, bidang_utama_id, pengalaman_tahun, kesediaan, jangkauan_km, alat_dimiliki, bahasa_terdeteksi, diterbitkan_pada",
    )
    .eq("pekerja_id", userId)
    .maybeSingle();

  if (!kartuRow) {
    return {
      pengguna,
      wilayahNama,
      kartu: null,
      bidangNama: null,
      keahlian: [],
      statistik: { jumlahPekerjaanSelesai: 0, rataRataPenilaian: 0, jumlahPenilai: 0 },
      riwayat: [],
    };
  }

  const kartu = kartuRow as KartuKerja;

  let bidangNama: string | null = null;
  if (kartu.bidang_utama_id) {
    const { data: bd } = await supabase
      .from("bidang_kerja")
      .select("nama")
      .eq("id", kartu.bidang_utama_id)
      .single();
    bidangNama = bd?.nama ?? null;
  }

  const { data: keahlianRows } = await supabase
    .from("kartu_keahlian")
    .select(
      "id, kartu_id, keahlian_id, nama_diajukan, sebutan_pekerja, level, kutipan_bukti, keyakinan, sumber, dikonfirmasi_pekerja",
    )
    .eq("kartu_id", kartu.id)
    .eq("dikonfirmasi_pekerja", true);

  const keahlian: KartuKeahlian[] = (keahlianRows ?? []).map((k) => ({
    ...k,
    lapis: "diklaim" as const,
  }));

  const { count: jumlahPekerjaanSelesai } = await supabase
    .from("pekerjaan")
    .select("id", { count: "exact", head: true })
    .eq("pekerja_id", userId)
    .not("selesai_pada", "is", null);

  const { data: penilaianRows } = await supabase
    .from("penilaian")
    .select("skor, pekerjaan!inner(pekerja_id)")
    .eq("pekerjaan.pekerja_id", userId);

  const jumlahPenilai = penilaianRows?.length ?? 0;
  const rataRataPenilaian =
    jumlahPenilai > 0
      ? penilaianRows!.reduce((total, n) => total + n.skor, 0) / jumlahPenilai
      : 0;

  type KesepakatanRingkas = { lingkup: string; upah_disepakati: number; satuan: string };
  type PekerjaanRiwayatRow = {
    id: string;
    selesai_pada: string | null;
    kesepakatan_kerja: KesepakatanRingkas | KesepakatanRingkas[] | null;
  };

  const { data: riwayatRows } = await supabase
    .from("pekerjaan")
    .select("id, selesai_pada, kesepakatan_kerja(lingkup, upah_disepakati, satuan)")
    .eq("pekerja_id", userId)
    .not("selesai_pada", "is", null)
    .order("selesai_pada", { ascending: false })
    .limit(5)
    .returns<PekerjaanRiwayatRow[]>();

  const riwayat: RiwayatPekerjaanRingkas[] = (riwayatRows ?? []).flatMap((r) => {
    const ks = Array.isArray(r.kesepakatan_kerja) ? r.kesepakatan_kerja[0] : r.kesepakatan_kerja;
    if (!ks || !r.selesai_pada) return [];
    return [
      {
        id: r.id,
        selesai_pada: r.selesai_pada,
        lingkup: ks.lingkup,
        upah_disepakati: ks.upah_disepakati,
        satuan: ks.satuan,
      },
    ];
  });

  return {
    pengguna,
    wilayahNama,
    kartu,
    bidangNama,
    keahlian,
    statistik: {
      jumlahPekerjaanSelesai: jumlahPekerjaanSelesai ?? 0,
      rataRataPenilaian,
      jumlahPenilai,
    },
    riwayat,
  };
}
