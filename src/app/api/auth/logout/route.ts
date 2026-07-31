import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { ok: false, pesan: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
