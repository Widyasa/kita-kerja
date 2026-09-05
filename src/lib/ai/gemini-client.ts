/**
 * Klien Gemini tunggal — satu pintu ke AI.
 * Semua panggilan Gemini hanya dari file ini.
 */

import { GoogleGenAI, type Content } from "@google/genai";
import { cookies } from "next/headers";
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
    this.name = "GeminiError";
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
  /** Demo only: paksa hasil "kuota habis" tanpa memanggil Gemini. */
  demoPaksaKuotaHabis?: boolean;
  /** Demo only: paksa hasil "AI gagal" tanpa memanggil Gemini. */
  demoPaksaAiGagal?: boolean;
}

/**
 * Baca sakelar simulasi demo dari cookie (diset oleh panel /demo).
 * Hanya aktif bila DEMO_MODE=true — di produksi selalu { false, false }
 * walau cookie-nya entah kenapa ada.
 */
export async function demoSimulasiAktif(): Promise<{ kuotaHabis: boolean; aiGagal: boolean }> {
  if (process.env.DEMO_MODE !== "true") return { kuotaHabis: false, aiGagal: false };
  const jar = await cookies();
  return {
    kuotaHabis: jar.get("kk-demo-kuota-habis")?.value === "true",
    aiGagal: jar.get("kk-demo-ai-gagal")?.value === "true",
  };
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

/** Klasifikasi error API/SDK → kode + pesan pengguna + debug. */
function klasifikasiErrorApi(err: unknown): GeminiError {
  const teks = String(err);
  const lower = teks.toLowerCase();

  if (
    /\b429\b/.test(teks) ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    return new GeminiError(
      "kuota",
      "Kuota AI sementara penuh. Coba lagi dalam beberapa saat.",
      teks.slice(0, 1200),
    );
  }

  if (
    /\b401\b/.test(teks) ||
    /\b403\b/.test(teks) ||
    lower.includes("api key") ||
    lower.includes("permission") ||
    lower.includes("unauthenticated") ||
    lower.includes("unauthorized")
  ) {
    return new GeminiError(
      "konfigurasi",
      "AI belum siap. Coba lagi nanti.",
      teks.slice(0, 1200),
    );
  }

  if (
    (/\b404\b/.test(teks) && lower.includes("model")) ||
    lower.includes("model not found") ||
    lower.includes("is not found for api")
  ) {
    return new GeminiError(
      "konfigurasi",
      "Model AI tidak tersedia. Coba lagi nanti.",
      teks.slice(0, 1200),
    );
  }

  if (
    lower.includes("timeout") ||
    lower.includes("etimedout") ||
    lower.includes("econnreset") ||
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("unavailable") ||
    /\b503\b/.test(teks) ||
    /\b500\b/.test(teks)
  ) {
    return new GeminiError(
      "jaringan",
      "Koneksi ke AI bermasalah. Coba lagi dalam beberapa saat.",
      teks.slice(0, 1200),
    );
  }

  return new GeminiError(
    "gagal",
    "AI tidak bisa menjawab saat ini. Silakan gunakan jalur manual.",
    teks.slice(0, 1200),
  );
}

async function generateJsonText(
  client: GoogleGenAI,
  model: string,
  promptParts: Content[],
  responseSchema: object,
  temperature: number,
): Promise<string> {
  const response = await client.models.generateContent({
    model,
    contents: promptParts,
    config: {
      temperature,
      responseMimeType: "application/json",
      responseSchema: responseSchema as object,
    },
  });

  const jsonText = response.text ?? null;
  if (!jsonText) {
    throw new GeminiError("gagal", "AI tidak memberikan jawaban. Coba lagi.");
  }
  return jsonText;
}

/**
 * Panggil Gemini dengan guardrail, logging, dan fallback ladder.
 * Bila panggilan pertama gagal sebelum ada teks (jaringan/model), coba sekali
 * lagi dengan model light agar ekstraksi tidak sering 503 intermiten.
 */
export async function callGemini<T>({
  jenis,
  promptParts,
  responseSchema,
  zodSchema,
  temperature = 0.3,
  userId,
  useLight = false,
  demoPaksaKuotaHabis = false,
  demoPaksaAiGagal = false,
}: CallGeminiOptions<T>): Promise<CallGeminiResult<T> | CallGeminiError> {
  // 1. Cek konfigurasi
  if (!apiKey) {
    return { ok: false, kode: "konfigurasi", pesan_pengguna: "AI belum siap. Coba lagi nanti." };
  }

  // 1b. Simulasi demo: kuota habis (hanya bila DEMO_MODE=true)
  if (process.env.DEMO_MODE === "true" && demoPaksaKuotaHabis) {
    return { ok: false, kode: "kuota", pesan_pengguna: "Kuota AI hari ini sudah penuh (simulasi demo)." };
  }

  // 2. Cek kuota (lazy import agar tidak circular)
  const { checkQuota } = await import("./quota");
  const kuota = await checkQuota(jenis, userId);
  if (!kuota.ok) {
    return { ok: false, kode: "kuota", pesan_pengguna: kuota.pesan };
  }

  // 2b. Simulasi demo: AI gagal (hanya bila DEMO_MODE=true)
  if (process.env.DEMO_MODE === "true" && demoPaksaAiGagal) {
    return { ok: false, kode: "gagal", pesan_pengguna: "AI tidak bisa menjawab saat ini. Silakan gunakan jalur manual." };
  }

  const modelUtama = useLight ? modelLight : modelMain;
  const modelCadangan =
    modelUtama === modelLight ? modelMain : modelLight;
  const client = getClient();
  const mulai = Date.now();

  let jsonText: string | null = null;
  let modelTerpakai = modelUtama;

  try {
    try {
      jsonText = await generateJsonText(
        client,
        modelUtama,
        promptParts,
        responseSchema,
        temperature,
      );
    } catch (pertama) {
      const classified =
        pertama instanceof GeminiError ? pertama : klasifikasiErrorApi(pertama);

      // Jangan retry kuota/validasi; untuk jaringan/gagal/konfigurasi coba model cadangan
      const bisaRetry =
        classified.kode === "jaringan" ||
        classified.kode === "gagal" ||
        classified.kode === "konfigurasi";

      if (!bisaRetry || modelCadangan === modelUtama) {
        throw classified;
      }

      try {
        modelTerpakai = modelCadangan;
        jsonText = await generateJsonText(
          client,
          modelCadangan,
          promptParts,
          responseSchema,
          temperature,
        );
        logAi({
          userId,
          jenis,
          model: modelCadangan,
          latensiMs: Date.now() - mulai,
          status: "sukses",
          catatan: `fallback setelah gagal model=${modelUtama} kode=${classified.kode}: ${(classified.debug ?? classified.message).slice(0, 400)}`,
        }).catch(() => {});
      } catch (kedua) {
        throw kedua instanceof GeminiError
          ? kedua
          : klasifikasiErrorApi(kedua);
      }
    }

    // 4. Parse & validasi Zod
    const parsed = JSON.parse(jsonText);
    const zodResult = zodSchema.safeParse(parsed);
    if (!zodResult.success) {
      throw new GeminiError(
        "validasi",
        "Jawaban AI tidak sesuai format. Coba dengan kalimat lain.",
        `raw=${jsonText.slice(0, 800)} | issues=${JSON.stringify(zodResult.error.issues).slice(0, 800)}`,
      );
    }

    const latensiMs = Date.now() - mulai;

    // 5. Log ke database (fire-and-forget) — skip bila sudah dilog di fallback
    if (modelTerpakai === modelUtama) {
      logAi({
        userId,
        jenis,
        model: modelTerpakai,
        latensiMs,
        status: "sukses",
      }).catch(() => {});
    }

    return { ok: true, data: zodResult.data, model: modelTerpakai, latensiMs };
  } catch (err) {
    const latensiMs = Date.now() - mulai;
    const geminiErr =
      err instanceof GeminiError ? err : klasifikasiErrorApi(err);

    logAi({
      userId,
      jenis,
      model: modelTerpakai,
      latensiMs,
      status: geminiErr.kode === "validasi" ? "ditolak_validasi" : "gagal",
      catatan: geminiErr.debug ?? geminiErr.message,
    }).catch(() => {});

    return {
      ok: false,
      kode: geminiErr.kode,
      pesan_pengguna: geminiErr.pesan_pengguna,
    };
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
