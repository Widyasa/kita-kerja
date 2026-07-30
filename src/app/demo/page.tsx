import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  HandHeart,
  House,
  LayoutGrid,
  Mic,
  RotateCcw,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  DaftarRekamanContoh,
  SakelarSimulasiKegagalan,
  SetelUlangDataDemo,
} from "./kontrol-interaktif";

/**
 * /demo — panel mode demo (Bagian 16). Asuransi babak final di depan juri.
 * Aktif hanya bila DEMO_MODE=true; selain itu seluruh jejak tersembunyi (404).
 *
 * Empat kontrol wajib:
 * 1. Ganti persona satu klik
 * 2. Setel ulang data demo
 * 3. Rekaman contoh
 * 4. Sakelar simulasi kegagalan
 */

function Bagian({
  ikon: Ikon,
  judul,
  deskripsi,
  children,
}: {
  ikon: LucideIcon;
  judul: string;
  deskripsi: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-tanah-200 pb-10">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50 text-biru-600">
          <Ikon className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-h2">{judul}</h2>
          <p className="text-body text-tanah-600">{deskripsi}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const PERSONA: {
  href: string;
  nama: string;
  peran: string;
  satuBaris: string;
  ikon: LucideIcon;
}[] = [
  {
    href: "/worker",
    nama: "Pak Warto",
    peran: "Pekerja — kartu lengkap",
    satuBaris: "Tukang bangunan 12 tahun, Kartu Kerja lengkap dengan riwayat panjang.",
    ikon: House,
  },
  {
    href: "/worker/interview",
    nama: "Bu Yanti",
    peran: "Pekerja baru — tanpa kartu",
    satuBaris: "Pekerja baru yang belum punya kartu — mulai dari Ngobrol Kerja.",
    ikon: Mic,
  },
  {
    href: "/employer",
    nama: "Mbak Dhika",
    peran: "Pemberi kerja",
    satuBaris: "Pekerja kantoran yang memasang lowongan dan memilih pekerja.",
    ikon: Users,
  },
  {
    href: "/companion",
    nama: "Pak Slamet",
    peran: "Pendamping",
    satuBaris: "Pengurus RT yang mendaftarkan pekerja tanpa HP.",
    ikon: HandHeart,
  },
];

export default function HalamanPanelDemo() {
  if (process.env.DEMO_MODE !== "true") notFound();

  return (
    <main className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-3">
        <p className="mikro text-kuning-700">Demo — hanya untuk juri</p>
        <h1 className="text-h1">Panel Demo Kita Kerja</h1>
        <p className="text-body-lg text-tanah-700">
          Mode demo menyiapkan semua yang dibutuhkan agar presentasi berjalan
          lancar: ganti tokoh satu klik, kembalikan data ke awal, rekaman cadangan,
          dan simulasi keadaan gagal.
        </p>
      </header>

      {/* 1. GANTI PERSONA SATU KLIK */}
      <Bagian
        ikon={Users}
        judul="Ganti persona satu klik"
        deskripsi="Masuk langsung sebagai salah satu tokoh — tanpa keluar-masuk akun di depan juri."
      >
        <ul className="flex flex-col gap-3">
          {PERSONA.map((p) => {
            const Ikon = p.ikon;
            return (
              <li key={p.nama}>
                <Link
                  href={p.href}
                  className="flex min-h-14 items-center gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-4 shadow-1 transition-colors duration-(--duration-fast) hover:bg-tanah-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50 text-biru-600">
                    <Ikon className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-lg font-bold">
                      {p.nama}{" "}
                      <span className="font-semibold text-tanah-600">
                        · {p.peran}
                      </span>
                    </span>
                    <span className="block text-label text-tanah-600">
                      {p.satuBaris}
                    </span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-tanah-400" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </Bagian>

      {/* 2. SETEL ULANG DATA DEMO */}
      <Bagian
        ikon={RotateCcw}
        judul="Setel ulang data demo"
        deskripsi="Kembalikan seluruh data ke keadaan awal — demo tidak boleh gagal karena sisa percobaan sebelumnya."
      >
        <SetelUlangDataDemo />
      </Bagian>

      {/* 3. REKAMAN CONTOH */}
      <Bagian
        ikon={Mic}
        judul="Rekaman contoh"
        deskripsi="Bila mikrofon bermasalah atau ruangan berisik, alur demo tetap bisa berjalan memakai rekaman yang sudah disiapkan."
      >
        <DaftarRekamanContoh />
      </Bagian>

      {/* 4. SAKELAR SIMULASI KEGAGALAN */}
      <Bagian
        ikon={TriangleAlert}
        judul="Simulasi kegagalan"
        deskripsi="Paksa keadaan gagal untuk mendemokan degradasi berjenjang di depan juri — menunjukkan sistem turun kelas dengan mulus."
      >
        <SakelarSimulasiKegagalan />
      </Bagian>

      {/* Tautan menonjol ke katalog komponen */}
      <Link
        href="/demo/component"
        className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-biru-600 px-6 py-4 text-button font-semibold text-tanah-0 shadow-1 transition-colors duration-(--duration-fast) hover:bg-biru-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:ring-offset-2"
      >
        <LayoutGrid className="size-5" aria-hidden />
        Buka Katalog Komponen
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </main>
  );
}
