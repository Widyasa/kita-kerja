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

const DEMO_PASSWORD = process.env.DEMO_FALLBACK_PASSWORD ?? "kitakerja-demo-2026";

function uuid(): string {
  return crypto.randomUUID();
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
  catatan: string;
}[] = [
  { lingkup: "Pasang keramik lantai 60x60 ruang tamu dan kamar", upah: 4200000, satuan: "borongan", mulai: "2026-02-03", selesai: "2026-02-11", skor: 5, catatan: "Rapi, nat lurus semua. Datang tepat waktu." },
  { lingkup: "Plester dan aci dinding belakang rumah", upah: 175000, satuan: "harian", mulai: "2026-03-09", selesai: "2026-03-17", skor: 5, catatan: "Hasil acian halus, tidak perlu diulang." },
  { lingkup: "Pasang bata expose pagar depan", upah: 3800000, satuan: "borongan", mulai: "2026-04-06", selesai: "2026-04-15", skor: 4, catatan: "Bagus, hanya selesai mundur dua hari karena hujan." },
  { lingkup: "Perbaikan keramik kamar mandi bocor", upah: 165000, satuan: "harian", mulai: "2026-05-11", selesai: "2026-05-14", skor: 5, catatan: "Cepat dan bersih, bocornya berhenti." },
  { lingkup: "Plester dekoratif tekstur kasar dinding teras", upah: 2600000, satuan: "borongan", mulai: "2026-06-08", selesai: "2026-06-13", skor: 5, catatan: "Teksturnya persis seperti yang saya minta." },
  { lingkup: "Pasang keramik dinding dapur", upah: 180000, satuan: "harian", mulai: "2026-07-06", selesai: "2026-07-10", skor: 4, catatan: "Kerja baik, alat dibawa sendiri." },
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

// Test users — created via admin.createUser (phone OTP flow)
const testUsers = [
  { email: "warto@kitakerja.test", phone: "+6281234567890", nama: "Warto Sugianto", peran: "pekerja", wilayah_nama: "Kota Malang" },
  { email: "dhika@kitakerja.test", phone: "+6281234567891", nama: "Dhika Ayu Permata", peran: "pemberi_kerja", wilayah_nama: "Kota Malang" },
  { email: "slamet@kitakerja.test", phone: "+6281234567892", nama: "Slamet Riyadi", peran: "pendamping", wilayah_nama: "Kota Malang" },
  { email: "yanti@kitakerja.test", phone: "+6281234567893", nama: "Yanti Puspitasari", peran: "pekerja", wilayah_nama: "Kota Surabaya" },
];

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
    const { data, error } = await supabase
      .from("wilayah")
      .upsert({ id: uuid(), ...w }, { onConflict: "nama,provinsi", ignoreDuplicates: false })
      .select("id")
      .single();
    if (error || !data) {
      console.error("  wilayah error:", error?.message ?? "tidak ada baris kembali");
      continue;
    }
    // id diambil dari baris hasil upsert, bukan uuid() lokal, supaya saat
    // baris sudah ada seluruh relasi tetap menunjuk id kanonik yang sama.
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
    const id = uuid();
    bidangMap.set(b.nama, id);
    const { error } = await supabase.from("bidang_kerja").insert({ id, ...b });
    if (error) console.error("  bidang error:", error.message);
    else console.log("  ✅ Bidang:", b.nama);
  }

  // 3. Keahlian Baku
  const keahlianMap = new Map<string, string>();
  for (const k of keahlianData) {
    const id = uuid();
    keahlianMap.set(k.nama_baku, id);
    const bidang_id = bidangMap.get(k.bidang_nama);
    if (!bidang_id) {
      console.error("  bidang not found:", k.bidang_nama);
      continue;
    }
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

  // 5. Pengguna test (via admin.createUser + insert pengguna)
  const userMap = new Map<string, string>(); // email -> id
  for (const u of testUsers) {
    const wilayah_id = wilayahMap.get(u.wilayah_nama) ?? null;

    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      phone: u.phone,
      password: DEMO_PASSWORD,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { nama: u.nama },
    });

    if (authErr) {
      console.error("  auth error:", authErr.message);
      // try to fetch existing
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((x) => x.email === u.email);
      if (existing) {
        userMap.set(u.email, existing.id);
        await supabase.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD });
        console.log("  ⚠️  User exists:", u.nama);
      }
      continue;
    }

    if (authUser?.user) {
      userMap.set(u.email, authUser.user.id);
      const { error } = await supabase.from("pengguna").insert({
        id: authUser.user.id,
        nama: u.nama,
        no_hp: u.phone,
        peran: u.peran,
        wilayah_id,
        url_foto: null,
        status_verifikasi: "hp_terverifikasi",
        didampingi_oleh: null,
      });
      if (error) console.error("  pengguna error:", error.message);
      else console.log("  ✅ Pengguna:", u.nama, `(${u.peran})`);
    }
  }

  // 6. Kartu Kerja untuk pekerja test (Warto)
  const wartoId = userMap.get("warto@kitakerja.test");
  if (wartoId) {
    const kartuId = uuid();
    const { error } = await supabase.from("kartu_kerja").insert({
      id: kartuId,
      pekerja_id: wartoId,
      // BUG-003 — token dibuat tetap agar cocok dengan tautan "Contoh
      // verifikasi kartu" di beranda. Sebelumnya token diacak tiap seed,
      // sehingga /verify/9f3c1a7b… selalu membalas "Kartu tidak ditemukan".
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
    });
    if (error) console.error("  kartu_kerja error:", error.message);
    else console.log("  ✅ Kartu Kerja: Warto");

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

        const { error: eNil } = await supabase.from("penilaian").insert({
          id: uuid(),
          pekerjaan_id: pekerjaanId,
          pemberi_kerja_id: dhikaId,
          skor: r.skor,
          catatan: r.catatan,
        });
        if (eNil) console.error("  penilaian riwayat error:", eNil.message);
        else console.log("  ✅ Riwayat:", r.lingkup.slice(0, 40));
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

  console.log("\n🎉 Seeding selesai!");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
