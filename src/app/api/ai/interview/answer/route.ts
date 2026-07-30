import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { callGemini } from "@/lib/ai/gemini-client";
import { transcribeAudio } from "@/lib/ai/groq-client";
import { SkemaWawancaraKeluaran } from "@/lib/ai/output-schemas";
import { PROMPT_WAWANCARA_SYSTEM } from "@/lib/ai/prompt-interview";
import { transcodeKeWav } from "@/lib/audio/transcode";
import { z } from "zod";

const BodySchema = z.object({
  sesi_id: z.string().uuid(),
  audio_base64: z.string().min(1),
  mime_type: z.string().min(1),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pekerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format tidak valid." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Ambil sesi
  const { data: sesi } = await supabase
    .from("sesi_wawancara")
    .select("*")
    .eq("id", body.sesi_id)
    .eq("pekerja_id", userOrResponse.id)
    .single();

  if (!sesi) {
    return NextResponse.json(
      { ok: false, pesan: "Sesi tidak ditemukan." },
      { status: 404 }
    );
  }

  if (sesi.status !== "berjalan") {
    return NextResponse.json(
      { ok: false, pesan: "Sesi sudah selesai." },
      { status: 409 }
    );
  }

  if (sesi.jumlah_putaran >= 6) {
    return NextResponse.json(
      { ok: false, pesan: "Wawancara sudah mencapai batas maksimal 6 putaran." },
      { status: 400 }
    );
  }

  // Browser cuma bisa rekam webm/opus secara konsisten; transcode dulu ke wav
  // supaya format-nya pasti didukung layanan transkrip.
  let audioWavBase64: string;
  try {
    audioWavBase64 = await transcodeKeWav(body.audio_base64, body.mime_type);
  } catch (err) {
    const { createServiceClient } = await import("@/lib/supabase/server-client");
    const service = await createServiceClient();
    await service.from("log_ai").insert({
      pengguna_id: userOrResponse.id,
      jenis: "wawancara",
      model: "transcode",
      status: "gagal",
      catatan: String(err instanceof Error ? err.stack ?? err.message : err).slice(0, 1000),
    }).then(undefined, () => {});
    return NextResponse.json(
      { ok: false, pesan: "Gagal memproses rekaman audio. Coba rekam ulang." },
      { status: 400 }
    );
  }

  // 1. Transkrip via Groq Whisper (model ASR asli, terpisah dari Gemini).
  const transkripsi = await transcribeAudio(audioWavBase64, userOrResponse.id);
  if (!transkripsi.ok) {
    return NextResponse.json(
      { ok: false, pesan: transkripsi.pesan_pengguna },
      { status: transkripsi.kode === "kuota" ? 429 : 503 }
    );
  }

  const jawaban = transkripsi.text.trim();
  if (!jawaban) {
    return NextResponse.json(
      { ok: false, pesan: "Rekaman tidak terdengar jelas. Coba bicara lebih dekat ke mikrofon dan rekam ulang." },
      { status: 422 }
    );
  }

  // 2. Pertanyaan berikutnya via Gemini (text-only, dari transkrip Groq).
  const history = (sesi.putaran as any[]).map((p) =>
    `Q${p.nomor}: ${p.pertanyaan}\nA: ${p.transkrip}`
  ).join("\n\n");

  const ai = await callGemini({
    jenis: "wawancara",
    promptParts: [
      { role: "user", parts: [{ text: PROMPT_WAWANCARA_SYSTEM }] },
      ...(history ? [{ role: "user", parts: [{ text: `Riwayat sebelumnya:\n${history}` }] }] : []),
      { role: "user", parts: [{ text: `Putaran ${sesi.jumlah_putaran + 1}.\nJawaban pekerja: ${jawaban}` }] },
    ],
    responseSchema: {
      type: "object",
      properties: {
        pertanyaan: { type: "string" },
        sudah_cukup: { type: "boolean" },
      },
      required: ["pertanyaan", "sudah_cukup"],
    },
    zodSchema: SkemaWawancaraKeluaran,
    temperature: 0.4,
    userId: userOrResponse.id,
  });

  if (!ai.ok) {
    return NextResponse.json(
      { ok: false, pesan: ai.pesan_pengguna },
      { status: 503 }
    );
  }

  const putaranBaru = [
    ...(sesi.putaran as any[]),
    {
      nomor: sesi.jumlah_putaran + 1,
      pertanyaan: ai.data.pertanyaan,
      transkrip: jawaban,
      dibuat_pada: new Date().toISOString(),
    },
  ];

  const { error } = await supabase
    .from("sesi_wawancara")
    .update({
      putaran: putaranBaru,
      jumlah_putaran: sesi.jumlah_putaran + 1,
      diperbarui_pada: new Date().toISOString(),
    })
    .eq("id", body.sesi_id);

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyimpan jawaban." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      sesi_id: body.sesi_id,
      transkrip: jawaban,
      pertanyaan: ai.data.pertanyaan,
      putaran: sesi.jumlah_putaran + 1,
      sudah_cukup: ai.data.sudah_cukup,
    },
  });
}
