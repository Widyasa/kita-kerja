/**
 * Saringan Aman: aturan deterministik + AI, disimpan lewat service role.
 * Dipakai oleh /api/ai/jobs/screen dan /api/jobs/publish supaya satu implementasi.
 */

import { callGemini } from "@/lib/ai/gemini-client";
import { SkemaSaringan } from "@/lib/ai/output-schemas";
import { PROMPT_SARINGAN } from "@/lib/ai/prompt-screening";
import { analisisRisikoAturan, tingkatRisiko } from "@/lib/engine/risk";
import { createServiceClient } from "@/lib/supabase/server-client";
import type { TemuanSaringan, TingkatRisiko } from "@/lib/mock/types";

export interface HasilSaringan {
  skor_risiko: number;
  tingkat: TingkatRisiko;
  temuan: TemuanSaringan[];
  pertanyaan_disarankan: string[];
  skor_ai: number;
  skor_aturan: number;
}

export async function jalankanSaringan(
  lowonganId: string,
  teksAsli: string,
  userId: string,
  demoOpsi?: { demoPaksaKuotaHabis?: boolean; demoPaksaAiGagal?: boolean },
): Promise<HasilSaringan> {
  const aturan = analisisRisikoAturan(teksAsli);

  const ai = await callGemini({
    jenis: "saringan",
    promptParts: [
      { role: "user", parts: [{ text: PROMPT_SARINGAN }] },
      { role: "user", parts: [{ text: `Teks lowongan:\n${teksAsli}` }] },
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
            required: ["jenis", "kutipan", "penjelasan"],
          },
        },
        pertanyaan_disarankan: { type: "array", items: { type: "string" } },
        skor_ai: { type: "integer" },
      },
      required: ["temuan", "pertanyaan_disarankan", "skor_ai"],
    },
    zodSchema: SkemaSaringan,
    temperature: 0.1,
    userId,
    demoPaksaKuotaHabis: demoOpsi?.demoPaksaKuotaHabis,
    demoPaksaAiGagal: demoOpsi?.demoPaksaAiGagal,
  });

  const skorAi = ai.ok ? ai.data.skor_ai : 0;
  const skorTotal = Math.min(aturan.skor_aturan + skorAi, 100);
  const tingkat = tingkatRisiko(skorTotal);
  const temuan = [...aturan.temuan, ...(ai.ok ? ai.data.temuan : [])];
  const pertanyaan = ai.ok ? ai.data.pertanyaan_disarankan : [];

  const service = await createServiceClient();
  await service.from("saringan_aman").upsert(
    {
      lowongan_id: lowonganId,
      skor_risiko: skorTotal,
      tingkat,
      temuan,
      pertanyaan_disarankan: pertanyaan,
      skor_ai: skorAi,
      skor_aturan: aturan.skor_aturan,
    },
    { onConflict: "lowongan_id" },
  );

  return {
    skor_risiko: skorTotal,
    tingkat,
    temuan,
    pertanyaan_disarankan: pertanyaan,
    skor_ai: skorAi,
    skor_aturan: aturan.skor_aturan,
  };
}
