import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";
import { resolveKeahlianIds } from "@/lib/engine/keahlian-resolver";
import { z } from "zod";

const BodySchema = z.object({
  nama: z.array(z.string()).max(20),
});

export async function POST(request: Request) {
  const userOrResponse = await requireSession();
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
  const ids = await resolveKeahlianIds(supabase, body.nama);

  return NextResponse.json({ ok: true, data: { keahlian_ids: ids } });
}
