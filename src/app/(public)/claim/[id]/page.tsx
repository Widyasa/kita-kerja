"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, HandHeart, Loader2, MessageSquareText } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { LangkahOTP } from "@/component/bersama/LangkahOTP";

const KODE_DEMO = "123456";

/**
 * /claim/[id] — pekerja yang didaftarkan pendamping (no_hp sintetis)
 * mengambil alih akunnya sendiri di sini, di HP-nya sendiri: verifikasi
 * nomor asli lewat OTP (pola sama dengan /sign-in), lalu server menempelkan
 * nomor itu ke akun `id` ini dan menghapus status "didampingi".
 *
 * Halaman ini tetap dibiarkan sepenuhnya di klien (tanpa pengecekan
 * server-side dulu) supaya tidak butuh file/endpoint baru — kelayakan akun
 * (masih didampingi? nomor belum dipakai?) diperiksa di /api/auth/claim dan
 * kegagalannya muncul sebagai toast Indonesia yang jelas.
 */
export default function HalamanKlaimAkun({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [langkah, setLangkah] = useState<"hp" | "otp">("hp");
  const [noHp, setNoHp] = useState("");
  const [loading, setLoading] = useState(false);

  const hpValid = noHp.replace(/\D/g, "").length >= 9;

  async function kirimOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!hpValid || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: noHp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal mengirim OTP.");
      setLangkah("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function verifikasiOTP(kode: string) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pengguna_id: id, phone: noHp, code: kode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Klaim gagal.");
      toast.success("Akun berhasil diklaim — sekarang milik Anda sepenuhnya.");
      router.push(json.redirect ?? "/worker");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-(--max-worker) flex-col gap-8 px-4 py-12 sm:py-16">
      <div className="flex items-start gap-4 rounded-xl border border-biru-200 bg-biru-50 p-5">
        <HandHeart className="mt-1 size-8 shrink-0 text-biru-600" aria-hidden />
        <p className="text-body-lg text-biru-800">
          Akun ini didaftarkan pendamping atas nama Anda. Verifikasi nomor HP
          Anda sendiri di sini — sesudahnya, akun ini sepenuhnya milik Anda.
        </p>
      </div>

      {langkah === "hp" ? (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Klaim akun Anda</h1>
            <p className="text-body-lg text-tanah-600">
              Tulis nomor HP Anda. Kami kirim kode lewat SMS — tidak perlu
              kata sandi.
            </p>
          </header>

          <form className="flex flex-col gap-6" onSubmit={kirimOTP}>
            <div className="flex flex-col gap-2">
              <label htmlFor="no-hp" className="text-label text-tanah-800">
                Nomor HP Anda
              </label>
              <Input
                id="no-hp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Contoh: 0812 3456 0001"
                className="h-14 text-body-lg"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" variant="aksen" size="lg" disabled={!hpValid || loading}>
              {loading ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <MessageSquareText aria-hidden />
              )}
              Kirim kode SMS
            </Button>
          </form>
        </>
      ) : (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-h1">Masukkan kode SMS</h1>
            <p className="text-body-lg text-tanah-600">
              Enam angka yang kami kirim ke{" "}
              <span className="font-semibold text-tanah-800">{noHp}</span>.
            </p>
          </header>

          <p className="rounded-xl bg-kuning-50 px-4 py-3 text-center text-body font-semibold text-kuning-800">
            Kode demo: <span className="font-mono tracking-widest">{KODE_DEMO}</span>
          </p>

          <LangkahOTP onSelesai={verifikasiOTP} />

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setLangkah("hp")}
            disabled={loading}
          >
            <ArrowLeft aria-hidden />
            Ganti nomor HP
          </Button>
        </>
      )}
    </div>
  );
}
