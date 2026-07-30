import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { callGemini } from "@/lib/ai/klien-gemini";
import { SkemaWawancaraKeluaran } from "@/lib/ai/skema-keluaran";
import { PROMPT_WAWANCARA_SYSTEM } from "@/lib/ai/prompt-wawancara";

export async function POST() {
  const userOrResponse = await requireRole("pekerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const supabase = await createClient();

  // Cek apakah sudah ada sesi berjalan
  const { data: sesiAktif } = await supabase
    .from("sesi_wawancara")
    .select("id")
    .eq("pekerja_id", userOrResponse.id)
    .eq("status", "berjalan")
    .maybeSingle();

  if (sesiAktif) {
    return NextResponse.json(
      { ok: false, pesan: "Kamu masih punya sesi wawancara yang berjalan." },
      { status: 409 }
    );
  }

  // Buat sesi baru
  const { data: sesi, error } = await supabase
    .from("sesi_wawancara")
    .insert({
      pekerja_id: userOrResponse.id,
      status: "berjalan",
      putaran: [],
      jumlah_putaran: 0,
    })
    .select()
    .single();

  if (error || !sesi) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal memulai sesi wawancara." },
      { status: 500 }
    );
  }

  // Pertanyaan pertama dari AI
  const ai = await callGemini({
    jenis: "wawancara",
    promptParts: [
      { role: "user", parts: [{ text: PROMPT_WAWANCARA_SYSTEM }] },
      { role: "user", parts: [{ text: "Putaran 1. Ini awal wawancara. Tanyakan pertanyaan pembuka yang ramah." }] },
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

  const pertanyaanPertama = ai.ok
    ? ai.data.pertanyaan
    : "Halo! Bisa ceritakan keahlian utama yang kamu punya?";

  return NextResponse.json({
    ok: true,
    data: {
      sesi_id: sesi.id,
      pertanyaan: pertanyaanPertama,
      putaran: 1,
    },
  });
}
