export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY ?? "",
  model: process.env.GEMINI_MODEL ?? "",
  lightModel: process.env.GEMINI_MODEL_LIGHT ?? "",
} as const;

export function assertGeminiConfig() {
  if (!geminiConfig.apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  if (!geminiConfig.model) {
    throw new Error("Missing GEMINI_MODEL");
  }
}
