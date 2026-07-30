"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, HandHeart, Mic, PhoneOff } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { cn } from "@/lib/utils";

interface PilihanWilayah {
  id: string;
  nama: string;
  provinsi: string;
}

/**
 * /companion/register — mendaftarkan pekerja TANPA HP (CONTEXT.md).
 * Satu tugas per layar, tiga langkah dengan indikator titik:
 *
 *   1. Nama + wilayah (+ nomor HP OPSIONAL — tidak pernah wajib)
 *   2. Persetujuan berbahasa polos — akun milik pekerja
 *   3. Penjelasan wawancara — yang menjawab adalah pekerja, bukan pendamping
 *      → mendaftarkan akun pekerja lewat POST /api/companion/register.
 *      Wawancara sendiri harus dijalankan dari login pekerja, bukan dari sini.
 *
 * Wilayah diambil dari GET /api/wilayah saat halaman dimuat.
 */

type Langkah = 1 | 2 | 3;

function IndikatorTitik({ langkah }: { langkah: Langkah }) {
  return (
    <ol
      className="flex items-center gap-2"
      aria-label={`Langkah ${langkah} dari 3`}
    >
      {([1, 2, 3] as const).map((n) => (
        <li
          key={n}
          aria-current={n === langkah ? "step" : undefined}
          className={cn(
            "size-3 rounded-full transition-colors duration-(--duration-fast) motion-safe:transition-all",
            n === langkah
              ? "w-8 bg-biru-600"
              : n < langkah
                ? "bg-biru-300"
                : "bg-tanah-300",
          )}
        >
          <span className="sr-only">Langkah {n}</span>
        </li>
      ))}
    </ol>
  );
}

export default function HalamanDaftarkanPekerja() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<Langkah>(1);
  const [nama, setNama] = useState("");
  const [wilayahId, setWilayahId] = useState("");
  const [noHp, setNoHp] = useState("");
  const [pekerjaSetuju, setPekerjaSetuju] = useState(false);
  const [wilayah, setWilayah] = useState<PilihanWilayah[]>([]);
  const [sibuk, setSibuk] = useState(false);

  const namaTampil = nama.trim() || "pekerja ini";

  useEffect(() => {
    fetch("/api/wilayah")
      .then((res) => res.json())
      .then((json) => setWilayah(json?.data?.wilayah ?? []))
      .catch(() => setWilayah([]));
  }, []);

  async function daftarkan() {
    if (sibuk) return;
    setSibuk(true);
    try {
      const res = await fetch("/api/companion/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          wilayah_id: wilayahId,
          no_hp: noHp.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mendaftarkan pekerja.");
      toast.success(`${nama.trim()} berhasil didaftarkan.`);
      router.push("/companion");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSibuk(false);
    }
  }

  // ============ LANGKAH 1 — Nama + wilayah (HP opsional) ============
  if (langkah === 1) {
    const bolehLanjut = nama.trim().length > 0 && wilayahId !== "";
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/companion")}>
            <ArrowLeft aria-hidden />
            Kembali
          </Button>
          <IndikatorTitik langkah={1} />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-h1">Siapa yang Anda dampingi?</h1>
          <p className="text-body-lg text-tanah-700">
            Isi atas nama pekerjanya. Nomor HP tidak wajib.
          </p>
        </div>

        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (bolehLanjut) setLangkah(2);
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="nama-pekerja" className="text-body font-semibold">
              Nama lengkap pekerja
            </label>
            <Input
              id="nama-pekerja"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Rudi Hartono"
              autoComplete="off"
              className="h-14 text-body-lg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="wilayah-pekerja" className="text-body font-semibold">
              Wilayah tempat ia biasa bekerja
            </label>
            <select
              id="wilayah-pekerja"
              value={wilayahId}
              onChange={(e) => setWilayahId(e.target.value)}
              className="h-14 w-full rounded-md border border-input bg-tanah-0 px-4 text-body-lg shadow-1 outline-none transition-[color,box-shadow] duration-(--duration-fast) focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Pilih kabupaten/kota
              </option>
              {wilayah.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama}, {w.provinsi}
                </option>
              ))}
            </select>
          </div>

          {/* Nomor HP OPSIONAL — tidak pernah wajib, default tanpa */}
          <div className="flex flex-col gap-3 rounded-xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
            <div className="flex items-start gap-3">
              <PhoneOff className="mt-0.5 size-6 shrink-0 text-tanah-500" aria-hidden />
              <div className="flex flex-col gap-1">
                <label htmlFor="no-hp-pekerja" className="text-body font-semibold">
                  Nomor HP (tidak wajib)
                </label>
                <p className="text-body text-tanah-600">
                  Banyak pekerja yang didampingi belum punya HP. Kosongkan saja
                  — akun tetap bisa dibuat dan tetap miliknya.
                </p>
              </div>
            </div>
            <Input
              id="no-hp-pekerja"
              type="tel"
              inputMode="tel"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="Boleh dikosongkan"
              autoComplete="off"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!bolehLanjut}>
            Lanjut
            <ArrowRight aria-hidden />
          </Button>
        </form>
      </div>
    );
  }

  // ============ LANGKAH 2 — Persetujuan berbahasa polos ============
  if (langkah === 2) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLangkah(1)}>
            <ArrowLeft aria-hidden />
            Kembali
          </Button>
          <IndikatorTitik langkah={2} />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-h1">Jelaskan dulu ke {namaTampil}</h1>
          <p className="text-body-lg text-tanah-700">
            Bacakan pelan-pelan. Pastikan ia paham sebelum lanjut.
          </p>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-biru-200 bg-biru-50 p-5">
          <HandHeart className="mt-1 size-8 shrink-0 text-biru-600" aria-hidden />
          <p className="text-body-lg text-biru-800">
            Akun ini milik {namaTampil}. Anda hanya membantu mengisinya. Bila
            nanti ia punya HP sendiri, akun ini bisa dipindahkan.
          </p>
        </div>

        <label
          htmlFor="setuju-pendampingan"
          className="flex min-h-12 cursor-pointer items-start gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-4 shadow-1"
        >
          <input
            id="setuju-pendampingan"
            type="checkbox"
            checked={pekerjaSetuju}
            onChange={(e) => setPekerjaSetuju(e.target.checked)}
            className="mt-1 size-6 shrink-0 accent-biru-600"
          />
          <span className="text-body-lg">
            {namaTampil} sudah paham dan setuju didaftarkan.
          </span>
        </label>

        <Button
          size="lg"
          className="w-full"
          disabled={!pekerjaSetuju}
          onClick={() => setLangkah(3)}
        >
          Lanjut
          <ArrowRight aria-hidden />
        </Button>
      </div>
    );
  }

  // ============ LANGKAH 3 — Penjelasan wawancara ============
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setLangkah(2)}>
          <ArrowLeft aria-hidden />
          Kembali
        </Button>
        <IndikatorTitik langkah={3} />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-h1">Sekarang giliran {namaTampil}</h1>
        <p className="text-body-lg text-tanah-700">
          Yang menjawab pertanyaan nanti adalah {namaTampil}, bukan Anda.
          Bacakan pertanyaannya, lalu biarkan ia menjawab dengan suaranya
          sendiri. Boleh pakai bahasa daerah.
        </p>
      </div>

      <div className="flex items-start gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50 text-biru-600">
          <Mic className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-body font-semibold text-tanah-900">
            Kira-kira 3 menit ngobrol
          </p>
          <p className="mt-1 text-body text-tanah-600">
            Jawaban {namaTampil} akan disusun menjadi Kartu Kerja atas namanya.
          </p>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={sibuk}
        onClick={daftarkan}
      >
        Daftarkan {namaTampil}
      </Button>

      <Button variant="link" asChild className="min-h-12 w-full">
        <Link href="/companion">Nanti saja — kembali ke Pekerja Saya</Link>
      </Button>
    </div>
  );
}
