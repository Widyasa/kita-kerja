"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Quote,
  Sparkles,
  CircleHelp,
  Megaphone,
  TriangleAlert,
  CircleCheck,
  PencilLine,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/component/ui/button";
import { RingkasanEkstraksi } from "@/component/pemberi/RingkasanEkstraksi";
import {
  KUNCI_TEKS_LOWONGAN,
  type BidangLowongan,
} from "@/component/pemberi/ekstraksi";
import type { TemuanSaringan } from "@/lib/mock/types";

/**
 * /employer/post/result — Bagian 6.6 + 14:
 * - "Tulisan Anda:" sebagai konteks
 * - hasil ekstraksi AI (POST /api/ai/jobs/extract) sebagai bidang yang dapat
 *   diedit
 * - "Yang saya simpulkan" (syarat tersirat) dan "Yang belum jelas"
 *   (menggerakkan skor kelengkapan) — dua bagian yang MENONJOL
 * - tayangkan() memanggil POST /api/jobs/publish; bila hasilnya "moderasi",
 *   tampilkan keadaan MODERASI-TAHAN dari `saringan` yang dikembalikan
 *   server — dua jalan (perbaiki / tayangkan dengan penanda), bukan
 *   penolakan mentah
 */

type Keadaan = "sunting" | "tayang" | "tayang_dengan_penanda";

function IsiHasil() {
  const router = useRouter();

  const [keadaan, setKeadaan] = useState<Keadaan>("sunting");
  const [bidang, setBidang] = useState<BidangLowongan | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [menayangkan, setMenayangkan] = useState(false);
  const [saringan, setSaringan] = useState<{ tingkat: string; temuan: TemuanSaringan[] } | null>(
    null,
  );
  /** id lowongan sesudah percobaan tayang pertama — dipakai supaya percobaan
   * ulang (mis. sesudah moderasi) MEMPERBARUI baris yang sama, bukan
   * membuat baris baru setiap kali "Tayangkan" ditekan */
  const [lowonganId, setLowonganId] = useState<string | null>(null);
  /** nama keahlian yang disarankan AI (belum di-resolve ke keahlian_baku.id
   * — ditampilkan sebagai info, tidak dikirim sebagai keahlian_ids) */
  const [keahlianDisarankan, setKeahlianDisarankan] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const teks = sessionStorage.getItem(KUNCI_TEKS_LOWONGAN)?.trim();
      if (!teks) {
        router.replace("/employer/post");
        return;
      }
      try {
        const res = await fetch("/api/ai/jobs/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teks }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.pesan || "Gagal membaca tulisan Anda.");
        const d = json.data;
        // "mulai" HARUS ISO yyyy-mm-dd untuk kolom `date` di Postgres — Gemini
        // kadang mengembalikan teks bebas ("senin", "senin depan"). Tolak apa
        // pun yang bukan ISO alih-alih mengirimnya mentah ke /api/jobs/publish
        // (yang akan gagal insert dengan pesan tidak jelas bagi pemberi kerja).
        const mulaiIsoValid = /^\d{4}-\d{2}-\d{2}$/.test(d.mulai ?? "");
        const yangBelumJelas: string[] = d.yang_belum_jelas ?? [];
        if (!mulaiIsoValid && d.mulai) {
          yangBelumJelas.push("Tanggal mulai yang pasti");
        }
        setBidang({
          judul: d.judul_baku ?? "",
          jenisKerja: d.jenis_kerja ?? "",
          jumlahPekerja: d.jumlah_pekerja ? String(d.jumlah_pekerja) : "",
          lokasi: d.lokasi_teks ?? "",
          wilayahId: "",
          kecamatanId: "",
          keahlianIds: [],
          upah: d.upah_ditawarkan ? String(d.upah_ditawarkan) : "",
          satuanUpah: d.satuan_upah ?? "harian",
          mulai: mulaiIsoValid ? d.mulai : "",
          syaratTersirat: d.syarat_tersirat ?? [],
          yangBelumJelas,
          kelengkapan: d.kelengkapan ?? 0,
          teksAsli: teks,
        });
        setKeahlianDisarankan(d.keahlian_dibutuhkan ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
        router.replace("/employer/post");
      } finally {
        setMemuat(false);
      }
    })();
  }, [router]);

  async function tayangkan(paksa: boolean) {
    if (!bidang || menayangkan) return;
    if (!bidang.judul.trim()) {
      toast.error("Judul lowongan perlu diisi dulu.");
      return;
    }
    setMenayangkan(true);
    try {
      let keahlianIds: string[] = [];
      if (keahlianDisarankan.length > 0) {
        try {
          const resResolve = await fetch("/api/keahlian/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nama: keahlianDisarankan }),
          });
          const jsonResolve = await resResolve.json();
          if (resResolve.ok) keahlianIds = jsonResolve.data.keahlian_ids;
        } catch {
          // resolusi keahlian gagal → tetap lanjut publish tanpa keahlian_ids,
          // jangan blokir penerbitan lowongan karena ini
        }
      }
      const res = await fetch("/api/jobs/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // hadir sesudah percobaan pertama supaya percobaan ulang
          // MEMPERBARUI baris yang sama, bukan membuat baris baru
          lowongan_id: lowonganId ?? undefined,
          teks_asli: bidang.teksAsli,
          judul_baku: bidang.judul,
          jenis_kerja: bidang.jenisKerja || null,
          jumlah_pekerja: Number(bidang.jumlahPekerja) || 1,
          upah_ditawarkan: bidang.upah ? Number(bidang.upah) : null,
          satuan_upah: bidang.satuanUpah,
          lokasi_teks: bidang.lokasi || null,
          wilayah_id: bidang.wilayahId || null,
          kecamatan_id: bidang.kecamatanId || null,
          mulai: bidang.mulai || null,
          syarat_tersirat: bidang.syaratTersirat,
          keahlian_ids: keahlianIds,
          paksa_tayang: paksa,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal menayangkan lowongan.");
      setLowonganId(json.data.lowongan_id);
      if (json.data.status === "moderasi") {
        // JANGAN hapus sessionStorage di sini — bila pemberi kerja memuat
        // ulang halaman saat memperbaiki temuan moderasi, teks aslinya
        // harus tetap ada supaya useEffect di atas tidak mengalihkan ke
        // /employer/post dan kehilangan tulisannya.
        setSaringan(json.data.saringan);
        setKeadaan("sunting");
      } else {
        // status "tayang" adalah keadaan akhir — aman menghapus sekarang
        sessionStorage.removeItem(KUNCI_TEKS_LOWONGAN);
        setKeadaan(paksa ? "tayang_dengan_penanda" : "tayang");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setMenayangkan(false);
    }
  }

  if (memuat || !bidang) {
    return (
      <p role="status" className="text-body text-tanah-600">
        Membaca tulisan Anda…
      </p>
    );
  }

  // ---------- keadaan sesudah tayang ----------
  if (keadaan === "tayang" || keadaan === "tayang_dengan_penanda") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl border border-tanah-200 bg-tanah-0 p-8 text-center shadow-1">
        <span className="flex size-16 items-center justify-center rounded-full bg-aman-50">
          <CircleCheck className="size-8 text-aman-600" aria-hidden />
        </span>
        <h1 className="text-h1">Lowongan Anda sudah tayang</h1>
        <p className="max-w-md text-body-lg text-tanah-600">
          Pekerja di sekitar lokasi sekarang bisa melihat &ldquo;{bidang.judul}&rdquo;.
          Calon yang cocok akan muncul di dasbor Anda.
        </p>
        {keadaan === "tayang_dengan_penanda" && (
          <p className="max-w-md rounded-lg bg-hati-50 p-4 text-body text-tanah-900">
            Lowongan tayang dengan penanda pengingat untuk pekerja. Bagian yang
            tadi ditandai tetap bisa Anda perbaiki kapan saja.
          </p>
        )}
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/employer">Kembali ke dasbor</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-h1">Periksa dulu, lalu tayangkan</h1>
        <p className="mt-2 text-body-lg text-tanah-600">
          Ini yang saya tangkap dari tulisan Anda. Semua bisa diubah sebelum
          tayang.
        </p>
      </header>

      {/* teks asli sebagai konteks */}
      <figure className="rounded-2xl border border-tanah-200 bg-tanah-50 p-5">
        <figcaption className="flex items-center gap-2 text-label font-semibold text-tanah-600">
          <Quote className="size-4" aria-hidden />
          Tulisan Anda:
        </figcaption>
        <blockquote className="mt-2 text-body-lg text-tanah-900 italic">
          &ldquo;{bidang.teksAsli}&rdquo;
        </blockquote>
      </figure>

      {/* ---------- keadaan MODERASI-TAHAN ---------- */}
      {saringan && (
        <section
          aria-labelledby="judul-moderasi"
          className="flex flex-col gap-5 rounded-2xl border border-bahaya-600/30 bg-bahaya-50 p-6"
        >
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-7 shrink-0 text-bahaya-600" aria-hidden />
            <div>
              <h2 id="judul-moderasi" className="text-h2">
                Lowongan ini perlu diperbaiki dulu
              </h2>
              <p className="mt-1 text-body text-tanah-900">
                Saringan Aman menemukan beberapa bagian yang bisa membuat pekerja
                curiga. Ini bukan penolakan — perbaiki bagian di bawah, atau
                tetap tayangkan dengan penanda pengingat untuk pekerja.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-label font-semibold text-tanah-700">
              Yang perlu diperbaiki:
            </h3>
            <ul className="mt-2 flex flex-col gap-3">
              {saringan.temuan.map((t, i) => (
                <li key={i} className="rounded-lg bg-tanah-0 p-4 shadow-1">
                  <p className="text-body text-tanah-700 italic">&ldquo;{t.kutipan}&rdquo;</p>
                  <p className="mt-1 text-label text-tanah-600">{t.penjelasan}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setSaringan(null)}
            >
              <PencilLine aria-hidden />
              Perbaiki lowongan
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              disabled={menayangkan}
              onClick={() => tayangkan(true)}
            >
              <Megaphone aria-hidden />
              Tayangkan dengan penanda
            </Button>
          </div>
        </section>
      )}

      {/* ---------- dua bagian kecerdasan — MENONJOL ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Yang saya simpulkan */}
        <section
          aria-labelledby="judul-simpulan"
          className="flex flex-col gap-3 rounded-2xl border border-biru-600/30 bg-biru-50 p-6"
        >
          <h2 id="judul-simpulan" className="flex items-center gap-2 text-h3 text-biru-900">
            <Sparkles className="size-6 shrink-0 text-biru-600" aria-hidden />
            Yang saya simpulkan
          </h2>
          <p className="text-label text-tanah-600">
            Syarat yang tidak Anda tulis, tapi jelas dimaksudkan. Akan tampil di
            lowongan.
          </p>
          {bidang.syaratTersirat.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {bidang.syaratTersirat.map((s, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-tanah-0 px-4 py-3 text-body font-semibold text-tanah-900 shadow-1"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-tanah-0 px-4 py-3 text-body text-tanah-600 shadow-1">
              Tidak ada syarat tersirat dari tulisan ini.
            </p>
          )}
          {keahlianDisarankan.length > 0 && (
            <div>
              <h3 className="text-label font-semibold text-biru-900">
                Keahlian yang disarankan
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {keahlianDisarankan.map((k, i) => (
                  <li
                    key={i}
                    className="rounded-pill bg-tanah-0 px-3 py-1 text-label text-tanah-800 shadow-1"
                  >
                    {k}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-label text-tanah-600">
                Akan dicocokkan otomatis ke daftar keahlian baku saat
                lowongan ditayangkan. Nama yang tidak dikenali akan
                dilewati.
              </p>
            </div>
          )}
        </section>

        {/* Yang belum jelas */}
        <section
          aria-labelledby="judul-belum-jelas"
          className="flex flex-col gap-3 rounded-2xl border border-kuning-600/40 bg-kuning-50 p-6"
        >
          <h2 id="judul-belum-jelas" className="flex items-center gap-2 text-h3 text-kuning-800">
            <CircleHelp className="size-6 shrink-0 text-kuning-700" aria-hidden />
            Yang belum jelas
          </h2>
          <p className="text-label text-tanah-600">
            Lengkapi lewat bidang di bawah — kelengkapan lowongan Anda{" "}
            <span className="font-bold text-tanah-900">
              {Math.round(bidang.kelengkapan * 100)}%
            </span>
            . Lowongan yang lengkap terisi rata-rata lebih cepat.
          </p>
          {/* bilah kelengkapan */}
          <div
            role="progressbar"
            aria-valuenow={Math.round(bidang.kelengkapan * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Kelengkapan lowongan"
            className="h-3 overflow-hidden rounded-pill bg-tanah-0"
          >
            <div
              className="h-full rounded-pill bg-kuning-600 transition-all motion-safe:duration-(--duration-medium)"
              style={{ width: `${Math.max(8, bidang.kelengkapan * 100)}%` }}
            />
          </div>
          {bidang.yangBelumJelas.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {bidang.yangBelumJelas.map((b, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-tanah-0 px-4 py-3 text-body text-tanah-900 shadow-1"
                >
                  {b}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-tanah-0 px-4 py-3 text-body font-semibold text-aman-600 shadow-1">
              Lengkap — tidak ada yang belum jelas.
            </p>
          )}
        </section>
      </div>

      {/* ---------- bidang hasil ekstraksi yang dapat diedit ---------- */}
      <section aria-labelledby="judul-bidang" className="flex flex-col gap-4">
        <h2 id="judul-bidang" className="text-h2">
          Detail lowongan
        </h2>
        <RingkasanEkstraksi
          bidang={bidang}
          onUbah={(patch) => setBidang({ ...bidang, ...patch })}
        />
      </section>

      {/* ---------- CTA ---------- */}
      {!saringan && (
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            disabled={menayangkan}
            onClick={() => tayangkan(false)}
          >
            <Megaphone aria-hidden />
            Tayangkan lowongan
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/employer/post">Kembali dan tulis ulang</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

const IsiHasilDinamis = dynamic(() => Promise.resolve(IsiHasil), {
  ssr: false,
  loading: () => (
    <p className="text-body text-tanah-600" role="status">
      Membaca tulisan Anda…
    </p>
  ),
});

export default function HalamanHasilEkstraksi() {
  return (
    <Suspense
      fallback={
        <p className="text-body text-tanah-600" role="status">
          Membaca tulisan Anda…
        </p>
      }
    >
      <IsiHasilDinamis />
    </Suspense>
  );
}
