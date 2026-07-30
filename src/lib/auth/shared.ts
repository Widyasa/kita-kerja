export const DEMO_OTP = "123456";

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
