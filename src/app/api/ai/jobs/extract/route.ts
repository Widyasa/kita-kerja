import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { callGemini, demoSimulasiAktif } from "@/lib/ai/gemini-client";
import { SkemaEkstrakLowongan } from "@/lib/ai/output-schemas";
import { PROMPT_EKSTRAK_LOWONGAN } from "@/lib/ai/prompt-job-extract";
import { jagaEkstrakLowongan } from "@/lib/ai/guard";
import { z } from "zod";

const BodySchema = z.object({
  teks: z.string().min(3).max(5000),
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
      { ok: false, pesan: "Format tidak valid. Kirim { teks: string }." },
      { status: 400 }
    );
  }

  const { kuotaHabis, aiGagal } = await demoSimulasiAktif();
  const hasil = await callGemini({
    jenis: "baca_lowongan",
    promptParts: [
      { role: "user", parts: [{ text: PROMPT_EKSTRAK_LOWONGAN }] },
      { role: "user", parts: [{ text: `Teks lowongan:\n${body.teks}` }] },
    ],
    responseSchema: {
      type: "object",
      properties: {
        judul_baku: { type: "string", nullable: true },
        jenis_kerja: { type: "string", enum: ["harian", "borongan", "paruh_waktu", "menginap"], nullable: true },
        jumlah_pekerja: { type: "integer", nullable: true },
        upah_ditawarkan: { type: "integer", nullable: true },
        satuan_upah: { type: "string", enum: ["harian", "bulanan", "borongan", "per_jam"], nullable: true },
        lokasi_teks: { type: "string", nullable: true },
        mulai: { type: "string", nullable: true },
        syarat_tersirat: { type: "array", items: { type: "string" } },
        keahlian_dibutuhkan: { type: "array", items: { type: "string" } },
        yang_belum_jelas: { type: "array", items: { type: "string" } },
        kelengkapan: { type: "number" },
      },
    },
    zodSchema: SkemaEkstrakLowongan,
    temperature: 0.3,
    userId: userOrResponse.id,
    demoPaksaKuotaHabis: kuotaHabis,
    demoPaksaAiGagal: aiGagal,
  });

  if (!hasil.ok) {
    const status =
      hasil.kode === "kuota" ? 429 : hasil.kode === "validasi" ? 422 : 503;
    return NextResponse.json(
      { ok: false, pesan: hasil.pesan_pengguna, kode: hasil.kode },
      { status },
    );
  }

  const bersih = jagaEkstrakLowongan(hasil.data);

  return NextResponse.json({ ok: true, data: bersih });
}
