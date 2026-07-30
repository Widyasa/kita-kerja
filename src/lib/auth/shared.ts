export const DEMO_OTP = "123456";

export const DEMO_PHONES = [
  "+6281234567890",
  "+6281234567891",
  "+6281234567892",
];

export const DEMO_PHONE_EMAILS: Record<string, string> = {
  "+6281234567890": "warto@kitakerja.test",
  "+6281234567891": "budi@kitakerja.test",
  "+6281234567892": "ani@kitakerja.test",
};

export function isDemoPhone(phone: string): boolean {
  return DEMO_PHONES.includes(phone);
}

export function demoEmailForPhone(phone: string): string | undefined {
  return DEMO_PHONE_EMAILS[phone];
}

export function normalisasiHp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("8")) return `+62${digits}`;
  return `+${digits}`;
}

export function tujuanPeran(peran: string): string {
  if (peran === "pekerja") return "/worker";
  if (peran === "pemberi_kerja") return "/employer";
  if (peran === "pendamping") return "/companion";
  return "/";
}
