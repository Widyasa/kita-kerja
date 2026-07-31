import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiHp, tujuanPeran, DEMO_OTP, demoEmailForPhone } from "@/lib/auth/shared";
import { z } from "zod";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const BodySchema = z.object({
  phone: z.string().min(9),
  code: z.string().length(6),
  intent: z.enum(["signin", "register"]),
  role: z.enum(["pekerja", "pemberi_kerja", "pendamping"]).optional(),
  nama: z.string().trim().min(3).max(100).optional(),
});

/**
 * BUG-008 — pesan galat Supabase sebelumnya diteruskan apa adanya ke
 * pengguna, sehingga muncul teks Inggris mentah seperti
 * "Token has expired or is invalid" di aplikasi yang seluruhnya berbahasa
 * Indonesia. Pesannya juga tidak menyebut sebab sebenarnya: pada alur masuk,
 * penyebab paling umum adalah nomornya memang belum terdaftar.
 */
function pesanRamah(pesanAsli: string | undefined, intent: "signin" | "register"): string {
  const p = (pesanAsli ?? "").toLowerCase();

  if (p.includes("expired") || p.includes("invalid")) {
    return intent === "signin"
      ? "Kode salah atau sudah kedaluwarsa. Bila nomor Anda belum pernah didaftarkan, daftar dulu lewat halaman Daftar."
      : "Kode salah atau sudah kedaluwarsa. Minta kode baru, lalu masukkan enam angka terakhir yang Anda terima.";
  }
  if (p.includes("rate") || p.includes("too many")) {
    return "Terlalu banyak percobaan. Tunggu beberapa menit sebelum mencoba lagi.";
  }
  if (p.includes("not found") || p.includes("no user")) {
    return "Nomor ini belum terdaftar. Silakan daftar dulu lewat halaman Daftar.";
  }
  return intent === "signin"
    ? "Tidak bisa masuk. Periksa kembali nomor dan kode Anda."
    : "Pendaftaran gagal. Coba minta kode baru.";
}

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

  const supabase = await createClient();
  let userId: string;

  // Demo fallback: bypass SMS provider by signing in through email/password.
  // Any phone works in DEMO_MODE as long as the demo code is used.
  if (DEMO_MODE && body.code === DEMO_OTP) {
    const fallbackPassword = process.env.DEMO_FALLBACK_PASSWORD;
    if (!fallbackPassword) {
      return NextResponse.json(
        { ok: false, pesan: "Demo fallback belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const service = await createServiceClient();
    const generatedEmail = demoEmailForPhone(phone);

    // Cari pengguna yang sudah ada berdasarkan nomor HP (cover user hasil seed).
    const { data: existingPengguna } = await service
      .from("pengguna")
      .select("id")
      .eq("no_hp", phone)
      .single();

    let authEmail = generatedEmail;
    let targetUserId: string | null = existingPengguna?.id ?? null;

    if (targetUserId) {
      const { data: authUser, error: getErr } = await service.auth.admin.getUserById(targetUserId);
      if (getErr || !authUser.user) {
        return NextResponse.json(
          { ok: false, pesan: "Gagal menemukan akun demo." },
          { status: 500 }
        );
      }
      authEmail = authUser.user.email ?? generatedEmail;
      await service.auth.admin.updateUserById(targetUserId, { password: fallbackPassword });
    } else {
      const { data: newUser, error: createErr } = await service.auth.admin.createUser({
        email: generatedEmail,
        phone,
        password: fallbackPassword,
        email_confirm: true,
        phone_confirm: true,
      });
      if (createErr || !newUser.user) {
        return NextResponse.json(
          { ok: false, pesan: "Gagal membuat akun. Coba lagi sebentar lagi." },
          { status: 500 }
        );
      }
      targetUserId = newUser.user.id;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: fallbackPassword,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, pesan: pesanRamah(error?.message, body.intent) },
        { status: 401 }
      );
    }
    userId = data.user.id;
  } else {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: body.code,
      type: "sms",
    });

    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, pesan: pesanRamah(error?.message, body.intent) },
        { status: 401 }
      );
    }
    userId = data.user.id;
  }

  const service = await createServiceClient();

  const { data: existing } = await service
    .from("pengguna")
    .select("peran")
    .eq("id", userId)
    .single();

  if (existing) {
    let redirect = tujuanPeran(existing.peran);
    if (existing.peran === "pekerja") {
      const { data: kartu } = await service
        .from("kartu_kerja")
        .select("diterbitkan_pada")
        .eq("pekerja_id", userId)
        .maybeSingle();
      if (!kartu?.diterbitkan_pada) redirect = "/worker/interview";
    }
    return NextResponse.json({ ok: true, redirect });
  }

  if (body.intent !== "register" || !body.role) {
    return NextResponse.json(
      { ok: false, pesan: "Akun belum terdaftar. Silakan daftar terlebih dahulu." },
      { status: 403 }
    );
  }

  const { error: insertError } = await service.from("pengguna").insert({
    id: userId,
    nama: body.nama?.trim() || phone,
    no_hp: phone,
    peran: body.role,
    status_verifikasi: "hp_terverifikasi",
  });

  if (insertError) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyimpan data pengguna." },
      { status: 500 }
    );
  }

  // Setiap pekerja butuh tepat satu baris kartu_kerja (kolom lain pakai
  // default DB — kosong sampai Ngobrol Kerja/isi manual menerbitkannya).
  if (body.role === "pekerja") {
    const { error: kartuError } = await service.from("kartu_kerja").insert({
      pekerja_id: userId,
    });

    if (kartuError) {
      return NextResponse.json(
        { ok: false, pesan: "Gagal menyiapkan kartu kerja." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    redirect: body.role === "pekerja" ? "/worker/interview" : tujuanPeran(body.role),
  });
}
