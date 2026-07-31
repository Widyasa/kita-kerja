import { createClient } from "@/lib/supabase/server-client";
import type { Peran, StatusVerifikasi } from "@/lib/mock/types";

export interface ProfilTampil {
  id: string;
  nama: string;
  no_hp: string;
  peran: Peran;
  status_verifikasi: StatusVerifikasi;
  wilayah_id: string | null;
  wilayah_nama: string | null;
  didampingi_oleh: string | null;
}

export interface PilihanWilayah {
  id: string;
  nama: string;
  provinsi: string;
}

export async function profilPengguna(penggunaId: string) {
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("pengguna")
    .select("id, nama, no_hp, peran, status_verifikasi, wilayah_id, didampingi_oleh, wilayah:wilayah_id(nama)")
    .eq("id", penggunaId)
    .single();

  const { data: daftarWilayah } = await supabase
    .from("wilayah")
    .select("id, nama, provinsi")
    .order("nama");

  const wl = p && (Array.isArray(p.wilayah) ? p.wilayah[0] : p.wilayah);

  const profil: ProfilTampil = {
    id: p!.id as string,
    nama: p!.nama as string,
    no_hp: p!.no_hp as string,
    peran: p!.peran as Peran,
    status_verifikasi: p!.status_verifikasi as StatusVerifikasi,
    wilayah_id: (p!.wilayah_id as string | null) ?? null,
    wilayah_nama: (wl as { nama: string } | null)?.nama ?? null,
    didampingi_oleh: (p!.didampingi_oleh as string | null) ?? null,
  };

  return { profil, daftarWilayah: (daftarWilayah ?? []) as PilihanWilayah[] };
}
