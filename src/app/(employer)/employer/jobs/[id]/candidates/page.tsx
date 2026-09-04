import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { KartuCalon } from "@/component/pemberi/KartuCalon";
import { createClient } from "@/lib/supabase/server-client";
import { calonUntukLowongan, kelolaLowongan } from "@/lib/data/pemberi";

import { AksiCalon } from "./aksi-calon";

/**
 * /employer/jobs/[id]/candidates — daftar calon dengan pratinjau Kartu Kerja,
 * alasan pencocokan yang selalu dijelaskan, dan rekam jejak faktual.
 * Aksi per calon: Undang / buat kesepakatan. TIDAK ADA skor angka.
 */
export default async function HalamanCalonPekerja({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const kelola = await kelolaLowongan(id, user!.id);
  if (!kelola) {
    return (
      <KeadaanKosong
        ikon={Users}
        judul="Lowongan tidak ditemukan"
        penjelasan="Kembali ke dasbor untuk melihat lowongan Anda."
        labelAksi="Kembali ke dasbor"
        hrefAksi="/employer"
      />
    );
  }

  const daftarCalon = await calonUntukLowongan(id, user!.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/employer/jobs/${kelola.lowongan.id}`}
          className="inline-flex min-h-12 w-fit items-center gap-2 rounded-lg px-2 text-label font-semibold text-biru-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke lowongan
        </Link>
        <h1 className="text-h1">Calon untuk &ldquo;{kelola.lowongan.judul_baku}&rdquo;</h1>
        <p className="text-body-lg text-tanah-600">
          Setiap calon dijelaskan kecocokannya — tanpa skor angka.
        </p>
      </header>

      {daftarCalon.length === 0 ? (
        <KeadaanKosong
          ikon={Users}
          judul="Belum ada calon"
          penjelasan="Calon akan muncul di sini begitu ada pekerja yang melamar. Lowongan yang lengkap biasanya lebih cepat mendapat calon."
          labelAksi="Kembali ke lowongan"
          hrefAksi={`/employer/jobs/${kelola.lowongan.id}`}
        />
      ) : (
        <ul className="flex flex-col gap-5">
          {daftarCalon.map((calon) => (
            <li key={calon.lamaran_id}>
              <KartuCalon calon={calon} aksi={<AksiCalon calon={calon} />} />
              {calon.status === "diundang" && (
                <p role="status" className="mt-2 rounded-lg bg-biru-50 p-3 text-label text-biru-900">
                  Undangan terkirim. Pekerja akan melihat undangan Anda di aplikasinya.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
