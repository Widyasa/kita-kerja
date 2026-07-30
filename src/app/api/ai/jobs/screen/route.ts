import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { callGemini } from "@/lib/ai/gemini-client";
import { SkemaSaringan } from "@/lib/ai/output-schemas";
import { PROMPT_SARINGAN } from "@/lib/ai/prompt-screening";
import { analisisRisikoAturan, tingkatRisiko } from "@/lib/engine/risk";
import { createServiceClient } from "@/lib/supabase/server-client";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z.object({
  lowongan_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pemberi_kerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format tidak valid. Kirim { lowongan_id: string }." },
      { status: 400 }
    );
  }

  // Ambil teks lowongan
  const supabase = await createClient();
  const { data: lowongan } = await supabase
    .from("lowongan")
    .select("id, teks_asli, pemberi_kerja_id")
    .eq("id", body.lowongan_id)
    .single();

  if (!lowongan) {
    return NextResponse.json(
      { ok: false, pesan: "Lowongan tidak ditemukan." },
      { status: 404 }
    );
  }

  if (lowongan.pemberi_kerja_id !== userOrResponse.id) {
    return NextResponse.json(
      { ok: false, pesan: "Akses ditolak." },
      { status: 403 }
    );
  }

  // Aturan deterministik
  const aturan = analisisRisikoAturan(lowongan.teks_asli);

  // AI screening
  const ai = await callGemini({
    jenis: "saringan",
    promptParts: [
      { role: "user", parts: [{ text: PROMPT_SARINGAN }] },
      { role: "user", parts: [{ text: `Teks lowongan:\n${lowongan.teks_asli}` }] },
    ],
    responseSchema: {
      type: "object",
      properties: {
        temuan: {
          type: "array",
          items: {
            type: "object",
            properties: {
              jenis: { type: "string" },
              kutipan: { type: "string" },
              penjelasan: { type: "string" },
            },
          },
        },
        pertanyaan_disarankan: { type: "array", items: { type: "string" } },
        skor_ai: { type: "integer" },
      },
    },
    zodSchema: SkemaSaringan,
    temperature: 0.1,
    userId: userOrResponse.id,
  });

  const skorAi = ai.ok ? ai.data.skor_ai : 0;
  const skorTotal = Math.min(aturan.skor_aturan + skorAi, 100);
  const tingkat = tingkatRisiko(skorTotal);

  // Simpan ke database via service role
  const service = await createServiceClient();
  await service.from("saringan_aman").upsert(
    {
      lowongan_id: body.lowongan_id,
      skor_risiko: skorTotal,
      tingkat,
      temuan: [...aturan.temuan, ...(ai.ok ? ai.data.temuan : [])],
      pertanyaan_disarankan: ai.ok ? ai.data.pertanyaan_disarankan : [],
      skor_ai: skorAi,
      skor_aturan: aturan.skor_aturan,
    },
    { onConflict: "lowongan_id" }
  );

  // Update status lowongan jika perlu
  if (tingkat === "berisiko_tinggi" && skorTotal >= 60) {
    await service
      .from("lowongan")
      .update({ status: "moderasi" })
      .eq("id", body.lowongan_id);
  }

  return NextResponse.json({
    ok: true,
    data: {
      skor_risiko: skorTotal,
      tingkat,
      temuan: [...aturan.temuan, ...(ai.ok ? ai.data.temuan : [])],
      pertanyaan_disarankan: ai.ok ? ai.data.pertanyaan_disarankan : [],
      skor_ai: skorAi,
      skor_aturan: aturan.skor_aturan,
    },
  });
}
