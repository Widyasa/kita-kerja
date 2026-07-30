import type { LevelKeahlian } from "@/lib/mock";

/**
 * Penyimpanan sisi klien untuk alur Ngobrol Kerja (fase 2, tanpa backend).
 * - Progres putaran disimpan di sessionStorage agar tahan refresh.
 * - Keahlian jalur manual disimpan agar halaman hasil bisa menampilkannya.
 */

export const KUNCI_PROGRES_NGOBROL = "kk-ngobrol-progres";
export const KUNCI_KEAHLIAN_MANUAL = "kk-keahlian-manual";

export interface JawabanTersimpan {
  nomor: number;
  transkrip: string;
}

export interface ProgresNgobrol {
  jawaban: JawabanTersimpan[];
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
