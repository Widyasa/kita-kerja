// Generator ilustrasi moodboard Kita Kerja via Gemini image API (gemini-2.5-flash-image)
// Pakai: node .scratch/gen-image.mjs <nama-file> <aspectRatio> <prompt...>
import { readFileSync, writeFileSync } from "node:fs";

const key = readFileSync(".env.local", "utf8")
  .split("\n")
  .find((l) => l.startsWith("GEMINI_API_KEY="))
  ?.split("=")[1]
  ?.trim();
if (!key) throw new Error("GEMINI_API_KEY tidak ditemukan di .env.local");

const [outFile, aspect, ...promptParts] = process.argv.slice(2);
const prompt = promptParts.join(" ");
if (!outFile || !prompt) throw new Error("pakai: node gen-image.mjs <out> <aspect> <prompt>");

const body = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect || "16:9" } },
};

const model = process.env.KK_IMAGE_MODEL || "gemini-3.1-flash-image";
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
);
const json = await res.json();
if (!res.ok) {
  console.error(JSON.stringify(json).slice(0, 500));
  process.exit(1);
}
const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
if (!part) {
  console.error("Tidak ada inlineData:", JSON.stringify(json).slice(0, 500));
  process.exit(1);
}
writeFileSync(outFile, Buffer.from(part.inlineData.data, "base64"));
console.log(`OK ${outFile} (${part.inlineData.mimeType})`);
