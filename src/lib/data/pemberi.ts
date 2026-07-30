import { createClient } from "@/lib/supabase/server-client";
import { hitungAcuanUpah } from "@/lib/engine/wage-benchmark";
import { ambilKeahlianTampil } from "./keahlian";
import type {
  AcuanTampil,
  CalonTampil,
  LowonganTampil,
  RekamJejakPekerja,
  SaringanTampil,
} from "./types";
import type { SatuanUpah, StatusKesepakatan, StatusLamaran, StatusLowongan } from "@/lib/mock/types";

function satu<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export interface RingkasLowongan {
  id: string;
  judul_baku: string;
  status: StatusLowongan;
  lokasi_teks: string | null;
  mulai: string | null;
  upah_ditawarkan: number | null;
  satuan_upah: SatuanUpah | null;
  wilayah_nama: string | null;
  acuan: AcuanTampil | null;
  jumlah_calon: number;
}

export interface RingkasKesepakatan {
  id: string;
  status: StatusKesepakatan;
  nama_pekerja: string;
  upah_disepakati: number;
  satuan: SatuanUpah;
  tanggal_bayar_dijanjikan: string;
}

export async function dasborPemberi(pemberiId: string) {
  const supabase = await createClient();

  const { data: barisLowongan } = await supabase
    .from("lowongan")
    .select(
      `id, judul_baku, status, lokasi_teks, mulai, upah_ditawarkan, satuan_upah, wilayah_id,
       wilayah:wilayah_id(nama), keahlian:lowongan_keahlian(keahlian_id), lamaran(id, status)`,
    )
    .eq("pemberi_kerja_id", pemberiId)
    .order("id");

  const lowongan: RingkasLowongan[] = await Promise.all(
    (barisLowongan ?? []).map(async (b: Record<string, unknown>) => {
      const keahlianId = (b.keahlian as { keahlian_id: string }[] | null)?.[0]?.keahlian_id ?? null;
      const wilayahId = b.wilayah_id as string | null;
      const acuan = keahlianId && wilayahId ? await hitungAcuanUpah(keahlianId, wilayahId) : null;
      return {
        id: b.id as string,
        judul_baku: (b.judul_baku as string) ?? "Lowongan",
        status: b.status as StatusLowongan,
        lokasi_teks: (b.lokasi_teks as string) ?? null,
        mulai: (b.mulai as string) ?? null,
        upah_ditawarkan: (b.upah_ditawarkan as number) ?? null,
        satuan_upah: (b.satuan_upah as SatuanUpah) ?? null,
        wilayah_nama: satu(b.wilayah as { nama: string } | null)?.nama ?? null,
        acuan: acuan
          ? {
              acuan_harian: acuan.acuan_harian,
              metode: acuan.metode,
              jumlah_laporan: acuan.jumlah_laporan,
            }
          : null,
        jumlah_calon: ((b.lamaran as unknown[]) ?? []).length,
      };
    }),
  );

  const { data: barisCalon } = await supabase
    .from("lamaran")
    .select("id, status, pekerja_id, lowongan_id, pekerja:pekerja_id(nama), lowongan:lowongan_id(judul_baku, pemberi_kerja_id)")
    .eq("status", "dilamar")
    .order("dibuat_pada", { ascending: false })
    .limit(10);

  const calonTerbaru = (barisCalon ?? [])
    .filter((c: Record<string, unknown>) => satu(c.lowongan as { pemberi_kerja_id: string } | null)?.pemberi_kerja_id === pemberiId)
    .map((c: Record<string, unknown>) => ({
      lamaran_id: c.id as string,
      lowongan_id: c.lowongan_id as string,
      nama: satu(c.pekerja as { nama: string } | null)?.nama ?? "Pekerja",
      judul_lowongan: satu(c.lowongan as { judul_baku: string } | null)?.judul_baku ?? "Lowongan",
      status: c.status as StatusLamaran,
    }));

  const { data: barisKesepakatan } = await supabase
    .from("kesepakatan_kerja")
    .select("id, status, upah_disepakati, satuan, tanggal_bayar_dijanjikan, pekerja:pekerja_id(nama)")
    .eq("pemberi_kerja_id", pemberiId)
    .in("status", ["menunggu", "berjalan"]);

  const kesepakatan: RingkasKesepakatan[] = (barisKesepakatan ?? []).map(
    (k: Record<string, unknown>) => ({
      id: k.id as string,
      status: k.status as StatusKesepakatan,
      nama_pekerja: satu(k.pekerja as { nama: string } | null)?.nama ?? "Pekerja",
      upah_disepakati: k.upah_disepakati as number,
      satuan: k.satuan as SatuanUpah,
      tanggal_bayar_dijanjikan: k.tanggal_bayar_dijanjikan as string,
    }),
  );

  return { lowongan, calonTerbaru, kesepakatan };
}

export interface KelolaLowongan {
  lowongan: LowonganTampil;
  jumlah_calon: number;
  jumlah_dilamar: number;
  jumlah_diundang: number;
}

export async function kelolaLowongan(
  lowonganId: string,
  pemberiId: string,
): Promise<KelolaLowongan | null> {
  const supabase = await createClient();

  const { data: b } = await supabase
    .from("lowongan")
    .select(
      `id, judul_baku, teks_asli, status, jenis_kerja, jumlah_pekerja, upah_ditawarkan,
       satuan_upah, lokasi_teks, mulai, syarat_tersirat, wilayah_id, pemberi_kerja_id,
       wilayah:wilayah_id(nama),
       saringan:saringan_aman(tingkat, temuan, pertanyaan_disarankan),
       keahlian:lowongan_keahlian(keahlian_id),
       lamaran(id, status)`,
    )
    .eq("id", lowonganId)
    .maybeSingle<Record<string, unknown>>();

  if (!b || b.pemberi_kerja_id !== pemberiId) return null;

  const keahlianId = (b.keahlian as { keahlian_id: string }[] | null)?.[0]?.keahlian_id ?? null;
  const wilayahId = b.wilayah_id as string | null;
  const acuan = keahlianId && wilayahId ? await hitungAcuanUpah(keahlianId, wilayahId) : null;
  const lamaran = (b.lamaran as { status: StatusLamaran }[] | null) ?? [];

  return {
    lowongan: {
      id: b.id as string,
      judul_baku: (b.judul_baku as string) ?? "Lowongan",
      teks_asli: b.teks_asli as string,
      status: b.status as StatusLowongan,
      jenis_kerja: (b.jenis_kerja as LowonganTampil["jenis_kerja"]) ?? null,
      jumlah_pekerja: b.jumlah_pekerja as number,
      upah_ditawarkan: (b.upah_ditawarkan as number) ?? null,
      satuan_upah: (b.satuan_upah as SatuanUpah) ?? null,
      lokasi_teks: (b.lokasi_teks as string) ?? null,
      mulai: (b.mulai as string) ?? null,
      syarat_tersirat: (b.syarat_tersirat as string[]) ?? [],
      wilayah_id: wilayahId,
      wilayah_nama: satu(b.wilayah as { nama: string } | null)?.nama ?? null,
      pemberi_kerja_id: b.pemberi_kerja_id as string,
      saringan: satu(b.saringan as SaringanTampil | null),
      acuan: acuan
        ? { acuan_harian: acuan.acuan_harian, metode: acuan.metode, jumlah_laporan: acuan.jumlah_laporan }
        : null,
      alasan_cocok: null,
    },
    jumlah_calon: lamaran.length,
    jumlah_dilamar: lamaran.filter((l) => l.status === "dilamar").length,
    jumlah_diundang: lamaran.filter((l) => l.status === "diundang").length,
  };
}

export async function calonUntukLowongan(
  lowonganId: string,
  pemberiId: string,
): Promise<CalonTampil[]> {
  const supabase = await createClient();

  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, pemberi_kerja_id")
    .eq("id", lowonganId)
    .maybeSingle();
  if (!lowongan || lowongan.pemberi_kerja_id !== pemberiId) return [];

  const { data: baris } = await supabase
    .from("lamaran")
    .select(
      `id, status, alasan_cocok, pekerja_id,
       pekerja:pekerja_id(nama, wilayah:wilayah_id(nama))`,
    )
    .eq("lowongan_id", lowonganId);

  const hasil: CalonTampil[] = [];

  for (const c of (baris ?? []) as Record<string, unknown>[]) {
    const pekerjaId = c.pekerja_id as string;
    const pekerja = satu(c.pekerja as { nama: string; wilayah: unknown } | null);

    const { data: kartu } = await supabase
      .from("kartu_kerja")
      .select("id, pengalaman_tahun, bidang:bidang_utama_id(nama)")
      .eq("pekerja_id", pekerjaId)
      .maybeSingle();

    const keahlian = kartu
      ? await ambilKeahlianTampil(supabase, kartu.id as string, pekerjaId, {
          hanyaDikonfirmasi: true,
        })
      : [];

    const { data: jejak } = await supabase.rpc("rekam_jejak_pekerja", { p_pekerja: pekerjaId });
    const jejakSatu = (jejak as RekamJejakPekerja[] | null)?.[0] ?? {
      pekerjaan_selesai: 0,
      rata_penilaian: 0,
      jumlah_penilai: 0,
    };

    const { data: kesepakatan } = await supabase
      .from("kesepakatan_kerja")
      .select("id")
      .eq("lowongan_id", lowonganId)
      .eq("pekerja_id", pekerjaId)
      .maybeSingle();

    hasil.push({
      lamaran_id: c.id as string,
      status: c.status as StatusLamaran,
      alasan_cocok: (c.alasan_cocok as string[]) ?? [],
      pekerja_id: pekerjaId,
      nama: pekerja?.nama ?? "Pekerja",
      wilayah_nama: satu(pekerja?.wilayah as { nama: string } | null)?.nama ?? null,
      bidang_nama: satu(kartu?.bidang as unknown as { nama: string } | null)?.nama ?? null,
      pengalaman_tahun: (kartu?.pengalaman_tahun as number) ?? null,
      keahlian,
      rekam_jejak: jejakSatu,
      kesepakatan_id: (kesepakatan?.id as string) ?? null,
    });
  }

  return hasil;
}
