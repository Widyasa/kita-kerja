/**
 * Resolusi kartu_keahlian -> KeahlianTampil, termasuk lapis kepercayaan
 * yang DITURUNKAN lewat RPC lapis_keahlian_pekerja (tidak pernah disimpan).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { KeahlianTampil } from "./types";

interface BarisKeahlian {
  id: string;
  keahlian_id: string | null;
  nama_diajukan: string | null;
  sebutan_pekerja: string | null;
  level: "pemula" | "terampil" | "ahli";
  kutipan_bukti: string;
  sumber: "ai" | "manual";
  dikonfirmasi_pekerja: boolean;
  keahlian_baku: { nama_baku: string } | { nama_baku: string }[] | null;
}

const KOLOM_KEAHLIAN =
  "id, keahlian_id, nama_diajukan, sebutan_pekerja, level, kutipan_bukti, sumber, dikonfirmasi_pekerja, keahlian_baku:keahlian_id(nama_baku)";

export async function ambilKeahlianTampil(
  supabase: SupabaseClient,
  kartuId: string,
  pekerjaId: string,
  opsi: { hanyaDikonfirmasi?: boolean } = {},
): Promise<KeahlianTampil[]> {
  let q = supabase.from("kartu_keahlian").select(KOLOM_KEAHLIAN).eq("kartu_id", kartuId);
  if (opsi.hanyaDikonfirmasi) q = q.eq("dikonfirmasi_pekerja", true);
  const { data: baris } = await q.returns<BarisKeahlian[]>();
  if (!baris || baris.length === 0) return [];

  const { data: lapisBaris } = await supabase.rpc("lapis_keahlian_pekerja", {
    p_pekerja: pekerjaId,
  });
  const petaLapis = new Map<string, KeahlianTampil["lapis"]>(
    ((lapisBaris ?? []) as { keahlian_id: string; lapis: KeahlianTampil["lapis"] }[]).map(
      (r) => [r.keahlian_id, r.lapis],
    ),
  );

  return baris.map((k) => {
    const baku = Array.isArray(k.keahlian_baku) ? k.keahlian_baku[0] : k.keahlian_baku;
    return {
      id: k.id,
      keahlian_id: k.keahlian_id,
      nama_tampil: baku?.nama_baku ?? k.nama_diajukan ?? k.sebutan_pekerja ?? "Keahlian",
      sebutan_pekerja: k.sebutan_pekerja ?? k.nama_diajukan ?? "",
      level: k.level,
      kutipan_bukti: k.kutipan_bukti,
      sumber: k.sumber,
      dikonfirmasi_pekerja: k.dikonfirmasi_pekerja,
      lapis: (k.keahlian_id && petaLapis.get(k.keahlian_id)) || "diklaim",
    };
  });
}

export { KOLOM_KEAHLIAN };
