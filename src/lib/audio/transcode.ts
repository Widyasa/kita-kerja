/**
 * Transcode audio rekaman browser (webm/opus — satu-satunya format yang
 * bisa dihasilkan MediaRecorder secara konsisten lintas browser) ke WAV,
 * satu-satunya format yang PASTI didukung Gemini audio understanding.
 * Tanpa ini, Gemini menerima request tanpa error tapi mengembalikan
 * transkrip kosong karena tidak bisa mendekode kontainer WebM.
 */

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

function ekstensiDariMime(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("wav")) return "wav";
  return "bin";
}

export async function transcodeKeWav(audioBase64: string, mimeType: string): Promise<string> {
  if (!ffmpegPath) {
    throw new Error("Binary ffmpeg tidak ditemukan (ffmpeg-static).");
  }

  const dir = await mkdtemp(join(tmpdir(), "kk-audio-"));
  const inputPath = join(dir, `input.${ekstensiDariMime(mimeType)}`);
  const outputPath = join(dir, "output.wav");

  try {
    await writeFile(inputPath, Buffer.from(audioBase64, "base64"));

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath as string, [
        "-y",
        "-i",
        inputPath,
        "-ar",
        "16000",
        "-ac",
        "1",
        outputPath,
      ]);

      let stderr = "";
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg keluar dengan kode ${code}: ${stderr.slice(-500)}`));
      });
    });

    const wav = await readFile(outputPath);
    return wav.toString("base64");
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
