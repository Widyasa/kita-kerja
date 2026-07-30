import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { callGemini } from "@/lib/ai/klien-gemini";
import { SkemaWawancaraKeluaran } from "@/lib/ai/skema-keluaran";
import { PROMPT_WAWANCARA_SYSTEM } from "@/lib/ai/prompt-wawancara";
import { z } from "zod";

const BodySchema = z.object({
  sesi_id: z.string().uuid(),
  jawaban: z.string().min(1).max(2000),
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

  // Build history dari putaran sebelumnya
  const history = (sesi.putaran as any[]).map((p) =>
    `Q${p.nomor}: ${p.pertanyaan}\nA: ${p.transkrip}`
  ).join("\n\n");

  const ai = await callGemini({
    jenis: "wawancara",
    promptParts: [
      { role: "user", parts: [{ text: PROMPT_WAWANCARA_SYSTEM }] },
      ...(history ? [{ role: "user", parts: [{ text: `Riwayat sebelumnya:\n${history}` }] }] : []),
      { role: "user", parts: [{ text: `Putaran ${sesi.jumlah_putaran + 1}.\nJawaban pekerja: ${body.jawaban}` }] },
    ],
    responseSchema: {
      type: "object",
      properties: {
        pertanyaan: { type: "string" },
        sudah_cukup: { type: "boolean" },
      },
    },
    zodSchema: SkemaWawancaraKeluaran,
    temperature: 0.6,
    userId: userOrResponse.id,
  });

  const putaranBaru = [
    ...(sesi.putaran as any[]),
    {
      nomor: sesi.jumlah_putaran + 1,
      pertanyaan: ai.ok ? ai.data.pertanyaan : "Bisa ceritakan lebih lanjut?",
      transkrip: body.jawaban,
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
      pertanyaan: ai.ok ? ai.data.pertanyaan : "Bisa ceritakan lebih lanjut?",
      putaran: sesi.jumlah_putaran + 1,
      sudah_cukup: ai.ok ? ai.data.sudah_cukup : false,
    },
  });
}
