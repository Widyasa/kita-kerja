import type { Metadata } from "next";
import { IdCard, Phone, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server-client";
import { profilPengguna } from "@/lib/data/profil";
import { LABEL_VERIFIKASI } from "@/lib/data/types";

import { ProfilForm } from "./profil-form";

export const metadata: Metadata = { title: "Profil Saya — Kita Kerja" };

export default async function HalamanProfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { profil, daftarWilayah } = await profilPengguna(user!.id);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-h1 text-tanah-900">Profil Saya</h1>
        <p className="mt-1 text-body-lg text-tanah-600">
          Nama ini yang dilihat pemberi kerja di Kartu Kerja Anda.
        </p>
      </header>

      <section
        aria-label="Informasi akun"
        className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
      >
        <p className="flex items-center gap-2 text-body text-tanah-700">
          <Phone className="size-5 shrink-0 text-tanah-500" aria-hidden />
          {profil.no_hp}
        </p>
        <p className="flex items-center gap-2 text-body text-tanah-700">
          <ShieldCheck className="size-5 shrink-0 text-biru-600" aria-hidden />
          {LABEL_VERIFIKASI[profil.status_verifikasi]}
        </p>
        <p className="flex items-center gap-2 text-body text-tanah-700">
          <IdCard className="size-5 shrink-0 text-tanah-500" aria-hidden />
          Nomor HP adalah kunci akun Anda dan tidak bisa diubah di sini.
        </p>
      </section>

      <ProfilForm profil={profil} daftarWilayah={daftarWilayah} />
    </div>
  );
}
