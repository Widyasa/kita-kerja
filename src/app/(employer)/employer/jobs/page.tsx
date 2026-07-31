import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Inbox, SquarePlus } from "lucide-react";

import { Button } from "@/component/ui/button";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { BadgeStatusLowongan } from "@/component/pemberi/BadgeStatusLowongan";
import { createClient } from "@/lib/supabase/server-client";
import { dasborPemberi } from "@/lib/data/pemberi";
import { formatRupiah, formatTanggal } from "@/lib/mock/utils";
import type { StatusLowongan } from "@/lib/mock/types";

export const metadata: Metadata = {
  title: "Lowongan Saya",
};

/**
 * /employer/jobs (BUG-004) — sebelumnya route ini belum ada sehingga menu
 * "Lowongan Saya" pada navigasi utama pemberi kerja membalas 404. Hanya
 * /employer/jobs/[id] yang tersedia.
 *
 * Berbeda dari dasbor yang hanya menampilkan lowongan berstatus "tayang",
 * halaman ini menampilkan SEMUA lowongan milik pemberi kerja, diurutkan
 * agar yang masih tayang berada di atas.
 */
const URUTAN_STATUS: Record<StatusLowongan, number> = {
  tayang: 0,
  moderasi: 1,
  draf: 2,
  terisi: 3,
  ditutup: 4,
};

export default async function HalamanLowonganSaya() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { lowongan } = await dasborPemberi(user!.id);

  const terurut = [...lowongan].sort(
    (a, b) => URUTAN_STATUS[a.status] - URUTAN_STATUS[b.status],
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1">Lowongan Saya</h1>
          <p className="text-body-lg text-tanah-600">
            Semua lowongan yang pernah Anda pasang, termasuk yang sudah ditutup.
          </p>
        </div>
        <Button asChild size="lg" variant="aksen" className="min-h-14 shrink-0">
          <Link href="/employer/post">
            <SquarePlus aria-hidden />
            Pasang lowongan
          </Link>
        </Button>
      </header>

      {terurut.length === 0 ? (
        <KeadaanKosong
          ikon={Inbox}
          judul="Belum ada lowongan"
          penjelasan="Tulis kebutuhan Anda seperti mengirim pesan biasa — kami yang merapikan jadi lowongan."
          labelAksi="Pasang lowongan sekarang"
          hrefAksi="/employer/post"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {terurut.map((l) => (
            <li key={l.id}>
              <Link
                href={`/employer/jobs/${l.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-50 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-h3">{l.judul_baku}</h2>
                  <BadgeStatusLowongan status={l.status} />
                  <span className="ml-auto flex items-center gap-1 text-label font-semibold text-biru-600">
                    Kelola
                    <ChevronRight className="size-4" aria-hidden />
                  </span>
                </div>
                <p className="text-body text-tanah-600">
                  {l.lokasi_teks ?? "Lokasi belum disebutkan"} · mulai{" "}
                  {l.mulai ? formatTanggal(l.mulai) : "belum ditentukan"} ·{" "}
                  {l.jumlah_calon > 0 ? (
                    <span className="font-semibold text-tanah-900">
                      {l.jumlah_calon} calon masuk
                    </span>
                  ) : (
                    "belum ada calon"
                  )}
                </p>
                {/* Upah selalu ditampilkan — bila kosong, katakan apa adanya (BUG-013). */}
                <p className="text-label text-tanah-600">
                  {l.upah_ditawarkan === null || l.satuan_upah === null
                    ? "Upah belum disebutkan"
                    : `Upah ${formatRupiah(l.upah_ditawarkan)} / ${
                        l.satuan_upah === "bulanan" ? "bulan" : l.satuan_upah
                      }`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
