"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  HandHeart,
  Loader2,
  Mic,
  UserPlus,
} from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { cn } from "@/lib/utils";

interface PilihanWilayah {
  id: string;
  nama: string;
  provinsi: string;
}

/**
 * /companion/register — mendaftarkan pekerja dengan email asli + kata sandi
 * (selaras /register). Tanpa email sementara / domain uji.
 *
 *   1. Nama, wilayah, email, kata sandi + konfirmasi
 *   2. Persetujuan — akun milik pekerja
 *   3. Konfirmasi + buat akun
 */

type Langkah = 1 | 2 | 3;

const DOMAIN_UJI = /(^|\.)kitakerja\.test$/i;

function emailAsliValid(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  const domain = e.split("@")[1] ?? "";
  return !DOMAIN_UJI.test(domain);
}

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordKonfirmasi, setPasswordKonfirmasi] = useState("");
  const [pekerjaSetuju, setPekerjaSetuju] = useState(false);
  const [wilayah, setWilayah] = useState<PilihanWilayah[]>([]);
  const [sibuk, setSibuk] = useState(false);

  const namaTampil = nama.trim() || "pekerja ini";
  const namaValid = nama.trim().length >= 3;
  const emailValid = emailAsliValid(email);
  const passwordValid = password.length >= 8;
  const passwordSama = password === passwordKonfirmasi && passwordKonfirmasi.length > 0;

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
          email: email.trim(),
          password,
          wilayah_id: wilayahId,
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

  // ============ LANGKAH 1 — Identitas + email/password ============
  if (langkah === 1) {
    const bolehLanjut =
      namaValid && wilayahId !== "" && emailValid && passwordValid && passwordSama;
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
            Isi atas nama pekerja. Pakai email yang bisa diakses pekerja nanti —
            bukan email sementara atau domain uji.
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

          <div className="flex flex-col gap-2">
            <label htmlFor="email-pekerja" className="text-body font-semibold">
              Email untuk masuk
            </label>
            <Input
              id="email-pekerja"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              autoComplete="off"
              className="h-14 text-body-lg"
            />
            <p className="text-label text-tanah-600">
              Wajib email asli yang pekerja (atau Anda atas namanya) bisa buka.
              Tanpa email yang bisa diakses, jangan daftarkan dulu.
            </p>
            {email.trim().length > 0 && !emailValid && (
              <p className="text-label text-hati-600" role="alert">
                {/kitakerja\.test$/i.test(email.trim())
                  ? "Email domain uji tidak diizinkan. Pakai email asli."
                  : "Format email tidak valid."}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password-pekerja" className="text-body font-semibold">
              Kata sandi
            </label>
            <Input
              id="password-pekerja"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              className="h-14 text-body-lg"
            />
            {password.length > 0 && !passwordValid && (
              <p className="text-label text-hati-600" role="alert">
                Kata sandi minimal 8 karakter
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password-konfirmasi"
              className="text-body font-semibold"
            >
              Konfirmasi kata sandi
            </label>
            <Input
              id="password-konfirmasi"
              type="password"
              value={passwordKonfirmasi}
              onChange={(e) => setPasswordKonfirmasi(e.target.value)}
              placeholder="Ulangi kata sandi"
              autoComplete="new-password"
              className="h-14 text-body-lg"
            />
            {passwordKonfirmasi.length > 0 && !passwordSama && (
              <p className="text-label text-hati-600" role="alert">
                Kata sandi tidak sama
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!bolehLanjut}>
            Lanjut
            <ArrowRight aria-hidden />
          </Button>
        </form>
      </div>
    );
  }

  // ============ LANGKAH 2 — Persetujuan ============
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
            Akun ini milik {namaTampil}. Anda hanya mendampingi. Email dan kata
            sandi dipakai {namaTampil} untuk masuk sendiri.
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

  // ============ LANGKAH 3 — Konfirmasi ============
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
        <h1 className="text-h1">Akun {namaTampil} akan dibuat</h1>
        <p className="text-body-lg text-tanah-700">
          Setelah terdaftar, berikan email dan kata sandi ke {namaTampil}. Ia
          masuk di halaman masuk, lalu menjawab Ngobrol Kerja sendiri. Anda
          mendampingi di sampingnya.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
        <p className="text-label text-tanah-600">Email masuk</p>
        <p className="break-all font-mono text-body font-semibold text-tanah-900">
          {email.trim()}
        </p>
        <p className="text-label text-tanah-600">
          Pastikan {namaTampil} juga ingat kata sandinya — tidak ditampilkan
          lagi di sini setelah akun dibuat.
        </p>
      </div>

      <div className="flex items-start gap-4 rounded-xl border border-tanah-200 bg-tanah-0 p-5 shadow-1">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-biru-50 text-biru-600">
          <Mic className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-body font-semibold text-tanah-900">
            Setelah didaftarkan
          </p>
          <p className="mt-1 text-body text-tanah-600">
            Buka halaman masuk, masukkan email dan kata sandi {namaTampil}, lalu
            mulai Ngobrol Kerja dari beranda pekerja.
          </p>
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={sibuk} onClick={daftarkan}>
        {sibuk ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <UserPlus aria-hidden />
        )}
        Daftarkan {namaTampil}
      </Button>

      <Button variant="link" asChild className="min-h-12 w-full">
        <Link href="/companion">Nanti saja — kembali ke Pekerja Saya</Link>
      </Button>
    </div>
  );
}
