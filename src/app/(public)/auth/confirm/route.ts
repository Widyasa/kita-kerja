import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { tujuanPeran } from "@/lib/auth/shared";

/**
 * Confirmation handler: magic link redirect from email.
 * Supabase redirects here with token in URL, exchange for session.
 */
const PERAN_VALID = ["pekerja", "pemberi_kerja", "pendamping"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const peran = searchParams.get("peran");
  const nama = searchParams.get("nama");

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=no_code", request.url));
  }

  const supabase = await createClient();

  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  if (!data.user) {
    return NextResponse.redirect(new URL("/sign-in?error=no_user", request.url));
  }

  const userId = data.user.id;
  const email = data.user.email ?? "";
  const service = await createServiceClient();

  const { data: existing } = await service
    .from("pengguna")
    .select("peran")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.redirect(new URL(tujuanPeran(existing.peran), request.url));
  }

  // Belum punya baris `pengguna`. Link ini datang dari alur daftar, jadi
  // peran & nama sudah ikut lewat query — buat baris pengguna sekarang,
  // di sini, satu-satunya tempat yang punya sesi pengguna baru sekaligus
  // datanya. Menunda ini ke langkah lain (mis. balik ke /register) berarti
  // baris `pengguna` tidak pernah terbuat kalau pengguna tidak mengulang
  // form — itulah sebabnya tabel pengguna & auth.users bisa tidak sinkron.
  if (!peran || !PERAN_VALID.includes(peran) || !nama) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/register?error=data_pendaftaran_hilang", request.url),
    );
  }

  const { error: insertError } = await service.from("pengguna").insert({
    id: userId,
    nama: nama.trim() || email.split("@")[0],
    email,
    peran,
    status_verifikasi: "email_terverifikasi",
  });

  if (insertError) {
    return NextResponse.redirect(
      new URL("/sign-in?error=gagal_menyimpan_pengguna", request.url),
    );
  }

  if (peran === "pekerja") {
    const { error: kartuError } = await service.from("kartu_kerja").insert({
      pekerja_id: userId,
    });
    if (kartuError) {
      return NextResponse.redirect(
        new URL("/sign-in?error=gagal_menyiapkan_kartu", request.url),
      );
    }
    return NextResponse.redirect(new URL("/worker/interview", request.url));
  }

  return NextResponse.redirect(new URL(tujuanPeran(peran), request.url));
}
