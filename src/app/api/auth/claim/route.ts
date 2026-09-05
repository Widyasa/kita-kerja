import { NextResponse } from "next/server";

/**
 * POST /api/auth/claim — deprecated.
 * Alur klaim HP + OTP diganti: pekerja didaftarkan dengan email + kata sandi
 * dan masuk lewat /sign-in.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      pesan:
        "Klaim akun via SMS tidak lagi dipakai. Masuk dengan email dan kata sandi di halaman masuk.",
    },
    { status: 410 },
  );
}
