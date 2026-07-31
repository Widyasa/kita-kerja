import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { transcribeAudio } from "@/lib/ai/groq-client";
import { transcodeKeWav } from "@/lib/audio/transcode";
import { z } from "zod";

const BodySchema = z.object({
  audio_base64: z.string().min(1),
  mime_type: z.string().min(1),
});

export async function POST(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  let wav: string;
  try {
    wav = await transcodeKeWav(body.audio_base64, body.mime_type);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Gagal memproses rekaman audio. Coba rekam ulang." },
      { status: 400 },
    );
  }

  const hasil = await transcribeAudio(wav, userOrResponse.id);
  if (!hasil.ok) {
    return NextResponse.json(
      { ok: false, pesan: hasil.pesan_pengguna },
      { status: hasil.kode === "kuota" ? 429 : 503 },
    );
  }

  const teks = hasil.text.trim();
  if (!teks) {
    return NextResponse.json(
      { ok: false, pesan: "Rekaman tidak terdengar jelas. Coba rekam ulang lebih dekat ke mikrofon." },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true, data: { teks } });
}
