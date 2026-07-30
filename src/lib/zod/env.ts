import { z } from "zod";

export const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1),
  GEMINI_MODEL_LIGHT: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_URL: z.string().url(),
  DEMO_MODE: z.enum(["true", "false"]),
  KUOTA_HARIAN_GLOBAL: z.coerce.number().default(1400),
  KUOTA_WAWANCARA_PER_PENGGUNA_HARI: z.coerce.number().default(3),
  KUOTA_AI_PER_PENGGUNA_JAM: z.coerce.number().default(20),
});
