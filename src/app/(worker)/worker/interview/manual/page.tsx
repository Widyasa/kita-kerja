"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { Textarea } from "@/component/ui/textarea";
import { cn } from "@/lib/utils";
import {
  KUNCI_KEAHLIAN_MANUAL,
  LABEL_LEVEL,
  PILIHAN_LEVEL,
  type KeahlianManualTersimpan,
} from "../_komponen/penyimpanan";

/**
 * Jalur manual (Bagian 6.2) — selalu dapat diakses, ditawarkan sejak pengantar.
 * Satu tugas per layar: tambah keahlian SATU PER SATU. Cerita singkat wajib
 * diisi sebagai pengganti kutipan bukti (tetap anti-karangan).
 * Hasil diteruskan ke /worker/interview/result untuk diperiksa sekali lagi.
 */

const skema = z.object({
  nama: z
    .string()
    .trim()
    .min(3, "Tulis nama keahliannya dulu ya (minimal 3 huruf)."),
  level: z.enum(["pemula", "terampil", "ahli"], {
    required_error: "Pilih salah satu ya.",
    invalid_type_error: "Pilih salah satu ya.",
  }),
  cerita: z
    .string()
    .trim()
    .min(10, "Ceritakan sedikit dulu ya — ini bukti keahlian Anda."),
});

type IsianManual = z.infer<typeof skema>;

export default function HalamanIsiManual() {
  const router = useRouter();
  const [daftar, setDaftar] = useState<KeahlianManualTersimpan[]>([]);
  const [dimuat, setDimuat] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IsianManual>({
    resolver: zodResolver(skema),
    defaultValues: { nama: "", cerita: "" },
  });

  // Pulihkan daftar yang sudah ditambah (tahan refresh) — baca sistem
  // eksternal lalu setState dari callback, bukan sinkron di badan effect.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const mentah = sessionStorage.getItem(KUNCI_KEAHLIAN_MANUAL);
        if (mentah) {
          const tersimpan = JSON.parse(mentah) as KeahlianManualTersimpan[];
          if (Array.isArray(tersimpan)) setDaftar(tersimpan);
        }
      } catch {
        // abaikan — mulai dari daftar kosong
      }
      setDimuat(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Simpan setiap berubah
  useEffect(() => {
    if (!dimuat) return;
    try {
      sessionStorage.setItem(KUNCI_KEAHLIAN_MANUAL, JSON.stringify(daftar));
    } catch {
      // abaikan
    }
  }, [daftar, dimuat]);

  const tambah = (data: IsianManual) => {
    setDaftar((d) => [...d, { id: `manual-${Date.now()}`, ...data }]);
    reset({ nama: "", cerita: "", level: undefined });
  };

  const hapus = (id: string) => setDaftar((d) => d.filter((k) => k.id !== id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/worker/interview")}
        >
          <ArrowLeft aria-hidden />
          Kembali
        </Button>
        <p className="mikro text-tanah-500">Langkah 1 dari 3</p>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-h1">Isi keahlian sendiri</h1>
        <p className="text-body-lg text-tanah-700">
          Tambah satu per satu. Tidak perlu buru-buru.
        </p>
      </div>

      {/* Formulir tambah — satu keahlian sekali isi */}
      <form
        onSubmit={handleSubmit(tambah)}
        noValidate
        className="flex flex-col gap-5 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1"
      >
        <div>
          <label htmlFor="nama" className="text-label text-tanah-800">
            Nama keahlian
          </label>
          <Input
            id="nama"
            className="mt-1"
            placeholder="Contoh: pasang keramik"
            aria-invalid={!!errors.nama}
            {...register("nama")}
          />
          {errors.nama && (
            <p role="alert" className="mt-1 text-label text-bahaya-600">
              {errors.nama.message}
            </p>
          )}
        </div>

        <Controller
          control={control}
          name="level"
          render={({ field }) => (
            <fieldset>
              <legend className="text-label text-tanah-800">
                Seberapa bisa?
              </legend>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {PILIHAN_LEVEL.map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={field.value === l}
                    onClick={() => field.onChange(l)}
                    className={cn(
                      "min-h-12 rounded-md border text-label font-semibold transition-colors duration-(--duration-fast) focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
                      field.value === l
                        ? "border-biru-600 bg-biru-600 text-tanah-0"
                        : "border-tanah-300 bg-tanah-0 text-tanah-800 hover:bg-tanah-100",
                    )}
                  >
                    {LABEL_LEVEL[l]}
                  </button>
                ))}
              </div>
              {errors.level && (
                <p role="alert" className="mt-1 text-label text-bahaya-600">
                  {errors.level.message}
                </p>
              )}
            </fieldset>
          )}
        />

        <div>
          <label htmlFor="cerita" className="text-label text-tanah-800">
            Cerita singkat
          </label>
          <p className="mt-1 text-label font-normal text-tanah-600">
            Cerita ini bukti bahwa keahliannya benar dari Anda. Contoh:
            &ldquo;Sudah 10 tahun pasang keramik rumah-rumah di Malang.&rdquo;
          </p>
          <Textarea
            id="cerita"
            className="mt-2"
            rows={3}
            aria-invalid={!!errors.cerita}
            {...register("cerita")}
          />
          {errors.cerita && (
            <p role="alert" className="mt-1 text-label text-bahaya-600">
              {errors.cerita.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full">
          <Plus aria-hidden />
          Tambah keahlian ini
        </Button>
      </form>

      {/* Daftar yang sudah ditambah */}
      {daftar.length > 0 && (
        <section
          aria-label="Keahlian yang sudah ditambah"
          className="flex flex-col gap-3"
        >
          <h2 className="text-h3">Sudah ditambah ({daftar.length})</h2>
          {daftar.map((k) => (
            <article
              key={k.id}
              className="rounded-xl border border-tanah-200 bg-tanah-0 p-4 shadow-1"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-body font-semibold text-tanah-900">
                    {k.nama}
                  </p>
                  <p className="text-label text-tanah-600">
                    {LABEL_LEVEL[k.level]}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => hapus(k.id)}>
                  <Trash2 aria-hidden />
                  Hapus
                </Button>
              </div>
              <p className="mt-2 text-body text-tanah-700 italic">
                &ldquo;{k.cerita}&rdquo;
              </p>
            </article>
          ))}
        </section>
      )}

      <footer className="flex flex-col gap-2">
        <Button
          size="lg"
          variant="aksen"
          className="w-full"
          disabled={daftar.length === 0}
          onClick={() => router.push("/worker/interview/result")}
        >
          Terbitkan Kartu Kerja saya
        </Button>
        {daftar.length === 0 && (
          <p className="text-center text-label text-tanah-500">
            Tambah minimal satu keahlian dulu ya.
          </p>
        )}
      </footer>
    </div>
  );
}
