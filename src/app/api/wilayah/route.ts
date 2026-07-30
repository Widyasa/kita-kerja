import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";

export async function GET() {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const supabase = await createClient();
  const { data } = await supabase.from("wilayah").select("id, nama, provinsi").order("nama");
  return NextResponse.json({ ok: true, data: { wilayah: data ?? [] } });
}
