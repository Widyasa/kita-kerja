/**
 * Ekstraksi lowongan teks bebas — Bagian 14 (versi mock deterministik).
 *
 * Fase 2 tidak memanggil AI: teks bebas diparsing dengan aturan sederhana
 * (kata kunci alias keahlian, nama kecamatan, pola upah, hari). Aturannya
 * DETERMINISTIK — sama seperti skor kelengkapan yang dihitung dari jumlah
 * bidang penting yang terisi, bukan dikarang.
 *
 * JANGAN mengarang upah/tanggal bila tidak disebutkan: bidang dibiarkan
 * kosong dan masuk daftar "Yang belum jelas".
 */

import {
  keahlianBaku,
  wilayah,
  type JenisKerja,
  type SatuanUpah,
  type TemuanSaringan,
} from "@/lib/mock";

/** Kunci sessionStorage untuk membawa teks ketikan ke halaman hasil */
export const KUNCI_TEKS_LOWONGAN = "kita-kerja:teks-lowongan";

/** Contoh cadangan bila halaman hasil dibuka tanpa teks */
export const CONTOH_TEKS_LOWONGAN =
  "butuh 2 tukang buat renov dapur, mulai senin, borongan, daerah Sukun";

// ============ BIDANG HASIL EKSTRAKSI (dapat diedit) ============

export interface BidangLowongan {
  judul: string;
  jenisKerja: JenisKerja | "";
  /** string agar mudah diikat ke input */
  jumlahPekerja: string;
  lokasi: string;
  wilayahId: string;
  keahlianId: string;
  upah: string;
  satuanUpah: SatuanUpah;
  /** ISO "YYYY-MM-DD" atau "" */
  mulai: string;
  syaratTersirat: string[];
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

// ============ ATURAN PARSING ============

const PETA_KECAMATAN: Record<string, string> = {
  sukun: "wl-kota-malang",
  blimbing: "wl-kota-malang",
  dinoyo: "wl-kota-malang",
  lowokwaru: "wl-kota-malang",
  klojen: "wl-kota-malang",
  kedungkandang: "wl-kota-malang",
  sawojajar: "wl-kota-malang",
  malang: "wl-kota-malang",
  rungkut: "wl-kota-surabaya",
  margorejo: "wl-kota-surabaya",
  surabaya: "wl-kota-surabaya",
  krian: "wl-kab-sidoarjo",
  sidoarjo: "wl-kab-sidoarjo",
  gamping: "wl-kab-sleman",
  sleman: "wl-kab-sleman",
};

const HARI: Record<string, number> = {
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
};

function kapital(kata: string): string {
  return kata.charAt(0).toUpperCase() + kata.slice(1);
}

function cariKeahlian(teks: string) {
  const t = teks.toLowerCase();
  for (const kb of keahlianBaku) {
    if (
      kb.alias.some((a) => new RegExp(`\\b${a.replace(/\s+/g, "\\s+")}\\b`, "i").test(t)) ||
      new RegExp(`\\b${kb.nama_baku.replace(/\s+/g, "\\s+")}\\b`, "i").test(t)
    ) {
      return kb;
    }
  }
  return undefined;
}

function cariKecamatan(teks: string): { nama: string; wilayahId: string } | null {
  const t = teks.toLowerCase();
  for (const [nama, wilayahId] of Object.entries(PETA_KECAMATAN)) {
    if (new RegExp(`\\b${nama}\\b`, "i").test(t)) {
      return { nama: kapital(nama), wilayahId };
    }
  }
  return null;
}

/** Parse "Rp150.000", "150 ribu", "150rb", "2,8 juta" → rupiah; null bila tidak ada */
function cariUpah(teks: string): number | null {
  const t = teks.toLowerCase();
  const pola =
    /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(ribu|rb|juta|jt)\b|rp\.?\s*(\d+(?:[.,]\d+)?)/i;
  const m = t.match(pola);
  if (!m) return null;
  const mentah = (m[1] ?? m[3] ?? "").replace(/\./g, "").replace(",", ".");
  let nilai = Number.parseFloat(mentah);
  if (Number.isNaN(nilai)) return null;
  const satuan = m[2];
  if (satuan === "ribu" || satuan === "rb") nilai *= 1_000;
  else if (satuan === "juta" || satuan === "jt") nilai *= 1_000_000;
  else if (nilai < 1000) nilai *= 1_000; // "Rp150" hampir pasti ribuan
  return Math.round(nilai);
}

function cariSatuanUpah(teks: string, jenis: JenisKerja | ""): SatuanUpah {
  const t = teks.toLowerCase();
  if (/per\s*jam|\/\s*jam/.test(t)) return "per_jam";
  if (/per\s*bulan|\/\s*bulan|bulanan|\bgaji\b/.test(t)) return "bulanan";
  if (/\bborongan\b/.test(t) || jenis === "borongan") return "borongan";
  return "harian";
}

function cariJenisKerja(teks: string): JenisKerja | "" {
  const t = teks.toLowerCase();
  if (/\bborongan\b/.test(t)) return "borongan";
  if (/menginap|tinggal di rumah/.test(t)) return "menginap";
  if (/paruh\s*waktu|\d+\s*x\s*seminggu|seminggu\s*\d+\s*x/.test(t)) return "paruh_waktu";
  if (/\bharian\b/.test(t)) return "harian";
  return "";
}

function cariTanggalMulai(teks: string): string {
  const t = teks.toLowerCase();
  const sekarang = new Date();
  const tambahHari = (n: number) => {
    const d = new Date(sekarang);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  if (/\bbesok\b/.test(t)) return tambahHari(1);
  if (/\blusa\b/.test(t)) return tambahHari(2);
  for (const [nama, angka] of Object.entries(HARI)) {
    if (new RegExp(`\\b${nama}\\b`, "i").test(t)) {
      const selisih = (angka - sekarang.getDay() + 7) % 7 || 7; // selalu ke depan
      return tambahHari(selisih);
    }
  }
  return ""; // JANGAN mengarang tanggal
}

/** Syarat tersirat — Bagian 14: jelas dimaksudkan, tidak dituliskan */
function simpulkanSyarat(teks: string, jenis: JenisKerja | ""): string[] {
  const t = teks.toLowerCase();
  const simpulan: string[] = [];
  if (/\bbayi\b|\banak\b|\bbocah\b/.test(t))
    simpulan.push("Pengalaman merawat anak kecil");
  if (/renov/.test(t)) simpulan.push("Ada pekerjaan bongkar dan pasang");
  if (/\bdapur\b/.test(t) && /renov/.test(t))
    simpulan.push("Bisa memasang keramik dan plester");
  if (jenis === "borongan") simpulan.push("Bisa mengatur waktu dan cara kerja sendiri");
  if (jenis === "menginap") simpulan.push("Bersedia tinggal di rumah pemberi kerja");
  if (/\bmotor\b|\bmatic\b/.test(t)) simpulan.push("Membawa peralatan servis sendiri");
  if (/\d+\s*x\s*seminggu|seminggu\s*\d+\s*x/.test(t))
    simpulan.push("Datang rutin sesuai jadwal yang disepakati");
  return simpulan;
}

// ============ EKSTRAKSI UTAMA ============

export function ekstrakLowongan(teks: string): BidangLowongan {
  const jenis = cariJenisKerja(teks);
  const kb = cariKeahlian(teks);
  const kec = cariKecamatan(teks);
  const upah = cariUpah(teks);
  const jumlah = teks.match(/(\d+)\s*(?:orang|tukang|pekerja|montir|art)\b/i);

  const lokasi = kec
    ? `${kec.nama}, ${wilayah.find((w) => w.id === kec.wilayahId)?.nama ?? ""}`
    : "";

  return {
    judul: kb ? `${kb.nama_baku}${lokasi ? `, ${kec!.nama}` : ""}` : "",
    jenisKerja: jenis,
    jumlahPekerja: jumlah ? jumlah[1] : "",
    lokasi,
    wilayahId: kec?.wilayahId ?? "wl-kota-surabaya", // rumah Mbak Dhika
    keahlianId: kb?.id ?? "kb-tukang-umum",
    upah: upah ? String(upah) : "",
    satuanUpah: cariSatuanUpah(teks, jenis),
    mulai: cariTanggalMulai(teks),
    syaratTersirat: simpulkanSyarat(teks, jenis),
    teksAsli: teks,
  };
}

// ============ YANG BELUM JELAS + KELENGKAPAN (deterministik) ============

export function hitungBelumJelas(b: BidangLowongan): string[] {
  const belum: string[] = [];
  const t = b.teksAsli.toLowerCase();
  if (!b.upah) belum.push("Besaran upah yang pasti");
  if (!b.mulai) belum.push("Tanggal mulai yang pasti");
  if (!b.lokasi) belum.push("Lokasi kerja (kecamatan dan kota)");
  if (!b.jumlahPekerja) belum.push("Jumlah pekerja yang dibutuhkan");
  if (!b.jenisKerja) belum.push("Jenis kerja: harian, borongan, atau paruh waktu");
  if (b.jenisKerja === "borongan") belum.push("Perkiraan lama pengerjaan");
  if (!/alat|bahan|material/.test(t)) belum.push("Alat dan bahan: disediakan atau dibawa sendiri");
  return belum;
}

/** Skor kelengkapan 0–1 dari 6 bidang penting — deterministik, bukan AI */
export function hitungKelengkapan(b: BidangLowongan): number {
  const terisi = [
    b.judul,
    b.jenisKerja,
    b.jumlahPekerja,
    b.lokasi,
    b.upah,
    b.mulai,
  ].filter((v) => v !== "" && v !== null).length;
  return Math.round((terisi / 6) * 10) / 10;
}

// ============ SARING TEKS (moderasi mock, dari kata kunci nyata) ============

/**
 * Menghasilkan temuan dari kutipan NYATA di teks ketikan.
 * Bila tidak ada kata kunci yang cocok, mengembalikan temuan contoh umum
 * (dipakai untuk demo keadaan moderasi lewat ?moderasi=1).
 */
export function saringTeks(teks: string): TemuanSaringan[] {
  const temuan: TemuanSaringan[] = [];
  const pola: { re: RegExp; jenis: string; penjelasan: string }[] = [
    {
      re: /[^.]*\b(biaya|jaminan|pendaftaran|transfer)\b[^.]*/i,
      jenis: "minta_biaya",
      penjelasan:
        "Lowongan asli tidak pernah meminta pekerja membayar lebih dulu. Bagian ini perlu dihapus.",
    },
    {
      re: /[^.]*\b(segera|terbatas|hari ini juga|jangan sampai menyesal)\b[^.]*/i,
      jenis: "mendesak",
      penjelasan:
        "Bahasa yang mendesak membuat pekerja curiga. Tulis ulang dengan tenang dan jelas.",
    },
    {
      re: /[^.]*\b(foto ktp|kirim ktp)\b[^.]*/i,
      jenis: "minta_data_diri",
      penjelasan:
        "Meminta foto KTP sebelum bertemu berisiko disalahgunakan. Cukup minta saat pekerjaan disepakati.",
    },
  ];
  for (const p of pola) {
    const m = teks.match(p.re);
    if (m) temuan.push({ jenis: p.jenis, kutipan: m[0].trim(), penjelasan: p.penjelasan });
  }
  if (temuan.length > 0) return temuan;
  // fallback demo
  return [
    {
      jenis: "minta_biaya",
      kutipan: "(contoh) “Wajib kirim biaya administrasi Rp150.000”",
      penjelasan:
        "Lowongan asli tidak pernah meminta pekerja membayar lebih dulu. Bagian seperti ini perlu dihapus.",
    },
    {
      jenis: "mendesak",
      kutipan: "(contoh) “SEGERA hubungi sekarang sebelum penuh!!”",
      penjelasan:
        "Bahasa yang mendesak membuat pekerja curiga. Tulis ulang dengan tenang dan jelas.",
    },
  ];
}
