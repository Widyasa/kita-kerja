import type { JenisKerja, SatuanUpah } from "@/lib/mock/types";

export const KUNCI_TEKS_LOWONGAN = "kita-kerja:teks-lowongan";

export interface BidangLowongan {
  judul: string;
  jenisKerja: JenisKerja | "";
  jumlahPekerja: string;
  lokasi: string;
  wilayahId: string;
  kecamatanId: string;
  keahlianIds: string[];
  upah: string;
  satuanUpah: SatuanUpah;
  mulai: string;
  syaratTersirat: string[];
  yangBelumJelas: string[];
  kelengkapan: number;
  teksAsli: string;
}

export const LABEL_JENIS_KERJA: Record<JenisKerja, string> = {
  harian: "Harian",
  borongan: "Borongan",
  paruh_waktu: "Paruh waktu",
  menginap: "Menginap",
};

export const LABEL_SATUAN_UPAH: Record<SatuanUpah, string> = {
  harian: "per hari",
  bulanan: "per bulan",
  borongan: "borongan",
  per_jam: "per jam",
};
