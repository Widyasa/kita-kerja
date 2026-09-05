import { redirect } from "next/navigation";

/**
 * /claim/[id] — deprecated.
 * Setelah pekerja didaftarkan dengan email + kata sandi, klaim via SMS OTP
 * tidak lagi dipakai. Arahkan ke halaman masuk.
 */
export default async function HalamanKlaimAkun({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/sign-in");
}
