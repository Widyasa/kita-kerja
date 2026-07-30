/**
 * Kuota AI — cek global harian, per-pengguna per jam, dan wawancara.
 */

import { createServiceClient } from "@/lib/supabase/server-client";
import type { JenisAI } from "./gemini-client";

const KUOTA_GLOBAL = parseInt(process.env.KUOTA_HARIAN_GLOBAL ?? "1400", 10);
const KUOTA_AI_PER_JAM = parseInt(process.env.KUOTA_AI_PER_PENGGUNA_JAM ?? "20", 10);
const KUOTA_WAWANCARA_HARI = parseInt(process.env.KUOTA_WAWANCARA_PER_PENGGUNA_HARI ?? "3", 10);

export interface KuotaResult {
  ok: boolean;
  pesan: string;
  tier: "normal" | "hemat" | "manual";
}

/**
 * Cek kuota sebelum panggil AI.
 * Returns: { ok: true, tier } jika lolos; { ok: false, pesan } jika habis.
 */
export async function checkQuota(
  jenis: JenisAI,
  userId?: string
): Promise<KuotaResult> {
  const supabase = await createServiceClient();
  const hariIni = new Date().toISOString().split("T")[0];

  // 1. Global daily
  const { data: kuotaHari } = await supabase
    .from("kuota_harian")
    .select("terpakai")
    .eq("tanggal", hariIni)
    .single();

  const terpakaiGlobal = kuotaHari?.terpakai ?? 0;

  if (terpakaiGlobal > KUOTA_GLOBAL) {
    return {
      ok: false,
      pesan: "Penggunaan AI hari ini sudah penuh. Silakan coba besok atau gunakan jalur manual.",
      tier: "manual",
    };
  }

  const tier: "normal" | "hemat" =
    terpakaiGlobal >= 1200 ? "hemat" : "normal";

  // 2. Per-user per hour (for AI calls except wawancara)
  if (userId && jenis !== "wawancara") {
    const sejamLalu = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("log_ai")
      .select("*", { count: "exact", head: true })
      .eq("pengguna_id", userId)
      .gte("dibuat_pada", sejamLalu);

    if ((count ?? 0) >= KUOTA_AI_PER_JAM) {
      return {
        ok: false,
        pesan: "Kamu sudah menggunakan AI terlalu sering dalam 1 jam terakhir. Istirahat sebentar ya.",
        tier,
      };
    }
  }

  // 3. Wawancara per hari per user
  if (userId && jenis === "wawancara") {
    const { count } = await supabase
      .from("log_ai")
      .select("*", { count: "exact", head: true })
      .eq("pengguna_id", userId)
      .eq("jenis", "wawancara")
      .gte("dibuat_pada", `${hariIni}T00:00:00Z`);

    if ((count ?? 0) >= KUOTA_WAWANCARA_HARI) {
      return {
        ok: false,
        pesan: `Kamu sudah menggunakan wawancara ${KUOTA_WAWANCARA_HARI} kali hari ini. Coba lagi besok ya.`,
        tier,
      };
    }
  }

  // Increment global counter
  await supabase.from("kuota_harian").upsert(
    { tanggal: hariIni, terpakai: terpakaiGlobal + 1 },
    { onConflict: "tanggal" }
  );

  return { ok: true, pesan: "", tier };
}
