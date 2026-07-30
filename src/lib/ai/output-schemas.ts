/**
 * Skema Zod mirror untuk validasi keluaran AI.
 * Setiap skema ini sesuai dengan responseSchema yang dikirim ke Gemini.
 */

import { z } from "zod";

export const SkemaWawancaraKeluaran = z.object({
  pertanyaan: z.string(),
  sudah_cukup: z.boolean(),
});

export const SkemaWawancaraHasil = z.object({
  keahlian: z.array(
    z.object({
      nama_baku: z.string().nullable(),
      nama_diajukan: z.string().nullable(),
      sebutan_pekerja: z.string(),
      level: z.enum(["pemula", "terampil", "ahli"]),
      kutipan_bukti: z.string().min(3),
      keyakinan: z.number().min(0).max(1),
      pengalaman_tahun: z.number().int().min(0).max(60).optional(),
    })
  ).max(12),
  bahasa_terdeteksi: z.array(z.string()).default([]),
  ringkasan: z.string().optional(),
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
