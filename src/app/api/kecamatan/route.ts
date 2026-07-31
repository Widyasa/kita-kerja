import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server-client";

export async function GET(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const { searchParams } = new URL(request.url);
  const wilayahId = searchParams.get("wilayah_id");

  const supabase = await createClient();
  let query = supabase.from("kecamatan").select("id, nama, wilayah_id").order("nama");
  if (wilayahId) query = query.eq("wilayah_id", wilayahId);

  const { data } = await query;

  return NextResponse.json({ ok: true, data: { kecamatan: data ?? [] } });
}
