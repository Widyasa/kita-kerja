/**
 * Skema Zod mirror untuk validasi keluaran AI.
 * Setiap skema ini sesuai dengan responseSchema yang dikirim ke Gemini.
 *
 * Field numerik/enum dinormalisasi dulu lewat normalisasiMentahEkstrak —
 * model sering kirim string, skala 0–100, atau "" untuk null.
 */

import { z } from "zod";

export const SkemaWawancaraKeluaran = z.object({
  pertanyaan: z.string(),
  sudah_cukup: z.boolean(),
});

export const SkemaWawancaraHasil = z.object({
  keahlian: z
    .array(
      z.object({
        nama_baku: z.string().nullable(),
        nama_diajukan: z.string().nullable(),
        sebutan_pekerja: z.string(),
        level: z.enum(["pemula", "terampil", "ahli"]),
        kutipan_bukti: z.string().min(3),
        keyakinan: z.number().min(0).max(1),
        pengalaman_tahun: z.number().int().min(0).max(60).optional(),
      }),
    )
    .max(12),
  bahasa_terdeteksi: z.array(z.string()).default([]),
  ringkasan: z.string().optional(),
});

const JENIS_KERJA = ["harian", "borongan", "paruh_waktu", "menginap"] as const;
const SATUAN_UPAH = ["harian", "bulanan", "borongan", "per_jam"] as const;

export const SkemaEkstrakLowongan = z.object({
  judul_baku: z.string().max(200).nullable(),
  jenis_kerja: z.enum(JENIS_KERJA).nullable(),
  jumlah_pekerja: z.number().int().min(1).max(100).nullable(),
  upah_ditawarkan: z.number().int().min(0).nullable(),
  satuan_upah: z.enum(SATUAN_UPAH).nullable(),
  lokasi_teks: z.string().max(300).nullable(),
  mulai: z.string().nullable(),
  syarat_tersirat: z.array(z.string()).default([]),
  keahlian_dibutuhkan: z.array(z.string()).default([]),
  yang_belum_jelas: z.array(z.string()).default([]),
  kelengkapan: z.number().min(0).max(1).default(0),
});

export type EkstrakLowongan = z.infer<typeof SkemaEkstrakLowongan>;

function kosongKeNull(v: unknown): unknown {
  if (v === undefined || v === "") return null;
  return v;
}

function intAtauNull(v: unknown): number | null {
  const x = kosongKeNull(v);
  if (x === null) return null;
  if (typeof x === "number" && Number.isFinite(x)) return Math.round(x);
  if (typeof x === "string") {
    const n = Number(x.replace(/[^\d.-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

function enumAtauNull<T extends readonly string[]>(
  allowed: T,
  v: unknown,
): T[number] | null {
  const x = kosongKeNull(v);
  if (x === null || typeof x !== "string") return null;
  const s = x.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (allowed as readonly string[]).includes(s) ? (s as T[number]) : null;
}

function arrayString(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String).filter((s) => s.trim().length > 0);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

/**
 * Normalisasi keluaran mentah Gemini sebelum Zod —
 * tahan string angka, enum longgar, kelengkapan 0–100, array hilang.
 */
export function normalisasiMentahEkstrak(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;

  const judul = kosongKeNull(o.judul_baku);
  const lokasi = kosongKeNull(o.lokasi_teks);
  const mulai = kosongKeNull(o.mulai);

  let jumlah = intAtauNull(o.jumlah_pekerja);
  if (jumlah !== null) {
    if (jumlah < 1) jumlah = null;
    else jumlah = Math.min(100, jumlah);
  }

  let upah = intAtauNull(o.upah_ditawarkan);
  if (upah !== null && upah < 0) upah = null;

  let kelengkapan = 0;
  {
    const k = kosongKeNull(o.kelengkapan);
    let n: number | null = null;
    if (typeof k === "number" && Number.isFinite(k)) n = k;
    else if (typeof k === "string") {
      const parsed = Number(k.replace(",", "."));
      n = Number.isFinite(parsed) ? parsed : null;
    }
    if (n !== null) {
      kelengkapan = n > 1 ? Math.max(0, Math.min(1, n / 100)) : Math.max(0, Math.min(1, n));
    }
  }

  return {
    judul_baku: typeof judul === "string" ? judul.slice(0, 200) : null,
    jenis_kerja: enumAtauNull(JENIS_KERJA, o.jenis_kerja),
    jumlah_pekerja: jumlah,
    upah_ditawarkan: upah,
    satuan_upah: enumAtauNull(SATUAN_UPAH, o.satuan_upah),
    lokasi_teks: typeof lokasi === "string" ? lokasi.slice(0, 300) : null,
    mulai: typeof mulai === "string" ? mulai : null,
    syarat_tersirat: arrayString(o.syarat_tersirat),
    keahlian_dibutuhkan: arrayString(o.keahlian_dibutuhkan),
    yang_belum_jelas: arrayString(o.yang_belum_jelas),
    kelengkapan,
  };
}

export const SkemaSaringan = z.object({
  temuan: z.array(
    z.object({
      jenis: z.string(),
      kutipan: z.string(),
      penjelasan: z.string(),
    }),
  ),
  pertanyaan_disarankan: z.array(z.string()),
  skor_ai: z.number().int().min(0).max(60),
});

export const SkemaNormalisasi = z.object({
  keahlian_id: z.string().uuid().nullable(),
  nama_baku: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});
