import { createClient } from "@/lib/supabase/server-client";
import type { StatusLamaran, SatuanUpah } from "@/lib/mock/types";

export interface LamaranTampil {
  id: string;
  status: StatusLamaran;
  lowongan_id: string;
  judul_baku: string;
  lokasi_teks: string | null;
  wilayah_nama: string | null;
  upah_ditawarkan: number | null;
  satuan_upah: SatuanUpah | null;
}

interface Baris {
  id: string;
  status: StatusLamaran;
  lowongan_id: string;
  lowongan:
    | {
        judul_baku: string | null;
        lokasi_teks: string | null;
        upah_ditawarkan: number | null;
        satuan_upah: SatuanUpah | null;
        wilayah: { nama: string } | { nama: string }[] | null;
      }
    | null;
}

export async function lamaranPekerja(pekerjaId: string): Promise<LamaranTampil[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lamaran")
    .select(
      "id, status, lowongan_id, lowongan:lowongan_id(judul_baku, lokasi_teks, upah_ditawarkan, satuan_upah, wilayah:wilayah_id(nama))",
    )
    .eq("pekerja_id", pekerjaId)
    .order("dibuat_pada", { ascending: false })
    .returns<Baris[]>();

  return (data ?? []).flatMap((b) => {
    const lo = Array.isArray(b.lowongan) ? b.lowongan[0] : b.lowongan;
    if (!lo) return [];
    const wl = Array.isArray(lo.wilayah) ? lo.wilayah[0] : lo.wilayah;
    return [
      {
        id: b.id,
        status: b.status,
        lowongan_id: b.lowongan_id,
        judul_baku: lo.judul_baku ?? "Lowongan",
        lokasi_teks: lo.lokasi_teks,
        wilayah_nama: wl?.nama ?? null,
        upah_ditawarkan: lo.upah_ditawarkan,
        satuan_upah: lo.satuan_upah,
      },
    ];
  });
}
