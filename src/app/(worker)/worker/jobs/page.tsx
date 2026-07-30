import { BriefcaseBusiness, OctagonAlert } from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { KartuLowongan } from "@/component/pekerja/KartuLowongan";
import { lowongan, saringanAman } from "@/lib/mock";

/**
 * Daftar lowongan (`/worker/jobs`):
 * - semua lowongan tayang, alasan pencocokan SELALU tampil di tiap kartu
 * - skor angka tidak pernah ditampilkan
 * - lowongan berisiko_tinggi SELALU di bagian bawah, dengan pembatas
 *   dan penanda jelas (Bagian 12: tetap ditampilkan, tidak disembunyikan)
 */
export default function HalamanDaftarLowongan() {
  const tayang = lowongan.filter((l) => l.status === "tayang");
  const tingkat = (id: string) =>
    saringanAman.find((s) => s.lowongan_id === id)?.tingkat;

  const biasa = tayang.filter((l) => tingkat(l.id) !== "berisiko_tinggi");
  const berisiko = tayang.filter((l) => tingkat(l.id) === "berisiko_tinggi");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-h1 text-tanah-900">Lowongan</h1>
        <p className="mt-1 text-body-lg text-tanah-600">
          Semua lowongan sudah diperiksa Saringan Aman. Baca penandanya sebelum
          melamar.
        </p>
      </header>

      {tayang.length === 0 ? (
        <KeadaanKosong
          ikon={BriefcaseBusiness}
          judul="Belum ada lowongan tayang"
          penjelasan="Lowongan baru diperiksa setiap hari. Lengkapi Kartu Kerja Anda supaya lowongan yang cocok mudah ditemukan."
          labelAksi="Periksa Kartu Kerja"
          hrefAksi="/worker/card"
        />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {biasa.map((lw) => (
              <li key={lw.id}>
                <KartuLowongan lowongan={lw} href={`/worker/jobs/${lw.id}`} />
              </li>
            ))}
          </ul>

          {berisiko.length > 0 && (
            <section aria-labelledby="judul-berisiko">
              {/* Pembatas jelas sebelum kelompok berisiko tinggi */}
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-bahaya-600/30 bg-bahaya-50 p-4">
                <OctagonAlert
                  className="mt-0.5 size-6 shrink-0 text-bahaya-600"
                  aria-hidden
                />
                <div>
                  <h2
                    id="judul-berisiko"
                    className="text-h3 text-tanah-900"
                  >
                    Ditandai banyak tanda bahaya
                  </h2>
                  <p className="mt-1 text-label text-tanah-600">
                    Lowongan di bawah ini tetap ditampilkan karena Anda berhak
                    memutuskan sendiri — tetapi baca Saringan Aman dan tanyakan
                    pertanyaan yang disarankan sebelum melamar.
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-4">
                {berisiko.map((lw) => (
                  <li key={lw.id}>
                    <KartuLowongan
                      lowongan={lw}
                      href={`/worker/jobs/${lw.id}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
