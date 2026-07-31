/**
 * Cocokkan nama keahlian bebas (dari ekstraksi AI) ke keahlian_baku.id —
 * pencocokan nama, BUKAN AI: deterministik, tidak pernah mengarang upah/id.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

function normalisasi(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function resolveKeahlianIds(
  supabase: SupabaseClient,
  namaNama: string[]
): Promise<string[]> {
  if (namaNama.length === 0) return [];

  const { data: semua } = await supabase
    .from("keahlian_baku")
    .select("id, nama_baku, alias");

  if (!semua) return [];

  const hasil = new Set<string>();

  for (const nama of namaNama) {
    const target = normalisasi(nama);
    if (!target) continue;

    // 1. cocok persis (nama_baku atau salah satu alias)
    let cocok = semua.find(
      (k) =>
        normalisasi(k.nama_baku) === target ||
        (k.alias ?? []).some((a: string) => normalisasi(a) === target)
    );

    // 2. cocok sebagian (target mengandung nama_baku, atau sebaliknya)
    if (!cocok) {
      cocok = semua.find((k) => {
        const baku = normalisasi(k.nama_baku);
        if (target.includes(baku) || baku.includes(target)) return true;
        return (k.alias ?? []).some((a: string) => {
          const al = normalisasi(a);
          return target.includes(al) || al.includes(target);
        });
      });
    }

    if (cocok) hasil.add(cocok.id);
  }

  return [...hasil];
}
