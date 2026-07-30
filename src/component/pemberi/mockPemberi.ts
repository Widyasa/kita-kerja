/**
 * Data turunan khusus sisi pemberi kerja (Mbak Dhika) — fase 2 frontend statis.
 *
 * Semuanya MENURUN dari mock sentral (@/lib/mock) tanpa mengubahnya:
 * - lowonganDhika    : lowongan milik u-dhika (lw-08, lw-11)
 * - calonUntuk()     : calon per lowongan + kartu + rekam jejak faktual
 * - kesepakatanDhika : kesepakatan milik Dhika (mock lokal — mock sentral
 *                      belum punya kesepakatan untuk u-dhika)
 *
 * Angka rekam jejak calon non-Warto memang mock (fase 2), tetapi disajikan
 * sebagai kalimat faktual, bukan skor.
 */

import {
  kartuKerja,
  keahlianAminah,
  lamaran,
  lowongan,
  pengguna,
  type KartuKeahlian,
  type KartuKerja,
  type KesepakatanKerja,
  type Lamaran,
  type Lowongan,
  type Pengguna,
} from "@/lib/mock";

/** Lowongan milik Mbak Dhika */
export const lowonganDhika: Lowongan[] = lowongan.filter(
  (l) => l.pemberi_kerja_id === "u-dhika",
);

/** Lamaran yang masuk ke lowongan Dhika */
export const lamaranDhika: Lamaran[] = lamaran.filter((lm) =>
  lowonganDhika.some((l) => l.id === lm.lowongan_id),
);

// ============ CALON ============

export interface CalonPemberi {
  lamaran: Lamaran;
  pekerja: Pengguna;
  kartu: KartuKerja | null;
  keahlian: KartuKeahlian[];
  /** kalimat faktual — TIDAK ADA skor angka */
  rekamJejak: string[];
}

/** Keahlian klaim untuk calon yang belum punya kartu di mock sentral */
const keahlianYanti: KartuKeahlian[] = [
  {
    id: "kkh-yanti-angkut",
    kartu_id: "",
    keahlian_id: "kb-buruh-angkut",
    nama_diajukan: null,
    sebutan_pekerja: "angkut barang",
    level: "pemula",
    kutipan_bukti: "Biasa bantu bongkar muat di pasar.",
    keyakinan: 0.8,
    sumber: "manual",
    dikonfirmasi_pekerja: true,
    lapis: "diklaim",
  },
];

const keahlianRudi: KartuKeahlian[] = [
  {
    id: "kkh-rudi-angkut",
    kartu_id: "",
    keahlian_id: "kb-buruh-angkut",
    nama_diajukan: null,
    sebutan_pekerja: "kuli angkut",
    level: "pemula",
    kutipan_bukti: "Sanggup angkut karung dan kardus, badan kuat.",
    keyakinan: 0.78,
    sumber: "manual",
    dikonfirmasi_pekerja: true,
    lapis: "diklaim",
  },
];

const REKAM_JEJAK: Record<string, string[]> = {
  "u-yanti": [
    "2 pekerjaan selesai dikonfirmasi dua pihak di Kita Kerja.",
    "Nomor HP belum diverifikasi — minta pekerja memverifikasi sebelum mulai.",
  ],
  "u-rudi": [
    "Belum ada pekerjaan selesai di Kita Kerja — calon baru.",
    "Akun didampingi oleh Slamet W., pendamping terverifikasi.",
  ],
  "u-aminah": [
    "Kartu Kerja baru diterbitkan 18 Juli 2026.",
    "Pengalaman 6 tahun dari cerita pekerja — belum ada pekerjaan yang membuktikan.",
  ],
};

const KEAHLIAN_CALON: Record<string, KartuKeahlian[]> = {
  "u-yanti": keahlianYanti,
  "u-rudi": keahlianRudi,
  "u-aminah": keahlianAminah,
};

/** Calon untuk satu lowongan, lengkap dengan kartu dan rekam jejak */
export function calonUntuk(lowonganId: string): CalonPemberi[] {
  return lamaran
    .filter((lm) => lm.lowongan_id === lowonganId)
    .map((lm) => {
      const pekerja = pengguna.find((p) => p.id === lm.pekerja_id)!;
      return {
        lamaran: lm,
        pekerja,
        kartu: kartuKerja.find((k) => k.pekerja_id === pekerja.id) ?? null,
        keahlian: KEAHLIAN_CALON[pekerja.id] ?? [],
        rekamJejak: REKAM_JEJAK[pekerja.id] ?? ["Belum ada riwayat di Kita Kerja."],
      };
    });
}

// ============ KESEPAKATAN MILIK DHIKA (mock lokal) ============

export const kesepakatanDhika: KesepakatanKerja[] = [
  {
    id: "ks-dhika-01",
    lowongan_id: "lw-08",
    pekerja_id: "u-yanti",
    pemberi_kerja_id: "u-dhika",
    lingkup:
      "Bongkar muat karung sembako dan kardus di gudang Margorejo. Jam kerja 07.00–15.00, makan siang disediakan.",
    upah_disepakati: 150000,
    satuan: "harian",
    mulai: "2026-08-05",
    selesai: null,
    tanggal_bayar_dijanjikan: "2026-08-12",
    status: "berjalan",
  },
  {
    id: "ks-dhika-02",
    lowongan_id: "lw-11",
    pekerja_id: "u-aminah",
    pemberi_kerja_id: "u-dhika",
    lingkup:
      "Membantu rumah tangga menginap di Gamping: beres-beres, masak, dan menemani nenek. Pulang sebulan sekali.",
    upah_disepakati: 2800000,
    satuan: "bulanan",
    mulai: "2026-08-15",
    selesai: null,
    tanggal_bayar_dijanjikan: "2026-09-15",
    status: "menunggu",
  },
];

export function cariKesepakatanDhika(id: string): KesepakatanKerja | undefined {
  return kesepakatanDhika.find((k) => k.id === id);
}

// ============ LABEL STATUS ============

export const LABEL_STATUS_LAMARAN: Record<Lamaran["status"], string> = {
  dilamar: "Melamar",
  diundang: "Diundang",
  ditolak: "Tidak diteruskan",
  disepakati: "Disepakati",
};
