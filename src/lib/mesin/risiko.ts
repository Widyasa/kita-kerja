/**
 * Mesin risiko — aturan deterministik + AI untuk Saringan Aman.
 */

interface AturanRisiko {
  pola: RegExp;
  jenis: string;
  penjelasan: string;
  skor: number; // 0-40
}

const ATURAN: AturanRisiko[] = [
  {
    pola: /bayar\s+(?:dp|uang\s+muka|pendaftaran|biaya\s+admin)/i,
    jenis: "diminta_uang",
    penjelasan: "Lowongan meminta pembayaran di muka",
    skor: 25,
  },
  {
    pola: /\b(?:pinjam|jual|beli)\b.*\b(?:ktp|sim|kk|ijazah)\b/i,
    jenis: "jaminan_pribadi",
    penjelasan: "Diminta menyerahkan dokumen pribadi sebagai jaminan",
    skor: 20,
  },
  {
    pola: /(?:upah|gaji)\s*(?:belum\s+di(?:tentuka|tetapka)n|nanti|rahasia|negosiasi)/i,
    jenis: "upah_tidak_jelas",
    penjelasan: "Upah belum jelas atau tidak disebutkan",
    skor: 10,
  },
  {
    pola: /(?:wa|whatsapp|chat)\s*(?:saja|only|aja).*\b(?:081|082|085|087|088)\d{8,}\b/i,
    jenis: "kontak_terbatas",
    penjelasan: "Hanya kontak WhatsApp tanpa detail perusahaan/lokasi",
    skor: 8,
  },
  {
    pola: /(?:jam\s+kerja|kerja)\s*(?:24\s*jam|non\s*stop|tanpa\s*istirahat)/i,
    jenis: "jam_kerja_ekstrem",
    penjelasan: "Jam kerja tidak wajar",
    skor: 12,
  },
  {
    pola: /(?:lokasi|rumah|alamat)\s*(?:rahasia|nanti|ditunjukkan|diinfokan)/i,
    jenis: "lokasi_tidak_jelas",
    penjelasan: "Lokasi kerja tidak jelas",
    skor: 8,
  },
];

export interface HasilRisikoAturan {
  skor_aturan: number;
  temuan: Array<{ jenis: string; kutipan: string; penjelasan: string }>;
}

/**
 * Jalankan aturan deterministik pada teks lowongan.
 */
export function analisisRisikoAturan(teks: string): HasilRisikoAturan {
  let skor = 0;
  const temuan: Array<{ jenis: string; kutipan: string; penjelasan: string }> = [];

  for (const aturan of ATURAN) {
    const match = teks.match(aturan.pola);
    if (match) {
      skor += aturan.skor;
      temuan.push({
        jenis: aturan.jenis,
        kutipan: match[0],
        penjelasan: aturan.penjelasan,
      });
    }
  }

  return {
    skor_aturan: Math.min(skor, 40),
    temuan,
  };
}

/** Hitung tingkat risiko total. */
export function tingkatRisiko(skorTotal: number): "aman" | "hati_hati" | "berisiko_tinggi" {
  if (skorTotal < 30) return "aman";
  if (skorTotal < 60) return "hati_hati";
  return "berisiko_tinggi";
}
