import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock, Handshake } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { dasborPemberi } from "@/lib/data/pemberi";
import { formatTanggal, inisialkanNamaBelakang, upahTeks } from "@/lib/mock/utils";
import type { StatusKesepakatan } from "@/lib/mock/types";

export const metadata: Metadata = {
  title: "Kesepakatan",
};

/**
 * /employer/agreements (BUG-005) — sebelumnya route ini belum ada sehingga
 * menu "Kesepakatan" pada navigasi utama pemberi kerja membalas 404,
 * padahal dasbor sudah menjanjikan fiturnya. Hanya /employer/agreements/[id]
 * yang tersedia.
 *
 * Yang menunggu konfirmasi ditaruh paling atas karena itu yang butuh
 * tindakan pemberi kerja.
 */
const URUTAN_STATUS: Record<StatusKesepakatan, number> = {
  menunggu: 0,
  berjalan: 1,
  sengketa: 2,
  selesai: 3,
  batal: 4,
};

const LABEL_STATUS: Record<StatusKesepakatan, { teks: string; kelas: string }> = {
  menunggu: { teks: "Menunggu konfirmasi", kelas: "text-hati-600" },
  berjalan: { teks: "Berjalan", kelas: "text-biru-600" },
  sengketa: { teks: "Ada sengketa", kelas: "text-bahaya-600" },
  selesai: { teks: "Selesai", kelas: "text-aman-600" },
  batal: { teks: "Dibatalkan", kelas: "text-tanah-600" },
};

export default async function HalamanKesepakatan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { kesepakatan } = await dasborPemberi(user!.id);

  const terurut = [...kesepakatan].sort(
    (a, b) => URUTAN_STATUS[a.status] - URUTAN_STATUS[b.status],
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-h1">Kesepakatan</h1>
        <p className="text-body-lg text-tanah-600">
          Janji upah dan tanggal bayar yang tercatat antara Anda dan pekerja.
        </p>
      </header>

      {terurut.length === 0 ? (
        <KeadaanKosong
          ikon={Handshake}
          judul="Belum ada kesepakatan"
          penjelasan="Bila Anda dan pekerja sudah sepakat, buat kesepakatan dari daftar calon agar janji upah dan tanggal bayar tercatat jelas."
          labelAksi="Lihat lowongan saya"
          hrefAksi="/employer/jobs"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {terurut.map((k) => {
            const label = LABEL_STATUS[k.status];
            return (
              <li key={k.id}>
                <Link
                  href={`/employer/agreements/${k.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-tanah-200 bg-tanah-0 p-4 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-50 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50">
                    {k.status === "menunggu" ? (
                      <Clock className="size-6 text-hati-600" aria-hidden />
                    ) : (
                      <Handshake className="size-6 text-biru-600" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold">
                      {inisialkanNamaBelakang(k.nama_pekerja)}
                      <span className={`ml-2 text-label font-semibold ${label.kelas}`}>
                        {label.teks}
                      </span>
                    </p>
                    <p className="text-label text-tanah-600">
                      Bayar dijanjikan {formatTanggal(k.tanggal_bayar_dijanjikan)} ·{" "}
                      {upahTeks(k.upah_disepakati, k.satuan)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-tanah-400" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
