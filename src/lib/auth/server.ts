import { createClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { ok: false, pesan: "Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  return user;
}

export async function requireRole(role: "pekerja" | "pemberi_kerja" | "pendamping") {
  const userOrResponse = await requireSession();

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pengguna")
    .select("peran")
    .eq("id", userOrResponse.id)
    .single();

  if (error || !data || data.peran !== role) {
    return NextResponse.json(
      { ok: false, pesan: "Akses ditolak." },
      { status: 403 }
    );
  }

  return userOrResponse;
}
