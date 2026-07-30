"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Handshake, Users } from "lucide-react";

import { Button } from "@/component/ui/button";
import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { KartuCalon } from "@/component/pemberi/KartuCalon";
import {
  calonUntuk,
  kesepakatanDhika,
  lowonganDhika,
} from "@/component/pemberi/mockPemberi";
import type { StatusLamaran } from "@/lib/mock";

/**
 * /employer/jobs/[id]/candidates — daftar calon dengan pratinjau Kartu Kerja,
 * alasan pencocokan yang selalu dijelaskan, dan rekam jejak faktual.
 * Aksi per calon: Undang / buat kesepakatan. TIDAK ADA skor angka.
 */
export default function HalamanCalonPekerja({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const lwn = lowonganDhika.find((l) => l.id === id);
  const daftarCalon = calonUntuk(id);

  // status lamaran lokal per calon (client-side penuh)
  const [statusMap, setStatusMap] = useState<Record<string, StatusLamaran>>({});
  const statusUntuk = (lamaranId: string, awal: StatusLamaran) =>
    statusMap[lamaranId] ?? awal;

  if (!lwn) {
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/employer/jobs/${lwn.id}`}
          className="inline-flex min-h-12 w-fit items-center gap-2 rounded-lg px-2 text-label font-semibold text-biru-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke lowongan
        </Link>
        <h1 className="text-h1">Calon untuk &ldquo;{lwn.judul_baku}&rdquo;</h1>
        <p className="text-body-lg text-tanah-600">
          Setiap calon dijelaskan kenapa cocok — tidak ada skor angka.
        </p>
      </header>

      {daftarCalon.length === 0 ? (
        <KeadaanKosong
          ikon={Users}
          judul="Belum ada calon"
          penjelasan="Calon akan muncul di sini begitu ada pekerja yang melamar. Lowongan yang lengkap biasanya lebih cepat mendapat calon."
          labelAksi="Kembali ke lowongan"
          hrefAksi={`/employer/jobs/${lwn.id}`}
        />
      ) : (
        <ul className="flex flex-col gap-5">
          {daftarCalon.map((calon) => {
            const status = statusUntuk(calon.lamaran.id, calon.lamaran.status);
            const kesepakatan = kesepakatanDhika.find(
              (k) => k.lowongan_id === lwn.id && k.pekerja_id === calon.pekerja.id,
            );
            return (
              <li key={calon.lamaran.id}>
                <KartuCalon
                  calon={{
                    ...calon,
                    lamaran: { ...calon.lamaran, status },
                  }}
                  aksi={
                    status === "disepakati" ? (
                      <Button asChild size="lg" className="flex-1">
                        <Link
                          href={`/employer/agreements/${kesepakatan?.id ?? "ks-dhika-01"}`}
                        >
                          <Handshake aria-hidden />
                          Lihat kesepakatan
                        </Link>
                      </Button>
                    ) : (
                      <>
                        {status === "dilamar" && (
                          <Button
                            size="lg"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              setStatusMap((m) => ({
                                ...m,
                                [calon.lamaran.id]: "diundang",
                              }))
                            }
                          >
                            <Send aria-hidden />
                            Undang
                          </Button>
                        )}
                        <Button
                          size="lg"
                          className="flex-1"
                          onClick={() =>
                            setStatusMap((m) => ({
                              ...m,
                              [calon.lamaran.id]: "disepakati",
                            }))
                          }
                        >
                          <Handshake aria-hidden />
                          Buat kesepakatan
                        </Button>
                      </>
                    )
                  }
                />
                {status === "diundang" && (
                  <p role="status" className="mt-2 rounded-lg bg-biru-50 p-3 text-label text-biru-900">
                    Undangan terkirim. Pekerja akan melihat undangan Anda di
                    aplikasinya.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
