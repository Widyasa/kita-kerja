import Link from "next/link";
import { CircleCheck, Search } from "lucide-react";

import { Button } from "@/component/ui/button";
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

  const { data: pekerjaan } = await supabase
    .from("pekerjaan")
    .select("id")
    .eq("kesepakatan_id", k.id)
    .maybeSingle();

  const { data: penilaian } = pekerjaan
    ? await supabase
        .from("penilaian")
        .select("skor")
        .eq("pekerjaan_id", pekerjaan.id)
        .maybeSingle()
    : { data: null };

  if (penilaian) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl border border-tanah-200 bg-tanah-0 p-8 text-center shadow-1">
        <span className="flex size-16 items-center justify-center rounded-full bg-aman-50">
          <CircleCheck className="size-8 text-aman-600" aria-hidden />
        </span>
        <h1 className="text-h1">Penilaian sudah terkirim</h1>
        <p className="max-w-md text-body-lg text-tanah-600">
          Anda sudah mengirim penilaian untuk pekerjaan ini
          {penilaian.skor ? ` (${penilaian.skor} bintang)` : ""}. Penilaian
          bersifat permanen dan sudah tampil di Kartu Kerja {k.nama_pekerja}.
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/employer">Kembali ke dasbor</Link>
        </Button>
      </div>
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
