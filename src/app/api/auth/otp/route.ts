import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { z } from "zod";

const BodySchema = z
  .object({
    email: z.string().email(),
    intent: z.enum(["signin", "register"]),
    peran: z.enum(["pekerja", "pemberi_kerja", "pendamping"]).optional(),
    nama: z.string().trim().min(3).max(100).optional(),
  })
  .refine((b) => b.intent !== "register" || (b.peran && b.nama), {
    message: "Peran dan nama wajib diisi untuk pendaftaran.",
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

  const email = body.email;
  const supabase = await createClient();

  // Peran & nama dibawa lewat query link konfirmasi, karena browser yang
  // membuka link itu belum tentu tab yang sama dengan yang mengisi form —
  // localStorage tidak bisa diandalkan lintas perangkat/klien email.
  // NEXT_PUBLIC_APP_URL dipakai kalau diset (perlu di production, karena
  // origin request bisa jadi proxy/internal); di dev/preview yang belum
  // mengesetnya, jatuh ke origin request itu sendiri.
  const basisUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirect = new URL("/auth/confirm", basisUrl);
  if (body.intent === "register" && body.peran && body.nama) {
    redirect.searchParams.set("peran", body.peran);
    redirect.searchParams.set("nama", body.nama);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirect.toString(),
      shouldCreateUser: body.intent === "register",
    },
  });

  if (error) {
    const p = error.message.toLowerCase();
    const pesan =
      p.includes("rate") || p.includes("too many")
        ? "Terlalu banyak permintaan kode. Tunggu beberapa menit sebelum mencoba lagi."
        : "Gagal mengirim kode ke email itu. Periksa kembali alamatnya.";
    return NextResponse.json({ ok: false, pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, pesan: "Cek email Anda untuk link konfirmasi." });
}
