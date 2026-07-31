import type { LevelKeahlian } from "@/lib/mock";

/**
 * Penyimpanan sisi klien untuk alur Ngobrol Kerja.
 * - Progres sesi wawancara (server-side) disimpan di sessionStorage agar
 *   tahan refresh — sesi_id tetap sama, backend yang menyimpan jawaban asli.
 * - Draf keahlian jalur manual disimpan sampai dikirim ke server.
 */

export const KUNCI_PROGRES_NGOBROL = "kk-ngobrol-progres";
export const KUNCI_KEAHLIAN_MANUAL = "kk-keahlian-manual";

export interface JawabanTersimpan {
  nomor: number;
  transkrip: string;
}

export interface PertanyaanTersimpan {
  nomor: number;
  teks: string;
}

export interface ProgresNgobrol {
  sesiId: string;
  pertanyaan: string;
  putaran: number;
  jawaban: JawabanTersimpan[];
  /** semua pertanyaan yang pernah ditampilkan — dipakai untuk "Ulangi" per nomor */
  riwayatPertanyaan: PertanyaanTersimpan[];
  /** nomor pertanyaan yang sudah pernah diulang (maks 1x per nomor) */
  sudahDiulang: number[];
}

export interface KeahlianManualTersimpan {
  id: string;
  nama: string;
  level: LevelKeahlian;
  cerita: string;
}

export const PILIHAN_LEVEL: LevelKeahlian[] = ["pemula", "terampil", "ahli"];

export const LABEL_LEVEL: Record<LevelKeahlian, string> = {
  pemula: "Pemula",
  terampil: "Terampil",
  ahli: "Ahli",
};
