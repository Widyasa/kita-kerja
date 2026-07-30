import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { callGemini } from "@/lib/ai/gemini-client";
import { SkemaWawancaraHasil } from "@/lib/ai/output-schemas";
import { PROMPT_WAWANCARA_HASIL } from "@/lib/ai/prompt-interview";
import { jagaKeahlian } from "@/lib/ai/guard";
import { z } from "zod";

const BodySchema = z.object({
  sesi_id: z.string().uuid(),
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

  if (sesi.jumlah_putaran < 3) {
    return NextResponse.json(
      { ok: false, pesan: "Minimal 3 putaran sebelum bisa menyelesaikan." },
      { status: 400 }
    );
  }

  // Gabungkan transkrip
  const transkripGabungan = (sesi.putaran as any[])
    .map((p) => p.transkrip)
    .join("\n");

  const ai = await callGemini({
    jenis: "wawancara",
    promptParts: [
      { role: "user", parts: [{ text: PROMPT_WAWANCARA_HASIL }] },
      { role: "user", parts: [{ text: `Transkrip wawancara:\n${transkripGabungan}` }] },
    ],
    responseSchema: {
      type: "object",
      properties: {
        keahlian: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nama_baku: { type: "string", nullable: true },
              nama_diajukan: { type: "string", nullable: true },
              sebutan_pekerja: { type: "string" },
              level: { type: "string", enum: ["pemula", "terampil", "ahli"] },
              kutipan_bukti: { type: "string" },
              keyakinan: { type: "number" },
              pengalaman_tahun: { type: "integer" },
            },
            required: [
              "nama_baku",
              "nama_diajukan",
              "sebutan_pekerja",
              "level",
              "kutipan_bukti",
              "keyakinan",
            ],
          },
        },
        bahasa_terdeteksi: { type: "array", items: { type: "string" } },
        ringkasan: { type: "string" },
      },
      required: ["keahlian"],
    },
    zodSchema: SkemaWawancaraHasil,
    temperature: 0.3,
    userId: userOrResponse.id,
  });

  if (!ai.ok) {
    return NextResponse.json(
      { ok: false, pesan: ai.pesan_pengguna },
      { status: 503 }
    );
  }

  // Jalankan penjaga
  const keahlianBersih = jagaKeahlian(ai.data.keahlian, transkripGabungan);

  // Ambil kartu kerja
  const { data: kartu } = await supabase
    .from("kartu_kerja")
    .select("id")
    .eq("pekerja_id", userOrResponse.id)
    .single();

  if (!kartu) {
    return NextResponse.json(
      { ok: false, pesan: "Kartu kerja tidak ditemukan." },
      { status: 404 }
    );
  }

  // Insert keahlian sementara (status menyusun)
  for (const k of keahlianBersih) {
    await supabase.from("kartu_keahlian").insert({
      kartu_id: kartu.id,
      keahlian_id: null,
      nama_diajukan: k.nama_diajukan ?? k.nama_baku ?? k.sebutan_pekerja,
      sebutan_pekerja: k.sebutan_pekerja,
      level: k.level,
      kutipan_bukti: k.kutipan_bukti,
      keyakinan: k.keyakinan,
      sumber: "ai",
      dikonfirmasi_pekerja: false,
    });
  }

  // Update sesi
  await supabase
    .from("sesi_wawancara")
    .update({
      status: "menyusun",
      hasil_ekstraksi: {
        keahlian: keahlianBersih,
        bahasa_terdeteksi: ai.data.bahasa_terdeteksi,
        ringkasan: ai.data.ringkasan,
      },
      diperbarui_pada: new Date().toISOString(),
    })
    .eq("id", body.sesi_id);

  return NextResponse.json({
    ok: true,
    data: {
      keahlian: keahlianBersih,
      bahasa_terdeteksi: ai.data.bahasa_terdeteksi,
      ringkasan: ai.data.ringkasan,
    },
  });
}
