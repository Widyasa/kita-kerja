/**
 * Data awal mock Kita Kerja — sesuai Bagian 17 spec.
 * Semua nama, tempat, dan nominal dibuat terasa Indonesia dan wajar.
 * Lapis kepercayaan pada kartu keahlian DIHITUNG dari riwayat (hitungLapis),
 * tidak disimpan mentah — meniru perilaku turunan di CONTEXT.md.
 */

import type {
  AcuanUpah,
  BidangKerja,
  KartuKeahlian,
  KartuKerja,
  KeahlianBaku,
  KesepakatanKerja,
  Lamaran,
  LapisKepercayaan,
  Lowongan,
  Pekerjaan,
  Pengguna,
  Penilaian,
  PutaranWawancara,
  SaringanAman,
  Wilayah,
} from "./types";

// ============ WILAYAH (UMK 2026) ============

export const wilayah: Wilayah[] = [
  { id: "wl-kota-malang", nama: "Kota Malang", jenis: "kota", provinsi: "Jawa Timur", umk: 3338547, tahun_umk: 2026 },
  { id: "wl-kab-malang", nama: "Kabupaten Malang", jenis: "kabupaten", provinsi: "Jawa Timur", umk: 3368275, tahun_umk: 2026 },
  { id: "wl-kota-surabaya", nama: "Kota Surabaya", jenis: "kota", provinsi: "Jawa Timur", umk: 5103820, tahun_umk: 2026 },
  { id: "wl-kab-sidoarjo", nama: "Kabupaten Sidoarjo", jenis: "kabupaten", provinsi: "Jawa Timur", umk: 4956230, tahun_umk: 2026 },
  { id: "wl-kota-yogyakarta", nama: "Kota Yogyakarta", jenis: "kota", provinsi: "DI Yogyakarta", umk: 2701552, tahun_umk: 2026 },
  { id: "wl-kab-sleman", nama: "Kabupaten Sleman", jenis: "kabupaten", provinsi: "DI Yogyakarta", umk: 2615090, tahun_umk: 2026 },
];

// ============ BIDANG KERJA ============

export const bidangKerja: BidangKerja[] = [
  { id: "bd-konstruksi", nama: "Konstruksi", ikon: "hard-hat" },
  { id: "bd-rumah-tangga", nama: "Rumah Tangga", ikon: "house" },
  { id: "bd-otomotif", nama: "Otomotif", ikon: "wrench" },
  { id: "bd-jasa-harian", nama: "Jasa Harian", ikon: "sun" },
  { id: "bd-pertanian", nama: "Pertanian", ikon: "sprout" },
  { id: "bd-perdagangan", nama: "Perdagangan Kecil", ikon: "store" },
];

// ============ KEAHLIAN BAKU (±30, alias kaya, pengali dari tabel spec) ============

export const keahlianBaku: KeahlianBaku[] = [
  // Konstruksi
  { id: "kb-tukang-umum", bidang_id: "bd-konstruksi", nama_baku: "Tukang bangunan umum", alias: ["kuli", "kuli bangunan", "buruh bangunan", "tukang batu", "tukang"], pengali_upah: 1.15 },
  { id: "kb-keramik", bidang_id: "bd-konstruksi", nama_baku: "Pemasangan keramik", alias: ["pasang keramik", "tukang keramik", "keramik", "tegel", "pasang tegel", "granit"], pengali_upah: 1.35 },
  { id: "kb-plester", bidang_id: "bd-konstruksi", nama_baku: "Plesteran", alias: ["plester", "aci", "tukang plester", "ngaci", "plester aci"], pengali_upah: 1.25 },
  { id: "kb-cor", bidang_id: "bd-konstruksi", nama_baku: "Pengecoran", alias: ["cor", "ngecor", "bikin cor", "tukang cor", "cor dak"], pengali_upah: 1.25 },
  { id: "kb-bata", bidang_id: "bd-konstruksi", nama_baku: "Pemasangan bata", alias: ["pasang bata", "tembok bata", "mbatik", "pasang batako", "batako"], pengali_upah: 1.15 },
  { id: "kb-cat", bidang_id: "bd-konstruksi", nama_baku: "Pengecatan", alias: ["ngecet", "tukang cat", "cat tembok", "cat rumah"], pengali_upah: 1.2 },
  { id: "kb-listrik", bidang_id: "bd-konstruksi", nama_baku: "Instalasi listrik rumah", alias: ["listrik", "tukang listrik", "pasang listrik", "instalatir"], pengali_upah: 1.45 },
  { id: "kb-atap", bidang_id: "bd-konstruksi", nama_baku: "Pemasangan atap", alias: ["genteng", "pasang genteng", "atap", "baja ringan", "pasang atap"], pengali_upah: 1.3 },
  { id: "kb-kayu", bidang_id: "bd-konstruksi", nama_baku: "Tukang kayu / mebel", alias: ["tukang kayu", "mebel", "mebelir", "kusen", "bikin lemari"], pengali_upah: 1.4 },
  { id: "kb-kepala-tukang", bidang_id: "bd-konstruksi", nama_baku: "Kepala tukang", alias: ["mandor", "kepala tukang", "mandor bangunan"], pengali_upah: 1.6 },
  // Rumah tangga
  { id: "kb-prt", bidang_id: "bd-rumah-tangga", nama_baku: "Pembantu rumah tangga", alias: ["art", "prt", "pembantu", "asisten rumah tangga", "bibi"], pengali_upah: 1.0 },
  { id: "kb-merawat-anak", bidang_id: "bd-rumah-tangga", nama_baku: "Merawat anak", alias: ["baby sitter", "jaga anak", "momong", "pengasuh", "nanny"], pengali_upah: 1.1 },
  { id: "kb-merawat-lansia", bidang_id: "bd-rumah-tangga", nama_baku: "Merawat lansia", alias: ["jaga orang tua", "perawat lansia", "nemenin mbah", "caregiver"], pengali_upah: 1.15 },
  { id: "kb-memasak", bidang_id: "bd-rumah-tangga", nama_baku: "Memasak", alias: ["masak", "juru masak", "koki rumah", "masakan rumahan"], pengali_upah: 1.1 },
  { id: "kb-cuci-setrika", bidang_id: "bd-rumah-tangga", nama_baku: "Cuci dan setrika", alias: ["cuci baju", "nyuci", "setrika", "nyetrika", "laundry rumah"], pengali_upah: 1.0 },
  // Otomotif
  { id: "kb-montir-motor", bidang_id: "bd-otomotif", nama_baku: "Montir motor", alias: ["montir", "tukang motor", "bengkel motor", "mekanik motor", "servis motor"], pengali_upah: 1.4 },
  { id: "kb-montir-mobil", bidang_id: "bd-otomotif", nama_baku: "Montir mobil", alias: ["mekanik mobil", "bengkel mobil", "servis mobil", "tukang mobil"], pengali_upah: 1.5 },
  { id: "kb-tambal-ban", bidang_id: "bd-otomotif", nama_baku: "Tambal ban", alias: ["tambal", "tukang tambal", "ban bocor", "tambal tubeless"], pengali_upah: 1.05 },
  { id: "kb-cuci-kendaraan", bidang_id: "bd-otomotif", nama_baku: "Cuci kendaraan", alias: ["cuci motor", "cuci mobil", "steam motor", "carwash"], pengali_upah: 1.0 },
  // Jasa harian
  { id: "kb-buruh-angkut", bidang_id: "bd-jasa-harian", nama_baku: "Buruh angkut", alias: ["kuli angkut", "angkut barang", "kuli pikul", "bongkar muat"], pengali_upah: 1.05 },
  { id: "kb-pindahan", bidang_id: "bd-jasa-harian", nama_baku: "Jasa pindahan", alias: ["pindahan rumah", "angkut pindahan", "jasa angkut"], pengali_upah: 1.1 },
  { id: "kb-tukang-taman", bidang_id: "bd-jasa-harian", nama_baku: "Tukang taman", alias: ["taman", "potong rumput", "beres-beres taman", "tukang kebun"], pengali_upah: 1.15 },
  { id: "kb-jaga-toko", bidang_id: "bd-jasa-harian", nama_baku: "Penjaga toko", alias: ["jaga toko", "karyawan toko", "pelayan toko", "toko kelontong"], pengali_upah: 1.0 },
  { id: "kb-kebersihan", bidang_id: "bd-jasa-harian", nama_baku: "Petugas kebersihan", alias: ["bersih-bersih", "cleaning", "tukang sapu", "kebersihan kantor"], pengali_upah: 1.0 },
  // Pertanian
  { id: "kb-tanam-padi", bidang_id: "bd-pertanian", nama_baku: "Tanam dan panen padi", alias: ["tandur", "matun", "panen padi", "tani sawah"], pengali_upah: 1.0 },
  { id: "kb-kebun-sayur", bidang_id: "bd-pertanian", nama_baku: "Pekerja kebun sayur", alias: ["kebun sayur", "panen sayur", "tani sayur", "kebun tomat"], pengali_upah: 1.0 },
  { id: "kb-ternak", bidang_id: "bd-pertanian", nama_baku: "Perawatan ternak", alias: ["angon", "jaga sapi", "kandang ayam", "ternak kambing"], pengali_upah: 1.05 },
  { id: "kb-iram", bidang_id: "bd-pertanian", nama_baku: "Irigasi dan pengairan", alias: ["pengairan", "atur air sawah", "irigasi", "ulu-ulu"], pengali_upah: 1.05 },
  // Perdagangan kecil
  { id: "kb-jualan-warung", bidang_id: "bd-perdagangan", nama_baku: "Melayani warung makan", alias: ["pelayan warung", "pelayan warung makan", "bantu warung", "warung kopi"], pengali_upah: 1.0 },
  { id: "kb-kasir", bidang_id: "bd-perdagangan", nama_baku: "Kasir toko", alias: ["kasir", "jaga kasir", "mesin kasir"], pengali_upah: 1.05 },
  { id: "kb-kulakan", bidang_id: "bd-perdagangan", nama_baku: "Kulakan dan stok barang", alias: ["kulakan", "belanja stok", "stok barang", "gudang toko"], pengali_upah: 1.05 },
];

// ============ PENGGUNA ============

export const pengguna: Pengguna[] = [
  // Persona utama
  { id: "u-warto", nama: "Warto Sugianto", no_hp: "081234560001", peran: "pekerja", wilayah_id: "wl-kota-malang", url_foto: null, status_verifikasi: "identitas_terverifikasi", didampingi_oleh: null, umur: 34 },
  { id: "u-yanti", nama: "Yanti Puspitasari", no_hp: "081234560002", peran: "pekerja", wilayah_id: "wl-kota-surabaya", url_foto: null, status_verifikasi: "belum", didampingi_oleh: null, umur: 26 },
  { id: "u-dhika", nama: "Dhika Ramadhani", no_hp: "081234560003", peran: "pemberi_kerja", wilayah_id: "wl-kota-surabaya", url_foto: null, status_verifikasi: "hp_terverifikasi", didampingi_oleh: null, umur: 33 },
  { id: "u-slamet", nama: "Slamet Widodo", no_hp: "081234560004", peran: "pendamping", wilayah_id: "wl-kota-malang", url_foto: null, status_verifikasi: "identitas_terverifikasi", didampingi_oleh: null, umur: 55 },
  // Pekerja pendukung
  { id: "u-joko", nama: "Joko Prasetyo", no_hp: "081234560005", peran: "pekerja", wilayah_id: "wl-kab-sidoarjo", url_foto: null, status_verifikasi: "hp_terverifikasi", didampingi_oleh: null, umur: 41 },
  { id: "u-aminah", nama: "Siti Aminah", no_hp: "081234560006", peran: "pekerja", wilayah_id: "wl-kab-sleman", url_foto: null, status_verifikasi: "hp_terverifikasi", didampingi_oleh: null, umur: 38 },
  { id: "u-bangun", nama: "Bangun Saputra", no_hp: "081234560007", peran: "pekerja", wilayah_id: "wl-kota-yogyakarta", url_foto: null, status_verifikasi: "identitas_terverifikasi", didampingi_oleh: null, umur: 45 },
  { id: "u-rudi", nama: "Rudi Hartono", no_hp: "081234560008", peran: "pekerja", wilayah_id: "wl-kota-malang", url_foto: null, status_verifikasi: "belum", didampingi_oleh: "u-slamet", umur: 29 },
  // Pemberi kerja pendukung
  { id: "u-hadi", nama: "Hadi Santoso", no_hp: "081234560009", peran: "pemberi_kerja", wilayah_id: "wl-kota-malang", url_foto: null, status_verifikasi: "hp_terverifikasi", didampingi_oleh: null, umur: 52 },
  { id: "u-rina", nama: "Rina Marlina", no_hp: "081234560010", peran: "pemberi_kerja", wilayah_id: "wl-kab-malang", url_foto: null, status_verifikasi: "hp_terverifikasi", didampingi_oleh: null, umur: 40 },
  { id: "u-eko", nama: "Eko Purnomo", no_hp: "081234560011", peran: "pemberi_kerja", wilayah_id: "wl-kab-sidoarjo", url_foto: null, status_verifikasi: "hp_terverifikasi", didampingi_oleh: null, umur: 47 },
  { id: "u-sari", nama: "Sari Wulandari", no_hp: "081234560012", peran: "pemberi_kerja", wilayah_id: "wl-kota-malang", url_foto: null, status_verifikasi: "belum", didampingi_oleh: null, umur: 36 },
];

/** Pekerja utama untuk demo fase 2 */
export const pekerjaUtama = pengguna.find((p) => p.id === "u-warto")!;
/** Pemberi kerja utama untuk demo fase 2 */
export const pemberiKerjaUtama = pengguna.find((p) => p.id === "u-dhika")!;
/** Pendamping utama untuk demo fase 2 */
export const pendampingUtama = pengguna.find((p) => p.id === "u-slamet")!;

// ============ KARTU KERJA ============

export const kartuKerja: KartuKerja[] = [
  {
    id: "kk-warto",
    pekerja_id: "u-warto",
    token_publik: "9f3c1a7b2e4d48f6a1c5e7b9d2f4a6c8",
    aktif_publik: true,
    ringkasan:
      "Tukang bangunan 12 tahun. Paling kuat di pasang keramik dan plester. Biasa kerja harian maupun borongan di Malang Raya.",
    bidang_utama_id: "bd-konstruksi",
    pengalaman_tahun: 12,
    kesediaan: ["harian", "borongan"],
    jangkauan_km: 25,
    alat_dimiliki: ["jidar", "cetong", "benang", "waterpass", "gerinda kecil"],
    bahasa_terdeteksi: "jv",
    diterbitkan_pada: "2025-11-01T08:30:00+07:00",
  },
  {
    id: "kk-joko",
    pekerja_id: "u-joko",
    token_publik: "2b7d9f1a3c5e8b6d4a2c7e9f1b3d5a7c",
    aktif_publik: true,
    ringkasan: "Montir motor 8 tahun, biasa bengkel harian dan panggilan.",
    bidang_utama_id: "bd-otomotif",
    pengalaman_tahun: 8,
    kesediaan: ["harian", "paruh_waktu"],
    jangkauan_km: 15,
    alat_dimiliki: ["kunci pas set", "obeng set", "kompresor kecil"],
    bahasa_terdeteksi: "jv",
    diterbitkan_pada: "2026-03-14T10:05:00+07:00",
  },
  {
    id: "kk-bangun",
    pekerja_id: "u-bangun",
    token_publik: "5a1c3e7b9d2f4a6c8e1b3d5f7a9c2e4b",
    aktif_publik: true,
    ringkasan: "Tukang kayu dan mebel 20 tahun. Bisa kusen, lemari, dan kitchen set.",
    bidang_utama_id: "bd-konstruksi",
    pengalaman_tahun: 20,
    kesediaan: ["borongan"],
    jangkauan_km: 30,
    alat_dimiliki: ["gergaji mesin", "serut", "bor listrik"],
    bahasa_terdeteksi: "jv",
    diterbitkan_pada: "2025-12-20T13:45:00+07:00",
  },
  {
    id: "kk-aminah",
    pekerja_id: "u-aminah",
    token_publik: "7c9e1a3b5d7f2a4c6e8b1d3f5a7c9e2a",
    aktif_publik: true,
    ringkasan: "Baru diterbitkan. Pengalaman 6 tahun membantu rumah tangga dan merawat anak.",
    bidang_utama_id: "bd-rumah-tangga",
    pengalaman_tahun: 6,
    kesediaan: ["harian", "menginap"],
    jangkauan_km: 10,
    alat_dimiliki: [],
    bahasa_terdeteksi: "jv",
    diterbitkan_pada: "2026-07-18T09:10:00+07:00",
  },
];

/** Kartu Kerja milik Pak Warto — kartu utama demo */
export const kartuWarto = kartuKerja.find((k) => k.id === "kk-warto")!;

// ============ RIWAYAT PEKERJAAN PAK WARTO ============
// 47 pekerjaan selesai, Nov 2025 – Jul 2026. 32 di antaranya punya penilaian
// (27 skor 5, 5 skor 4 → rata-rata 4,8). Baris "cat" sengaja belum
// dikonfirmasi pemberi kerja → lapis keahlian Pengecatan menjadi "dinilai".

type BarisRiwayat = [
  selesai: string,
  judul: string,
  keahlian: "kb-keramik" | "kb-plester" | "kb-tukang-umum" | "kb-cor" | "kb-bata" | "kb-cat",
  upah: number,
  skor: 0 | 4 | 5,
  catatan: string | null,
  pemberiKonfirmasi: boolean,
];

const RIWAYAT_WARTO: BarisRiwayat[] = [
  // November 2025
  ["2025-11-03", "Pasang keramik lantai teras, Lowokwaru", "kb-keramik", 165000, 5, "Rapi dan cepat selesai.", true],
  ["2025-11-10", "Perbaikan dinding retak, Blimbing", "kb-tukang-umum", 150000, 5, "Datang tepat waktu, kerja bagus.", true],
  ["2025-11-17", "Plester kamar tambahan, Dinoyo", "kb-plester", 155000, 4, "Hasil rata, lumayan cepat.", true],
  ["2025-11-24", "Keramik kamar mandi, Kedungkandang", "kb-keramik", 170000, 5, "Rapi sekali, terima kasih.", true],
  // Desember 2025
  ["2025-12-02", "Cor dak lantai dua, Pakis", "kb-cor", 160000, 5, "Kuat dan rajin.", true],
  ["2025-12-08", "Plester fasad rumah, Karangploso", "kb-plester", 155000, 5, null, true],
  ["2025-12-12", "Pasang tegel ruang tamu, Wagir", "kb-keramik", 170000, 5, "Hasil halus, mau pesan lagi.", true],
  ["2025-12-19", "Renovasi pagar dan kanopi, Klojen", "kb-tukang-umum", 150000, 5, null, true],
  ["2025-12-27", "Pasang bata dinding gudang, Singosari", "kb-bata", 150000, 0, null, true],
  // Januari 2026
  ["2026-01-05", "Keramik lantai dua rumah Pak Yono, Dau", "kb-keramik", 175000, 5, "Kerjanya cekatan.", true],
  ["2026-01-12", "Aci dinding rumah baru, Tumpang", "kb-plester", 158000, 0, null, true],
  ["2026-01-17", "Pengecatan kamar anak, Sukun", "kb-cat", 150000, 5, "Rapi, tidak beleber.", false],
  ["2026-01-21", "Bongkar pasang dapur, Blimbing", "kb-tukang-umum", 150000, 0, null, true],
  ["2026-01-26", "Cor jalan masuk gang, Pakisaji", "kb-cor", 160000, 5, null, true],
  ["2026-01-30", "Keramik selasar kantor desa, Pakis", "kb-keramik", 172000, 5, "Tepat janji.", true],
  // Februari 2026
  ["2026-02-02", "Pasang keramik musala, Kepanjen", "kb-keramik", 170000, 5, "Hasil bagus, jamaah senang.", true],
  ["2026-02-07", "Plester tangga dan selasar, Lowokwaru", "kb-plester", 155000, 0, null, true],
  ["2026-02-11", "Dinding kamar belakang, Wagir", "kb-bata", 150000, 4, null, true],
  ["2026-02-16", "Cat ulang ruang tamu, Dau", "kb-cat", 150000, 0, null, false],
  ["2026-02-21", "Cor tiang teras, Singosari", "kb-cor", 160000, 5, null, true],
  ["2026-02-26", "Keramik teras warung, Pakis", "kb-keramik", 168000, 0, null, true],
  // Maret 2026
  ["2026-03-03", "Plester rumah dua lantai, Karangploso", "kb-plester", 160000, 5, "Rapi sekali, hasil halus.", true],
  ["2026-03-09", "Perbaikan atap bocor, Sukun", "kb-tukang-umum", 150000, 5, "Sigap dan jujur.", true],
  ["2026-03-14", "Keramik dapur, Blimbing", "kb-keramik", 172000, 5, null, true],
  ["2026-03-19", "Pagar belakang rumah, Dau", "kb-bata", 152000, 0, null, true],
  ["2026-03-24", "Aci plafon dan lis, Lowokwaru", "kb-plester", 158000, 0, null, true],
  ["2026-03-28", "Pengecatan pagar besi, Klojen", "kb-cat", 150000, 4, "Bersih kerjanya.", false],
  // April 2026
  ["2026-04-02", "Pasang granit ruang keluarga, Dinoyo", "kb-keramik", 180000, 5, "Granit rapi, sambungan halus.", true],
  ["2026-04-07", "Cor lantai gudang, Pakisaji", "kb-cor", 162000, 0, null, true],
  ["2026-04-11", "Plester kamar mandi atas, Wagir", "kb-plester", 158000, 5, null, true],
  ["2026-04-15", "Renovasi kios pasar, Kepanjen", "kb-tukang-umum", 155000, 5, "Bisa dipercaya, lanjutkan.", true],
  ["2026-04-20", "Keramik kamar tidur, Singosari", "kb-keramik", 170000, 4, null, true],
  ["2026-04-25", "Aci dinding luar, Blimbing", "kb-plester", 160000, 5, "Hasil bagus.", true],
  // Mei 2026
  ["2026-05-05", "Genteng dan rangka baja ringan, Dau", "kb-tukang-umum", 155000, 5, "Berani tinggi, rapi.", true],
  ["2026-05-09", "Keramik teras masjid, Pakis", "kb-keramik", 172000, 5, "Alhamdulillah rapi.", true],
  ["2026-05-14", "Plester dinding sumur, Sukun", "kb-plester", 158000, 0, null, true],
  ["2026-05-19", "Cor lantai bengkel, Karangploso", "kb-cor", 162000, 0, null, true],
  ["2026-05-24", "Pasang tegel kamar mandi, Lowokwaru", "kb-keramik", 175000, 5, "Presisi, air mengalir lancar.", true],
  ["2026-05-28", "Perbaikan plafon ruang tamu, Klojen", "kb-tukang-umum", 152000, 0, null, true],
  // Juni 2026
  ["2026-06-02", "Plester rumah petak tiga unit, Kepanjen", "kb-plester", 160000, 5, "Cepat dan rapi.", true],
  ["2026-06-08", "Perbaikan lantai ambles, Blimbing", "kb-tukang-umum", 150000, 4, null, true],
  ["2026-06-13", "Keramik ruang tamu Pak Hadi, Blimbing", "kb-keramik", 180000, 5, "Keramik mulus, puas.", true],
  ["2026-06-20", "Tembok pembatas kebun, Wagir", "kb-bata", 152000, 0, null, true],
  ["2026-06-27", "Plester kamar kos, Dinoyo", "kb-plester", 160000, 0, null, true],
  // Juli 2026
  ["2026-07-06", "Aci ulang dapur, Dinoyo", "kb-plester", 160000, 5, "Rapi, bersih.", true],
  ["2026-07-14", "Keramik garasi, Pakisaji", "kb-keramik", 172000, 0, null, true],
  ["2026-07-22", "Cor dak musala, Singosari", "kb-cor", 165000, 5, "Amanah, hasil kuat.", true],
];

const PEMBERI_KERJA_RIWAYAT = ["u-hadi", "u-rina", "u-sari", "u-dhika"] as const;

export const riwayatWarto: Pekerjaan[] = RIWAYAT_WARTO.map((b, i) => ({
  id: `pk-warto-${String(i + 1).padStart(2, "0")}`,
  kesepakatan_id: null,
  pekerja_id: "u-warto",
  pemberi_kerja_id: PEMBERI_KERJA_RIWAYAT[i % PEMBERI_KERJA_RIWAYAT.length],
  keahlian_id: b[2],
  judul: b[1],
  wilayah_id: i % 3 === 0 ? "wl-kab-malang" : "wl-kota-malang",
  upah_diterima: b[3],
  satuan: "harian",
  selesai_pada: b[0],
  dikonfirmasi_selesai_pekerja: true,
  dikonfirmasi_selesai_pemberi: b[6],
}));

export const penilaianWarto: Penilaian[] = RIWAYAT_WARTO
  .map((b, i) => ({ baris: b, pekerjaanId: `pk-warto-${String(i + 1).padStart(2, "0")}`, pemberiId: PEMBERI_KERJA_RIWAYAT[i % PEMBERI_KERJA_RIWAYAT.length] }))
  .filter(({ baris }) => baris[4] > 0)
  .map(({ baris, pekerjaanId, pemberiId }, i) => ({
    id: `nl-warto-${String(i + 1).padStart(2, "0")}`,
    pekerjaan_id: pekerjaanId,
    pemberi_kerja_id: pemberiId,
    skor: baris[4] as 4 | 5,
    catatan: baris[5],
  }));

/**
 * Lapis kepercayaan — TURUNAN, tidak disimpan (CONTEXT.md):
 * - terverifikasi: ada pekerjaan selesai dikonfirmasi dua pihak dengan keahlian itu
 * - dinilai: ada penilaian pada pekerjaan dengan keahlian itu
 * - diklaim: sisanya (hasil Ngobrol Kerja / input manual)
 */
export function hitungLapis(keahlianId: string | null): LapisKepercayaan {
  if (!keahlianId) return "diklaim";
  const pekerjaanTerkait = riwayatWarto.filter((p) => p.keahlian_id === keahlianId);
  if (pekerjaanTerkait.some((p) => p.dikonfirmasi_selesai_pekerja && p.dikonfirmasi_selesai_pemberi)) {
    return "terverifikasi";
  }
  if (pekerjaanTerkait.some((p) => penilaianWarto.some((n) => n.pekerjaan_id === p.id))) {
    return "dinilai";
  }
  return "diklaim";
}

// ============ KARTU KEAHLIAN ============

type KeahlianMentah = Omit<KartuKeahlian, "lapis">;

const KEAHLIAN_WARTO_MENTAH: KeahlianMentah[] = [
  {
    id: "kkh-warto-keramik",
    kartu_id: "kk-warto",
    keahlian_id: "kb-keramik",
    nama_diajukan: null,
    sebutan_pekerja: "keramik",
    level: "ahli",
    kutipan_bukti: "Paling sering keramik karo plester, wis rolas taun aku nggarap omah-omahan.",
    keyakinan: 0.97,
    sumber: "ai",
    dikonfirmasi_pekerja: true,
  },
  {
    id: "kkh-warto-plester",
    kartu_id: "kk-warto",
    keahlian_id: "kb-plester",
    nama_diajukan: null,
    sebutan_pekerja: "plester, ngaci",
    level: "ahli",
    kutipan_bukti: "Plester aci iki wis mesti rata, wong wis puluhan omah tak garap.",
    keyakinan: 0.96,
    sumber: "ai",
    dikonfirmasi_pekerja: true,
  },
  {
    id: "kkh-warto-tukang",
    kartu_id: "kk-warto",
    keahlian_id: "kb-tukang-umum",
    nama_diajukan: null,
    sebutan_pekerja: "tukang batu",
    level: "ahli",
    kutipan_bukti: "Kuli bangunan wis tak lakoni sak umur-umur, lulusan SD langsung melu proyek.",
    keyakinan: 0.94,
    sumber: "ai",
    dikonfirmasi_pekerja: true,
  },
  {
    id: "kkh-warto-cor",
    kartu_id: "kk-warto",
    keahlian_id: "kb-cor",
    nama_diajukan: null,
    sebutan_pekerja: "ngecor",
    level: "terampil",
    kutipan_bukti: "Ngecor dak lantai loro ya tau, biasane rame-rame, aku sing ngatur campuran.",
    keyakinan: 0.9,
    sumber: "ai",
    dikonfirmasi_pekerja: true,
  },
  {
    id: "kkh-warto-cat",
    kartu_id: "kk-warto",
    keahlian_id: "kb-cat",
    nama_diajukan: null,
    sebutan_pekerja: "ngecet",
    level: "terampil",
    kutipan_bukti: "Ngecet tembok omah ya biasa, hasile rapi, ora beleber.",
    keyakinan: 0.86,
    sumber: "ai",
    dikonfirmasi_pekerja: true,
  },
  {
    id: "kkh-warto-gambar",
    kartu_id: "kk-warto",
    keahlian_id: null,
    nama_diajukan: "membaca gambar kerja",
    sebutan_pekerja: "maca gambar",
    level: "terampil",
    kutipan_bukti: "Aku iso maca gambar sithik-sithik, sing penting ana ukurane.",
    keyakinan: 0.82,
    sumber: "ai",
    dikonfirmasi_pekerja: true,
  },
];

export const keahlianWarto: KartuKeahlian[] = KEAHLIAN_WARTO_MENTAH.map((k) => ({
  ...k,
  lapis: hitungLapis(k.keahlian_id),
}));

export const keahlianJoko: KartuKeahlian[] = [
  { id: "kkh-joko-montir", kartu_id: "kk-joko", keahlian_id: "kb-montir-motor", nama_diajukan: null, sebutan_pekerja: "montir", level: "ahli", kutipan_bukti: "Montir motor wis wolu taun, saka bengkel tekan panggilan omah.", keyakinan: 0.95, sumber: "ai", dikonfirmasi_pekerja: true, lapis: "terverifikasi" },
  { id: "kkh-joko-tambal", kartu_id: "kk-joko", keahlian_id: "kb-tambal-ban", nama_diajukan: null, sebutan_pekerja: "tambal ban", level: "terampil", kutipan_bukti: "Tambal tubeless ya bisa, biasa sekalian servis ringan.", keyakinan: 0.88, sumber: "ai", dikonfirmasi_pekerja: true, lapis: "dinilai" },
];

export const keahlianBangun: KartuKeahlian[] = [
  { id: "kkh-bangun-kayu", kartu_id: "kk-bangun", keahlian_id: "kb-kayu", nama_diajukan: null, sebutan_pekerja: "tukang kayu", level: "ahli", kutipan_bukti: "Kusen, lemari, kitchen set — rong puluh taun wis biasa.", keyakinan: 0.96, sumber: "ai", dikonfirmasi_pekerja: true, lapis: "terverifikasi" },
];

export const keahlianAminah: KartuKeahlian[] = [
  { id: "kkh-aminah-prt", kartu_id: "kk-aminah", keahlian_id: "kb-prt", nama_diajukan: null, sebutan_pekerja: "mbantu rumah tangga", level: "terampil", kutipan_bukti: "Wis enem taun mbantu beres-beres omah, masak, lan nyuci.", keyakinan: 0.9, sumber: "ai", dikonfirmasi_pekerja: true, lapis: "diklaim" },
  { id: "kkh-aminah-anak", kartu_id: "kk-aminah", keahlian_id: "kb-merawat-anak", nama_diajukan: null, sebutan_pekerja: "momong bocah", level: "terampil", kutipan_bukti: "Tau momong bocah loro taun setengah, sabar, wis biasa.", keyakinan: 0.87, sumber: "ai", dikonfirmasi_pekerja: true, lapis: "diklaim" },
];

/** Statistik ringkas Pak Warto, dihitung dari riwayat — untuk KartuKerjaVisual */
export const statistikWarto = {
  jumlahPekerjaanSelesai: riwayatWarto.length,
  jumlahPenilai: penilaianWarto.length,
  rataRataPenilaian:
    Math.round(
      (penilaianWarto.reduce((a, n) => a + n.skor, 0) / penilaianWarto.length) * 10,
    ) / 10,
};

// ============ UPAH TERANG (deterministik — AI tidak pernah menyentuh angka) ============

/** Laporan lapangan contoh: (keahlian, wilayah) → median lapangan */
const LAPORAN_LAPANGAN: Record<string, { median: number; jumlah: number }> = {
  "kb-keramik:wl-kota-malang": { median: 175000, jumlah: 14 },
  "kb-plester:wl-kota-malang": { median: 162000, jumlah: 9 },
  "kb-tukang-umum:wl-kota-malang": { median: 150000, jumlah: 21 },
  "kb-plester:wl-kab-malang": { median: 163000, jumlah: 7 },
  "kb-montir-motor:wl-kab-sidoarjo": { median: 268000, jumlah: 5 },
};

function bulatkanRibu(n: number): number {
  return Math.round(n / 1000) * 1000;
}

/**
 * Acuan Upah Terang: max(UMK/26 × pengali, median lapangan).
 * Baris Math.max ini keputusan produk: platform tidak meneguhkan upah rendah.
 */
export function acuanUntuk(keahlianId: string, wilayahId: string): AcuanUpah {
  const kb = keahlianBaku.find((k) => k.id === keahlianId);
  const wl = wilayah.find((w) => w.id === wilayahId);
  if (!kb || !wl) throw new Error(`acuanUntuk: tidak dikenal ${keahlianId} / ${wilayahId}`);
  const acuanAturan = bulatkanRibu((wl.umk / 26) * kb.pengali_upah);
  const lapangan = LAPORAN_LAPANGAN[`${keahlianId}:${wilayahId}`];
  if (lapangan) {
    return {
      id: `au-${keahlianId}-${wilayahId}`,
      keahlian_id: keahlianId,
      wilayah_id: wilayahId,
      acuan_harian: Math.max(acuanAturan, lapangan.median),
      metode: "umk_dan_lapangan",
      jumlah_laporan: lapangan.jumlah,
    };
  }
  return {
    id: `au-${keahlianId}-${wilayahId}`,
    keahlian_id: keahlianId,
    wilayah_id: wilayahId,
    acuan_harian: acuanAturan,
    metode: "umk_saja",
    jumlah_laporan: 0,
  };
}

// ============ LOWONGAN (15: 8 aman, 4 hati-hati, 3 berpola penipuan) ============

export const lowongan: Lowongan[] = [
  // --- AMAN ---
  {
    id: "lw-01", pemberi_kerja_id: "u-hadi", wilayah_id: "wl-kota-malang",
    teks_asli: "Butuh tukang pasang keramik untuk lantai ruang tamu dan dapur rumah saya di Blimbing, luas sekitar 42 m². Keramik sudah saya sediakan. Upah Rp180.000 per hari, makan siang disediakan. Mulai Senin 3 Agustus, perkiraan 10 hari kerja. Hubungi Hadi.",
    judul_baku: "Pasang keramik lantai rumah, Blimbing", bidang_id: "bd-konstruksi",
    jenis_kerja: "harian", jumlah_pekerja: 1, upah_ditawarkan: 180000, satuan_upah: "harian",
    lokasi_teks: "Blimbing, Kota Malang", mulai: "2026-08-03",
    syarat_tersirat: ["perkiraan 10 hari kerja", "makan siang disediakan"], status: "tayang",
    keahlian_ids: ["kb-keramik"], jarak_km: 3.2,
    alasan_cocok: "Cocok karena keramik adalah keahlian utama Anda yang sudah terverifikasi.",
  },
  {
    id: "lw-02", pemberi_kerja_id: "u-rina", wilayah_id: "wl-kab-malang",
    teks_asli: "Renovasi rumah dua lantai di Karangploso, perlu plester dan aci seluruh dinding dalam. Borongan Rp4.500.000, bahan dari kami. Target selesai tiga minggu. Bisa mulai pertengahan Agustus. Yang penting rapi dan tepat waktu.",
    judul_baku: "Plester rumah dua lantai, Karangploso", bidang_id: "bd-konstruksi",
    jenis_kerja: "borongan", jumlah_pekerja: 1, upah_ditawarkan: 4500000, satuan_upah: "borongan",
    lokasi_teks: "Karangploso, Kabupaten Malang", mulai: "2026-08-17",
    syarat_tersirat: ["target tiga minggu", "bahan disediakan"], status: "tayang",
    keahlian_ids: ["kb-plester"], jarak_km: 8.5,
    alasan_cocok: "Cocok karena Anda ahli plester dan bersedia kerja borongan.",
  },
  {
    id: "lw-03", pemberi_kerja_id: "u-sari", wilayah_id: "wl-kota-malang",
    teks_asli: "Renovasi kamar mandi di rumah kami, daerah Dinoyo. Ganti keramik lantai dan dinding, plus plester ulang sebagian. Perkiraan seminggu. Upah Rp175.000 per hari. Mulai awal Agustus.",
    judul_baku: "Renovasi kamar mandi, Dinoyo", bidang_id: "bd-konstruksi",
    jenis_kerja: "harian", jumlah_pekerja: 1, upah_ditawarkan: 175000, satuan_upah: "harian",
    lokasi_teks: "Dinoyo, Kota Malang", mulai: "2026-08-04",
    syarat_tersirat: ["perkiraan satu minggu"], status: "tayang",
    keahlian_ids: ["kb-keramik", "kb-plester"], jarak_km: 5.1,
    alasan_cocok: "Cocok karena Anda menguasai keramik dan plester sekaligus.",
  },
  {
    id: "lw-04", pemberi_kerja_id: "u-hadi", wilayah_id: "wl-kab-malang",
    teks_asli: "Cor dak lantai dua rumah di Pakis, luas 60 m². Perlu 3 orang, kerja tim dua hari berturut-turut. Upah Rp165.000 per hari per orang. Alat molen kami sewa. Mulai 10 Agustus pagi-pagi.",
    judul_baku: "Cor dak lantai dua, Pakis", bidang_id: "bd-konstruksi",
    jenis_kerja: "harian", jumlah_pekerja: 3, upah_ditawarkan: 165000, satuan_upah: "harian",
    lokasi_teks: "Pakis, Kabupaten Malang", mulai: "2026-08-10",
    syarat_tersirat: ["kerja tim", "dua hari berturut-turut"], status: "tayang",
    keahlian_ids: ["kb-cor"], jarak_km: 11.4,
    alasan_cocok: "Cocok karena Anda terampil ngecor dan biasa kerja tim.",
  },
  {
    id: "lw-05", pemberi_kerja_id: "u-eko", wilayah_id: "wl-kota-malang",
    teks_asli: "Pembangunan ruko dua lantai di Jalan Raya Sawojajar perlu tukang bangunan harian. Upah Rp168.000 per hari, kerja Senin–Sabtu. Proyek sekitar tiga bulan. Langsung ketemu mandor di lokasi.",
    judul_baku: "Tukang harian pembangunan ruko, Sawojajar", bidang_id: "bd-konstruksi",
    jenis_kerja: "harian", jumlah_pekerja: 2, upah_ditawarkan: 168000, satuan_upah: "harian",
    lokasi_teks: "Sawojajar, Kota Malang", mulai: "2026-08-03",
    syarat_tersirat: ["proyek tiga bulan", "kerja Senin sampai Sabtu"], status: "tayang",
    keahlian_ids: ["kb-tukang-umum"], jarak_km: 6.8,
    alasan_cocok: "Cocok karena Anda tukang bangunan umum dengan 12 tahun pengalaman.",
  },
  {
    id: "lw-06", pemberi_kerja_id: "u-rina", wilayah_id: "wl-kab-malang",
    teks_asli: "Pengecatan rumah baru di Wagir, dua lantai, dalam dan luar. Borongan Rp3.200.000 termasuk plitur pagar. Cat kami beli sesuai pilihan Anda. Waktu fleksibel bulan Agustus.",
    judul_baku: "Pengecatan rumah baru, Wagir", bidang_id: "bd-konstruksi",
    jenis_kerja: "borongan", jumlah_pekerja: 1, upah_ditawarkan: 3200000, satuan_upah: "borongan",
    lokasi_teks: "Wagir, Kabupaten Malang", mulai: "2026-08-08",
    syarat_tersirat: ["waktu fleksibel"], status: "tayang",
    keahlian_ids: ["kb-cat"], jarak_km: 9.7,
    alasan_cocok: "Cocok karena Anda terampil mengecat dan hasilnya dinilai rapi.",
  },
  {
    id: "lw-07", pemberi_kerja_id: "u-eko", wilayah_id: "wl-kab-sidoarjo",
    teks_asli: "Bengkel motor di Krian cari montir tetap. Gaji Rp3.100.000 per bulan, hari kerja Senin–Sabtu, libur hari Minggu. Bengkel ramai servis rutin dan ganti oli. Bisa mulai bulan depan.",
    judul_baku: "Montir motor tetap, Krian", bidang_id: "bd-otomotif",
    jenis_kerja: "paruh_waktu", jumlah_pekerja: 1, upah_ditawarkan: 3100000, satuan_upah: "bulanan",
    lokasi_teks: "Krian, Kabupaten Sidoarjo", mulai: "2026-09-01",
    syarat_tersirat: ["libur hari Minggu"], status: "tayang",
    keahlian_ids: ["kb-montir-motor"], jarak_km: 48.3,
    alasan_cocok: "Di luar bidang utama Anda — ditampilkan untuk contoh KartuLowongan.",
  },
  {
    id: "lw-08", pemberi_kerja_id: "u-dhika", wilayah_id: "wl-kota-surabaya",
    teks_asli: "Gudang sembako kami di Margorejo butuh buruh angkut harian untuk bongkar muat karung dan kardus. Upah Rp150.000 per hari, kerja jam 7 pagi sampai 3 sore. Makan siang disediakan. Hubungi Dhika.",
    judul_baku: "Buruh angkut gudang sembako, Margorejo", bidang_id: "bd-jasa-harian",
    jenis_kerja: "harian", jumlah_pekerja: 2, upah_ditawarkan: 150000, satuan_upah: "harian",
    lokasi_teks: "Margorejo, Kota Surabaya", mulai: "2026-08-05",
    syarat_tersirat: ["jam kerja 07.00–15.00", "makan siang disediakan"], status: "tayang",
    keahlian_ids: ["kb-buruh-angkut"], jarak_km: 88.0,
    alasan_cocok: "Di luar jangkauan Anda — contoh untuk dasbor Mbak Dhika.",
  },
  // --- HATI-HATI ---
  {
    id: "lw-09", pemberi_kerja_id: "u-sari", wilayah_id: "wl-kota-malang",
    teks_asli: "Butuh tukang untuk proyek besar sekitar Malang. Upah nego tergantung kemampuan. Nanti dijelaskan pas ketemu. Langsung hubungi nomor ini, jangan banyak tanya dulu.",
    judul_baku: "Tukang proyek besar, Malang", bidang_id: "bd-konstruksi",
    jenis_kerja: "harian", jumlah_pekerja: 5, upah_ditawarkan: 150000, satuan_upah: "harian",
    lokasi_teks: "sekitar Malang", mulai: "2026-08-06",
    syarat_tersirat: ["lokasi tidak jelas", "upah nego"], status: "tayang",
    keahlian_ids: ["kb-tukang-umum"], jarak_km: 7.5,
    alasan_cocok: "Sesuai bidang Anda, tapi ada beberapa hal yang sebaiknya ditanyakan dulu.",
  },
  {
    id: "lw-10", pemberi_kerja_id: "u-eko", wilayah_id: "wl-kab-malang",
    teks_asli: "Pasang keramik perumahan baru di Singosari, banyak unit, kerja berkelanjutan. Upah Rp150.000 per hari. Kalau cocok lanjut terus sampai akhir tahun.",
    judul_baku: "Pasang keramik perumahan, Singosari", bidang_id: "bd-konstruksi",
    jenis_kerja: "harian", jumlah_pekerja: 4, upah_ditawarkan: 150000, satuan_upah: "harian",
    lokasi_teks: "Singosari, Kabupaten Malang", mulai: "2026-08-11",
    syarat_tersirat: ["kerja berkelanjutan"], status: "tayang",
    keahlian_ids: ["kb-keramik"], jarak_km: 14.2,
    alasan_cocok: "Cocok karena keramik keahlian utama Anda, tapi upahnya sedikit di bawah acuan.",
  },
  {
    id: "lw-11", pemberi_kerja_id: "u-dhika", wilayah_id: "wl-kab-sleman",
    teks_asli: "Cari pembantu rumah tangga menginap di rumah keluarga kami, Gamping. Kerja beres-beres, masak, dan bantu jaga nenek. Harus tinggal di rumah, pulang hanya sebulan sekali. Gaji Rp2.800.000 per bulan.",
    judul_baku: "Pembantu rumah tangga menginap, Gamping", bidang_id: "bd-rumah-tangga",
    jenis_kerja: "menginap", jumlah_pekerja: 1, upah_ditawarkan: 2800000, satuan_upah: "bulanan",
    lokasi_teks: "Gamping, Kabupaten Sleman", mulai: "2026-08-15",
    syarat_tersirat: ["pulang hanya sebulan sekali"], status: "tayang",
    keahlian_ids: ["kb-prt"], jarak_km: 95.0,
    alasan_cocok: "Di luar bidang Anda — contoh penanda hati-hati untuk demo.",
  },
  {
    id: "lw-12", pemberi_kerja_id: "u-rina", wilayah_id: "wl-kota-surabaya",
    teks_asli: "Perlu kuli pindahan gudang, banyak barang. Upah harian lumayan. Nanti dijemput di Terminal Purabaya, barang diangkut ke lokasi. Hubungi cepat, yang lambat tidak kebagian.",
    judul_baku: "Kuli pindahan gudang, Surabaya", bidang_id: "bd-jasa-harian",
    jenis_kerja: "harian", jumlah_pekerja: 6, upah_ditawarkan: 140000, satuan_upah: "harian",
    lokasi_teks: "dijemput di Terminal Purabaya", mulai: "2026-08-07",
    syarat_tersirat: ["lokasi kerja tidak disebutkan", "dijemput di terminal"], status: "tayang",
    keahlian_ids: ["kb-buruh-angkut"], jarak_km: 86.5,
    alasan_cocok: "Di luar jangkauan Anda — contoh lokasi kabur untuk demo.",
  },
  // --- BERISIKO TINGGI (pola penipuan nyata, untuk demo Saringan Aman) ---
  {
    id: "lw-13", pemberi_kerja_id: "u-sari", wilayah_id: "wl-kota-surabaya",
    teks_asli: "LOWONGAN TERBATAS! Proyek apartemen Surabaya butuh tukang bangunan, gaji Rp350.000 per hari!! Hanya untuk 3 orang pertama. Wajib kirim biaya administrasi Rp150.000 untuk seragam dan ID card proyek. SEGERA hubungi sekarang sebelum penuh!!",
    judul_baku: "Tukang proyek apartemen, Surabaya", bidang_id: "bd-konstruksi",
    jenis_kerja: "harian", jumlah_pekerja: 3, upah_ditawarkan: 350000, satuan_upah: "harian",
    lokasi_teks: "Surabaya (detail menyusul)", mulai: "2026-08-03",
    syarat_tersirat: ["minta biaya administrasi", "mendesak segera", "upah jauh di atas wajar"], status: "tayang",
    keahlian_ids: ["kb-tukang-umum"], jarak_km: 87.0,
    alasan_cocok: "Sesuai bidang Anda, tetapi Saringan Aman menemukan beberapa tanda bahaya.",
  },
  {
    id: "lw-14", pemberi_kerja_id: "u-eko", wilayah_id: "wl-kab-sidoarjo",
    teks_asli: "Dibutuhkan pekerja gudang pabrik besar. Lokasi dirahasiakan demi keamanan perusahaan. Gaji pokok tinggi plus bonus mingguan. Pendaftaran Rp100.000 via transfer, kuota hanya hari ini. Jangan tanya-tanya dulu, langsung daftar.",
    judul_baku: "Pekerja gudang pabrik, Sidoarjo", bidang_id: "bd-jasa-harian",
    jenis_kerja: "harian", jumlah_pekerja: 10, upah_ditawarkan: 250000, satuan_upah: "harian",
    lokasi_teks: "dirahasiakan", mulai: "2026-08-04",
    syarat_tersirat: ["lokasi dirahasiakan", "minta biaya pendaftaran", "kuota mendesak"], status: "tayang",
    keahlian_ids: ["kb-buruh-angkut"], jarak_km: 46.0,
    alasan_cocok: "Saringan Aman menemukan beberapa tanda bahaya pada lowongan ini.",
  },
  {
    id: "lw-15", pemberi_kerja_id: "u-sari", wilayah_id: "wl-kab-malang",
    teks_asli: "Pekerja serabutan diutamakan bisa segala. Gaji besar dibayar mingguan. Kirim foto KTP dan biaya jaminan Rp200.000 (dikembalikan setelah kerja). Langsung kerja besok, tanpa wawancara. Jangan sampai menyesal!",
    judul_baku: "Pekerja serabutan, Malang", bidang_id: "bd-jasa-harian",
    jenis_kerja: "harian", jumlah_pekerja: 5, upah_ditawarkan: 300000, satuan_upah: "harian",
    lokasi_teks: "Malang (nanti diinfokan)", mulai: "2026-08-02",
    syarat_tersirat: ["minta foto KTP", "minta biaya jaminan", "tanpa wawancara"], status: "tayang",
    keahlian_ids: ["kb-tukang-umum"], jarak_km: 5.0,
    alasan_cocok: "Saringan Aman menemukan beberapa tanda bahaya pada lowongan ini.",
  },
];

// ============ SARINGAN AMAN ============

export const saringanAman: SaringanAman[] = [
  ...lowongan
    .filter((l) => ["lw-01", "lw-02", "lw-03", "lw-04", "lw-05", "lw-06", "lw-07", "lw-08"].includes(l.id))
    .map((l, i) => ({
      id: `sa-${l.id}`,
      lowongan_id: l.id,
      skor_risiko: 8 + i,
      tingkat: "aman" as const,
      temuan: [],
      pertanyaan_disarankan: [
        "Berapa lama perkiraan pekerjaan ini berlangsung?",
        "Kapan dan bagaimana upah akan dibayar?",
        "Apakah bahan dan alat disediakan, atau saya yang membawa?",
      ],
    })),
  {
    id: "sa-lw-09",
    lowongan_id: "lw-09",
    skor_risiko: 48,
    tingkat: "hati_hati",
    temuan: [
      { jenis: "lokasi_tidak_jelas", kutipan: "proyek besar sekitar Malang", penjelasan: "Alamat kerja tidak disebutkan dengan jelas." },
      { jenis: "upah_tidak_jelas", kutipan: "Upah nego tergantung kemampuan", penjelasan: "Besaran upah tidak ditulis, baru dijelaskan saat bertemu." },
    ],
    pertanyaan_disarankan: [
      "Di mana alamat pasti lokasi proyeknya?",
      "Berapa upah per hari yang pasti, sebelum saya datang?",
      "Siapa nama mandor atau pemilik proyek yang bisa saya hubungi?",
    ],
  },
  {
    id: "sa-lw-10",
    lowongan_id: "lw-10",
    skor_risiko: 35,
    tingkat: "hati_hati",
    temuan: [
      { jenis: "upah_di_bawah_acuan", kutipan: "Upah Rp150.000 per hari", penjelasan: "Upah sedikit di bawah acuan Upah Terang untuk keramik di Kabupaten Malang." },
    ],
    pertanyaan_disarankan: [
      "Apakah upah bisa disesuaikan dengan acuan daerah, sekitar Rp175.000 per hari?",
      "Apakah makan siang atau transport disediakan sebagai tambahan?",
      "Berapa unit pasti yang akan dikerjakan?",
    ],
  },
  {
    id: "sa-lw-11",
    lowongan_id: "lw-11",
    skor_risiko: 52,
    tingkat: "hati_hati",
    temuan: [
      { jenis: "syarat_ketat", kutipan: "pulang hanya sebulan sekali", penjelasan: "Aturan pulang yang sangat jarang perlu dipahami dulu sebelum setuju." },
      { jenis: "tugas_ganda", kutipan: "beres-beres, masak, dan bantu jaga nenek", penjelasan: "Ada tiga jenis pekerjaan sekaligus — tanyakan mana yang utama." },
    ],
    pertanyaan_disarankan: [
      "Apakah ada hari libur selain pulang sebulan sekali?",
      "Jam kerjanya dari jam berapa sampai jam berapa?",
      "Pekerjaan mana yang paling utama: beres-beres, masak, atau menjaga nenek?",
    ],
  },
  {
    id: "sa-lw-12",
    lowongan_id: "lw-12",
    skor_risiko: 58,
    tingkat: "hati_hati",
    temuan: [
      { jenis: "lokasi_tidak_jelas", kutipan: "Nanti dijemput di Terminal Purabaya", penjelasan: "Lokasi kerja tidak disebutkan, pekerja diminta menunggu jemputan." },
      { jenis: "mendesak", kutipan: "Hubungi cepat, yang lambat tidak kebagian", penjelasan: "Bahasa mendesak sering dipakai agar pekerja tidak sempat bertanya." },
    ],
    pertanyaan_disarankan: [
      "Di mana alamat gudang yang pasti?",
      "Berapa upah per hari secara tertulis sebelum saya berangkat?",
      "Siapa yang menjemput dan bagaimana saya mengenalinya?",
    ],
  },
  {
    id: "sa-lw-13",
    lowongan_id: "lw-13",
    skor_risiko: 92,
    tingkat: "berisiko_tinggi",
    temuan: [
      { jenis: "minta_biaya", kutipan: "Wajib kirim biaya administrasi Rp150.000 untuk seragam dan ID card proyek", penjelasan: "Lowongan asli tidak pernah meminta pekerja membayar lebih dulu." },
      { jenis: "mendesak", kutipan: "SEGERA hubungi sekarang sebelum penuh!!", penjelasan: "Desakan waktu dipakai agar Anda tidak sempat berpikir dan bertanya." },
      { jenis: "upah_tidak_wajar", kutipan: "gaji Rp350.000 per hari", penjelasan: "Upah ini lebih dari dua kali acuan untuk tukang di Surabaya — terlalu bagus untuk menjadi kenyataan." },
    ],
    pertanyaan_disarankan: [
      "Apakah biaya administrasi bisa dipotong dari gaji pertama saja?",
      "Di mana alamat kantor proyek yang bisa saya datangi langsung?",
      "Apa nama resmi perusahaan pemilik proyek apartemen ini?",
      "Bisakah saya bertemu dulu tanpa membayar apa pun?",
    ],
  },
  {
    id: "sa-lw-14",
    lowongan_id: "lw-14",
    skor_risiko: 88,
    tingkat: "berisiko_tinggi",
    temuan: [
      { jenis: "lokasi_dirahasiakan", kutipan: "Lokasi dirahasiakan demi keamanan perusahaan", penjelasan: "Tempat kerja yang sah selalu bisa ditunjukkan sebelum Anda mulai." },
      { jenis: "minta_biaya", kutipan: "Pendaftaran Rp100.000 via transfer", penjelasan: "Pungutan pendaftaran lewat transfer adalah pola penipuan yang paling umum." },
      { jenis: "mendesak", kutipan: "kuota hanya hari ini", penjelasan: "Batas waktu palsu dibuat agar Anda buru-buru membayar." },
    ],
    pertanyaan_disarankan: [
      "Apa nama pabrik dan alamat lengkapnya?",
      "Mengapa pendaftaran harus lewat transfer, bukan di tempat?",
      "Bisakah saya melihat lokasi kerja dulu sebelum memutuskan?",
      "Siapa penanggung jawab yang bisa saya temui langsung?",
    ],
  },
  {
    id: "sa-lw-15",
    lowongan_id: "lw-15",
    skor_risiko: 90,
    tingkat: "berisiko_tinggi",
    temuan: [
      { jenis: "minta_biaya", kutipan: "biaya jaminan Rp200.000 (dikembalikan setelah kerja)", penjelasan: "Janji uang kembali setelah kerja hampir tidak pernah ditepati." },
      { jenis: "minta_data_diri", kutipan: "Kirim foto KTP", penjelasan: "Foto KTP bisa disalahgunakan untuk pinjaman atau penipuan atas nama Anda." },
      { jenis: "terlalu_mudah", kutipan: "Langsung kerja besok, tanpa wawancara", penjelasan: "Pekerjaan asli selalu ingin mengenal pekerjanya dulu." },
    ],
    pertanyaan_disarankan: [
      "Mengapa perlu foto KTP sebelum bertemu langsung?",
      "Di mana alamat tempat kerjanya, bisa saya lihat dulu?",
      "Apakah jaminan bisa diganti pertemuan langsung tanpa uang?",
      "Bagaimana bentuk kesepakatan upah mingguannya, tertulis atau lisan?",
    ],
  },
];

// ============ LAMARAN ============

export const lamaran: Lamaran[] = [
  { id: "lm-01", lowongan_id: "lw-02", pekerja_id: "u-warto", status: "diundang", alasan_cocok: ["Ahli plester terverifikasi", "Bersedia borongan", "Jarak 8,5 km masih dalam jangkauan"] },
  { id: "lm-02", lowongan_id: "lw-03", pekerja_id: "u-warto", status: "dilamar", alasan_cocok: ["Keramik dan plester keduanya terverifikasi"] },
  { id: "lm-03", lowongan_id: "lw-05", pekerja_id: "u-warto", status: "dilamar", alasan_cocok: ["12 tahun pengalaman tukang bangunan"] },
  { id: "lm-04", lowongan_id: "lw-08", pekerja_id: "u-rudi", status: "dilamar", alasan_cocok: ["Bersedia kerja angkut, jarak jauh tapi sanggup"] },
  { id: "lm-05", lowongan_id: "lw-08", pekerja_id: "u-yanti", status: "diundang", alasan_cocok: ["Domisili Surabaya, dekat dengan gudang"] },
  { id: "lm-06", lowongan_id: "lw-07", pekerja_id: "u-joko", status: "disepakati", alasan_cocok: ["Montir motor terverifikasi, 8 tahun pengalaman"] },
  { id: "lm-07", lowongan_id: "lw-11", pekerja_id: "u-aminah", status: "dilamar", alasan_cocok: ["Pengalaman PRT 6 tahun, bersedia menginap"] },
];

// ============ KESEPAKATAN KERJA ============

export const kesepakatan: KesepakatanKerja[] = [
  {
    id: "ks-01",
    lowongan_id: "lw-01",
    pekerja_id: "u-warto",
    pemberi_kerja_id: "u-hadi",
    lingkup:
      "Pasang keramik lantai ruang tamu dan dapur rumah Pak Hadi di Blimbing, luas sekitar 42 m². Keramik dan bahan disediakan pemberi kerja. Perkiraan 10 hari kerja, makan siang disediakan.",
    upah_disepakati: 180000,
    satuan: "harian",
    mulai: "2026-08-03",
    selesai: null,
    tanggal_bayar_dijanjikan: "2026-08-15",
    status: "berjalan",
  },
  {
    id: "ks-02",
    lowongan_id: "lw-07",
    pekerja_id: "u-joko",
    pemberi_kerja_id: "u-eko",
    lingkup:
      "Montir tetap di Bengkel Motor Pak Eko, Krian. Servis rutin, ganti oli, dan perbaikan ringan. Hari kerja Senin–Sabtu, libur Minggu.",
    upah_disepakati: 3100000,
    satuan: "bulanan",
    mulai: "2026-09-01",
    selesai: null,
    tanggal_bayar_dijanjikan: "2026-10-01",
    status: "menunggu",
  },
];

/** Kesepakatan aktif Pak Warto — untuk demo halaman kesepakatan */
export const kesepakatanAktifWarto = kesepakatan.find((k) => k.id === "ks-01")!;

// ============ NGOBROL KERJA — 6 PUTARAN (gaya Bagian 10.4) ============

export const putaranWawancaraWarto: PutaranWawancara[] = [
  {
    nomor: 1,
    pertanyaan: "Pak Warto, kerja apa yang paling sering Bapak kerjakan?",
    transkrip: "Paling sering keramik karo plester, wis rolas taun aku nggarap omah-omahan.",
    sinyal_ditangkap: ["pemasangan keramik", "plesteran", "pengalaman 12 tahun"],
    dibuat_pada: "2025-11-01T08:02:00+07:00",
  },
  {
    nomor: 2,
    pertanyaan: "Boleh diceritakan, kerjaan terakhir Bapak di mana dan berapa lama?",
    transkrip: "K wingi iku nang Blimbing, omahe Pak Hadi, lantai loro. Telulas dina rampung.",
    sinyal_ditangkap: ["proyek terakhir di Blimbing", "rumah dua lantai", "12 hari kerja"],
    dibuat_pada: "2025-11-01T08:05:00+07:00",
  },
  {
    nomor: 3,
    pertanyaan: "Kalau ngecor, Bapak biasanya bagian apa?",
    transkrip: "Ngecor dak lantai loro ya tau, biasane rame-rame kanca sekampung, aku sing ngatur campuran.",
    sinyal_ditangkap: ["pengecoran", "mengatur campuran adukan", "biasa kerja tim"],
    dibuat_pada: "2025-11-01T08:08:00+07:00",
  },
  {
    nomor: 4,
    pertanyaan: "Bapak bisa membaca gambar kerja dari mandor?",
    transkrip: "Aku iso maca gambar sithik-sithik, sing penting ana ukurane.",
    sinyal_ditangkap: ["bisa membaca gambar kerja sederhana"],
    dibuat_pada: "2025-11-01T08:11:00+07:00",
  },
  {
    nomor: 5,
    pertanyaan: "Alat apa saja yang Bapak punya sendiri?",
    transkrip: "Ana jidar, cetong, benang, waterpass, gerinda cilik. Sing gedhe-gedhe biasane disiapne sing duwe omah.",
    sinyal_ditangkap: ["punya alat sendiri", "waterpass", "gerinda kecil"],
    dibuat_pada: "2025-11-01T08:14:00+07:00",
  },
  {
    nomor: 6,
    pertanyaan: "Bapak bersedia kerja di luar Kota Malang?",
    transkrip: "Isih isa, sing penting ono kesepakatan dhisik soal upah karo akomodasi.",
    sinyal_ditangkap: ["bersedia ke luar kota", "butuh kesepakatan upah dan akomodasi di awal"],
    dibuat_pada: "2025-11-01T08:17:00+07:00",
  },
];
