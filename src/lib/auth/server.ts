import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { tujuanPeran } from "@/lib/auth/shared";
import { NextResponse } from "next/server";

/** Halaman tujuan setelah masuk, termasuk pekerja yang belum punya kartu terbit. */
export async function redirectSetelahMasuk(userId: string): Promise<string | null> {
  const service = await createServiceClient();
  const { data: pengguna } = await service
    .from("pengguna")
    .select("peran")
    .eq("id", userId)
    .maybeSingle();

  if (!pengguna) return null;

  let redirect = tujuanPeran(pengguna.peran);
  if (pengguna.peran === "pekerja") {
    const { data: kartu } = await service
      .from("kartu_kerja")
      .select("diterbitkan_pada")
      .eq("pekerja_id", userId)
      .maybeSingle();
    if (!kartu?.diterbitkan_pada) redirect = "/worker/interview";
  }
  return redirect;
}

function pesanGalatMasuk(pesanAsli: string | undefined): string {
  const p = (pesanAsli ?? "").toLowerCase();
  if (p.includes("invalid") && p.includes("credential")) {
    return "Email atau kata sandi salah.";
  }
  if (p.includes("rate") || p.includes("too many")) {
    return "Terlalu banyak percobaan. Tunggu beberapa menit sebelum mencoba lagi.";
  }
  return "Tidak bisa masuk. Periksa kembali email dan kata sandi Anda.";
}

export { pesanGalatMasuk };

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
