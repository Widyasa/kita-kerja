import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { normalisasiEmail, POLA_EMAIL } from "@/lib/auth/shared";
import { z } from "zod";

/**
 * BUG-001 — kode OTP dikirim ke email, bukan SMS.
 *
 * Sebelumnya rute ini memanggil signInWithOtp({ phone }) dan, dalam
 * DEMO_MODE, langsung membalas ok tanpa mengirim apa pun — sehingga
 * verifikasi berikutnya menerima kode apa pun dan siapa saja yang tahu
 * nomor HP seseorang bisa masuk ke akunnya. Sekarang kode benar-benar
 * dikirim Supabase lewat email: gratis, tanpa provider SMS.
 */
const BodySchema = z.object({
  email: z.string().regex(POLA_EMAIL),
});

export async function POST(request: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Alamat email belum benar. Contoh: nama@email.com" },
      { status: 400 },
    );
  }

  const email = normalisasiEmail(body.email);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Akun auth dibuat saat verifikasi berhasil; baris `pengguna` menyusul
    // di /api/auth/verify sesuai peran yang dipilih.
    options: { shouldCreateUser: true },
  });

  if (error) {
    const p = error.message.toLowerCase();
    const pesan =
      p.includes("rate") || p.includes("too many")
        ? "Terlalu banyak permintaan kode. Tunggu beberapa menit sebelum mencoba lagi."
        : "Gagal mengirim kode ke email itu. Periksa kembali alamatnya.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
