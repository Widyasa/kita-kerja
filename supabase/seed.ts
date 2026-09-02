/**
 * Seed runner untuk Kita Kerja — jalankan dengan:
 *   npx tsx supabase/seed.ts
 *
 * Mengisi tabel dasar (wilayah, bidang, keahlian, pengguna test, kartu, acuan upah)
 * menggunakan service-role client.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_PASSWORD = process.env.DEMO_FALLBACK_PASSWORD ?? "123456";

function uuid(): string {
  return crypto.randomUUID();
}

type TemuanSaringan = { jenis: string; kutipan: string; penjelasan: string };

type LowonganTayangSeed = {
  judul: string;
  bidang: string;
  jenis: string;
  upah: number;
  satuan: string;
  lokasi: string;
  mulai: string;
  teks: string;
  keahlian: string[];
  wilayah_nama: string;
  saringan?: {
    skor_risiko: number;
    skor_aturan: number;
    skor_ai: number;
    tingkat: "berisiko_tinggi";
    temuan: TemuanSaringan[];
    pertanyaan_disarankan: string[];
  };
};

/** Sisipkan lowongan tayang + keahlian; upsert saringan bila ada. Idempotent per judul + pemberi. */
async function seedLowonganTayang(
  pemberiId: string,
  wilayahMap: Map<string, string>,
  bidangMap: Map<string, string>,
  keahlianMap: Map<string, string>,
  lw: LowonganTayangSeed,
): Promise<void> {
  const bidang_id = bidangMap.get(lw.bidang);
  const wilayah_id = wilayahMap.get(lw.wilayah_nama);
  if (!bidang_id || !wilayah_id) {
    console.error("  lowongan skip (bidang/wilayah):", lw.judul);
    return;
  }

  const { data: ada } = await supabase
    .from("lowongan")
    .select("id")
    .eq("judul_baku", lw.judul)
    .eq("pemberi_kerja_id", pemberiId)
    .maybeSingle();

  let lowonganId = ada?.id;
  if (lowonganId) {
    console.log("  ⚠️  Lowongan ada:", lw.judul);
  } else {
    lowonganId = uuid();
    const { error } = await supabase.from("lowongan").insert({
      id: lowonganId,
      pemberi_kerja_id: pemberiId,
      wilayah_id,
      teks_asli: lw.teks,
      judul_baku: lw.judul,
      bidang_id,
      jenis_kerja: lw.jenis,
      upah_ditawarkan: lw.upah,
      satuan_upah: lw.satuan,
      lokasi_teks: lw.lokasi,
      mulai: lw.mulai,
      status: "tayang",
    });
    if (error) {
      console.error("  lowongan error:", error.message);
      return;
    }
    console.log("  ✅ Lowongan:", lw.judul);
  }

  for (const keahlianNama of lw.keahlian) {
    const keahlian_id = keahlianMap.get(keahlianNama);
    if (!keahlian_id) continue;
    const { error: keahlianErr } = await supabase.from("lowongan_keahlian").upsert(
      { lowongan_id: lowonganId, keahlian_id, wajib: true },
      { onConflict: "lowongan_id,keahlian_id", ignoreDuplicates: true },
    );
    if (keahlianErr) console.error("  lowongan_keahlian error:", keahlianErr.message);
    else console.log("    • Keahlian:", keahlianNama);
  }

  if (lw.saringan) {
    const { error: sErr } = await supabase.from("saringan_aman").upsert(
      {
        lowongan_id: lowonganId,
        skor_risiko: lw.saringan.skor_risiko,
        tingkat: lw.saringan.tingkat,
        temuan: lw.saringan.temuan,
        pertanyaan_disarankan: lw.saringan.pertanyaan_disarankan,
        skor_ai: lw.saringan.skor_ai,
        skor_aturan: lw.saringan.skor_aturan,
        model: null,
      },
      { onConflict: "lowongan_id" },
    );
    if (sErr) console.error("  saringan_aman error:", sErr.message);
    else console.log("    • Saringan Aman:", lw.saringan.tingkat);
  }
}

// ============ DATA SEED ============

/**
 * BUG-003 / BUG-036 — kartu contoh Pak Warto.
 *
 * Token ini dipakai beranda pada tautan "Lihat seperti yang dilihat pemindai
 * QR", teks di bawah kode QR, dan tautan footer. Sebelumnya seed mengacak
 * token setiap dijalankan sehingga ketiganya selalu berujung "Kartu tidak
 * ditemukan". Nilainya kini tetap dan sama dengan yang dirujuk beranda.
 */
export const TOKEN_KARTU_DEMO = "9f3c1a7b2e4d48f6a1c5e7b9d2f4a6c8";

/**
 * Riwayat kerja Warto yang benar-benar tercatat di database, bukan angka
 * hias di beranda. Tiap baris menghasilkan rantai lengkap
 * lowongan -> lamaran -> kesepakatan -> pekerjaan -> penilaian, sehingga
 * statistik kartu dihitung dari data nyata.
 */
const riwayatWarto: {
  lingkup: string;
  upah: number;
  satuan: string;
  mulai: string;
  selesai: string;
  skor: number;
  catatan: string | null;
}[] = [
  { lingkup: "Pasang keramik lantai teras, Lowokwaru", upah: 165000, satuan: "harian", mulai: "2025-11-03", selesai: "2025-11-06", skor: 5, catatan: "Rapi dan cepat selesai." },
  { lingkup: "Perbaikan dinding retak, Blimbing", upah: 150000, satuan: "harian", mulai: "2025-11-10", selesai: "2025-11-13", skor: 5, catatan: "Datang tepat waktu, kerja bagus." },
  { lingkup: "Plester kamar tambahan, Dinoyo", upah: 155000, satuan: "harian", mulai: "2025-11-17", selesai: "2025-11-20", skor: 4, catatan: "Hasil rata, lumayan cepat." },
  { lingkup: "Keramik kamar mandi, Kedungkandang", upah: 170000, satuan: "harian", mulai: "2025-11-24", selesai: "2025-11-27", skor: 5, catatan: "Rapi sekali, terima kasih." },
  { lingkup: "Cor dak lantai dua, Pakis", upah: 160000, satuan: "harian", mulai: "2025-12-02", selesai: "2025-12-05", skor: 5, catatan: "Kuat dan rajin." },
  { lingkup: "Plester fasad rumah, Karangploso", upah: 155000, satuan: "harian", mulai: "2025-12-08", selesai: "2025-12-11", skor: 5, catatan: null },
  { lingkup: "Pasang tegel ruang tamu, Wagir", upah: 170000, satuan: "harian", mulai: "2025-12-12", selesai: "2025-12-15", skor: 5, catatan: "Hasil halus, mau pesan lagi." },
  { lingkup: "Renovasi pagar dan kanopi, Klojen", upah: 150000, satuan: "harian", mulai: "2025-12-19", selesai: "2025-12-22", skor: 5, catatan: null },
  { lingkup: "Pasang bata dinding gudang, Singosari", upah: 150000, satuan: "harian", mulai: "2025-12-27", selesai: "2025-12-30", skor: 0, catatan: null },
  { lingkup: "Keramik lantai dua rumah Pak Yono, Dau", upah: 175000, satuan: "harian", mulai: "2026-01-05", selesai: "2026-01-08", skor: 5, catatan: "Kerjanya cekatan." },
  { lingkup: "Aci dinding rumah baru, Tumpang", upah: 158000, satuan: "harian", mulai: "2026-01-12", selesai: "2026-01-15", skor: 0, catatan: null },
  { lingkup: "Pengecatan kamar anak, Sukun", upah: 150000, satuan: "harian", mulai: "2026-01-17", selesai: "2026-01-20", skor: 5, catatan: "Rapi, tidak beleber." },
  { lingkup: "Bongkar pasang dapur, Blimbing", upah: 150000, satuan: "harian", mulai: "2026-01-21", selesai: "2026-01-24", skor: 0, catatan: null },
  { lingkup: "Cor jalan masuk gang, Pakisaji", upah: 160000, satuan: "harian", mulai: "2026-01-26", selesai: "2026-01-29", skor: 5, catatan: null },
  { lingkup: "Keramik selasar kantor desa, Pakis", upah: 172000, satuan: "harian", mulai: "2026-01-30", selesai: "2026-02-02", skor: 5, catatan: "Tepat janji." },
  { lingkup: "Pasang keramik musala, Kepanjen", upah: 170000, satuan: "harian", mulai: "2026-02-02", selesai: "2026-02-05", skor: 5, catatan: "Hasil bagus, jamaah senang." },
  { lingkup: "Plester tangga dan selasar, Lowokwaru", upah: 155000, satuan: "harian", mulai: "2026-02-07", selesai: "2026-02-10", skor: 0, catatan: null },
  { lingkup: "Dinding kamar belakang, Wagir", upah: 150000, satuan: "harian", mulai: "2026-02-11", selesai: "2026-02-14", skor: 4, catatan: null },
  { lingkup: "Cat ulang ruang tamu, Dau", upah: 150000, satuan: "harian", mulai: "2026-02-16", selesai: "2026-02-19", skor: 0, catatan: null },
  { lingkup: "Cor tiang teras, Singosari", upah: 160000, satuan: "harian", mulai: "2026-02-21", selesai: "2026-02-24", skor: 5, catatan: null },
  { lingkup: "Keramik teras warung, Pakis", upah: 168000, satuan: "harian", mulai: "2026-02-26", selesai: "2026-03-01", skor: 0, catatan: null },
  { lingkup: "Plester rumah dua lantai, Karangploso", upah: 160000, satuan: "harian", mulai: "2026-03-03", selesai: "2026-03-06", skor: 5, catatan: "Rapi sekali, hasil halus." },
  { lingkup: "Perbaikan atap bocor, Sukun", upah: 150000, satuan: "harian", mulai: "2026-03-09", selesai: "2026-03-12", skor: 5, catatan: "Sigap dan jujur." },
  { lingkup: "Keramik dapur, Blimbing", upah: 172000, satuan: "harian", mulai: "2026-03-14", selesai: "2026-03-17", skor: 5, catatan: null },
  { lingkup: "Pagar belakang rumah, Dau", upah: 152000, satuan: "harian", mulai: "2026-03-19", selesai: "2026-03-22", skor: 0, catatan: null },
  { lingkup: "Aci plafon dan lis, Lowokwaru", upah: 158000, satuan: "harian", mulai: "2026-03-24", selesai: "2026-03-27", skor: 0, catatan: null },
  { lingkup: "Pengecatan pagar besi, Klojen", upah: 150000, satuan: "harian", mulai: "2026-03-28", selesai: "2026-03-31", skor: 4, catatan: "Bersih kerjanya." },
  { lingkup: "Pasang granit ruang keluarga, Dinoyo", upah: 180000, satuan: "harian", mulai: "2026-04-02", selesai: "2026-04-05", skor: 5, catatan: "Granit rapi, sambungan halus." },
  { lingkup: "Cor lantai gudang, Pakisaji", upah: 162000, satuan: "harian", mulai: "2026-04-07", selesai: "2026-04-10", skor: 0, catatan: null },
  { lingkup: "Plester kamar mandi atas, Wagir", upah: 158000, satuan: "harian", mulai: "2026-04-11", selesai: "2026-04-14", skor: 5, catatan: null },
  { lingkup: "Renovasi kios pasar, Kepanjen", upah: 155000, satuan: "harian", mulai: "2026-04-15", selesai: "2026-04-18", skor: 5, catatan: "Bisa dipercaya, lanjutkan." },
  { lingkup: "Keramik kamar tidur, Singosari", upah: 170000, satuan: "harian", mulai: "2026-04-20", selesai: "2026-04-23", skor: 4, catatan: null },
  { lingkup: "Aci dinding luar, Blimbing", upah: 160000, satuan: "harian", mulai: "2026-04-25", selesai: "2026-04-28", skor: 5, catatan: "Hasil bagus." },
  { lingkup: "Genteng dan rangka baja ringan, Dau", upah: 155000, satuan: "harian", mulai: "2026-05-05", selesai: "2026-05-08", skor: 5, catatan: "Berani tinggi, rapi." },
  { lingkup: "Keramik teras masjid, Pakis", upah: 172000, satuan: "harian", mulai: "2026-05-09", selesai: "2026-05-12", skor: 5, catatan: "Alhamdulillah rapi." },
  { lingkup: "Plester dinding sumur, Sukun", upah: 158000, satuan: "harian", mulai: "2026-05-14", selesai: "2026-05-17", skor: 0, catatan: null },
  { lingkup: "Cor lantai bengkel, Karangploso", upah: 162000, satuan: "harian", mulai: "2026-05-19", selesai: "2026-05-22", skor: 0, catatan: null },
  { lingkup: "Pasang tegel kamar mandi, Lowokwaru", upah: 175000, satuan: "harian", mulai: "2026-05-24", selesai: "2026-05-27", skor: 5, catatan: "Presisi, air mengalir lancar." },
  { lingkup: "Perbaikan plafon ruang tamu, Klojen", upah: 152000, satuan: "harian", mulai: "2026-05-28", selesai: "2026-05-31", skor: 0, catatan: null },
  { lingkup: "Plester rumah petak tiga unit, Kepanjen", upah: 160000, satuan: "harian", mulai: "2026-06-02", selesai: "2026-06-05", skor: 5, catatan: "Cepat dan rapi." },
  { lingkup: "Perbaikan lantai ambles, Blimbing", upah: 150000, satuan: "harian", mulai: "2026-06-08", selesai: "2026-06-11", skor: 4, catatan: null },
  { lingkup: "Keramik ruang tamu Pak Hadi, Blimbing", upah: 180000, satuan: "harian", mulai: "2026-06-13", selesai: "2026-06-16", skor: 5, catatan: "Keramik mulus, puas." },
  { lingkup: "Tembok pembatas kebun, Wagir", upah: 152000, satuan: "harian", mulai: "2026-06-20", selesai: "2026-06-23", skor: 0, catatan: null },
  { lingkup: "Plester kamar kos, Dinoyo", upah: 160000, satuan: "harian", mulai: "2026-06-27", selesai: "2026-06-30", skor: 0, catatan: null },
  { lingkup: "Aci ulang dapur, Dinoyo", upah: 160000, satuan: "harian", mulai: "2026-07-06", selesai: "2026-07-09", skor: 5, catatan: "Rapi, bersih." },
  { lingkup: "Keramik garasi, Pakisaji", upah: 172000, satuan: "harian", mulai: "2026-07-14", selesai: "2026-07-17", skor: 0, catatan: null },
  { lingkup: "Cor dak musala, Singosari", upah: 165000, satuan: "harian", mulai: "2026-07-22", selesai: "2026-07-25", skor: 5, catatan: "Amanah, hasil kuat." },
];

const wilayahData = [
  { nama: "Kota Malang", jenis: "kota", provinsi: "Jawa Timur", umk: 3338547, tahun_umk: 2026 },
  { nama: "Kabupaten Malang", jenis: "kabupaten", provinsi: "Jawa Timur", umk: 3368275, tahun_umk: 2026 },
  { nama: "Kota Surabaya", jenis: "kota", provinsi: "Jawa Timur", umk: 5103820, tahun_umk: 2026 },
  { nama: "Kabupaten Sidoarjo", jenis: "kabupaten", provinsi: "Jawa Timur", umk: 4956230, tahun_umk: 2026 },
  { nama: "Kota Yogyakarta", jenis: "kota", provinsi: "DI Yogyakarta", umk: 2701552, tahun_umk: 2026 },
  { nama: "Kabupaten Sleman", jenis: "kabupaten", provinsi: "DI Yogyakarta", umk: 2615090, tahun_umk: 2026 },
];

const bidangKerjaData = [
  { nama: "Konstruksi", ikon: "hard-hat" },
  { nama: "Rumah Tangga", ikon: "house" },
  { nama: "Otomotif", ikon: "wrench" },
  { nama: "Jasa Harian", ikon: "sun" },
  { nama: "Pertanian", ikon: "sprout" },
  { nama: "Perdagangan Kecil", ikon: "store" },
];

const keahlianData = [
  // Konstruksi
  { nama_baku: "Tukang Batu", bidang_nama: "Konstruksi", alias: ["mason", "tukang plester"], pengali_upah: 1.15 },
  { nama_baku: "Tukang Kayu", bidang_nama: "Konstruksi", alias: ["carpenter", "tukang pintu"], pengali_upah: 1.10 },
  { nama_baku: "Tukang Besi", bidang_nama: "Konstruksi", alias: ["tukang las", "welder"], pengali_upah: 1.20 },
  { nama_baku: "Tukang Cat", bidang_nama: "Konstruksi", alias: ["painter", "tukang tembok"], pengali_upah: 1.05 },
  { nama_baku: "Pemasangan Keramik", bidang_nama: "Konstruksi", alias: ["tukang keramik", "pasang keramik"], pengali_upah: 1.15 },
  { nama_baku: "Plesteran", bidang_nama: "Konstruksi", alias: ["plester", "aci"], pengali_upah: 1.10 },
  // Rumah Tangga
  { nama_baku: "Asisten Rumah Tangga", bidang_nama: "Rumah Tangga", alias: ["ART", "pembantu"], pengali_upah: 1.00 },
  { nama_baku: "Pengasuh Anak", bidang_nama: "Rumah Tangga", alias: ["nanny", "suster"], pengali_upah: 1.05 },
  { nama_baku: "Tukang Kebun", bidang_nama: "Rumah Tangga", alias: ["gardener", "tukang rumput"], pengali_upah: 1.00 },
  // Otomotif
  { nama_baku: "Mekanik Motor", bidang_nama: "Otomotif", alias: ["montir", "tukang motor"], pengali_upah: 1.10 },
  { nama_baku: "Mekanik Mobil", bidang_nama: "Otomotif", alias: ["montir mobil"], pengali_upah: 1.20 },
  { nama_baku: "Tukang Ban", bidang_nama: "Otomotif", alias: ["tambal ban", "spooring"], pengali_upah: 1.00 },
  // Jasa Harian
  { nama_baku: "Sopir Pribadi", bidang_nama: "Jasa Harian", alias: ["driver", "pengemudi"], pengali_upah: 1.15 },
  { nama_baku: "Tukang Pindahan", bidang_nama: "Jasa Harian", alias: ["jasa pindahan", "angkut barang"], pengali_upah: 1.05 },
  { nama_baku: "Tukang AC", bidang_nama: "Jasa Harian", alias: ["service AC", "bongkar pasang AC"], pengali_upah: 1.20 },
  // Pertanian
  { nama_baku: "Petani Sayur", bidang_nama: "Pertanian", alias: ["petani", "tani"], pengali_upah: 0.95 },
  { nama_baku: "Peternak", bidang_nama: "Pertanian", alias: ["breeder", "peternak ayam"], pengali_upah: 1.00 },
  // Perdagangan
   { nama_baku: "Penjaga Warung", bidang_nama: "Perdagangan Kecil", alias: ["kasir", "penjaga toko"], pengali_upah: 0.95 },
  { nama_baku: "Penjaga Parkir", bidang_nama: "Perdagangan Kecil", alias: ["tukang parkir", "juru parkir"], pengali_upah: 0.90 },
];

const kecamatanData: { nama: string; wilayah_nama: string; lat: number; lng: number }[] = [
  // Kota Malang
  { nama: "Sukun", wilayah_nama: "Kota Malang", lat: -7.995, lng: 112.612 },
  { nama: "Blimbing", wilayah_nama: "Kota Malang", lat: -7.943, lng: 112.635 },
  { nama: "Klojen", wilayah_nama: "Kota Malang", lat: -7.983, lng: 112.629 },
  { nama: "Lowokwaru", wilayah_nama: "Kota Malang", lat: -7.936, lng: 112.605 },
  // Kabupaten Malang
  { nama: "Kepanjen", wilayah_nama: "Kabupaten Malang", lat: -8.135, lng: 112.567 },
  { nama: "Turen", wilayah_nama: "Kabupaten Malang", lat: -8.171, lng: 112.694 },
  { nama: "Singosari", wilayah_nama: "Kabupaten Malang", lat: -7.898, lng: 112.664 },
  // Kota Surabaya
  { nama: "Rungkut", wilayah_nama: "Kota Surabaya", lat: -7.335, lng: 112.766 },
  { nama: "Gubeng", wilayah_nama: "Kota Surabaya", lat: -7.276, lng: 112.752 },
  { nama: "Wonokromo", wilayah_nama: "Kota Surabaya", lat: -7.310, lng: 112.738 },
  // Kabupaten Sidoarjo
  { nama: "Krian", wilayah_nama: "Kabupaten Sidoarjo", lat: -7.379, lng: 112.567 },
  { nama: "Sidoarjo", wilayah_nama: "Kabupaten Sidoarjo", lat: -7.447, lng: 112.718 },
  { nama: "Waru", wilayah_nama: "Kabupaten Sidoarjo", lat: -7.339, lng: 112.727 },
  // Kota Yogyakarta
  { nama: "Gondokusuman", wilayah_nama: "Kota Yogyakarta", lat: -7.782, lng: 110.379 },
  { nama: "Umbulharjo", wilayah_nama: "Kota Yogyakarta", lat: -7.813, lng: 110.379 },
  { nama: "Kraton", wilayah_nama: "Kota Yogyakarta", lat: -7.805, lng: 110.362 },
  // Kabupaten Sleman
  { nama: "Gamping", wilayah_nama: "Kabupaten Sleman", lat: -7.786, lng: 110.325 },
  { nama: "Sleman", wilayah_nama: "Kabupaten Sleman", lat: -7.719, lng: 110.357 },
  { nama: "Depok", wilayah_nama: "Kabupaten Sleman", lat: -7.771, lng: 110.404 },
];

// Akun uji per peran — masuk lewat email + kata sandi (lihat SEED_PASSWORD).
const testUsers = [
  { email: "warto@kitakerja.test", phone: "+6281234567890", nama: "Warto Sugianto", peran: "pekerja", wilayah_nama: "Kota Malang" },
  { email: "dhika@kitakerja.test", phone: "+6281234567891", nama: "Dhika Ayu Permata", peran: "pemberi_kerja", wilayah_nama: "Kota Malang" },
  { email: "slamet@kitakerja.test", phone: "+6281234567892", nama: "Slamet Riyadi", peran: "pendamping", wilayah_nama: "Kota Malang" },
  { email: "yanti@kitakerja.test", phone: "+6281234567893", nama: "Yanti Puspitasari", peran: "pekerja", wilayah_nama: "Kota Surabaya" },
];

async function pastikanAkunTest(
  u: (typeof testUsers)[number],
  wilayahMap: Map<string, string>,
): Promise<string | null> {
  const wilayah_id = wilayahMap.get(u.wilayah_nama) ?? null;
  let userId: string | null = null;

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: u.email,
    phone: u.phone,
    password: SEED_PASSWORD,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { nama: u.nama },
  });

  if (authErr) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((x) => x.email === u.email);
    if (!existing) {
      console.error("  auth error:", authErr.message);
      return null;
    }
    userId = existing.id;
    await supabase.auth.admin.updateUserById(existing.id, { password: SEED_PASSWORD });
    console.log("  ⚠️  User exists (password diperbarui):", u.nama);
  } else if (authUser?.user) {
    userId = authUser.user.id;
    console.log("  ✅ Auth:", u.nama);
  }

  if (!userId) return null;

  const { error: penggunaErr } = await supabase.from("pengguna").upsert(
    {
      id: userId,
      nama: u.nama,
      email: u.email,
      no_hp: u.phone,
      peran: u.peran,
      wilayah_id,
      url_foto: null,
      status_verifikasi: "email_terverifikasi",
      didampingi_oleh: null,
    },
    { onConflict: "id" },
  );

  if (penggunaErr) {
    console.error("  pengguna error:", penggunaErr.message);
    return null;
  }
  console.log("  ✅ Pengguna:", u.nama, `(${u.peran})`);

  if (u.peran === "pekerja") {
    const { data: kartuAda } = await supabase
      .from("kartu_kerja")
      .select("id")
      .eq("pekerja_id", userId)
      .maybeSingle();
    if (!kartuAda) {
      const { error: kartuErr } = await supabase.from("kartu_kerja").insert({ pekerja_id: userId });
      if (kartuErr) console.error("  kartu_kerja error:", kartuErr.message);
      else console.log("  ✅ Kartu Kerja (kosong):", u.nama);
    }
  }

  return userId;
}

async function seed() {
  console.log("🌱 Seeding Kita Kerja...\n");

  // 1. Wilayah
  // BUG-010 — sebelumnya memakai .insert() dengan uuid() baru tiap dijalankan,
  // sehingga setiap seed menambah satu set wilayah baru. Dropdown sempat
  // menampilkan tiap wilayah 6x (37 opsi untuk 6 wilayah).
  // Sekarang upsert pada kunci alami (nama, provinsi) — lihat migrasi
  // 20260731100000_dedup_wilayah_unique.sql yang memasang constraint-nya.
  const wilayahMap = new Map<string, string>();
  for (const w of wilayahData) {
    const { data: existing } = await supabase
      .from("wilayah")
      .select("id")
      .eq("nama", w.nama)
      .eq("provinsi", w.provinsi)
      .maybeSingle();
    if (existing) {
      wilayahMap.set(w.nama, existing.id);
      console.log("  ⚠️  Wilayah ada:", w.nama);
      continue;
    }
    const { data, error } = await supabase
      .from("wilayah")
      .insert({ id: uuid(), ...w })
      .select("id")
      .single();
    if (error || !data) {
      console.error("  wilayah error:", error?.message ?? "tidak ada baris kembali");
      continue;
    }
    wilayahMap.set(w.nama, data.id);
    console.log("  ✅ Wilayah:", w.nama);
  }

  // 1b. Kecamatan
  const kecamatanMap = new Map<string, string>(); // `${nama}|${wilayah_nama}` -> id
  for (const k of kecamatanData) {
    const id = uuid();
    const wilayah_id = wilayahMap.get(k.wilayah_nama);
    if (!wilayah_id) {
      console.error("  wilayah not found:", k.wilayah_nama);
      continue;
    }
    const { data: kecamatanAda } = await supabase
      .from("kecamatan")
      .select("id")
      .eq("nama", k.nama)
      .eq("wilayah_id", wilayah_id)
      .maybeSingle();
    if (kecamatanAda) {
      kecamatanMap.set(`${k.nama}|${k.wilayah_nama}`, kecamatanAda.id);
      console.log("  ⚠️  Kecamatan ada:", k.nama);
      continue;
    }
    kecamatanMap.set(`${k.nama}|${k.wilayah_nama}`, id);
    const { error } = await supabase
      .from("kecamatan")
      .insert({ id, nama: k.nama, wilayah_id, lat: k.lat, lng: k.lng });
    if (error) console.error("  kecamatan error:", error.message);
    else console.log("  ✅ Kecamatan:", k.nama);
  }

  // 2. Bidang Kerja
  const bidangMap = new Map<string, string>();
  for (const b of bidangKerjaData) {
    const { data: existing } = await supabase
      .from("bidang_kerja")
      .select("id")
      .eq("nama", b.nama)
      .maybeSingle();
    if (existing) {
      bidangMap.set(b.nama, existing.id);
      console.log("  ⚠️  Bidang ada:", b.nama);
      continue;
    }
    const id = uuid();
    bidangMap.set(b.nama, id);
    const { error } = await supabase.from("bidang_kerja").insert({ id, ...b });
    if (error) console.error("  bidang error:", error.message);
    else console.log("  ✅ Bidang:", b.nama);
  }

  // 3. Keahlian Baku
  const keahlianMap = new Map<string, string>();
  for (const k of keahlianData) {
    const { data: existing } = await supabase
      .from("keahlian_baku")
      .select("id")
      .eq("nama_baku", k.nama_baku)
      .maybeSingle();
    if (existing) {
      keahlianMap.set(k.nama_baku, existing.id);
      console.log("  ⚠️  Keahlian ada:", k.nama_baku);
      continue;
    }
    const id = uuid();
    const bidang_id = bidangMap.get(k.bidang_nama);
    if (!bidang_id) {
      console.error("  bidang not found:", k.bidang_nama);
      continue;
    }
    keahlianMap.set(k.nama_baku, id);
    const { error } = await supabase.from("keahlian_baku").insert({
      id,
      bidang_id,
      nama_baku: k.nama_baku,
      alias: k.alias,
      pengali_upah: k.pengali_upah,
    });
    if (error) console.error("  keahlian error:", error.message);
    else console.log("  ✅ Keahlian:", k.nama_baku);
  }

  // 4. Konversi Satuan
  const konversiData = [
    { konteks: "panjang", satuan_lokal: "meter", faktor: 1, satuan_baku: "m" },
    { konteks: "panjang", satuan_lokal: "centimeter", faktor: 0.01, satuan_baku: "m" },
    { konteks: "berat", satuan_lokal: "kilogram", faktor: 1, satuan_baku: "kg" },
    { konteks: "waktu", satuan_lokal: "jam", faktor: 1, satuan_baku: "jam" },
  ];
  for (const k of konversiData) {
    const { error } = await supabase.from("konversi_satuan").insert({ id: uuid(), ...k });
    if (error) console.error("  konversi error:", error.message);
    else console.log("  ✅ Konversi:", k.satuan_lokal);
  }

  // 5. Pengguna test (email + kata sandi, satu per peran + pekerja tambahan)
  const userMap = new Map<string, string>(); // email -> id
  console.log(`  🔑 Kata sandi semua akun uji: ${SEED_PASSWORD}\n`);
  for (const u of testUsers) {
    const id = await pastikanAkunTest(u, wilayahMap);
    if (id) userMap.set(u.email, id);
  }

  // 6. Kartu Kerja untuk pekerja test (Warto)
  const wartoId = userMap.get("warto@kitakerja.test");
  if (wartoId) {
    const kartuFields = {
      token_publik: TOKEN_KARTU_DEMO,
      aktif_publik: true,
      ringkasan: "Tukang batu berpengalaman 12 tahun di Kota Malang. Ahli pemasangan bata expose dan plester dekoratif.",
      bidang_utama_id: bidangMap.get("Konstruksi")!,
      pengalaman_tahun: 12,
      kesediaan: ["harian", "borongan"],
      jangkauan_km: 15,
      alat_dimiliki: ["trowel", "waterpass", "mesin molen"],
      bahasa_terdeteksi: ["Bahasa Indonesia", "Bahasa Jawa"],
      diterbitkan_pada: new Date().toISOString(),
    };

    const { data: kartuAda } = await supabase
      .from("kartu_kerja")
      .select("id")
      .eq("pekerja_id", wartoId)
      .maybeSingle();

    let kartuId = kartuAda?.id;
    if (kartuId) {
      const { error } = await supabase.from("kartu_kerja").update(kartuFields).eq("id", kartuId);
      if (error) console.error("  kartu_kerja update error:", error.message);
      else console.log("  ⚠️  Kartu Kerja diperbarui: Warto");
    } else {
      kartuId = uuid();
      const { error } = await supabase.from("kartu_kerja").insert({
        id: kartuId,
        pekerja_id: wartoId,
        ...kartuFields,
      });
      if (error) console.error("  kartu_kerja error:", error.message);
      else console.log("  ✅ Kartu Kerja: Warto");
    }

    if (!kartuId) {
      console.error("  kartu_kerja skip: tidak ada id kartu Warto");
    } else {

    // Kartu Keahlian untuk Warto
    // BUG-036 — tiga keahlian ini sama dengan yang ditampilkan kartu contoh
    // di beranda, supaya kartu asli dan kartu demo tidak saling bertentangan.
    const wartoKeahlian = [
      { keahlian: "Pemasangan Keramik", level: "ahli", kutipan: "Saya sudah 12 tahun pasang keramik di rumah-rumah di Malang. Paling teliti di bagian nat supaya lurus semua.", keyakinan: 0.95, sumber: "manual" },
      { keahlian: "Plesteran", level: "ahli", kutipan: "Plester dekoratif tekstur kasar juga pernah saya kerjakan di rumah Pak Darmo di Sukun.", keyakinan: 0.90, sumber: "manual" },
      { keahlian: "Tukang Batu", level: "terampil", kutipan: "Pasang bata expose tanpa plester, harus rata semua dari awal.", keyakinan: 0.80, sumber: "manual" },
    ];
    for (const k of wartoKeahlian) {
      const keahlian_id = keahlianMap.get(k.keahlian);
      const { error } = await supabase.from("kartu_keahlian").insert({
        id: uuid(),
        kartu_id: kartuId,
        keahlian_id,
        nama_diajukan: null,
        sebutan_pekerja: k.keahlian,
        level: k.level,
        kutipan_bukti: k.kutipan,
        keyakinan: k.keyakinan,
        sumber: k.sumber,
        dikonfirmasi_pekerja: true,
      });
      if (error) console.error("  kartu_keahlian error:", error.message);
      else console.log("  ✅ Keahlian:", k.keahlian);
    }

    // BUG-036 — riwayat kerja nyata untuk Warto.
    // Sebelumnya kartu contoh di beranda mengklaim 47 pekerjaan selesai dan
    // 4,8 dari 32 penilai, sementara akun Warto yang sebenarnya kosong
    // (0 pekerjaan, 0 penilai, keahlian masih "Diklaim"). Sekarang tiap
    // pekerjaan ditulis sebagai rantai lengkap sehingga statistik kartu
    // dihitung dari data yang benar-benar ada.
    const dhikaId = userMap.get("dhika@kitakerja.test");
    const wilayahMalang = wilayahMap.get("Kota Malang");
    if (dhikaId) {
      for (const r of riwayatWarto) {
        const lowonganId = uuid();
        const { error: eLow } = await supabase.from("lowongan").insert({
          id: lowonganId,
          pemberi_kerja_id: dhikaId,
          wilayah_id: wilayahMalang,
          teks_asli: r.lingkup,
          judul_baku: r.lingkup,
          bidang_id: bidangMap.get("Konstruksi"),
          jenis_kerja: r.satuan === "harian" ? "harian" : "borongan",
          jumlah_pekerja: 1,
          upah_ditawarkan: r.upah,
          satuan_upah: r.satuan,
          lokasi_teks: "Sukun, Kota Malang",
          mulai: r.mulai,
          status: "terisi",
        });
        if (eLow) { console.error("  lowongan riwayat error:", eLow.message); continue; }

        await supabase.from("lamaran").insert({
          id: uuid(), lowongan_id: lowonganId, pekerja_id: wartoId, status: "disepakati",
        });

        const kesepakatanId = uuid();
        const { error: eKes } = await supabase.from("kesepakatan_kerja").insert({
          id: kesepakatanId,
          lowongan_id: lowonganId,
          pekerja_id: wartoId,
          pemberi_kerja_id: dhikaId,
          lingkup: r.lingkup,
          upah_disepakati: r.upah,
          satuan: r.satuan,
          mulai: r.mulai,
          selesai: r.selesai,
          tanggal_bayar_dijanjikan: r.selesai,
          otp_pekerja_pada: new Date(r.selesai).toISOString(),
          otp_pemberi_pada: new Date(r.selesai).toISOString(),
          status: "selesai",
        });
        if (eKes) { console.error("  kesepakatan riwayat error:", eKes.message); continue; }

        const pekerjaanId = uuid();
        const { error: ePek } = await supabase.from("pekerjaan").insert({
          id: pekerjaanId,
          kesepakatan_id: kesepakatanId,
          pekerja_id: wartoId,
          pemberi_kerja_id: dhikaId,
          dikonfirmasi_selesai_pekerja: true,
          dikonfirmasi_selesai_pemberi: true,
          selesai_pada: new Date(r.selesai).toISOString(),
        });
        if (ePek) { console.error("  pekerjaan riwayat error:", ePek.message); continue; }

        // skor 0 = pekerjaan selesai tapi pemberi kerja belum menilai.
        // Barisnya sengaja tidak dibuat supaya jumlah penilai tetap jujur.
        if (r.skor > 0) {
          const { error: eNil } = await supabase.from("penilaian").insert({
            id: uuid(),
            pekerjaan_id: pekerjaanId,
            pemberi_kerja_id: dhikaId,
            skor: r.skor,
            catatan: r.catatan,
          });
          if (eNil) console.error("  penilaian riwayat error:", eNil.message);
        }
        console.log("  ✅ Riwayat:", r.lingkup.slice(0, 40));
      }
    }
    }
  }

  // 7. Acuan Upah (sample untuk Kota Malang)
  const wilayahMalang = wilayahMap.get("Kota Malang")!;
  const acuanSamples = [
    { keahlian: "Tukang Batu", acuan_harian: Math.round(3338547 / 26 * 1.15), metode: "umk_saja" },
    { keahlian: "Tukang Kayu", acuan_harian: Math.round(3338547 / 26 * 1.10), metode: "umk_saja" },
    { keahlian: "Asisten Rumah Tangga", acuan_harian: Math.round(3338547 / 26 * 1.00), metode: "umk_saja" },
    { keahlian: "Mekanik Motor", acuan_harian: Math.round(3338547 / 26 * 1.10), metode: "umk_saja" },
    { keahlian: "Sopir Pribadi", acuan_harian: Math.round(3338547 / 26 * 1.15), metode: "umk_saja" },
  ];
  for (const a of acuanSamples) {
    const keahlian_id = keahlianMap.get(a.keahlian);
    if (!keahlian_id) continue;
    const { error } = await supabase.from("acuan_upah").insert({
      id: uuid(),
      keahlian_id,
      wilayah_id: wilayahMalang,
      acuan_harian: a.acuan_harian,
      metode: a.metode,
      jumlah_laporan: 0,
    });
    if (error) console.error("  acuan_upah error:", error.message);
    else console.log("  ✅ Acuan Upah:", a.keahlian);
  }

  // 8. Lowongan sample yang TAYANG — dipakai halaman publik /lowongan.
  const pemberiId = userMap.get("dhika@kitakerja.test");
  if (pemberiId) {
    const lowonganData: LowonganTayangSeed[] = [
      {
        judul: "Tukang Batu Pemasangan Rumah",
        bidang: "Konstruksi",
        jenis: "harian",
        upah: 150000,
        satuan: "harian",
        lokasi: "Sukun, Malang",
        mulai: "2026-08-01",
        teks: "Cari tukang batu untuk pemasangan bata expose rumah baru di Sukun. Harus berpengalaman minimum 5 tahun. Upah 150rb/hari, ada bonus kalau selesai cepat. Bawa waterpass dan trowel sendiri.",
        keahlian: ["Tukang Batu"],
        wilayah_nama: "Kota Malang",
      },
      {
        judul: "Sopir Pribadi Harian",
        bidang: "Jasa Harian",
        jenis: "harian",
        upah: 200000,
        satuan: "harian",
        lokasi: "Malang Tengah",
        mulai: "2026-08-05",
        teks: "Butuh sopir pribadi untuk perjalanan sehari-hari. Punya SIM A & B, usia 25-50 tahun, bersih dan rapi. Gaji 200rb/hari. Mulai jam 7 pagi.",
        keahlian: ["Sopir Pribadi"],
        wilayah_nama: "Kota Malang",
      },
      {
        judul: "Asisten Rumah Tangga Tinggal",
        bidang: "Rumah Tangga",
        jenis: "menginap",
        upah: 2500000,
        satuan: "bulanan",
        lokasi: "Batu, Malang",
        mulai: "2026-08-10",
        teks: "ART berpengalaman untuk keluarga kecil (2 anak). Tugas: memasak, membersihkan, menjaga anak. Tinggal di rumah, libur hari Jum'at-Sabtu. Gaji 2,5jt/bulan, ada asuransi & TPP.",
        keahlian: ["Asisten Rumah Tangga"],
        wilayah_nama: "Kota Malang",
      },
    ];

    for (const lw of lowonganData) {
      await seedLowonganTayang(pemberiId, wilayahMap, bidangMap, keahlianMap, lw);
    }

    // 9. Lowongan berisiko tinggi — QA 1.3 / Bagian 17: tetap tayang di daftar publik,
    // dipindah ke kelompok bawah dengan Saringan Aman (bukan disembunyikan, bukan "penipuan").
    const lowonganBerisiko: LowonganTayangSeed[] = [
      {
        judul: "Tukang proyek apartemen, Surabaya",
        bidang: "Konstruksi",
        jenis: "harian",
        upah: 350000,
        satuan: "harian",
        lokasi: "Surabaya (detail menyusul)",
        mulai: "2026-08-03",
        teks:
          "LOWONGAN TERBATAS! Proyek apartemen Surabaya butuh tukang bangunan, gaji Rp350.000 per hari!! Hanya untuk 3 orang pertama. Wajib kirim biaya administrasi Rp150.000 untuk seragam dan ID card proyek. SEGERA hubungi sekarang sebelum penuh!!",
        keahlian: ["Tukang Batu"],
        wilayah_nama: "Kota Surabaya",
        saringan: {
          skor_risiko: 92,
          skor_aturan: 25,
          skor_ai: 67,
          tingkat: "berisiko_tinggi",
          temuan: [
            {
              jenis: "diminta_uang",
              kutipan: "Wajib kirim biaya administrasi Rp150.000",
              penjelasan: "Lowongan asli jarang meminta pekerja membayar lebih dulu.",
            },
            {
              jenis: "mendesak",
              kutipan: "SEGERA hubungi sekarang sebelum penuh!!",
              penjelasan: "Desakan waktu dipakai agar Anda tidak sempat berpikir dan bertanya.",
            },
            {
              jenis: "upah_tidak_wajar",
              kutipan: "gaji Rp350.000 per hari",
              penjelasan:
                "Upah ini jauh di atas acuan untuk tukang di Surabaya — terlalu bagus untuk menjadi kenyataan.",
            },
          ],
          pertanyaan_disarankan: [
            "Apakah biaya administrasi bisa dipotong dari gaji pertama saja?",
            "Di mana alamat kantor proyek yang bisa saya datangi langsung?",
            "Apa nama resmi perusahaan pemilik proyek apartemen ini?",
            "Bisakah saya bertemu dulu tanpa membayar apa pun?",
          ],
        },
      },
      {
        judul: "Pekerja gudang pabrik, Sidoarjo",
        bidang: "Jasa Harian",
        jenis: "harian",
        upah: 250000,
        satuan: "harian",
        lokasi: "dirahasiakan",
        mulai: "2026-08-04",
        teks:
          "Dibutuhkan pekerja gudang pabrik besar. Lokasi dirahasiakan demi keamanan perusahaan. Gaji pokok tinggi plus bonus mingguan. Pendaftaran Rp100.000 via transfer, kuota hanya hari ini. Jangan tanya-tanya dulu, langsung daftar.",
        keahlian: ["Tukang Pindahan"],
        wilayah_nama: "Kabupaten Sidoarjo",
        saringan: {
          skor_risiko: 88,
          skor_aturan: 33,
          skor_ai: 55,
          tingkat: "berisiko_tinggi",
          temuan: [
            {
              jenis: "lokasi_tidak_jelas",
              kutipan: "Lokasi dirahasiakan demi keamanan perusahaan",
              penjelasan: "Tempat kerja yang sah selalu bisa ditunjukkan sebelum Anda mulai.",
            },
            {
              jenis: "diminta_uang",
              kutipan: "Pendaftaran Rp100.000 via transfer",
              penjelasan:
                "Pungutan pendaftaran lewat transfer sering muncul pada lowongan yang belum bisa menunjukkan lokasi kerja.",
            },
            {
              jenis: "mendesak",
              kutipan: "kuota hanya hari ini",
              penjelasan: "Batas waktu palsu dibuat agar Anda buru-buru memutuskan.",
            },
          ],
          pertanyaan_disarankan: [
            "Apa nama pabrik dan alamat lengkapnya?",
            "Mengapa pendaftaran harus lewat transfer, bukan di tempat?",
            "Bisakah saya melihat lokasi kerja dulu sebelum memutuskan?",
            "Siapa penanggung jawab yang bisa saya temui langsung?",
          ],
        },
      },
      {
        judul: "Pekerja serabutan, Malang",
        bidang: "Jasa Harian",
        jenis: "harian",
        upah: 300000,
        satuan: "harian",
        lokasi: "Malang (nanti diinfokan)",
        mulai: "2026-08-02",
        teks:
          "Pekerja serabutan diutamakan bisa segala. Gaji besar dibayar mingguan. Kirim foto KTP dan biaya jaminan Rp200.000 (dikembalikan setelah kerja). Langsung kerja besok, tanpa wawancara. Jangan sampai menyesal!",
        keahlian: ["Tukang Batu"],
        wilayah_nama: "Kabupaten Malang",
        saringan: {
          skor_risiko: 90,
          skor_aturan: 45,
          skor_ai: 45,
          tingkat: "berisiko_tinggi",
          temuan: [
            {
              jenis: "diminta_uang",
              kutipan: "biaya jaminan Rp200.000 (dikembalikan setelah kerja)",
              penjelasan: "Janji uang kembali setelah kerja hampir tidak pernah ditepati.",
            },
            {
              jenis: "jaminan_pribadi",
              kutipan: "Kirim foto KTP",
              penjelasan:
                "Foto KTP bisa disalahgunakan tanpa Anda tahu sebelum bertemu langsung.",
            },
            {
              jenis: "terlalu_mudah",
              kutipan: "Langsung kerja besok, tanpa wawancara",
              penjelasan: "Pekerjaan asli selalu ingin mengenal pekerjanya dulu.",
            },
          ],
          pertanyaan_disarankan: [
            "Mengapa perlu foto KTP sebelum bertemu langsung?",
            "Di mana alamat tempat kerjanya, bisa saya lihat dulu?",
            "Apakah jaminan bisa diganti pertemuan langsung tanpa uang?",
            "Bagaimana bentuk kesepakatan upah mingguannya, tertulis atau lisan?",
          ],
        },
      },
    ];

    console.log("\n  — Lowongan berisiko tinggi (Saringan Aman) —");
    for (const lw of lowonganBerisiko) {
      await seedLowonganTayang(pemberiId, wilayahMap, bidangMap, keahlianMap, lw);
    }
  }

  console.log("\n🎉 Seeding selesai!");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
