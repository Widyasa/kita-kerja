export const DEMO_OTP = "123456";

/**
 * BUG-001 — kunci akun dipindah dari nomor HP ke email.
 *
 * OTP SMS sebelumnya berjalan dalam DEMO_MODE yang menerima kode apa pun,
 * sehingga siapa pun yang tahu nomor HP seseorang bisa masuk ke akunnya.
 * Email OTP dipakai karena Supabase mengirimkannya tanpa biaya provider,
 * jadi verifikasi asli bisa aktif tanpa langganan SMS.
 */
export function normalisasiEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Pola email yang cukup ketat untuk dipakai di klien maupun server. */
export const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function emailValid(email: string): boolean {
  return POLA_EMAIL.test(normalisasiEmail(email));
}

export function normalisasiHp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("8")) return `+62${digits}`;
  return `+${digits}`;
}

export function demoEmailForPhone(phone: string): string {
  return `demo-${phone.replace(/\+/g, "")}@kitakerja.test`;
}

export function tujuanPeran(peran: string): string {
  if (peran === "pekerja") return "/worker";
  if (peran === "pemberi_kerja") return "/employer";
  if (peran === "pendamping") return "/companion";
  return "/";
}
