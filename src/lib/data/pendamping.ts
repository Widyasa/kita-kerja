import { createClient } from "@/lib/supabase/server-client";

export interface PekerjaDidampingi {
  id: string;
  nama: string;
  wilayah_nama: string | null;
  kartu_diterbitkan_pada: string | null;
  punya_kartu: boolean;
}

// PostgREST returns an embedded to-one relation as either a single object or
// a one-element array depending on how it infers the FK cardinality — unwrap
// both shapes the same way the rest of src/lib/data does (see `satu()` in
// lowongan.ts / pemberi.ts / kesepakatan.ts).
function satu<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function pekerjaDidampingi(pendampingId: string): Promise<PekerjaDidampingi[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pengguna")
    .select("id, nama, wilayah:wilayah_id(nama), kartu_kerja(diterbitkan_pada)")
    .eq("didampingi_oleh", pendampingId)
    .order("nama");

  return (data ?? []).map((p: Record<string, unknown>) => {
    const wl = satu(p.wilayah as { nama: string } | { nama: string }[] | null);
    const kartu = satu(
      p.kartu_kerja as { diterbitkan_pada: string | null } | { diterbitkan_pada: string | null }[] | null,
    );
    return {
      id: p.id as string,
      nama: p.nama as string,
      wilayah_nama: wl?.nama ?? null,
      kartu_diterbitkan_pada: kartu?.diterbitkan_pada ?? null,
      punya_kartu: !!kartu?.diterbitkan_pada,
    };
  });
}
