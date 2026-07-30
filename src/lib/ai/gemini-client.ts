/**
 * Klien Gemini tunggal — satu pintu ke AI.
 * Semua panggilan Gemini hanya dari file ini.
 */

import { GoogleGenAI, type Content } from "@google/genai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
const modelMain = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const modelLight = process.env.GEMINI_MODEL_LIGHT ?? "gemini-2.0-flash-lite";

let genai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!apiKey) throw new GeminiError("konfigurasi", "AI belum siap. Coba lagi nanti.");
  if (!genai) genai = new GoogleGenAI({ apiKey });
  return genai;
}

export class GeminiError extends Error {
  constructor(
    public kode: "konfigurasi" | "kuota" | "gagal" | "validasi" | "jaringan",
    public pesan_pengguna: string,
    /** Detail teknis (jsonText mentah, isu Zod) — masuk ke log_ai.catatan, tidak ke pengguna. */
    public debug?: string
  ) {
    super(pesan_pengguna);
  }
}

export type JenisAI = "wawancara" | "baca_lowongan" | "saringan" | "normalisasi" | "profil";

export interface CallGeminiOptions<T> {
  jenis: JenisAI;
  promptParts: Content[];
  responseSchema: object;
  zodSchema: z.ZodSchema<T>;
  temperature?: number;
  userId?: string;
  /** Gunakan model light untuk normalisasi. */
  useLight?: boolean;
}

export interface CallGeminiResult<T> {
  ok: true;
  data: T;
  model: string;
  latensiMs: number;
}

export interface CallGeminiError {
  ok: false;
  kode: string;
  pesan_pengguna: string;
}

/**
 * Panggil Gemini dengan guardrail, logging, dan fallback ladder.
 */
export async function callGemini<T>({
  jenis,
  promptParts,
  responseSchema,
  zodSchema,
  temperature = 0.3,
  userId,
  useLight = false,
}: CallGeminiOptions<T>): Promise<CallGeminiResult<T> | CallGeminiError> {
  // 1. Cek konfigurasi
  if (!apiKey) {
    return { ok: false, kode: "konfigurasi", pesan_pengguna: "AI belum siap. Coba lagi nanti." };
  }

  // 2. Cek kuota (lazy import agar tidak circular)
  const { checkQuota } = await import("./quota");
  const kuota = await checkQuota(jenis, userId);
  if (!kuota.ok) {
    return { ok: false, kode: "kuota", pesan_pengguna: kuota.pesan };
  }

  const modelName = useLight ? modelLight : modelMain;
  const client = getClient();
  const mulai = Date.now();

  let jsonText: string | null = null;

  try {
    // 3. Panggil Gemini
    const response = await client.models.generateContent({
      model: modelName,
      contents: promptParts,
      config: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
      },
    });

    jsonText = response.text ?? null;
    if (!jsonText) {
      throw new GeminiError("gagal", "AI tidak memberikan jawaban. Coba lagi.");
    }

    // 4. Parse & validasi Zod
    const parsed = JSON.parse(jsonText);
    const zodResult = zodSchema.safeParse(parsed);
    if (!zodResult.success) {
      throw new GeminiError(
        "validasi",
        "Jawaban AI tidak sesuai format. Coba dengan kalimat lain.",
        `raw=${jsonText.slice(0, 800)} | issues=${JSON.stringify(zodResult.error.issues).slice(0, 800)}`
      );
    }

    const latensiMs = Date.now() - mulai;

    // 5. Log ke database (fire-and-forget)
    logAi({
      userId,
      jenis,
      model: modelName,
      latensiMs,
      status: "sukses",
    }).catch(() => {});

    return { ok: true, data: zodResult.data, model: modelName, latensiMs };
  } catch (err) {
    const latensiMs = Date.now() - mulai;

    if (err instanceof GeminiError) {
      logAi({ userId, jenis, model: modelName, latensiMs, status: "ditolak_validasi", catatan: err.debug ?? err.message }).catch(() => {});
      return { ok: false, kode: err.kode, pesan_pengguna: err.pesan_pengguna };
    }

    // Network / API error
    logAi({ userId, jenis, model: modelName, latensiMs, status: "gagal", catatan: String(err) }).catch(() => {});

    // Fallback ladder: retry once with simpler prompt
    if (jsonText === null) {
      return { ok: false, kode: "jaringan", pesan_pengguna: "Koneksi ke AI bermasalah. Coba lagi dalam beberapa saat." };
    }

    return { ok: false, kode: "gagal", pesan_pengguna: "AI tidak bisa menjawab saat ini. Silakan gunakan jalur manual." };
  }
}

/** Log AI call ke tabel log_ai (fire-and-forget). */
async function logAi(opts: {
  userId?: string;
  jenis: JenisAI;
  model: string;
  latensiMs: number;
  status: "sukses" | "gagal" | "kuota_habis" | "ditolak_validasi";
  catatan?: string;
}) {
  try {
    const { createServiceClient } = await import("@/lib/supabase/server-client");
    const supabase = await createServiceClient();
    await supabase.from("log_ai").insert({
      pengguna_id: opts.userId ?? null,
      jenis: opts.jenis,
      model: opts.model,
      latensi_ms: opts.latensiMs,
      status: opts.status,
      catatan: opts.catatan ?? null,
    });
  } catch {
    // Logging failure must not break user flow
  }
}
