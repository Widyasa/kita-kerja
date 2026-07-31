import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server-client";
import { normalisasiEmail, tujuanPeran, POLA_EMAIL } from "@/lib/auth/shared";
import { z } from "zod";

const BodySchema = z.object({
  email: z.string().regex(POLA_EMAIL),
  code: z.string().length(6),
  intent: z.enum(["signin", "register"]),
  role: z.enum(["pekerja", "pemberi_kerja", "pendamping"]).optional(),
  nama: z.string().trim().min(3).max(100).optional(),
});

/**
 * BUG-008 — pesan galat Supabase sebelumnya diteruskan apa adanya ke
 * pengguna, sehingga muncul teks Inggris mentah seperti
 * "Token has expired or is invalid" di aplikasi yang seluruhnya berbahasa
 * Indonesia, tanpa menyebut sebab sebenarnya.
 */
function pesanRamah(pesanAsli: string | undefined, intent: "signin" | "register"): string {
  const p = (pesanAsli ?? "").toLowerCase();

  if (p.includes("expired") || p.includes("invalid")) {
    return "Kode salah atau sudah kedaluwarsa. Minta kode baru, lalu masukkan enam angka terakhir yang dikirim ke email Anda.";
  }
  if (p.includes("rate") || p.includes("too many")) {
    return "Terlalu banyak percobaan. Tunggu beberapa menit sebelum mencoba lagi.";
  }
  return intent === "signin"
    ? "Tidak bisa masuk. Periksa kembali email dan kode Anda."
    : "Pendaftaran gagal. Coba minta kode baru.";
}

export async function POST(request: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format tidak valid." }, { status: 400 });
  }

  const email = normalisasiEmail(body.email);
  const supabase = await createClient();

  /**
   * BUG-001 — verifikasi OTP yang sebenarnya.
   *
   * Versi lama punya cabang DEMO_MODE: bila kode sama dengan DEMO_OTP,
   * server mencari pengguna berdasarkan nomor HP lalu memaksa
   * signInWithPassword memakai DEMO_FALLBACK_PASSWORD — tanpa pernah
   * memeriksa apakah pemohon benar-benar memegang nomor itu. Itulah
   * lubang yang membuat siapa pun bisa masuk ke akun orang lain.
   * Cabang tersebut dihapus; satu-satunya jalan masuk kini adalah kode
   * yang dikirim Supabase ke alamat email pemohon.
   */
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: body.code,
    type: "email",
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, pesan: pesanRamah(error?.message, body.intent) },
      { status: 401 },
    );
  }

  const userId = data.user.id;
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

  // Email terverifikasi tapi belum punya baris `pengguna`. Untuk alur masuk
  // ini berarti akunnya memang belum pernah didaftarkan.
  if (body.intent !== "register" || !body.role) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { ok: false, pesan: "Akun belum terdaftar. Silakan daftar terlebih dahulu." },
      { status: 403 },
    );
  }

  const { error: insertError } = await service.from("pengguna").insert({
    id: userId,
    nama: body.nama?.trim() || email.split("@")[0],
    email,
    peran: body.role,
    status_verifikasi: "email_terverifikasi",
  });

  if (insertError) {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menyimpan data pengguna." },
      { status: 500 },
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
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    redirect: body.role === "pekerja" ? "/worker/interview" : tujuanPeran(body.role),
  });
}
