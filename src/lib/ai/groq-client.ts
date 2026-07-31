/**
 * Groq Whisper — speech-to-text khusus (model ASR asli, bukan LLM umum).
 * Next question tetap dipisah lewat Gemini text-only di gemini-client.ts.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_WHISPER_MODEL ?? "whisper-large-v3-turbo";

export interface TranscribeResult {
  ok: true;
  text: string;
}

export interface TranscribeError {
  ok: false;
  kode: "konfigurasi" | "kuota" | "gagal";
  pesan_pengguna: string;
  debug?: string;
}

export async function transcribeAudio(
  wavBase64: string,
  userId?: string
): Promise<TranscribeResult | TranscribeError> {
  if (!GROQ_API_KEY) {
    return {
      ok: false,
      kode: "konfigurasi",
      pesan_pengguna: "Layanan transkrip belum siap. Coba lagi nanti.",
    };
  }

  const mulai = Date.now();
  const buffer = Buffer.from(wavBase64, "base64");
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "audio/wav" }), "audio.wav");
  form.append("model", GROQ_MODEL);
  form.append("response_format", "json");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const kode = res.status === 429 ? "kuota" : "gagal";
      logAi({
        userId,
        status: kode === "kuota" ? "kuota_habis" : "gagal",
        latensiMs: Date.now() - mulai,
        catatan: `HTTP ${res.status}: ${detail.slice(0, 500)}`,
      }).catch(() => {});
      return {
        ok: false,
        kode,
        pesan_pengguna:
          kode === "kuota"
            ? "Layanan transkrip sedang penuh. Coba lagi sebentar lagi."
            : "Gagal mentranskrip rekaman. Coba lagi.",
        debug: detail.slice(0, 800),
      };
    }

    const json = (await res.json()) as { text?: string };
    logAi({ userId, status: "sukses", latensiMs: Date.now() - mulai }).catch(() => {});
    return { ok: true, text: json.text ?? "" };
  } catch (err) {
    logAi({
      userId,
      status: "gagal",
      latensiMs: Date.now() - mulai,
      catatan: String(err instanceof Error ? err.message : err),
    }).catch(() => {});
    return {
      ok: false,
      kode: "gagal",
      pesan_pengguna: "Koneksi ke layanan transkrip bermasalah. Coba lagi.",
    };
  }
}

async function logAi(opts: {
  userId?: string;
  status: "sukses" | "gagal" | "kuota_habis";
  latensiMs: number;
  catatan?: string;
}) {
  try {
    const { createServiceClient } = await import("@/lib/supabase/server-client");
    const supabase = await createServiceClient();
    await supabase.from("log_ai").insert({
      pengguna_id: opts.userId ?? null,
      jenis: "wawancara",
      model: GROQ_MODEL,
      latensi_ms: opts.latensiMs,
      status: opts.status,
      catatan: opts.catatan ?? null,
    });
  } catch {
    // Logging failure must not break user flow
  }
}
