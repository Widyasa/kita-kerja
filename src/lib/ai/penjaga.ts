/**
 * Penjaga keluaran AI — pipeline validasi & filter.
 * Selalu dijalankan pada keluaran AI sebelum disimpan ke DB.
 */

import { z } from "zod";

export const SkemaKeahlianKeluaran = z.object({
  nama_baku: z.string().min(1).max(100).nullable(),
  nama_diajukan: z.string().min(1).max(100).nullable(),
  sebutan_pekerja: z.string().min(1).max(100),
  level: z.enum(["pemula", "terampil", "ahli"]),
  kutipan_bukti: z.string().min(3).max(500),
  keyakinan: z.number().min(0).max(1),
  pengalaman_tahun: z.number().int().min(0).max(60).optional(),
});

export const SkemaHasilWawancara = z.object({
  keahlian: z.array(SkemaKeahlianKeluaran).max(12),
  bahasa_terdeteksi: z.array(z.string()).default([]),
  ringkasan: z.string().max(500).optional(),
});

export const SkemaEkstrakLowongan = z.object({
  judul_baku: z.string().max(200).nullable(),
  jenis_kerja: z.enum(["harian", "borongan", "paruh_waktu", "menginap"]).nullable(),
  jumlah_pekerja: z.number().int().min(1).max(100).nullable(),
  upah_ditawarkan: z.number().int().min(0).nullable(),
  satuan_upah: z.enum(["harian", "bulanan", "borongan", "per_jam"]).nullable(),
  lokasi_teks: z.string().max(300).nullable(),
  mulai: z.string().nullable(),
  syarat_tersirat: z.array(z.string()).default([]),
  keahlian_dibutuhkan: z.array(z.string()).default([]),
  yang_belum_jelas: z.array(z.string()).default([]),
  kelengkapan: z.number().min(0).max(1).default(0),
});

export const SkemaSaringan = z.object({
  temuan: z.array(
    z.object({
      jenis: z.string(),
      kutipan: z.string(),
      penjelasan: z.string(),
    })
  ),
  pertanyaan_disarankan: z.array(z.string()),
  skor_ai: z.number().int().min(0).max(60),
});

export const SkemaNormalisasi = z.object({
  keahlian_id: z.string().uuid().nullable(),
  nama_baku: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

// ======== PIPELINE PENJAGA ========

interface KeahlianBersih {
  nama_baku: string | null;
  nama_diajukan: string | null;
  sebutan_pekerja: string;
  level: "pemula" | "terampil" | "ahli";
  kutipan_bukti: string;
  keyakinan: number;
}

/**
 * Jalankan pipeline penjaga pada array keahlian dari AI.
 */
export function jagaKeahlian(
  keahlian: KeahlianBersih[],
  transkripGabungan: string
): KeahlianBersih[] {
  return keahlian
    .filter((k) => k.kutipan_bukti.trim().length >= 3)
    .filter((k) => verifikasiKutipan(k.kutipan_bukti, transkripGabungan))
    .map((k) => ({
      ...k,
      level: klemLevel(k.keyakinan, k.level),
      kutipan_bukti: bersihkanNominal(k.kutipan_bukti),
    }))
    .slice(0, 12);
}

/** Verifikasi kutipan muncul dalam transkrip (normalisasi longgar, reject jika overlap < 60%). */
function verifikasiKutipan(kutipan: string, transkrip: string): boolean {
  const k = kutipan.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const t = transkrip.toLowerCase().replace(/[^\w\s]/g, "").trim();
  if (t.includes(k)) return true;

  // Partial match: cek overlap token
  const kTokens = k.split(/\s+/).filter(Boolean);
  const tTokens = t.split(/\s+/).filter(Boolean);
  if (kTokens.length === 0) return false;

  let matched = 0;
  for (const token of kTokens) {
    if (tTokens.some((t) => t.includes(token) || token.includes(t))) {
      matched++;
    }
  }
  return matched / kTokens.length >= 0.6;
}

/** Klem level berdasarkan keyakinan. */
function klemLevel(keyakinan: number, levelAsli: "pemula" | "terampil" | "ahli"): "pemula" | "terampil" | "ahli" {
  if (keyakinan >= 0.75) return levelAsli;
  if (keyakinan >= 0.5) return "terampil";
  return "pemula";
}

/** Bersihkan pola nominal (Rp..., ribu/rb/juta/jt/k, angka >= 5 digit). */
function bersihkanNominal(teks: string): string {
  return teks
    .replace(/\bRp[\s.]?[\d.,]+\b/gi, "—")
    .replace(/\b\d{1,3}(?:[.,]\d{3})+\s*(?:ribu|ratus|rb|juta|jt|k)\b/gi, "—")
    .replace(/\b\d{5,}\s*(?:ribu|ratus|rb|juta|jt|k)?\b/gi, "—")
    .replace(/\b\d+\s*(?:ribu|ratus|rb|juta|jt|k)\b/gi, "—")
    .trim();
}

/** Bersihkan keluaran ekstraksi lowongan. */
export function jagaEkstrakLowongan(data: z.input<typeof SkemaEkstrakLowongan>): z.infer<typeof SkemaEkstrakLowongan> {
  return {
    ...data,
    upah_ditawarkan: data.upah_ditawarkan ?? null,
    jumlah_pekerja: Math.min(data.jumlah_pekerja ?? 1, 100),
    syarat_tersirat: (data.syarat_tersirat ?? []).slice(0, 20),
    keahlian_dibutuhkan: (data.keahlian_dibutuhkan ?? []).slice(0, 10),
    yang_belum_jelas: (data.yang_belum_jelas ?? []).slice(0, 10),
    kelengkapan: data.kelengkapan ?? 0,
  };
}
