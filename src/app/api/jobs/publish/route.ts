import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { jalankanSaringan } from "@/lib/engine/screening-runner";
import { z } from "zod";

const BodySchema = z.object({
  teks_asli: z.string().min(3).max(5000),
  judul_baku: z.string().trim().min(3).max(200),
  jenis_kerja: z.enum(["harian", "borongan", "paruh_waktu", "menginap"]).nullable(),
  jumlah_pekerja: z.number().int().min(1).max(100),
  upah_ditawarkan: z.number().int().min(0).nullable(),
  satuan_upah: z.enum(["harian", "bulanan", "borongan", "per_jam"]).nullable(),
  lokasi_teks: z.string().max(300).nullable(),
  wilayah_id: z.string().uuid().nullable(),
  mulai: z.string().nullable(),
  syarat_tersirat: z.array(z.string()).max(20).default([]),
  keahlian_ids: z.array(z.string().uuid()).max(10).default([]),
  /** true bila pemberi kerja memilih "Tayangkan dengan penanda" pada keadaan moderasi */
  paksa_tayang: z.boolean().default(false),
});

export async function POST(request: Request) {
  const userOrResponse = await requireRole("pemberi_kerja");
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: lowongan, error } = await supabase
    .from("lowongan")
    .insert({
      pemberi_kerja_id: userOrResponse.id,
      teks_asli: body.teks_asli,
      judul_baku: body.judul_baku,
      jenis_kerja: body.jenis_kerja,
      jumlah_pekerja: body.jumlah_pekerja,
      upah_ditawarkan: body.upah_ditawarkan,
      satuan_upah: body.satuan_upah,
      lokasi_teks: body.lokasi_teks,
      wilayah_id: body.wilayah_id,
      mulai: body.mulai,
      syarat_tersirat: body.syarat_tersirat,
      status: "draf",
    })
    .select("id")
    .single();

  if (error || !lowongan) {
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan lowongan." }, { status: 500 });
  }

  if (body.keahlian_ids.length > 0) {
    await supabase.from("lowongan_keahlian").insert(
      body.keahlian_ids.map((keahlian_id) => ({
        lowongan_id: lowongan.id,
        keahlian_id,
        wajib: true,
      })),
    );
  }

  const saringan = await jalankanSaringan(lowongan.id, body.teks_asli, userOrResponse.id);

  const perluModerasi = saringan.tingkat === "berisiko_tinggi" && saringan.skor_risiko >= 60;
  const status = perluModerasi && !body.paksa_tayang ? "moderasi" : "tayang";

  await supabase.from("lowongan").update({ status }).eq("id", lowongan.id);

  return NextResponse.json({
    ok: true,
    data: { lowongan_id: lowongan.id, status, saringan },
  });
}
