import Link from "next/link";
import {
  CircleAlert,
  CircleCheck,
  HandHeart,
  Mic,
  UserPlus,
  Users,
} from "lucide-react";

import { KeadaanKosong } from "@/component/bersama/KeadaanKosong";
import { Button } from "@/component/ui/button";
import {
  formatTanggal,
  inisialNama,
  kartuKerja,
  pendampingUtama,
  pengguna,
  wilayah,
} from "@/lib/mock";

/**
 * /companion — daftar pekerja yang didampingi Pak Slamet (fase 2, data mock).
 * Menampilkan status Kartu Kerja masing-masing pekerja (sudah terbit / belum,
 * kapan terakhir diperbarui) dan CTA besar untuk mendaftarkan pekerja baru.
 *
 * Prinsip CONTEXT.md: akun pekerja yang didaftarkan pendamping MILIK pekerja.
 * Kalimat peran ini wajib selalu terlihat di halaman ini.
 */
export default function HalamanPekerjaDidampingi() {
  const didampingi = pengguna.filter(
    (p) => p.didampingi_oleh === pendampingUtama.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="mikro text-kuning-700">
          {pendampingUtama.nama} — Pendamping
        </p>
        <h1 className="text-h1">Pekerja Saya</h1>
        {/* Kalimat peran — wajib selalu terlihat (CONTEXT.md) */}
        <p className="flex items-start gap-3 rounded-xl border border-biru-200 bg-biru-50 p-4 text-body text-biru-800">
          <HandHeart className="mt-0.5 size-6 shrink-0" aria-hidden />
          <span>
            Anda mendampingi. Kartu Kerja dan akun tetap milik pekerja.
          </span>
        </p>
      </header>

      {/* CTA utama 56px, teks >= 19px */}
      <Button asChild size="lg" className="w-full">
        <Link href="/companion/register">
          <UserPlus aria-hidden />
          Daftarkan pekerja baru
        </Link>
      </Button>

      {didampingi.length === 0 ? (
        <KeadaanKosong
          ikon={Users}
          judul="Belum ada pekerja yang didampingi"
          penjelasan="Pekerja yang Anda daftarkan akan muncul di sini beserta status Kartu Kerjanya. Mulai dengan menekan tombol di atas — tidak perlu nomor HP."
          labelAksi="Daftarkan pekerja baru"
          hrefAksi="/companion/register"
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {didampingi.map((pekerja) => {
            const kartu = kartuKerja.find((k) => k.pekerja_id === pekerja.id);
            const wl = wilayah.find((w) => w.id === pekerja.wilayah_id);
            return (
              <li
                key={pekerja.id}
                className="flex flex-col gap-4 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="flex size-14 shrink-0 items-center justify-center rounded-full bg-tanah-100 text-h3 font-bold text-tanah-700"
                    aria-hidden
                  >
                    {inisialNama(pekerja.nama)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-h3">{pekerja.nama}</p>
                    <p className="text-body text-tanah-600">
                      {pekerja.umur ? `${pekerja.umur} tahun` : ""}
                      {pekerja.umur && wl ? " · " : ""}
                      {wl?.nama ?? "Wilayah belum diisi"}
                    </p>
                  </div>
                </div>

                {kartu ? (
                  <div className="flex items-start gap-3 rounded-xl bg-aman-50 p-4">
                    <CircleCheck
                      className="mt-0.5 size-6 shrink-0 text-aman-600"
                      aria-hidden
                    />
                    <div>
                      <p className="text-body font-semibold text-aman-600">
                        Kartu Kerja sudah terbit
                      </p>
                      <p className="text-body text-tanah-600">
                        Terakhir diperbarui{" "}
                        {kartu.diterbitkan_pada
                          ? formatTanggal(kartu.diterbitkan_pada)
                          : "belum tercatat"}
                        .
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-xl bg-hati-50 p-4">
                    <div className="flex items-start gap-3">
                      <CircleAlert
                        className="mt-0.5 size-6 shrink-0 text-hati-600"
                        aria-hidden
                      />
                      <div>
                        <p className="text-body font-semibold text-kuning-700">
                          Belum punya Kartu Kerja
                        </p>
                        <p className="text-body text-tanah-600">
                          Ajak {pekerja.nama} ngobrol beberapa menit. Ia yang
                          menjawab, Anda yang mendampingi.
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/worker/interview">
                        <Mic aria-hidden />
                        Mulai wawancara untuknya
                      </Link>
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
