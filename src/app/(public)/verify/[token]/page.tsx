import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Info,
  MapPin,
  ShieldCheck,
  ShieldQuestion,
  Star,
} from "lucide-react";

import { BadgeLapis } from "@/component/bersama/BadgeLapis";
import { LabelSection } from "@/component/bersama/LabelSection";
import { createServiceClient } from "@/lib/supabase/server-client";
import {
  formatTanggal,
  inisialkanNamaBelakang,
  inisialNama,
  type LapisKepercayaan,
} from "@/lib/mock";

/**
 * Verifikasi publik `/verify/[token]` (Bagian 6.5).
 * Dibuka orang asing yang baru memindai QR dari selembar kertas — harus
 * dipahami dalam 5 detik, tanpa login, tanpa membocorkan data pribadi:
 * TIDAK PERNAH menampilkan nomor HP, alamat lengkap, atau audio.
 * Nama belakang diinisialkan. Token apa pun selain token kartu aktif
 * mendapat SATU halaman sopan yang seragam (kasus tidak dibedakan).
 *
 * Bahasa visual "dossier": halaman dibaca seperti lembar bukti tercetak —
 * identitas + panel keaslian dua kolom di desktop, angka sebagai strip
 * ledger, keahlian sebagai baris ledger. Di bawah 1024px runtuh ke satu
 * kolom dengan urutan baca yang sama.
 *
 * Data dibaca lewat createServiceClient() langsung di server component ini
 * (bukan self-fetch ke /api/cards/[token]) karena halaman ini publik dan
 * tidak terikat sesi pengguna mana pun — pola kolom eksplisit yang sama
 * dengan route tersebut: jangan pernah expose ID internal, nomor HP, atau
 * alamat lengkap.
 */
export const metadata: Metadata = {
  title: "Verifikasi Kartu Kerja — Kita Kerja",
  robots: { index: false, follow: false },
};

const URUTAN_LAPIS: LapisKepercayaan[] = ["terverifikasi", "dinilai", "diklaim"];

const JUDUL_LAPIS: Record<LapisKepercayaan, string> = {
  terverifikasi: "Keahlian terverifikasi",
  dinilai: "Keahlian yang dinilai pemberi kerja",
  diklaim: "Keahlian yang dinyatakan sendiri",
};

interface KartuPublik {
  aktif_publik: boolean;
  ringkasan: string | null;
  pengalaman_tahun: number;
  diterbitkan_pada: string | null;
  bidang_utama: { nama: string } | { nama: string }[] | null;
  // `id` di sini adalah id pekerja (untuk parameter RPC), TIDAK PERNAH
  // dirender ke JSX — lihat komentar di titik pemakaian di bawah.
  // `wilayah` hanya level kabupaten/kecamatan (bukan alamat lengkap) —
  // aman untuk verifikasi publik, dan memang bagian desain asli halaman ini.
  pekerja:
    | { id: string; nama: string; wilayah: { nama: string } | { nama: string }[] | null }
    | { id: string; nama: string; wilayah: { nama: string } | { nama: string }[] | null }[]
    | null;
  keahlian: {
    sebutan_pekerja: string | null;
    nama_diajukan: string | null;
    level: string;
    kutipan_bukti: string;
    keahlian_id: string | null;
    dikonfirmasi_pekerja: boolean;
    keahlian: { nama_baku: string } | { nama_baku: string }[] | null;
  }[];
}

function halamanTidakDitemukan() {
  return (
    <main className="mx-auto flex w-full max-w-(--max-worker) flex-col items-center gap-6 px-4 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-tanah-100 text-tanah-600">
        <ShieldQuestion className="size-8" aria-hidden />
      </span>
      <h1 className="text-h1 text-balance">
        Kartu tidak ditemukan atau sudah dinonaktifkan pemiliknya
      </h1>
      <p className="text-body-lg max-w-md text-balance text-tanah-600">
        Periksa kembali tautan yang Anda pindai, atau minta pemilik kartu
        membagikan tautan terbarunya.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-12 items-center rounded-md px-4 text-body font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
      >
        Apa itu Kita Kerja?
      </Link>
    </main>
  );
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServiceClient();

  // Kolom eksplisit — jangan pernah expose ID internal, nomor HP, atau
  // alamat lengkap. Sama seperti pola di GET /api/cards/[token].
  const { data: kartuRow } = await supabase
    .from("kartu_kerja")
    .select(
      `aktif_publik, ringkasan, pengalaman_tahun, diterbitkan_pada,
       bidang_utama:bidang_utama_id(nama),
       pekerja:pekerja_id(id, nama, wilayah:wilayah_id(nama)),
       keahlian:kartu_keahlian(sebutan_pekerja, nama_diajukan, level, kutipan_bukti, keahlian_id, dikonfirmasi_pekerja, keahlian:keahlian_id(nama_baku))`,
    )
    .eq("token_publik", token)
    .maybeSingle<KartuPublik>();

  // Hanya token kartu yang aktif publik yang menampilkan kartu.
  // Token lain APA PUN (tidak dikenal, salah format, atau nonaktif) →
  // halaman seragam yang sopan (jangan bedakan kasus).
  if (!kartuRow || !kartuRow.aktif_publik) {
    return halamanTidakDitemukan();
  }

  const pekerja = Array.isArray(kartuRow.pekerja) ? kartuRow.pekerja[0] : kartuRow.pekerja;
  const bidangUtama = Array.isArray(kartuRow.bidang_utama)
    ? kartuRow.bidang_utama[0]
    : kartuRow.bidang_utama;

  // Tanpa pekerja terhubung, kartu tidak valid untuk ditampilkan — perlakukan
  // sama seperti token tidak ditemukan (jangan bedakan kasus ke pemindai).
  if (!pekerja) {
    return halamanTidakDitemukan();
  }

  // Wilayah tingkat kabupaten/kecamatan — bukan alamat lengkap, aman untuk
  // kartu verifikasi publik (memang bagian desain asli halaman ini).
  const wilayahPekerja = Array.isArray(pekerja.wilayah) ? pekerja.wilayah[0] : pekerja.wilayah;

  // pekerja.id dipakai HANYA sebagai parameter RPC di server, tidak pernah
  // dikirim ke JSX / klien.
  const pekerjaId = pekerja.id;

  const { data: jejak } = await supabase.rpc("rekam_jejak_pekerja", {
    p_pekerja: pekerjaId,
  });
  const statistik = (
    jejak as
      | { pekerjaan_selesai: number; rata_penilaian: number; jumlah_penilai: number }[]
      | null
  )?.[0] ?? { pekerjaan_selesai: 0, rata_penilaian: 0, jumlah_penilai: 0 };

  const { data: lapisBaris } = await supabase.rpc("lapis_keahlian_pekerja", {
    p_pekerja: pekerjaId,
  });
  const petaLapis = new Map(
    ((lapisBaris ?? []) as { keahlian_id: string; lapis: LapisKepercayaan }[]).map((r) => [
      r.keahlian_id,
      r.lapis,
    ]),
  );

  // Hanya keahlian yang sudah DIKONFIRMASI pekerja boleh tampil di halaman
  // verifikasi publik — sama seperti getDashboardPekerja dan
  // calonUntukLowongan. Sebuah tebakan AI yang belum dikonfirmasi pekerja
  // tidak pernah pantas dipajang di depan orang asing yang memindai QR.
  const keahlianTerkonfirmasi = kartuRow.keahlian.filter((k) => k.dikonfirmasi_pekerja);

  const keahlian = keahlianTerkonfirmasi.map((k, i) => {
    const baku = Array.isArray(k.keahlian) ? k.keahlian[0] : k.keahlian;
    return {
      id: `${i}`,
      nama_tampil: baku?.nama_baku ?? k.nama_diajukan ?? k.sebutan_pekerja ?? "Keahlian",
      lapis: (k.keahlian_id && petaLapis.get(k.keahlian_id)) || ("diklaim" as LapisKepercayaan),
    };
  });

  return (
    <main className="mx-auto w-full max-w-5xl border-x border-tanah-200 px-14 py-16 max-lg:max-w-(--max-worker) max-lg:border-x-0 max-lg:px-4 max-lg:py-10">
      {/* identitas + panel keaslian — dua kolom di desktop */}
      <div className="grid grid-cols-[1.1fr_0.9fr] items-end gap-12 max-lg:grid-cols-1 max-lg:gap-6">
        <div className="flex items-center gap-5">
          <span
            aria-hidden
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-kuning-100 text-h1 font-bold text-kuning-800 max-lg:size-16"
          >
            {inisialNama(pekerja.nama)}
          </span>
          <div>
            <LabelSection label="Kartu Kerja terverifikasi" />
            <h1 className="mt-3 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.04] font-extrabold tracking-[-0.025em] text-balance">
              {inisialkanNamaBelakang(pekerja.nama)}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-body-lg text-tanah-600">
              <MapPin className="size-4" aria-hidden />
              {bidangUtama?.nama ?? "—"} · {wilayahPekerja?.nama ?? "—"}
            </p>
          </div>
        </div>

        {/* panel keaslian */}
        <div className="flex items-start gap-3 rounded-xl bg-aman-50 p-5">
          <ShieldCheck className="mt-0.5 size-7 shrink-0 text-aman-600" aria-hidden />
          <div>
            <p className="text-h3 text-aman-600">Kartu ini asli dan masih berlaku</p>
            {kartuRow.diterbitkan_pada && (
              <p className="text-label text-tanah-600">
                Diterbitkan {formatTanggal(kartuRow.diterbitkan_pada)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* bukti angka — strip ledger rata kiri */}
      <div className="mt-14 grid grid-cols-2 divide-x-2 divide-tanah-200 border-y-2 border-tanah-200 py-8 max-lg:py-6">
        <div className="flex flex-col gap-2 pr-8 max-lg:pr-5">
          <p className="flex items-center gap-2 text-[4rem] leading-none font-extrabold tracking-[-0.03em] text-biru-600 tabular-nums max-lg:text-[3rem]">
            {statistik.pekerjaan_selesai}
          </p>
          <p className="text-label flex items-center gap-1.5 text-tanah-600">
            <BriefcaseBusiness className="size-4" aria-hidden />
            pekerjaan selesai
          </p>
        </div>
        <div className="flex flex-col gap-2 px-8 max-lg:px-5">
          <p className="flex items-center gap-2 text-[4rem] leading-none font-extrabold tracking-[-0.03em] text-kuning-800 tabular-nums max-lg:text-[3rem]">
            {statistik.jumlah_penilai > 0
              ? statistik.rata_penilaian.toFixed(1).replace(".", ",")
              : "—"}
          </p>
          <p className="text-label flex items-center gap-1.5 text-tanah-600">
            <Star className="size-4 fill-kuning-500 text-kuning-500" aria-hidden />
            dari {statistik.jumlah_penilai} penilai
          </p>
        </div>
      </div>

      {/* keahlian dikelompokkan per lapis kepercayaan — baris ledger */}
      <section className="mt-14 flex flex-col divide-y-2 divide-tanah-200 border-y-2 border-tanah-200">
        {URUTAN_LAPIS.map((lapis) => {
          const daftar = keahlian.filter((k) => k.lapis === lapis);
          if (daftar.length === 0) return null;
          return (
            <div
              key={lapis}
              className="grid grid-cols-[0.4fr_0.6fr] gap-10 py-8 max-lg:grid-cols-1 max-lg:gap-3"
            >
              <div className="flex flex-wrap content-start items-center gap-3">
                <BadgeLapis lapis={lapis} />
                <h2 className="text-h3">{JUDUL_LAPIS[lapis]}</h2>
              </div>
              <ul className="flex flex-col divide-y divide-tanah-200">
                {daftar.map((k) => (
                  <li
                    key={k.id}
                    className="py-3 text-body font-semibold first:pt-0 last:pb-0 max-lg:py-3 max-lg:first:pt-3 max-lg:last:pb-3"
                  >
                    {k.nama_tampil}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* disclaimer jujur */}
      <div className="mt-14 flex items-start gap-3 rounded-xl border border-tanah-200 bg-tanah-0 p-5">
        <Info className="mt-0.5 size-6 shrink-0 text-tanah-500" aria-hidden />
        <p className="text-body text-tanah-700">
          Kita Kerja menampilkan riwayat yang dikonfirmasi kedua pihak. Kami
          tidak menjamin hasil pekerjaan.
        </p>
      </div>

      <p className="mt-10 border-t border-tanah-200 pt-6 text-center text-label text-tanah-500">
        Halaman ini dibagikan sendiri oleh pemilik kartu dan bisa dinonaktifkan
        kapan saja.{" "}
        <Link
          href="/"
          className="font-bold text-biru-600 underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
        >
          Apa itu Kita Kerja?
        </Link>
      </p>
    </main>
  );
}
