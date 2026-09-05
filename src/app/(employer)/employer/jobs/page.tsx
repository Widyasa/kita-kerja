import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, SquarePlus } from "lucide-react";

import { Button } from "@/component/ui/button";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { createClient } from "@/lib/supabase/server-client";
import { dasborPemberi } from "@/lib/data/pemberi";
import type { StatusLowongan } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

import { DaftarLowongan } from "./daftar-lowongan";

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
 * agar yang masih tayang berada di atas. Filter status + batas tampil
 * (Muat lebih banyak) agar daftar panjang tetap mudah dipindai.
 */
const URUTAN_STATUS: Record<StatusLowongan, number> = {
  tayang: 0,
  moderasi: 1,
  draf: 2,
  terisi: 3,
  ditutup: 4,
};

type FilterStatus = "semua" | "tayang" | "ditutup";

const FILTER: { id: FilterStatus; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "tayang", label: "Tayang" },
  { id: "ditutup", label: "Ditutup" },
];

function parseFilter(raw: string | string[] | undefined): FilterStatus {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "tayang" || v === "ditutup") return v;
  return "semua";
}

export default async function HalamanLowonganSaya({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { lowongan } = await dasborPemberi(user!.id);
  const filter = parseFilter((await searchParams).status);

  const terurut = [...lowongan].sort(
    (a, b) => URUTAN_STATUS[a.status] - URUTAN_STATUS[b.status],
  );

  const tersaring =
    filter === "semua"
      ? terurut
      : terurut.filter((l) => l.status === filter);

  const hitung = {
    semua: lowongan.length,
    tayang: lowongan.filter((l) => l.status === "tayang").length,
    ditutup: lowongan.filter((l) => l.status === "ditutup").length,
  };

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

      {lowongan.length === 0 ? (
        <KeadaanKosong
          ikon={Inbox}
          judul="Belum ada lowongan"
          penjelasan="Tulis kebutuhan Anda seperti mengirim pesan biasa — kami yang merapikan jadi lowongan."
          labelAksi="Pasang lowongan sekarang"
          hrefAksi="/employer/post"
        />
      ) : (
        <>
          <nav
            aria-label="Saring status lowongan"
            className="flex flex-wrap gap-2 border-b border-tanah-200 pb-3"
          >
            {FILTER.map((f) => {
              const aktif = filter === f.id;
              const href =
                f.id === "semua" ? "/employer/jobs" : `/employer/jobs?status=${f.id}`;
              return (
                <Link
                  key={f.id}
                  href={href}
                  aria-current={aktif ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-4 py-2 text-label font-semibold transition-colors duration-(--duration-fast) focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
                    aktif
                      ? "bg-biru-600 text-tanah-0"
                      : "bg-tanah-100 text-tanah-700 hover:bg-tanah-200",
                  )}
                >
                  {f.label}
                  <span className="ml-1.5 tabular-nums opacity-80">
                    {hitung[f.id]}
                  </span>
                </Link>
              );
            })}
          </nav>

          {tersaring.length === 0 ? (
            <KeadaanKosong
              ikon={Inbox}
              judul={
                filter === "tayang"
                  ? "Tidak ada lowongan tayang"
                  : "Tidak ada lowongan ditutup"
              }
              penjelasan="Coba filter lain, atau pasang lowongan baru."
              labelAksi="Lihat semua"
              hrefAksi="/employer/jobs"
            />
          ) : (
            <DaftarLowongan lowongan={tersaring} />
          )}
        </>
      )}
    </div>
  );
}
