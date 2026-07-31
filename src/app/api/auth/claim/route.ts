import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiHp, DEMO_OTP } from "@/lib/auth/shared";
import { z } from "zod";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const BodySchema = z.object({
  pengguna_id: z.string().uuid(),
  phone: z.string().min(9),
  code: z.string().length(6),
});

/**
 * POST /api/auth/claim — pekerja yang didaftarkan pendamping (no_hp sintetis
 * "tanpa-hp-<uuid8>") mengambil alih akunnya sendiri dengan nomor HP asli.
 * Sepupu dari /api/auth/verify: OTP-send tetap generik lewat /api/auth/otp,
 * demo-fallback memakai kode yang sama persis (DEMO_OTP), hanya langkah
 * "setelah verifikasi berhasil" yang berbeda — di sini kita TIDAK membuat
 * pengguna baru, kita menempelkan nomor terverifikasi ke `pengguna_id` yang
 * sudah ada supaya seluruh riwayatnya (kartu_kerja, ulasan, dst.) ikut.
 */
export async function POST(request: Request) {
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

  const phone = normalisasiHp(body.phone);
  const service = await createServiceClient();

  // Akun target harus genuinely masih didampingi (belum pernah dapat HP
  // asli) — cegah endpoint ini dipakai untuk membajak akun yang sudah milik
  // orang lain sepenuhnya.
  const { data: target } = await service
    .from("pengguna")
    .select("id, didampingi_oleh")
    .eq("id", body.pengguna_id)
    .maybeSingle();

  if (!target) {
    return NextResponse.json(
      { ok: false, pesan: "Akun tidak ditemukan." },
      { status: 404 }
    );
  }

  if (!target.didampingi_oleh) {
    return NextResponse.json(
      { ok: false, pesan: "Akun ini sudah tidak didampingi — tidak perlu diklaim." },
      { status: 409 }
    );
  }

  // Nomor HP baru tidak boleh sudah dipakai akun lain.
  const { data: bentrok } = await service
    .from("pengguna")
    .select("id")
    .eq("no_hp", phone)
    .neq("id", body.pengguna_id)
    .maybeSingle();

  if (bentrok) {
    return NextResponse.json(
      { ok: false, pesan: "Nomor ini sudah terdaftar di akun lain." },
      { status: 409 }
    );
  }

  // Verifikasi kepemilikan nomor HP baru — demo bypass HANYA jika DEMO_MODE
  // aktif DAN kode cocok persis dengan DEMO_OTP, sama seperti /api/auth/verify.
  if (!(DEMO_MODE && body.code === DEMO_OTP)) {
    // Dipanggil lewat client service-role (bukan client cookie-bound) supaya
    // verifyOtp TIDAK menulis sesi browser untuk identitas yang salah:
    // nomor baru ini belum tentu terkait pengguna_id yang sedang diklaim —
    // kalau belum pernah dipakai, Supabase membuat identitas auth baru untuk
    // nomor itu, bukan mengembalikan pengguna_id yang kita maksud.
    const { data: verifyData, error: verifyErr } = await service.auth.verifyOtp({
      phone,
      token: body.code,
      type: "sms",
    });

    if (verifyErr || !verifyData.user) {
      return NextResponse.json(
        { ok: false, pesan: "Verifikasi OTP gagal." },
        { status: 401 }
      );
    }

    // Identitas yang baru saja diverifikasi BUKAN akun yang kita klaim —
    // pengguna_id tetap identitas yang dipertahankan (riwayat kartu_kerja,
    // ulasan, dst. ikut situ). Hapus identitas auth sementara ini supaya
    // nomornya bebas ditempelkan ke pengguna_id di bawah tanpa bentrok
    // constraint unique.
    if (verifyData.user.id !== body.pengguna_id) {
      await service.auth.admin.deleteUser(verifyData.user.id);
    }
  }

  // Tempelkan nomor terverifikasi + kata sandi sekali-pakai (server-side
  // saja, tidak pernah dikirim ke klien) ke akun yang diklaim, lalu masuk
  // sebagai akun itu lewat kata sandi tsb — pola yang sama dengan fallback
  // demo di /api/auth/verify, dipakai di sini untuk KEDUA jalur (demo maupun
  // OTP asli). Sign-in pakai EMAIL, bukan phone: proyek ini menonaktifkan
  // login phone+password ("Phone logins are disabled" dari GoTrue) — hanya
  // OTP phone dan email+password yang aktif. Setiap akun yang lolos gerbang
  // didampingi_oleh di atas SELALU punya email (companion/register selalu
  // membuatnya), jadi ini aman dipakai di sini.
  const sandiSekaliPakai = crypto.randomUUID();
  const { data: authUser, error: updateAuthErr } = await service.auth.admin.updateUserById(
    body.pengguna_id,
    { phone, phone_confirm: true, password: sandiSekaliPakai }
  );

  if (updateAuthErr || !authUser.user?.email) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal memverifikasi nomor." },
      { status: 500 }
    );
  }

  const { error: updateErr } = await service
    .from("pengguna")
    .update({ no_hp: phone, didampingi_oleh: null, status_verifikasi: "hp_terverifikasi" })
    .eq("id", body.pengguna_id);

  if (updateErr) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyelesaikan klaim akun." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: authUser.user.email,
    password: sandiSekaliPakai,
  });

  if (signInErr || !signInData.user) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal masuk setelah klaim." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, redirect: "/worker" });
}
