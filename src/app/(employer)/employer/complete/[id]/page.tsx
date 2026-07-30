import { Search } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { kesepakatanUntukPihak } from "@/lib/data/kesepakatan";
import { formatRupiah, formatTanggal } from "@/lib/mock";

import { FormPenilaian } from "./form-penilaian";

/**
 * /employer/complete/[id] — konfirmasi pekerjaan selesai + penilaian 1–5.
 * Penilaian permanen dan tampil di Kartu Kerja pekerja.
 */
export default async function HalamanKonfirmasiSelesai({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const k = await kesepakatanUntukPihak(id, user!.id);

  if (!k) {
    return (
      <KeadaanKosong
        ikon={Search}
        judul="Kesepakatan tidak ditemukan"
        penjelasan="Kembali ke dasbor untuk melihat kesepakatan Anda."
        labelAksi="Kembali ke dasbor"
        hrefAksi="/employer"
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">Konfirmasi pekerjaan selesai</h1>
        <p className="text-body-lg text-tanah-600">
          {k.nama_pekerja} · upah {formatRupiah(k.upah_disepakati)} /{" "}
          {k.satuan === "harian" ? "hari" : "bulan"} · dibayar dijanjikan{" "}
          {formatTanggal(k.tanggal_bayar_dijanjikan)}
        </p>
      </header>

      <FormPenilaian kesepakatanId={k.id} namaPekerja={k.nama_pekerja} />
    </div>
  );
}
