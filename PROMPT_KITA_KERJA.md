# **KITA KERJA** 

## **Dokumen Prompt Pembangunan Website** 

Spesifikasi teknis dan desain menyeluruh untuk dipakai sebagai prompt pembangunan aplikasi web Web Development Competition — Veternity Beraksi 2026 — Sub-tema 1: Informal Job Portal & Local Network Service 

**BAGIAN 0 — Cara memakai dokumen ini** 

Dokumen ini adalah **prompt pembangunan** , bukan laporan. Isinya ditulis sebagai instruksi kepada agen pembangun kode. 

#### **Cara pakai:** 

1. Berikan seluruh dokumen ini sebagai konteks awal kepada agen pembangun. 

2. Perintahkan agen mengerjakan **per bagian** , mengikuti urutan di Bagian 20. Jangan minta seluruh aplikasi dalam satu perintah — hasilnya akan dangkal dan banyak bagian yang mengambang. 

3. Bagian 2 (Aturan Mutlak) adalah pagar. Setiap keluaran kode harus diperiksa terhadap bagian itu. 

4. Bagian 18 (Kriteria Selesai) adalah alat uji. Jangan menyatakan sebuah fitur selesai sebelum semua butir centangnya terpenuhi. 

**Prioritas ketika waktu menipis:** kerjakan sesuai urutan Bagian 20 dan potong dari belakang. Yang tidak boleh dipotong: Ngobrol Kerja, Kartu Kerja beserta halaman verifikasi QR, dan pencocokan. 

2 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 1 — Ringkasan produk** 

## **1.1 Tesis** 

### **Pekerja informal Indonesia tidak kekurangan pengalaman. Mereka kekurangan bukti.** 

Seorang tukang bangunan dengan pengalaman dua belas tahun tidak memiliki satu pun dokumen yang membuktikannya. Setiap kali bertemu calon pemberi kerja baru, ia kembali ke titik nol. Reputasinya nyata dan bernilai ekonomi, tetapi bersifat **lisan, lokal, dan hangus** ketika ia berpindah tempat. 

Kita Kerja tidak menciptakan lowongan baru. Kita Kerja mengubah pengalaman yang sudah ada menjadi **bukti yang bisa dibawa ke mana pun** . Pencocokan pekerjaan adalah akibat dari itu, bukan intinya. 

## **1.2 Konteks masalah** 

|**Bentuk bukti**|**Pekerja formal**|**Pekerja informal**|
|---|---|---|
|Riwayat pekerjaan tertulis|CV|tidak ada|
|Verifkasi pihak ketiga|surat referensi, ijazah|"tanya saja tetangga saya"|
|Bukti keahlian|sertifkat, portofolio|tidak ada|
|Bukti penghasilan|slip gaji, mutasi rekening|tidak ada|
|Sifat reputasi|portabel, kumulatif|lisan, lokal, hangus|



Data acuan untuk konten aplikasi dan halaman landing: 

- **87,74 juta pekerja informal** per Februari 2026 — 59,42% dari 147,67 juta penduduk bekerja 

- Pekerja formal hanya 59,93 juta orang (40,58%) 

- 

- Bahkan di Jakarta, pekerja informal mencapai 1,98 juta orang (38,13%) 

- 

- **69% populasi unbanked memiliki HP sendiri** ; 33% menyebut jarak sebagai penghalang layanan formal 

- Sekitar **97,7 juta orang dewasa Indonesia unbanked** — terbesar keempat di dunia 

3 

Kita Kerja — Dokumen Prompt Pembangunan 

## **1.3 Enam komponen produk** 

|**Komponen**|**Fungsi**|
|---|---|
|**Ngobrol Kerja**|Wawancara kompetensi adaptif berbasis suara. AI bertanya situasional, pekerja menjawab<br>dengan suara dalam bahasa apa pun termasuk bahasa daerah.|
|**Kartu Kerja**|Kredensial kerja yang bisa dicetak, ber-QR, dan diverifkasi siapa pun tanpa perlu akun. Tiga<br>lapis kepercayaan dibedakan secara visual.|
|**Saringan Aman**|AI menandai pola lowongan berisiko dan mengeluarkan daftar pertanyaan yang sebaiknya<br>ditanyakan pekerja — bukan larangan.|
|**Upah Terang**|Acuan upah per jenis pekerjaan per wilayah berbasis UMK. Lowongan di bawah acuan<br>ditandai.|
|**Kesepakatan**<br>**Kerja**|Perjanjian digital dikonfrmasi OTP dua pihak. Tanpa escrow. Penegakan lewat reputasi.|
|**Pencocokan**|Berbasis taksonomi keahlian, bukan embedding. Alasan pencocokan selalu ditampilkan.|



## **1.4 Tiga peran pengguna** 

**Pekerja** — Pak Warto, 34, tukang bangunan serabutan, Malang. Lulus SMP, HP Android bekas, paket 3 GB. Menganggur 8–12 hari per bulan menunggu panggilan. 

**Pemberi kerja** — Mbak Dhika, 29, pekerja kantoran di Surabaya yang butuh ART tiga kali seminggu. **Bukan HRD.** Tidak akan mengisi formulir panjang. 

**Pendamping** — perangkat kelurahan, karang taruna, atau pengurus RT yang mendampingi pekerja tanpa smartphone. 

Ditambah satu aktor tanpa akun: **Publik** — siapa pun yang memindai QR di Kartu Kerja cetak dan membuka halaman verifikasi. 

4 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 2 — Aturan mutlak** 

Setiap butir di bawah ini bersifat wajib. Pelanggaran satu butir saja merusak integritas produk atau kehilangan nilai penjurian. 

## **2.1 Keamanan** 

1. **<mark>`GEMINI_API_KEY`</mark> hanya ada di sisi server.** Tidak pernah memakai awalan <mark>`NEXT_PUBLIC_` .</mark> Semua panggilan Gemini terjadi di Route Handler atau Server Action. Uji: cari string <mark>`GEMINI`</mark> di seluruh bundel klien — harus nol hasil. 

2. **<mark>`SUPABASE_SERVICE_ROLE_KEY`</mark> hanya di sisi server.** Kunci ini melewati RLS. 

   - **Halaman verifikasi publik memakai token acak** , bukan ID berurutan. Gunakan 

3. 

<mark>`gen_random_uuid()`</mark> atau 22 karakter base62 acak. URL <mark>`/verifikasi/1`</mark> yang bisa dinaikkan menjadi <mark>`/verifikasi/2`</mark> berarti seluruh basis data pekerja dapat dipanen. 

4. **Rekaman audio tidak pernah publik.** Simpan di bucket privat, layani lewat signed URL berumur maksimal 60 detik, dan sediakan tombol hapus permanen bagi pekerja. 

5. **Baris riwayat pekerjaan tidak boleh ditulis dari klien.** Penambahan hanya lewat fungsi server yang memverifikasi kesepakatan dan konfirmasi dua pihak. Jika klien bisa menulis langsung, seluruh nilai Kartu Kerja runtuh. 

6. **Validasi setiap masukan dengan Zod di batas server.** Jangan pernah percaya bentuk data dari klien maupun dari model AI. 

7. **Rate limit semua endpoint AI.** Per pengguna dan global. 

## **2.2 Integritas AI** 

1. **Setiap keahlian wajib menyertakan kutipan ucapan pekerja.** Kolom <mark>`kutipan_bukti`</mark> bersifat <mark>`NOT NULL`</mark> di basis data. Tolak di lapisan server setiap butir keahlian dengan kutipan kosong atau 

kurang dari 3 karakter. AI tidak boleh mengklaim keahlian yang tidak diucapkan. 

2. **AI tidak pernah menyentuh angka upah.** Semua nominal berasal dari basis data dan aturan deterministik. Terapkan penyaring keluaran: hapus setiap pola mata uang <mark>(</mark> <mark>`/Rp\s?[\d.,]+/i` ,</mark> <mark>`/\d+\s? (ribu|juta|rb|k)\b/i` )</mark> dari teks yang dihasilkan AI sebelum ditampilkan. 

3. **AI tidak menentukan status verifikasi.** Verifikasi hanya dari konfirmasi manusia dan aturan sistem. 

4. **AI tidak menyatakan sebuah lowongan pasti penipuan.** Keluarannya berupa temuan berkutipan dan pertanyaan yang disarankan. 

5. **Level keahlian default adalah** **<mark>`terampil` .</mark>** Naikkan ke <mark>`ahli`</mark> hanya jika keyakinan ≥ 0,75 dan kutipan mendukung. Turunkan ke <mark>`pemula`</mark> jika keyakinan < 0,5. Klasifikasi berlebih merugikan pekerja karena ia dikirim ke pekerjaan yang tidak sanggup dikerjakan. 

6. **Jika kuota Gemini habis, aplikasi tetap berfungsi penuh** lewat jalur manual. Yang hilang hanya kemudahan akses, bukan integritas data. Jangan pernah menampilkan galat mentah. 

## **2.3 Aksesibilitas** 

1. **Ukuran teks minimum 15px di seluruh aplikasi.** Layar pekerja memakai body 19px. 

2. **Target sentuh minimum 48×48px.** Tombol aksi utama tinggi 56px. Tombol rekam suara berdiameter 88px. 

5 

Kita Kerja — Dokumen Prompt Pembangunan 

3. **Kontras minimum WCAG 2.1 AA:** 4,5:1 untuk teks normal, 3:1 untuk teks besar dan komponen antarmuka. 

4. **Satu tugas per layar** di alur pekerja. Jangan pernah menampilkan dua keputusan sekaligus. 

5. **Setiap alur berbasis AI punya jalur manual** yang bisa diakses tanpa menunggu kegagalan. 

6. **Ikon selalu berpasangan dengan label teks.** Ikon tanpa teks tidak dapat dipahami pengguna yang tidak akrab dengan konvensi antarmuka. 

7. **Hormati** **<mark>`prefers-reduced-motion` .</mark>** 

## **2.4 Etika** 

1. **Jangan pernah menjanjikan keamanan.** Bahasa yang dipakai: "kami menandai pola yang perlu diwaspadai dan membantu Anda bertanya". Bukan: "kami memastikan lowongan ini aman". 

2. **Halaman verifikasi publik dapat dinonaktifkan pekerja.** Kredensial milik pekerja, bukan milik platform. 

3. **Halaman verifikasi publik tidak menampilkan nomor HP, alamat lengkap, atau audio.** Nama belakang ditampilkan sebagai inisial. 

4. **Minta izin merekam dengan bahasa yang dipahami** , bukan paragraf syarat dan ketentuan. 

6 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 3 — Tumpukan teknologi dan penyiapan** 

## **3.1 Tumpukan** 

|**Lapis**|**Pilihan**|**Alasan**|
|---|---|---|
|Framework|Next.js 15, App Router,<br>TypeScript|satu basis kode, server dan klien menyatu, kunci API aman|
|Styling|Tailwind CSS v4|token desain sebagai utilitas, konsisten|
|Komponen<br>primitif|shadcn/ui di atas Radix UI|aksesibilitas bawaan: fokus, ARIA, keyboard|
|Ikon|Lucide React|konsisten, ringan, garis tunggal|
|Basis data|Supabase Postgres|relasional cocok untuk taksonomi;**RLS**sebagai pertahanan<br>lapis basis data|
|Autentikasi|Supabase Auth|sesi terkelola|
|Penyimpanan|Supabase Storage, bucket<br>privat|audio dan foto lewat signed URL|
|AI|Gemini API, kelas Flash,<br>multimodal|audio dipahami langsung, kuota gratis memadai|
|Validasi|Zod|validasi di batas server|
|Form|React Hook Form + Zod<br>resolver||
|QR|`qrcode` (server-side, hasilkan<br>SVG)|tanpa layanan pihak ketiga|
|Grafk|Recharts|grafk penghasilan sederhana|
|Hosting|Vercel|deploy cepat, HTTPS otomatis, env terenkripsi|



7 

Kita Kerja — Dokumen Prompt Pembangunan 

## **3.2 Variabel lingkungan** 

```
# AI — HANYA SISI SERVER
GEMINI_API_KEY=
GEMINI_MODEL=                    # gunakan model kelas Flash yang tersedia
GEMINI_MODEL_RINGAN=             # model lebih kecil untuk normalisasi taksonomi
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # aman di klien, dilindungi RLS
SUPABASE_SERVICE_ROLE_KEY=       # HANYA SISI SERVER, melewati RLS
# Aplikasi
APP_URL=                         # untuk membentuk URL di dalam QR
DEMO_MODE=true                   # aktifkan panel demo dan rekaman contoh
# Batas kuota
KUOTA_HARIAN_GLOBAL=1400
KUOTA_WAWANCARA_PER_PENGGUNA_HARI=3
KUOTA_AI_PER_PENGGUNA_JAM=20
```

**Catatan penting soal model:** jangan menuliskan nama model secara keras di dalam kode. Baca dari <mark>`GEMINI_MODEL`</mark> . Pada tahap penyiapan, panggil endpoint daftar model Gemini untuk memastikan nama model yang dipakai benar-benar tersedia dan mendukung masukan audio, lalu simpan hasilnya di env. 

8 

Kita Kerja — Dokumen Prompt Pembangunan 

## **3.3 Struktur direktori** 

9 

Kita Kerja — Dokumen Prompt Pembangunan 

```
src/
  app/
    (publik)/
      page.tsx                       # landing
      masuk/page.tsx
      daftar/page.tsx
      verifikasi/[token]/page.tsx    # verifikasi Kartu Kerja, tanpa login
    (pekerja)/pekerja/
      page.tsx                       # beranda pekerja
      ngobrol/page.tsx               # wawancara suara
      ngobrol/hasil/page.tsx         # konfirmasi profil
      ngobrol/manual/page.tsx        # jalur manual
      kartu/page.tsx
      kartu/cetak/page.tsx           # tata letak cetak
      lowongan/page.tsx
      lowongan/[id]/page.tsx
      lamaran/page.tsx
      kesepakatan/[id]/page.tsx
      riwayat/page.tsx
    (pemberi)/pemberi/
      page.tsx
      pasang/page.tsx                # tulis teks bebas
      pasang/hasil/page.tsx          # konfirmasi ekstraksi
      lowongan/[id]/page.tsx
      lowongan/[id]/calon/page.tsx
      kesepakatan/[id]/page.tsx
      selesai/[id]/page.tsx          # konfirmasi selesai + penilaian
    (pendamping)/pendamping/
      page.tsx
      daftarkan/page.tsx
    demo/page.tsx                    # panel demo, hanya bila DEMO_MODE
    api/
      ai/wawancara/mulai/route.ts
      ai/wawancara/jawab/route.ts
      ai/wawancara/selesai/route.ts
      ai/lowongan/ekstrak/route.ts
      ai/lowongan/saring/route.ts
      kartu/terbitkan/route.ts
      kartu/[token]/route.ts
      kesepakatan/buat/route.ts
      kesepakatan/otp/route.ts
      pekerjaan/selesai/route.ts
      upah/lapor/route.ts
      acuan-upah/route.ts
      cocok/route.ts
  komponen/
    ui/                              # shadcn
```

10 

Kita Kerja — Dokumen Prompt Pembangunan 

```
    pekerja/                         # TombolRekam, KartuKeahlian, dll.
    pemberi/
    kartu/                           # KartuKerjaVisual, KartuCetak, BadgeLapis
    bersama/
  lib/
    ai/
      klien-gemini.ts                # satu-satunya tempat memanggil Gemini
      prompt-wawancara.ts
      prompt-lowongan.ts
      prompt-saringan.ts
      prompt-normalisasi.ts
      skema-keluaran.ts              # responseSchema + Zod cermin
      penjaga.ts                     # penyaring mata uang, klem level, cek kutipan
      kuota.ts                       # penghitung, antrean, degradasi
    mesin/
      acuan-upah.ts                  # deterministik
      pencocokan.ts                  # deterministik
      risiko.ts                      # gabungan AI + aturan
    supabase/
      klien-server.ts
      klien-browser.ts
    zod/
  gaya/
    token.css                        # token desain
```

11 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 4 — Design system** 

## **4.1 Prinsip desain** 

Kata "modern" di sini **tidak** berarti minimalis tipis abu-abu seperti dasbor SaaS. Pengguna utama aplikasi ini adalah orang dengan pendidikan dasar yang memegang HP bekas di bawah sinar matahari. Modern yang benar untuk mereka berarti: 

**Besar, jelas, hangat, dan tenang.** Tipografi besar dengan kontras tinggi. Ruang kosong yang lega. Satu tugas per layar. Warna hangat, bukan abu-abu dingin korporat. Sudut membulat yang ramah, bukan siku tajam. Gerak halus yang menjelaskan, bukan yang memamerkan diri. 

Empat prinsip yang mengikat: 

1. **Satu keputusan per layar.** Jangan pernah menampilkan dua pertanyaan atau dua aksi utama sekaligus. 

2. **Suara lebih dulu, teks kemudian.** Di setiap tempat pekerja perlu memberi informasi, tombol rekam suara adalah aksi utama dan mengetik adalah alternatif. 

3. **Tunjukkan alasannya.** Setiap hasil AI, setiap pencocokan, setiap penanda upah harus menjelaskan dasarnya dalam satu kalimat. 

4. **Jujur soal tingkat kepercayaan.** Yang terverifikasi dan yang baru klaim harus terlihat berbeda. Menyeragamkan agar tampak meyakinkan justru merusak kepercayaan. 

## **4.2 Warna** 

Palet dinamai dalam bahasa Indonesia agar konsisten dipakai seluruh tim. 

#### **Biru Amanah — warna utama, dipakai untuk kepercayaan, verifikasi, dan navigasi** 

```
--biru-50   #EFF4FF      --biru-500  #3B66F6
--biru-100  #DBE6FE      --biru-600  #2547EB     ← utama
--biru-200  #BFD3FE      --biru-700  #1D35D8
--biru-300  #93B4FD      --biru-800  #1E2DAF
--biru-400  #608CFA      --biru-900  #1E2C8A
```

#### **Kuning Kerja — aksen, dipakai untuk aksi utama dan penyorotan** 

```
--kuning-50   #FFFBEB    --kuning-500  #F59E0B
--kuning-100  #FEF3C7    --kuning-600  #D97706   ← aksen utama
--kuning-200  #FDE68A    --kuning-700  #B45309
--kuning-300  #FCD34D    --kuning-800  #92400E
--kuning-400  #FBBF24    --kuning-900  #78350F
```

**Tanah — netral hangat. Jangan memakai abu-abu dingin.** 

12 

Kita Kerja — Dokumen Prompt Pembangunan 

|`--tanah-0`|`#FFFFFF`|`--tanah-500  #7D766A`|
|---|---|---|
|`--tanah-50`|`#FAF9F7`|`--tanah-600  #5C5649`|
|`--tanah-100`|`#F3F1ED`|`--tanah-700  #423E34`|
|`--tanah-200`|`#E6E2DA`|`--tanah-800  #2B2822`|
|`--tanah-300`|`#D1CBC0`|`--tanah-900  #1A1814   ← teks utama`|
|`--tanah-400`|`#A69F92`||



#### **Semantik** 

```
aman       --aman-50  #F0FDF4   --aman-600  #16A34A
hati-hati  --hati-50  #FFFBEB   --hati-600  #D97706
bahaya     --bahaya-50 #FEF2F2  --bahaya-600 #DC2626
info       --biru-50            --biru-600
```

**Warna tiga lapis kepercayaan Kartu Kerja** — ini penanda visual paling penting di seluruh aplikasi: 

|**Lapis**|**Warna**|**Ikon Lucide**|**Arti**|
|---|---|---|---|
|Terverifkasi|`--biru-600`di atas<br>`--biru-50`|`shield-`<br>`check`|riwayat kerja dikonfrmasi dua pihak, tidak<br>dapat diubah|
|Dinilai|`--kuning-600`di atas<br>`--`<br>`kuning-50`|`star`|penilaian dari pemberi kerja terverifkasi|
|Diklaim|`--tanah-500`di atas<br>`--`|`user-round`|hasil Ngobrol Kerja yang dikonfrmasi pekerja|
||`tanah-100`||sendiri|



Gunakan ketiganya konsisten di mana pun keahlian atau riwayat ditampilkan. Jangan pernah menampilkan ketiganya dengan gaya yang sama. 

## **4.3 Tipografi** 

**Huruf utama: Plus Jakarta Sans.** Dipilih bukan karena estetika saja — huruf ini dirancang oleh Tokotype di Indonesia untuk identitas kota Jakarta. Memakainya berarti antarmuka ini memakai huruf Indonesia, dan itu detail yang bisa disebut dalam presentasi. 

**Huruf mono: JetBrains Mono** — hanya untuk token, kode, dan ID. 

Skala, mobile-first. Angka pertama ukuran, kedua tinggi baris. 

13 

Kita Kerja — Dokumen Prompt Pembangunan 

|**Nama**|**Ukuran / tinggi baris**|**Bobot**|**Pemakaian**|
|---|---|---|---|
|`display`|40 / 44|800|angka besar, judul landing|
|`h1`|32 / 38|700|judul halaman|
|`h2`|26 / 32|700|judul bagian|
|`h3`|21 / 28|600|judul kartu|
|`body-lg`|19 / 30|400|**default seluruh layar pekerja**|
|`body`|17 / 28|400|default layar pemberi kerja|
|`label`|15 / 22|600|label formulir, keterangan|
|`mikro`|13 / 18|700|huruf kapital dengan spasi 0,06em, hanya untuk penanda|



Aturan tegas: tidak ada teks di bawah 15px kecuali penanda <mark>`mikro` .</mark> Teks tombol minimum 19px. Jangan pakai bobot 300 atau lebih tipis — hilang di layar murah. 

## **4.4 Jarak, sudut, bayangan, gerak** 

```
Jarak (basis 4px)   4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80
Sudut               sm 8 · md 12 · lg 16 · xl 20 · 2xl 28 · pil 999
Target sentuh       minimum 48px · CTA utama tinggi 56px · tombol rekam 88px
Lebar isi maksimum  layar pekerja 520px · dasbor pemberi kerja 1120px
```

Bayangan hanya tiga tingkat, semuanya halus. Jangan memakai bayangan berwarna atau glow. 

```
--bayang-1  0 1px 2px rgba(26,24,20,.06), 0 1px 3px rgba(26,24,20,.05)
--bayang-2  0 4px 12px rgba(26,24,20,.08)
--bayang-3  0 12px 32px rgba(26,24,20,.10)
```

Gerak: 

```
--cepat   150ms      untuk tekan, hover, ganti keadaan
--sedang  240ms      untuk masuk atau keluar elemen
--lambat  400ms      untuk transisi antar langkah wawancara
easing    cubic-bezier(.2,.8,.2,1)
```

Bungkus semua animasi dalam <mark>`@media (prefers-reduced-motion: no-preference)` .</mark> 

14 

Kita Kerja — Dokumen Prompt Pembangunan 

## **4.5 Katalog komponen** 

|**Komponen**|**Spesifkasi**|
|---|---|
|`TombolRekam`|Bulat 88px,<br>`--kuning-600` , ikon<br>`mic` 32px, label di bawah "Tekan dan tahan untuk<br>bicara". Saat merekam: cincin denyut, gelombang audio langsung, penghitung detik, dan<br>area "Lepas untuk kirim, geser ke atas untuk batal". Wajib mendukung tekan-tahan pada<br>sentuh**dan**klik-tahan pada tetikus. Sediakan mode alternatif "Tekan sekali untuk mulai,<br>sekali lagi untuk selesai" karena tekan-tahan lama menyulitkan sebagian pengguna.|
|`GelombangAudio`|Kanvas menampilkan amplitudo dari<br>`AnalyserNode` . Ini satu-satunya cara pengguna tahu<br>suaranya tertangkap. Tanpa umpan balik ini, pengguna akan berbicara ke mikrofon mati<br>tanpa sadar.|
|`KartuPertanyaan`|Menampilkan satu pertanyaan AI. Teks<br>`h3` , latar<br>`--biru-50`,sudut 20px. Menampilkan<br>indikator langkah "Pertanyaan 3 dari 6".|
|`KartuKeahlian`|Nama baku sebagai<br>`h3` , sebutan asli pekerja di bawah dalam tanda kutip, penanda level,<br>penanda lapis kepercayaan, dan kutipan bukti yang dapat dibuka-tutup. Tombol "Betul"<br>dan "Perbaiki".|
|`BadgeLapis`|Penanda tiga lapis kepercayaan sesuai tabel 4.2. Selalu berikon dan berteks.|
|`KartuLowongan`|Judul, wilayah, jarak, penanda Upah Terang, penanda tingkat Saringan Aman, dan satu<br>baris alasan pencocokan.|
|`PenandaUpah`|Tiga keadaan:<br>`sesuai acuan`(aman),<br>`sedikit di bawah acuan` (hati-hati),<br>`di bawah`<br>`acuan` (bahaya). Selalu menampilkan nominal acuan di sebelahnya.|
|`PanelSaringanAman`|Tingkat risiko, daftar temuan berikut kutipan dari teks lowongan, dan**daftar pertanyaan**<br>**yang disarankan sebagai bagian paling menonjol**— bukan sebagai catatan kecil.|
|`KartuKerjaVisual`|Representasi digital Kartu Kerja: foto, nama, bidang utama, tiga keahlian teratas, jumlah<br>pekerjaan selesai, rata-rata penilaian, QR, token.|
|`KartuCetak`|Tata letak khusus cetak, lihat Bagian 15.3.|
|`LangkahOTP`|Enam kotak angka, papan tuts numerik, tempel otomatis, hitung mundur kirim ulang.|
|`KeadaanKosong`|Setiap daftar kosong wajib menjelaskan langkah berikutnya, bukan hanya menulis "belum<br>ada data".|
|`SpanduLuring`|Ditampilkan saat koneksi hilang: "Koneksi terputus. Rekaman Anda disimpan dan akan<br>dikirim otomatis."|



15 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 5 — Arsitektur informasi dan rute** 

## **5.1 Daftar rute** 

|**Rute**|**Akses**|**Isi**|
|---|---|---|
|`/`|publik|Landing. Dua pintu masuk besar: "Saya cari kerja" dan<br>"Saya butuh pekerja"|
|`/masuk`,<br>`/daftar`|publik|Masuk dengan nomor HP + OTP|
|`/verifikasi/[token]`|**publik, tanpa**<br>**login**|Verifkasi Kartu Kerja dari pemindaian QR|
|`/pekerja`|pekerja|Beranda: status Kartu Kerja, lowongan cocok, lamaran<br>berjalan|
|`/pekerja/ngobrol`|pekerja|Wawancara suara|
|`/pekerja/ngobrol/hasil`|pekerja|Konfrmasi profl keahlian, satu per satu|
|`/pekerja/ngobrol/manual`|pekerja|Jalur manual, selalu dapat diakses|
|`/pekerja/kartu`|pekerja|Kartu Kerja|
|`/pekerja/kartu/cetak`|pekerja|Tata letak cetak|
|`/pekerja/lowongan`|pekerja|Daftar lowongan tersaring dan tercocokkan|
|`/pekerja/lowongan/[id]`|pekerja|Detail lowongan + Saringan Aman + Upah Terang|
|`/pekerja/lamaran`|pekerja|Lamaran dan statusnya|
|`/pekerja/kesepakatan/`<br>`[id]`|pekerja|Kesepakatan Kerja + OTP + konfrmasi selesai|
|`/pekerja/riwayat`|pekerja|Riwayat pekerjaan dan grafk penghasilan|
|`/pemberi`|pemberi kerja|Dasbor: lowongan aktif, calon masuk, kesepakatan|
|`/pemberi/pasang`|pemberi kerja|Tulis lowongan sebagai teks bebas|
|`/pemberi/pasang/hasil`|pemberi kerja|Konfrmasi hasil ekstraksi AI|
|`/pemberi/lowongan/[id]`|pemberi kerja|Kelola lowongan|
|`/pemberi/lowongan/[id]/`<br>`calon`|pemberi kerja|Daftar calon + pratinjau Kartu Kerja|
|`/pemberi/kesepakatan/`<br>`[id]`|pemberi kerja|Kesepakatan + OTP|
|`/pemberi/selesai/[id]`|pemberi kerja|Konfrmasi selesai + penilaian|
|`/pendamping`|pendamping|Daftar pekerja yang didampingi|
|`/pendamping/daftarkan`|pendamping|Daftarkan pekerja tanpa HP|
|`/demo`|hanya bila<br>`DEMO_MODE`|Panel demo, lihat Bagian 16|



16 

Kita Kerja — Dokumen Prompt Pembangunan 

Proteksi rute wajib diberlakukan di **middleware dan di server** , bukan dengan menyembunyikan tombol di klien. 

## **5.2 Navigasi** 

Layar pekerja: navigasi bawah dengan empat tab besar — **Beranda, Lowongan, Kartu, Riwayat** . Setiap tab berikon dan berteks. Tinggi bilah 64px. 

Layar pemberi kerja: navigasi samping pada layar lebar, navigasi bawah pada layar sempit. 

17 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 6 — Spesifikasi halaman** 

## **6.1 Landing** **<mark>`/`</mark>** 

Tujuan halaman ini bukan menjelaskan produk, melainkan **memisahkan dua jenis pengunjung dalam tiga detik** . 



<!-- Start of picture text -->
┌──────────────────────────────────────────────┐<br>│  Kita Kerja                                  │<br>│                                              │<br>│  Pengalaman Anda selama ini                  │<br>│  belum punya bukti.                          │   display 40/44<br>│  Sekarang punya.                             │<br>│                                              │<br>│  Ceritakan pekerjaan Anda dengan suara.      │   body-lg<br>│  Kita Kerja mengubahnya menjadi Kartu Kerja  │<br>│  yang bisa dibawa ke mana pun.               │<br>│                                              │<br>│  ┌────────────────────────────────────────┐  │<br>│  │  [suara]  Saya cari kerja                   │  │   56px, kuning-600<br>│  └────────────────────────────────────────┘  │<br>│  ┌────────────────────────────────────────┐  │<br>│  │  [orang]  Saya butuh pekerja                │  │   56px, garis biru-600<br>│  └────────────────────────────────────────┘  │<br>│                                              │<br>│  ── Bagaimana caranya ──                     │<br>│  1 Ngobrol dengan suara, 3 menit             │<br>│  2 Kartu Kerja Anda terbit                   │<br>│  3 Cetak dan tunjukkan ke siapa pun          │<br>│                                              │<br>│  87,74 juta pekerja informal di Indonesia     │   display<br>│  bekerja tanpa satu pun bukti pengalaman.     │<br>└──────────────────────────────────────────────┘<br><!-- End of picture text -->

Sertakan satu contoh Kartu Kerja nyata yang bisa dilihat langsung tanpa mendaftar — pengunjung harus bisa memahami artefak akhirnya sebelum diminta apa pun. 

## **6.2 Ngobrol Kerja** **<mark>`/pekerja/ngobrol`</mark>** 

Layar terpenting di seluruh aplikasi. Rancang dengan sangat hati-hati. 

#### **Keadaan 1 — pengantar dan izin** 

18 

Kita Kerja — Dokumen Prompt Pembangunan 



<!-- Start of picture text -->
┌──────────────────────────────────────────────┐<br>│  ← Kembali                    Langkah 1 dari 3│<br>│                                              │<br>│  Kita ngobrol dulu ya                        │   h1<br>│                                              │<br>│  Saya akan tanya beberapa hal tentang         │   body-lg<br>│  pekerjaan Bapak/Ibu. Jawab pakai suara       │<br>│  saja, tidak perlu menulis.                   │<br>│                                              │<br>│  Boleh pakai bahasa daerah.                   │<br>│  Kira-kira 3 menit.                           │<br>│                                              │<br>│  ┌──────────────────────────────────────┐    │<br>│  │ [mic] Kita perlu izin memakai mikrofon  │    │<br>│  │    Rekaman hanya untuk membuat        │    │<br>│  │    Kartu Kerja Anda. Bisa dihapus     │    │<br>│  │    kapan saja.                        │    │<br>│  └──────────────────────────────────────┘    │<br>│                                              │<br>│  ┌────────────────────────────────────────┐  │<br>│  │        Mulai ngobrol                   │  │<br>│  └────────────────────────────────────────┘  │<br>│                                              │<br>│  Lebih suka menulis sendiri? Isi manual →    │<br>└──────────────────────────────────────────────┘<br><!-- End of picture text -->

Perhatikan: jalur manual ditawarkan **sejak awal** , bukan hanya muncul setelah gagal. 

#### **Keadaan 2 — putaran wawancara** 

19 

Kita Kerja — Dokumen Prompt Pembangunan 



<!-- Start of picture text -->
┌──────────────────────────────────────────────┐<br>│  ← Keluar                  Pertanyaan 3 dari 6│<br>│  ●●●○○○                                       │<br>│                                              │<br>│  ┌──────────────────────────────────────┐    │<br>│  │ Bisa baca gambar kerja itu bagus,    │    │  KartuPertanyaan<br>│  │ Pak — tidak semua tukang bisa.       │    │  h3, biru-50<br>│  │ Gambar seperti apa yang biasanya      │    │<br>│  │ Bapak baca?                           │    │<br>│  └──────────────────────────────────────┘    │<br>│                                              │<br>│  Jawaban sebelumnya:                          │  dapat dibuka-tutup<br>│  "Macem-macem. Tapi paling sering             │<br>│   keramik karo plester..."                    │<br>│                                              │<br>│                  ╭─────────╮                  │<br>│                  │   [mic]    │                  │  88px, kuning-600<br>│                  ╰─────────╯                  │<br>│         Tekan dan tahan untuk bicara          │<br>│                                              │<br>│     ▁▃▅▇▅▃▁▂▄▆▄▂  0:07                       │  saat merekam<br>│                                              │<br>│  Sudah cukup, buat kartu saya →              │  aktif setelah putaran 3<br>└──────────────────────────────────────────────┘<br><!-- End of picture text -->

#### Detail yang wajib ada: 

- Indikator langkah berupa titik, bukan bilah persen. Enam titik lebih mudah dipahami daripada "50%". 

- Jawaban sebelumnya dapat dilihat agar pengguna merasa didengar. 

- 

- Tombol "sudah cukup" **hanya aktif setelah putaran ketiga** — di bawah itu profilnya terlalu tipis untuk berguna. 

- Saat AI sedang berpikir: tampilkan "Sebentar ya, saya dengarkan dulu…" dengan animasi halus. Jangan pakai putaran pemuat generik. 

- Setiap audio yang direkam langsung diunggah ke Storage sebelum dikirim ke AI, sehingga tidak hilang bila proses AI gagal. 

#### **Keadaan 3 — gagal** 

Jangan pernah menampilkan galat teknis. Tampilkan tiga pilihan: **Coba rekam lagi** , **Lanjut ke pertanyaan berikutnya** , dan **Isi manual saja** . 

## **6.3 Konfirmasi profil** **<mark>`/pekerja/ngobrol/hasil`</mark>** 

Konfirmasi dilakukan **satu keahlian per kartu** , tidak sebagai satu formulir panjang. Pekerja harus merasa memeriksa, bukan menandatangani. 

20 

Kita Kerja — Dokumen Prompt Pembangunan 



<!-- Start of picture text -->
┌──────────────────────────────────────────────┐<br>│  Ini yang saya dengar                        │  h1<br>│  Periksa satu-satu ya. Kalau ada yang        │<br>│  salah, bisa diperbaiki.                     │<br>│                                              │<br>│  ┌──────────────────────────────────────┐    │<br>│  │ [orang] Diklaim                            │    │  BadgeLapis<br>│  │                                       │    │<br>│  │ Pemasangan keramik            [Ahli] │    │  h3<br>│  │ Bapak menyebutnya "pasang keramik"    │    │<br>│  │                                       │    │<br>│  │ ▸ Kenapa saya simpulkan begitu        │    │  dapat dibuka<br>│  │   "paling sering keramik karo         │    │  kutipan_bukti<br>│  │    plester, wis rolas taun"           │    │<br>│  │                                       │    │<br>│  │  ┌──────────┐  ┌──────────┐          │    │<br>│  │  │  Betul   │  │ Perbaiki │          │    │  48px<br>│  │  └──────────┘  └──────────┘          │    │<br>│  └──────────────────────────────────────┘    │<br>│                                              │<br>│  [ kartu keahlian berikutnya... ]            │<br>│                                              │<br>│  ┌────────────────────────────────────────┐  │<br>│  │      Terbitkan Kartu Kerja saya        │  │<br>│  └────────────────────────────────────────┘  │<br>└──────────────────────────────────────────────┘<br><!-- End of picture text -->

Bagian "Kenapa saya simpulkan begitu" yang menampilkan kutipan asli adalah **fitur yang harus ditonjolkan saat presentasi** , bukan disembunyikan. Ia membuktikan AI tidak bisa mengarang. 

## **6.4 Kartu Kerja** **<mark>`/pekerja/kartu`</mark>** 

Halaman ini adalah puncak emosional produk. Rancang agar terasa seperti menerima sesuatu yang bernilai, bukan seperti membuka halaman profil. 

Susunan dari atas: <mark>`KartuKerjaVisual`</mark> besar dengan QR → tiga tombol besar sejajar ( **Cetak kartu** , **Bagikan tautan** , **Lihat seperti orang lain melihat** ) → ringkasan angka (jumlah pekerjaan selesai, rata-rata penilaian, tahun pengalaman) → daftar keahlian dikelompokkan per lapis kepercayaan → riwayat pekerjaan terverifikasi → sakelar "Tampilkan kartu saya untuk publik" beserta penjelasan singkat konsekuensinya. 

Tombol "Lihat seperti orang lain melihat" membuka <mark>`/verifikasi/[token]`</mark> di tab baru. Ini membangun kepercayaan pekerja terhadap apa yang dibagikan tentang dirinya. 

## **6.5 Halaman verifikasi publik** **<mark>`/verifikasi/[token]`</mark>** 

Halaman ini dibuka oleh orang asing yang baru memindai QR dari selembar kertas. Ia harus dapat dipahami dalam lima detik, **tanpa login** , dan tidak boleh membocorkan data pribadi. 

21 

Kita Kerja — Dokumen Prompt Pembangunan 



<!-- Start of picture text -->
┌──────────────────────────────────────────────┐<br>│  Kita Kerja · Verifikasi Kartu Kerja         │<br>│                                              │<br>│  ┌────┐  Warto S.                            │  nama belakang diinisialkan<br>│  │foto│  Tukang bangunan · Malang            │<br>│  └────┘                                       │<br>│                                              │<br>│  ┌──────────────────────────────────────┐    │<br>│  │ [v] Kartu ini asli dan masih berlaku   │    │  aman-50<br>│  │    Diterbitkan 12 Juli 2026           │    │<br>│  └──────────────────────────────────────┘    │<br>│                                              │<br>│  47 pekerjaan selesai   ★ 4,8 dari 32 penilai │  display<br>│                                              │<br>│  [verif] Keahlian terverifikasi                    │<br>│     Pemasangan keramik · Plesteran            │<br>│                                              │<br>│  [orang] Keahlian yang dinyatakan sendiri           │<br>│     Pembacaan gambar kerja                    │<br>│                                              │<br>│  Pekerjaan terakhir yang dikonfirmasi          │<br>│  Jun 2026 · Renovasi dapur · Sukun, Malang     │<br>│  Mei 2026 · Pasang keramik · Klojen, Malang    │<br>│                                              │<br>│  (i) Kita Kerja menampilkan riwayat yang        │<br>│    dikonfirmasi kedua pihak. Kami tidak        │<br>│    menjamin hasil pekerjaan.                   │<br>└──────────────────────────────────────────────┘<br><!-- End of picture text -->

Wajib: <mark>`noindex` ,</mark> rate limit per IP, dan halaman "kartu tidak ditemukan atau dinonaktifkan pemiliknya" yang sopan untuk token tidak valid. Jangan pernah menampilkan nomor HP, alamat lengkap, atau audio. 

## **6.6 Pasang lowongan** **<mark>`/pemberi/pasang`</mark>** 

Pemberi kerja bukan HRD. Layar ini hanya berisi **satu kotak teks besar** dan contoh. 

22 

Kita Kerja — Dokumen Prompt Pembangunan 



<!-- Start of picture text -->
┌──────────────────────────────────────────────┐<br>│  Butuh pekerja? Tulis saja seperti biasa      │  h1<br>│                                              │<br>│  Tidak perlu formulir. Tulis seperti Anda     │<br>│  mengirim pesan WhatsApp.                     │<br>│                                              │<br>│  ┌──────────────────────────────────────┐    │<br>│  │ butuh 2 tukang buat renov dapur,      │    │  min 160px<br>│  │ mulai senin, borongan, daerah Sukun    │    │  body-lg<br>│  │                                       │    │<br>│  └──────────────────────────────────────┘    │<br>│                                              │<br>│  [mic] Atau rekam suara saja                     │<br>│                                              │<br>│  Contoh yang bisa ditiru:                     │<br>│  · "cari ART 3x seminggu, ada bayi, Rungkut"  │<br>│  · "butuh montir panggilan buat motor matic"  │<br>│                                              │<br>│  ┌────────────────────────────────────────┐  │<br>│  │            Lanjut                      │  │<br>│  └────────────────────────────────────────┘  │<br>└──────────────────────────────────────────────┘<br><!-- End of picture text -->

Halaman hasil <mark>`/pemberi/pasang/hasil`</mark> menampilkan hasil ekstraksi sebagai bidang yang dapat diedit, **plus** dua bagian yang membuatnya terasa cerdas: 

- **"Yang saya simpulkan"** — syarat tersirat yang tidak dituliskan pemberi kerja. Contoh: dari "ada bayi" disimpulkan "pengalaman merawat anak kecil". 

- **"Yang belum jelas"** — daftar hal yang perlu dilengkapi, misalnya besaran upah. Ini juga yang menaikkan skor kelengkapan lowongan. 

Jika upah yang diisi berada di bawah acuan, tampilkan <mark>`PenandaUpah`</mark> beserta nominal acuan **sebelum** lowongan tayang, dengan bahasa yang tidak menghakimi: "Acuan harian untuk pekerjaan ini di Malang sekitar Rp135.000. Lowongan di bawah acuan biasanya lebih lama terisi." 

## **6.7 Detail lowongan untuk pekerja** **<mark>`/pekerja/lowongan/[id]`</mark>** 

Urutan dari atas: judul dan wilayah → <mark>`PenandaUpah`</mark> beserta acuan → **<mark>`PanelSaringanAman`</mark>** → alasan pencocokan → detail pekerjaan → identitas dan status verifikasi pemberi kerja → tombol lamar. 

Saringan Aman diletakkan **di atas** tombol lamar dan di atas detail pekerjaan. Kalau diletakkan di bawah, ia tidak akan terbaca. 

Untuk lowongan berisiko tinggi, tombol lamar tetap ada tetapi memerlukan satu langkah konfirmasi tambahan yang menampilkan kembali daftar pertanyaan yang disarankan. Jangan memblokir — pekerja berhak memutuskan sendiri. 

23 

Kita Kerja — Dokumen Prompt Pembangunan 

## **6.8 Kesepakatan Kerja** **<mark>`/pekerja/kesepakatan/[id]`</mark>** 

Tampilkan sebagai dokumen sederhana yang bisa dibaca orang awam: lingkup pekerjaan, upah, satuan, tanggal mulai, tanggal selesai, dan **tanggal pembayaran dijanjikan** sebagai baris paling menonjol. 

Di bawahnya <mark>`LangkahOTP`</mark> . Setelah kedua pihak mengonfirmasi, tampilkan tanda "Kesepakatan aktif" dan jelaskan satu kalimat apa artinya: "Kesepakatan ini tercatat. Kalau upah tidak dibayar sesuai tanggal, Anda bisa melaporkannya dan laporan itu akan tampil di profil pemberi kerja." 

24 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 7 — Skema basis data** 

Postgres. Jalankan sebagai migrasi Supabase. 

25 

Kita Kerja — Dokumen Prompt Pembangunan 

```
create extension if not exists pgcrypto;
-- ============ WILAYAH & TAKSONOMI ============
create table wilayah (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null,
  jenis         text not null check (jenis in ('kabupaten','kota')),
  provinsi      text not null,
  umk           integer not null,
  tahun_umk     integer not null,
  created_at    timestamptz default now()
);
```

```
create table bidang_kerja (
  id      uuid primary key default gen_random_uuid(),
  nama    text not null unique,
  ikon    text not null
);
```

##### `create table keahlian_baku (` 

```
  id            uuid primary key default gen_random_uuid(),
  bidang_id     uuid not null references bidang_kerja(id),
  nama_baku     text not null unique,
  alias         text[] not null default '{}',
  pengali_upah  numeric(4,2) not null default 1.00,
  created_at    timestamptz default now()
);
```

```
create table konversi_satuan (
```

```
  id            uuid primary key default gen_random_uuid(),
  konteks       text not null,
  satuan_lokal  text not null,
  faktor        numeric not null,
  satuan_baku   text not null,
  unique (konteks, satuan_lokal)
);
```

```
-- ============ PENGGUNA ============
```

##### `create table pengguna (` 

```
  id            uuid primary key references auth.users(id) on delete cascade,
  nama          text not null,
  no_hp         text not null unique,
  peran         text not null check (peran in ('pekerja','pemberi_kerja','pendamping')),
  wilayah_id    uuid references wilayah(id),
  url_foto      text,
```

26 

Kita Kerja — Dokumen Prompt Pembangunan 

```
  status_verifikasi text not null default 'belum'
```

```
                check (status_verifikasi in ('belum','hp_terverifikasi','identitas_terverifikasi')),
  didampingi_oleh uuid references pengguna(id),
  created_at    timestamptz default now()
);
```

```
-- ============ KARTU KERJA ============
```

|`create table kartu_kerja (`|
|---|



```
  id                uuid primary key default gen_random_uuid(),
  pekerja_id        uuid not null unique references pengguna(id) on delete cascade,
  token_publik      text not null unique default encode(gen_random_bytes(16),'hex'),
  aktif_publik      boolean not null default true,
  ringkasan         text,
  bidang_utama_id   uuid references bidang_kerja(id),
  pengalaman_tahun  integer check (pengalaman_tahun between 0 and 60),
  kesediaan         text[] not null default '{}',
  jangkauan_km      integer not null default 15 check (jangkauan_km between 1 and 200),
  alat_dimiliki     text[] not null default '{}',
  bahasa_terdeteksi text,
  diterbitkan_pada  timestamptz,
  updated_at        timestamptz default now()
```

##### `);` 

##### `create table kartu_keahlian (` 

|`id`|`uuid primary key default gen_random_uuid(),`|
|---|---|
|`kartu_id`|`uuid not null references kartu_kerja(id) on delete cascade,`|
|`keahlian_id`|`uuid references keahlian_baku(id),`|
|`nama_diajukan`|`text,`|
|`sebutan_pekerja`|`text not null,`|
|`level`|`text not null default 'terampil'`|
||`check (level in ('pemula','terampil','ahli')),`|
|`kutipan_bukti`|`text not null check (length(trim(kutipan_bukti)) >= 3),`|
|`keyakinan`|`numeric(3,2) check (keyakinan between 0 and 1),`|
|`sumber`|`text not null default 'ai' check (sumber in ('ai','manual')),`|
|`dikonfirmasi_pek`|`erja  boolean not null default false,`|
|`created_at`|`timestamptz default now(),`|
|`check (keahlian_`|`id is not null or nama_diajukan is not null)`|
|`);`||
|`create table sesi_`|`wawancara (`|
|`id`|`uuid primary key default gen_random_uuid(),`|
|`pekerja_id`|`uuid not null references pengguna(id) on delete cascade,`|
|`status`|`text not null default 'berjalan'`|
||`check (status in ('berjalan','menyusun','selesai','gagal','manual')),`|
|`putaran`|`jsonb not null default '[]'::jsonb,`|
|`jumlah_putaran`|`integer not null default 0 check (jumlah_putaran <= 6),`|
|`hasil_ekstraksi`|`jsonb,`|



27 

Kita Kerja — Dokumen Prompt Pembangunan 

|`created_at`<br>`updated_at`|`timestamptz default now(),`<br>`timestamptz default now()`|
|---|---|
|`);`||
|`-- ============ LO`|`WONGAN ============`|
|`create table lowon`|`gan (`|
|`id`|`uuid primary key default gen_random_uuid(),`|
|`pemberi_kerja_id`|`uuid not null references pengguna(id) on delete cascade,`|
|`wilayah_id`|`uuid not null references wilayah(id),`|
|`teks_asli`|`text not null,`|
|`judul_baku`|`text,`|
|`bidang_id`|`uuid references bidang_kerja(id),`|
|`jenis_kerja`|`text check (jenis_kerja in ('harian','borongan','paruh_waktu','menginap')),`|
|`jumlah_pekerja`|`integer default 1,`|
|`upah_ditawarkan`|`integer,`|
|`satuan_upah`|`text check (satuan_upah in ('harian','bulanan','borongan','per_jam')),`|
|`lokasi_teks`|`text,`|
|`lat`|`double precision,`|
|`lng`|`double precision,`|
|`mulai`|`date,`|
|`syarat_tersirat`|`text[] not null default '{}',`|
|`kelengkapan`|`numeric(3,2) default 0,`|
|`status`|`text not null default 'draf'`|
||`check (status in ('draf','moderasi','tayang','terisi','ditutup')),`|
|`created_at`<br>`);`|`timestamptz default now()`|



```
create table lowongan_keahlian (
```

```
  lowongan_id uuid not null references lowongan(id) on delete cascade,
  keahlian_id uuid not null references keahlian_baku(id),
  wajib       boolean not null default true,
  primary key (lowongan_id, keahlian_id)
);
```

```
create table saringan_aman (
```

```
  id                    uuid primary key default gen_random_uuid(),
  lowongan_id           uuid not null unique references lowongan(id) on delete cascade,
  skor_risiko           integer not null check (skor_risiko between 0 and 100),
  tingkat               text not null check (tingkat in ('aman','hati_hati','berisiko_tinggi')),
  temuan                jsonb not null default '[]'::jsonb,
  pertanyaan_disarankan text[] not null default '{}',
  skor_ai               integer,
  skor_aturan           integer,
  model                 text,
  diperiksa_pada        timestamptz default now()
);
```

28 

Kita Kerja — Dokumen Prompt Pembangunan 

```
-- ============ UPAH ============
```

```
create table acuan_upah (
```

```
  id              uuid primary key default gen_random_uuid(),
  keahlian_id     uuid not null references keahlian_baku(id),
  wilayah_id      uuid not null references wilayah(id),
  acuan_harian    integer not null,
  metode          text not null,
  jumlah_laporan  integer not null default 0,
  updated_at      timestamptz default now(),
  unique (keahlian_id, wilayah_id)
);
```

```
create table lapor_upah (
  id            uuid primary key default gen_random_uuid(),
  pekerjaan_id  uuid references pekerjaan(id) on delete set null,
  pekerja_id    uuid not null references pengguna(id) on delete cascade,
  keahlian_id   uuid references keahlian_baku(id),
  wilayah_id    uuid references wilayah(id),
  upah_diterima integer not null,
  satuan        text not null,
  created_at    timestamptz default now()
```

```
);
```

##### `-- ============ KESEPAKATAN & RIWAYAT ============` 

```
create table lamaran (
```

```
  id            uuid primary key default gen_random_uuid(),
  lowongan_id   uuid not null references lowongan(id) on delete cascade,
  pekerja_id    uuid not null references pengguna(id) on delete cascade,
  status        text not null default 'dilamar'
                check (status in ('dilamar','diundang','ditolak','disepakati')),
  alasan_cocok  jsonb not null default '[]'::jsonb,
  created_at    timestamptz default now(),
  unique (lowongan_id, pekerja_id)
);
```

##### `create table kesepakatan_kerja (` 

|`id`|`uuid primary key default gen_random_uuid(),`|
|---|---|
|`lowongan_id`|`uuid not null references lowongan(id),`|
|`pekerja_id`|`uuid not null references pengguna(id),`|
|`pemberi_kerja_id`|`uuid not null references pengguna(id),`|
|`lingkup`|`text not null,`|
|`upah_disepakati`|`integer not null,`|
|`satuan`|`text not null,`|
|`mulai`|`date not null,`|
|`selesai`|`date,`|
|`tanggal_bayar_dijanj`|`ikan date not null,`|



29 

Kita Kerja — Dokumen Prompt Pembangunan 

|`otp_pekerja_pada        timestamptz,`|
|---|
|`otp_pemberi_pada        timestamptz,`|
|`status                  text not null default 'menunggu'`|
|`check (status in ('menunggu','berjalan','selesai','batal','sengketa')),`|
|`created_at              timestamptz default now()`|
|`);`|
|`create table pekerjaan (`|
|`id                            uuid primary key default gen_random_uuid(),`|
|`kesepakatan_id                uuid not null unique references kesepakatan_kerja(id),`|
|`pekerja_id                    uuid not null references pengguna(id),`|
|`pemberi_kerja_id              uuid not null references pengguna(id),`|
|`dikonfirmasi_selesai_pekerja  boolean not null default false,`|
|`dikonfirmasi_selesai_pemberi  boolean not null default false,`|
|`selesai_pada                  timestamptz,`|
|`created_at                    timestamptz default now()`|
|`);`|
|`create table penilaian (`|
|`id                uuid primary key default gen_random_uuid(),`|
|`pekerjaan_id      uuid not null unique references pekerjaan(id) on delete cascade,`|
|`pemberi_kerja_id  uuid not null references pengguna(id),`|
|`skor              integer not null check (skor between 1 and 5),`|
|`catatan           text,`|
|`created_at        timestamptz default now()`|
|`);`|
|`create table laporan_masalah (`|
|`id            uuid primary key default gen_random_uuid(),`|
|`pekerjaan_id  uuid references pekerjaan(id) on delete set null,`|
|`lowongan_id   uuid references lowongan(id) on delete set null,`|
|`pelapor_id    uuid not null references pengguna(id),`|
|`jenis         text not null check (jenis in`|
|`('upah_tidak_dibayar','kondisi_tidak_sesuai','lowongan_palsu','lainnya')),`|
|`uraian        text not null,`|
|`status        text not null default 'baru' check (status in ('baru','ditindak','selesai')),`|
|`created_at    timestamptz default now()`|
|`);`|
|`-- ============ OPERASIONAL AI ============`|
|`create table cache_normalisasi (`|
|`id            uuid primary key default gen_random_uuid(),`|
|`kunci         text not null unique,`|
|`keahlian_id   uuid references keahlian_baku(id),`|
|`hasil         jsonb not null,`|
|`created_at    timestamptz default now()`<br>`);`|



30 

Kita Kerja — Dokumen Prompt Pembangunan 

```
create table log_ai (
  id            uuid primary key default gen_random_uuid(),
  pengguna_id   uuid references pengguna(id) on delete set null,
  jenis         text not null check (jenis in
                ('wawancara','baca_lowongan','saringan','normalisasi','profil')),
  model         text,
  latensi_ms    integer,
  token_masuk   integer,
  token_keluar  integer,
  status        text not null check (status in ('sukses','gagal','kuota_habis','ditolak_validasi')),
  catatan       text,
  created_at    timestamptz default now()
);
create table kuota_harian (
  tanggal   date primary key,
  terpakai  integer not null default 0
);
create index idx_lowongan_status on lowongan(status) where status = 'tayang';
create index idx_lowongan_wilayah on lowongan(wilayah_id);
create index idx_kartu_token on kartu_kerja(token_publik);
create index idx_pekerjaan_pekerja on pekerjaan(pekerja_id);
create index idx_log_ai_tanggal on log_ai(created_at);
```

**Catatan urutan:** tabel <mark>`lapor_upah`</mark> merujuk <mark>`pekerjaan`</mark> , jadi buat <mark>`pekerjaan`</mark> lebih dulu atau tambahkan foreign key-nya dengan <mark>`alter table`</mark> setelahnya. 

## **7.1 Empat batasan yang paling bernilai saat penjurian** 

<mark>`kartu_keahlian.kutipan_bukti NOT NULL`</mark> dengan <mark>`check (length(trim(...)) >= 3)`</mark> — pengaman antihalusinasi ditegakkan di tingkat basis data, bukan hanya di prompt. Tunjukkan batasan ini kepada juri. 

<mark>`lowongan.teks_asli NOT NULL`</mark> — teks mentah pemberi kerja disimpan apa adanya di samping hasil ekstraksi, sehingga bila AI salah baca sumber aslinya masih ada. 

<mark>`kartu_kerja.token_publik`</mark> dengan <mark>`gen_random_bytes`</mark> — acak, bukan berurutan, mencegah pemanenan data massal. 

<mark>`sesi_wawancara.jumlah_putaran <= 6`</mark> — batas kuota ditegakkan basis data, bukan hanya oleh logika aplikasi. 

31 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 8 — Kebijakan Row Level Security** 

32 

Kita Kerja — Dokumen Prompt Pembangunan 

```
alter table pengguna            enable row level security;
alter table kartu_kerja         enable row level security;
alter table kartu_keahlian      enable row level security;
alter table sesi_wawancara      enable row level security;
alter table lowongan            enable row level security;
alter table saringan_aman       enable row level security;
alter table lamaran             enable row level security;
alter table kesepakatan_kerja   enable row level security;
alter table pekerjaan           enable row level security;
alter table penilaian           enable row level security;
alter table lapor_upah          enable row level security;
alter table log_ai              enable row level security;
```

##### `-- PENGGUNA` 

```
create policy pengguna_baca_diri on pengguna
  for select using (auth.uid() = id);
create policy pengguna_ubah_diri on pengguna
  for update using (auth.uid() = id);
```

##### `-- KARTU KERJA` 

```
create policy kartu_kelola_pemilik on kartu_kerja
```

```
  for all using (auth.uid() = pekerja_id);
```

- `-- Halaman verifikasi publik TIDAK memakai policy anon.` 

- `-- Ia dilayani lewat Route Handler dengan service role, memilih kolom` 

- `-- secara eksplisit, dan menerapkan rate limit. Ini mencegah kebocoran` 

- `-- kolom baru yang tanpa sengaja ikut terekspos di masa depan.` 

##### `-- KARTU KEAHLIAN` 

```
create policy keahlian_kelola_pemilik on kartu_keahlian
  for all using (
```

```
    exists (select 1 from kartu_kerja k
```

```
            where k.id = kartu_id and k.pekerja_id = auth.uid())
```

```
  );
```

```
-- SESI WAWANCARA — berisi rekaman suara pribadi
```

```
create policy sesi_hanya_pemilik on sesi_wawancara
  for all using (auth.uid() = pekerja_id);
```

##### `-- LOWONGAN` 

```
create policy lowongan_kelola_pemilik on lowongan
  for all using (auth.uid() = pemberi_kerja_id);
create policy lowongan_baca_tayang on lowongan
  for select using (status = 'tayang');
```

```
-- SARINGAN AMAN — hanya dibaca; penulisan lewat service role
create policy saringan_baca on saringan_aman
  for select using (
```

33 

Kita Kerja — Dokumen Prompt Pembangunan 

```
    exists (select 1 from lowongan l
            where l.id = lowongan_id
              and (l.status = 'tayang' or l.pemberi_kerja_id = auth.uid()))
  );
```

```
-- LAMARAN
create policy lamaran_pihak_terkait on lamaran
  for select using (
    auth.uid() = pekerja_id
    or exists (select 1 from lowongan l
               where l.id = lowongan_id and l.pemberi_kerja_id = auth.uid())
  );
```

```
create policy lamaran_buat_pekerja on lamaran
```

```
  for insert with check (auth.uid() = pekerja_id);
```

```
-- KESEPAKATAN — hanya dua pihak
create policy kesepakatan_dua_pihak on kesepakatan_kerja
  for all using (auth.uid() = pekerja_id or auth.uid() = pemberi_kerja_id);
```

```
-- PEKERJAAN — hanya baca. Penulisan HANYA lewat fungsi server.
create policy pekerjaan_baca_pihak on pekerjaan
  for select using (auth.uid() = pekerja_id or auth.uid() = pemberi_kerja_id);
```

```
-- Tidak ada policy insert atau update. Ini disengaja.
```

```
-- PENILAIAN — sekali tulis, tidak dapat diubah
create policy penilaian_baca_semua on penilaian
  for select using (true);
create policy penilaian_tulis_pemberi on penilaian
  for insert with check (
    auth.uid() = pemberi_kerja_id
    and exists (select 1 from pekerjaan p
                where p.id = pekerjaan_id
                  and p.pemberi_kerja_id = auth.uid()
                  and p.selesai_pada is not null)
  );
-- Tidak ada policy update atau delete. Penilaian bersifat permanen.
```

```
-- LAPOR UPAH — tulis milik sendiri, baca hanya teragregasi
create policy lapor_tulis_pekerja on lapor_upah
  for insert with check (auth.uid() = pekerja_id);
create policy lapor_baca_diri on lapor_upah
  for select using (auth.uid() = pekerja_id);
```

```
-- LOG AI
create policy log_baca_diri on log_ai
  for select using (auth.uid() = pengguna_id);
```

34 

Kita Kerja — Dokumen Prompt Pembangunan 

## **8.1 Fungsi server untuk penambahan riwayat** 

Ini titik integritas paling penting di seluruh sistem. Riwayat kerja **tidak boleh** bisa ditulis dari klien. 

35 

Kita Kerja — Dokumen Prompt Pembangunan 

```
create or replace function selesaikan_pekerjaan(p_kesepakatan_id uuid, p_pihak text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
```

```
  v_kesepakatan kesepakatan_kerja;
  v_pekerjaan_id uuid;
begin
```

```
  select * into v_kesepakatan from kesepakatan_kerja where id = p_kesepakatan_id;
  if not found then raise exception 'kesepakatan tidak ditemukan'; end if;
```

```
  if v_kesepakatan.status <> 'berjalan' then
```

```
    raise exception 'kesepakatan belum aktif';
  end if;
```

```
  if v_kesepakatan.otp_pekerja_pada is null or v_kesepakatan.otp_pemberi_pada is null then
    raise exception 'kesepakatan belum dikonfirmasi kedua pihak';
```

```
  end if;
```

```
  if auth.uid() <> v_kesepakatan.pekerja_id
     and auth.uid() <> v_kesepakatan.pemberi_kerja_id then
    raise exception 'bukan pihak dalam kesepakatan';
  end if;
```

```
  insert into pekerjaan (kesepakatan_id, pekerja_id, pemberi_kerja_id)
  values (p_kesepakatan_id, v_kesepakatan.pekerja_id, v_kesepakatan.pemberi_kerja_id)
  on conflict (kesepakatan_id) do nothing;
```

```
  select id into v_pekerjaan_id from pekerjaan where kesepakatan_id = p_kesepakatan_id;
```

```
  if p_pihak = 'pekerja' then
```

```
    update pekerjaan set dikonfirmasi_selesai_pekerja = true where id = v_pekerjaan_id;
  else
```

```
    update pekerjaan set dikonfirmasi_selesai_pemberi = true where id = v_pekerjaan_id;
  end if;
```

##### `update pekerjaan` 

```
     set selesai_pada = now()
   where id = v_pekerjaan_id
```

```
     and dikonfirmasi_selesai_pekerja
     and dikonfirmasi_selesai_pemberi
     and selesai_pada is null;
```

```
  update kesepakatan_kerja set status = 'selesai'
```

```
   where id = p_kesepakatan_id
```

```
     and exists (select 1 from pekerjaan
```

```
                 where id = v_pekerjaan_id and selesai_pada is not null);
```

36 

Kita Kerja — Dokumen Prompt Pembangunan 

```
  return v_pekerjaan_id;
end;
$$;
```

37 

Kita Kerja — Dokumen Prompt Pembangunan 

# **BAGIAN 9 — Kontrak API** 

Semua endpoint memakai Zod untuk validasi masuk dan keluar. Semua kegagalan mengembalikan bentuk yang sama. 

```
type Gagal = {
  ok: false
  kode: 'validasi' | 'kuota' | 'ai_gagal' | 'tidak_berhak' | 'tidak_ditemukan' | 'server'
  pesan_pengguna: string    // bahasa manusia, siap ditampilkan
  saran_lanjut?: 'coba_lagi' | 'jalur_manual' | 'tunggu'
}
```

<mark>`pesan_pengguna`</mark> wajib dalam bahasa Indonesia sederhana. Jangan pernah meneruskan pesan galat mentah dari Gemini atau Postgres ke antarmuka. 

38 

Kita Kerja — Dokumen Prompt Pembangunan 

|**Endpoint**|**Metode**|**Masuk**|**Keluar**|
|---|---|---|---|
|`/api/ai/`<br>`wawancara/mulai`|POST|—|`{ sesi_id, pertanyaan, putaran:`<br>`1 }`|
|`/api/ai/`<br>`wawancara/jawab`|POST|`{ sesi_id, path_audio, mime }`|`{ transkrip, pertanyaan_berikut,`<br>`putaran, sudah_cukup }`|
|`/api/ai/`<br>`wawancara/`<br>`selesai`|POST|`{ sesi_id }`|`{ profil }` sudah lewat validasi dan<br>penjaga|
|`/api/ai/`<br>`lowongan/`<br>`ekstrak`|POST|`{ teks }` atau<br>`{ path_audio }`|`{ lowongan_terstruktur }`|
|`/api/ai/`<br>`lowongan/saring`|POST|`{ lowongan_id }`|`{ skor_risiko, tingkat, temuan,`<br>`pertanyaan_disarankan }`|
|`/api/kartu/`<br>`terbitkan`|POST|`{ keahlian_dikonfirmasi[] }`|`{ token_publik, url_qr }`|
|`/api/kartu/`<br>`[token]`|GET|—|data publik terpilih, rate-limited|
|`/api/`<br>`kesepakatan/`<br>`buat`|POST|`{ lowongan_id, pekerja_id, lingkup,`<br>`upah, satuan, tanggal }`|`{ kesepakatan_id }`|
|`/api/`<br>`kesepakatan/otp`|POST|`{ kesepakatan_id, aksi:`<br>`'kirim'\|'verifikasi', kode? }`|`{ status }`|
|`/api/pekerjaan/`<br>`selesai`|POST|`{ kesepakatan_id }`|`{ pekerjaan_id, selesai: bool }`|
|`/api/upah/lapor`|POST|`{ pekerjaan_id, upah_diterima,`<br>`satuan }`|`{ ok: true }`|
|`/api/acuan-upah`|GET|`?keahlian=&wilayah=`|`{ acuan_harian, metode,`<br>`jumlah_laporan }`|
|`/api/cocok`|GET|`?pekerja=` atau<br>`?lowongan=`|daftar terurut +<br>`alasan_cocok`|



**Aturan pengunggahan audio.** Klien mengunggah langsung ke Supabase Storage bucket privat, lalu mengirim **path** -nya ke server. Jangan pernah mengirim base64 audio melalui body permintaan Next.js — batas ukuran body akan tertabrak dan pengalaman di jaringan lambat menjadi buruk. Server membaca berkas dari Storage memakai service role, lalu meneruskan ke Gemini. 

39 

Kita Kerja — Dokumen Prompt Pembangunan 

# **BAGIAN 10 — Logika AI** 

Bagian ini adalah inti teknis produk. Kerjakan dengan sangat teliti. 

## **10.1 Aturan umum lapisan AI** 

1. Seluruh panggilan Gemini terjadi di satu berkas: <mark>`lib/ai/klien-gemini.ts` .</mark> Tidak ada tempat lain yang boleh memanggil Gemini. 

2. Setiap panggilan memakai <mark>`responseMimeType: "application/json"`</mark> dan <mark>`responseSchema`</mark> agar keluaran terstruktur dijamin bentuknya. 

3. Setiap keluaran AI **wajib** melewati skema Zod cermin di sisi server sebelum menyentuh basis data. <mark>`responseSchema`</mark> dari penyedia bukan jaminan; ia mengurangi kesalahan, tidak menghapusnya. 

4. Setiap panggilan dicatat ke <mark>`log_ai` :</mark> model, latensi, token, status. 

5. Setiap panggilan melewati pemeriksaan kuota lebih dulu. 

6. <mark>`temperature`</mark> untuk ekstraksi dan penyaringan: **0,1** . Untuk penyusunan pertanyaan wawancara: **0,6** . 

## **10.2 Mesin keadaan wawancara** 



<!-- Start of picture text -->
BELUM_MULAI<br>     │  POST /mulai<br>     ▼<br>PUTARAN_AKTIF(n)  ─── audio diterima ──►  Gemini<br>     │                                       │<br>     │◄──── pertanyaan_berikut, n = n+1 ─────┘<br>     │<br>     ├── n >= 3 dan pengguna menekan "sudah cukup" ──┐<br>     ├── sudah_cukup = true dari model ──────────────┤<br>     ├── n = 6 (batas keras) ────────────────────────┤<br>     │                                               ▼<br>     │                                        MENYUSUN_PROFIL<br>     │                                               │<br>     │                                               ▼<br>     │                                     MENUNGGU_KONFIRMASI<br>     │                                               │<br>     │                                    pekerja mengonfirmasi<br>     │                                               ▼<br>     │                                            SELESAI<br>     │<br>     ├── audio gagal 2x ──────────► GAGAL_AUDIO ──► tawarkan JALUR_MANUAL<br>     ├── AI gagal setelah tangga fallback ──► GAGAL_AI ──► JALUR_MANUAL<br>     └── kuota habis ─────────────► KUOTA_HABIS ──► JALUR_MANUAL<br><!-- End of picture text -->

Batas: minimum 3 putaran sebelum profil boleh disusun, maksimum 6 putaran. Batas 6 ditegakkan sekaligus oleh basis data dan aplikasi. 

40 

Kita Kerja — Dokumen Prompt Pembangunan 

Simpan setiap putaran ke <mark>`sesi_wawancara.putaran`</mark> sebagai objek <mark>`{ pertanyaan, path_audio, transkrip, sinyal_ditangkap, dibuat_pada }` .</mark> Sesi harus bisa dilanjutkan bila pengguna menutup peramban di tengah proses. 

## **10.3 Bentuk panggilan Gemini untuk audio** 

```
// lib/ai/klien-gemini.ts — inti panggilan
const body = {
  systemInstruction: { parts: [{ text: INSTRUKSI_WAWANCARA }] },
  contents: [{
    role: 'user',
    parts: [
      { text: konteksPutaran(sesi) },     // pertanyaan sebelumnya + sinyal terkumpul
      { inlineData: { mimeType: mime, data: base64Audio } }
    ]
  }],
  generationConfig: {
    temperature: 0.6,
    responseMimeType: 'application/json',
    responseSchema: SKEMA_PUTARAN
  }
}
```

**Penanganan MIME yang wajib.** <mark>`MediaRecorder`</mark> di Chrome Android menghasilkan <mark>`audio/ webm;codecs=opus` ,</mark> sedangkan Safari iOS menghasilkan <mark>`audio/mp4` .</mark> Deteksi dengan 

<mark>`MediaRecorder.isTypeSupported()`</mark> di klien, simpan <mark>`mime`</mark> sebenarnya bersama berkas, dan teruskan nilai itu ke Gemini. Menuliskan <mark>`audio/webm`</mark> secara keras akan membuat seluruh alur gagal di iPhone — dan salah satu juri hampir pasti memakai iPhone. 

Batasi durasi rekaman per putaran maksimum 60 detik dan ukuran berkas maksimum 8 MB. 

41 

Kita Kerja — Dokumen Prompt Pembangunan 

## **10.4 Instruksi sistem — Ngobrol Kerja** 

```
Kamu perekrut lapangan berpengalaman untuk pekerja sektor informal Indonesia.
Kamu sedang mewawancarai lewat suara. Pekerja mungkin lulusan SD atau SMP,
memakai bahasa daerah, dan tidak terbiasa menyebut keahliannya secara formal.
```

##### `CARA BERTANYA` 

- `Satu pertanyaan per putaran. Jangan pernah menumpuk dua pertanyaan.` 

- `Bahasa Indonesia sehari-hari yang sangat sederhana. Bila pekerja memakai` 

- `bahasa daerah, kamu boleh menyelipkan satu dua kata daerah yang sama.` 

- `Pertanyaan harus SITUASIONAL dan KONKRET.` 

```
    Buruk : "Apa keahlian utama Anda?"
```

```
    Baik  : "Kalau dapat kerja pasang keramik kamar mandi, Bapak mulai dari apa?"
```

- `Bila pekerja menyebut sesuatu bernilai secara sambil lalu — bisa baca gambar` 

```
  kerja, pernah jadi kepala tukang, punya alat sendiri, pernah pegang proyek
  besar, bisa menghitung kebutuhan bahan — KEJAR hal itu di putaran berikutnya.
  Di situlah keahlian yang tidak akan pernah ia tuliskan sendiri.
```

- `Akui singkat sebelum bertanya lagi, agar pekerja merasa didengar.` 

- `Maksimal 6 putaran. Berhenti lebih awal bila sudah cukup.` 

##### `TUJUAN` 

```
Memunculkan keahlian yang tidak akan disebut pekerja bila hanya diminta
mendeskripsikan dirinya. Pekerja informal secara sistematis merendahkan
deskripsi dirinya sendiri.
```

##### `LARANGAN` 

- `Jangan menyebut angka upah, gaji, atau nominal apa pun.` 

- `Jangan menyimpulkan keahlian yang tidak diucapkan pekerja.` 

- `Jangan menggurui, menilai, atau memuji berlebihan.` 

- `Jangan menanyakan hal sensitif: agama, suku, status pernikahan, kesehatan.` 

Skema keluaran per putaran: 

##### `{` 

- `"transkrip": "apa adanya, termasuk bahasa daerah",` 

- `"terjemahan_ringkas": "ringkasan bahasa Indonesia",` 

- `"sinyal_ditangkap": ["bisa baca gambar kerja", "punya alat sendiri"],` 

- `"pertanyaan_berikut": "string, atau null bila sudah cukup",` 

- `"alasan_pertanyaan": "singkat, untuk audit",` 

- `"sudah_cukup": false,` 

- `"bahasa_terdeteksi": "jawa"` 

```
}
```

## **10.5 Penyusunan profil akhir** 

Dipanggil sekali dengan seluruh transkrip terkumpul. <mark>`temperature: 0.1` .</mark> 

42 

Kita Kerja — Dokumen Prompt Pembangunan 

```
{
  "ringkasan": "2-3 kalimat, sudut pandang orang pertama, bahasa sederhana",
  "bidang_utama": "konstruksi",
  "pengalaman_tahun": 12,
  "keahlian": [
    {
      "nama_diajukan": "pemasangan keramik",
      "sebutan_pekerja": "pasang keramik",
      "level": "ahli",
      "kutipan_bukti": "paling sering keramik karo plester, wis rolas taun",
      "keyakinan": 0.88
    },
    {
      "nama_diajukan": "pembacaan gambar kerja",
      "sebutan_pekerja": "maca gambar sithik-sithik",
      "level": "terampil",
      "kutipan_bukti": "aku iso maca gambar sithik-sithik",
      "keyakinan": 0.65
    }
  ],
  "alat_dimiliki": ["waterpass", "gerinda"],
  "kesediaan": ["harian", "borongan"],
  "jangkauan_km": 15,
  "bahasa_terdeteksi": "jawa",
  "perlu_dikonfirmasi": ["pengalaman_tahun"]
}
```

## **10.6 Lapisan penjaga —** **<mark>`lib/ai/penjaga.ts`</mark>** 

Jalankan berurutan pada setiap keluaran AI. **Jangan pernah mengandalkan prompt untuk menegakkan aturan yang bisa ditegakkan kode.** 

43 

Kita Kerja — Dokumen Prompt Pembangunan 

```
export function jagaProfil(mentah: unknown): ProfilBersih {
  // 1. Bentuk
  const p = SkemaProfilZod.parse(mentah)
```

```
  // 2. Kutipan wajib — buang butir tanpa dasar
  p.keahlian = p.keahlian.filter(k => (k.kutipan_bukti ?? '').trim().length >= 3)
```

```
  // 3. Kutipan harus benar-benar berasal dari transkrip.
  //    Bandingkan dengan normalisasi longgar: huruf kecil, tanpa tanda baca.
  //    Bila kesamaan token < 60%, tolak butir tersebut.
  p.keahlian = p.keahlian.filter(k => kutipanAdaDiTranskrip(k.kutipan_bukti, transkripGabungan))
```

```
  // 4. Klem level berdasarkan keyakinan
  p.keahlian = p.keahlian.map(k => ({
    ...k,
    level: k.keyakinan >= 0.75 ? k.level
         : k.keyakinan >= 0.5  ? 'terampil'
         : 'pemula'
  }))
  // 5. Batas jumlah
  p.keahlian = p.keahlian.slice(0, 12)
```

```
  // 6. Hapus segala nominal dari teks bebas
  p.ringkasan = bersihkanNominal(p.ringkasan)
```

```
  // 7. Batas nilai wajar
```

```
  p.pengalaman_tahun = clamp(p.pengalaman_tahun, 0, 60)
  p.jangkauan_km = clamp(p.jangkauan_km, 1, 200)
  return p
}
const POLA_NOMINAL = [
  /Rp\s?[\d.,]+/gi,
  /\b\d+\s?(ribu|rb|juta|jt|k)\b/gi,
  /\b\d{5,}\b/g
]
export const bersihkanNominal = (t: string) =>
  POLA_NOMINAL.reduce((s, p) => s.replace(p, '—'), t)
```

#### Langkah 3 layak ditegaskan: **kutipan bukti diperiksa keberadaannya di transkrip asli.** Ini 

membuat halusinasi kutipan mustahil, bukan hanya tidak dianjurkan. Ini butir teknis paling kuat untuk disebut saat sesi tanya jawab juri. 

## **10.7 Normalisasi taksonomi dan cache** 

<mark>`nama_diajukan`</mark> dari AI adalah teks bebas. Ia harus dipetakan ke <mark>`keahlian_baku.id` .</mark> 

44 

Kita Kerja — Dokumen Prompt Pembangunan 

`1. Normalkan kunci: huruf kecil, buang spasi berlebih dan tanda baca` 

`2. Cek tabel cache_normalisasi → bila ada, pakai. Selesai, tanpa panggilan AI.` 

`3. Cocokkan langsung dengan keahlian_baku.nama_baku dan array alias` 

`4. Bila belum cocok, panggil GEMINI_MODEL_RINGAN dengan daftar taksonomi dan minta satu ID terdekat atau null` 

`5. Simpan hasilnya ke cache_normalisasi — permanen` 

`6. Bila null, simpan keahlian dengan nama_diajukan saja dan keahlian_id null. Butir semacam ini tidak ikut dalam pencocokan, tapi tetap tampil di kartu sebagai keahlian yang dinyatakan sendiri.` 

Cache ini adalah **pemotong kuota terbesar** di seluruh sistem, karena istilah lapangan sangat berulang: "tukang batu", "kuli", "tukang cor" akan muncul ribuan kali. Setelah sepekan pemakaian, sebagian besar normalisasi tidak lagi memerlukan panggilan AI. 

## **10.8 Tangga fallback** 

Terapkan pada setiap panggilan AI, berurutan: 

```
Percobaan 1  panggilan normal
     │ gagal jaringan atau 5xx
     ▼
Percobaan 2  ulangi sekali, jeda 800ms (backoff)
     │ gagal validasi Zod
     ▼
Percobaan 3  ulangi dengan prompt disederhanakan:
             buang instruksi adaptif, minta ekstraksi datar saja
     │ masih gagal
     ▼
Turun kelas  simpan audio, tampilkan:
             "Suaranya belum bisa saya proses. Rekamannya sudah saya simpan.
              Mau coba lagi, atau isi sendiri saja?"
             → tawarkan JALUR_MANUAL
```

Tidak pernah ada galat mentah yang sampai ke pengguna. Catat semuanya di <mark>`log_ai` .</mark> 

## **10.9 Arsitektur kuota** 

Kuota gratis Gemini kelas Flash: sekitar **10 permintaan per menit dan 1.500 per hari** . Ini harus dikelola secara arsitektural, bukan diabaikan. 

45 

Kita Kerja — Dokumen Prompt Pembangunan 

|`Batas keras     6 putaran per sesi wawancara`<br>`3 sesi wawancara per pengguna per hari`<br>`20 panggilan AI per pengguna per jam`|
|---|
|`Cache           normalisasi taksonomi → permanen`<br>`saringan aman → kunci sha256(teks_lowongan), pakai ulang`|
|`Antrean         bila 10 permintaan per menit tercapai, masukkan antrean dan`<br>`tampilkan pesan jujur: "Sedang banyak yang memakai, tunggu`<br>`sebentar ya" — bukan galat`|
|`Ambang global   dibaca dari tabel kuota_harian`<br>`< 1.200  normal`<br>`1.200–1.400  mode hemat:`<br>`· saringan aman hanya dari cache dan aturan deterministik`<br>`· normalisasi hanya dari cache dan pencocokan alias`<br>`· wawancara tetap jalan — ini fitur inti`<br>`> 1.400  hanya jalur manual, dengan pemberitahuan sopan`|
|`Pemantauan      setiap panggilan tercatat di log_ai`<br>`buat satu halaman internal sederhana yang menampilkan tabel ini`|



Halaman pemantauan itu bukan kelengkapan teknis semata — **tunjukkan halaman itu kepada juri** saat menjawab pertanyaan skalabilitas. Data nyata jauh lebih kuat daripada klaim. 

Perhatikan juga bahwa biaya AI hanya muncul pada tiga peristiwa: wawancara, pemasangan lowongan, dan pemeriksaan risiko. Bukan pada setiap kunjungan halaman. Ini poin yang layak disampaikan. 

46 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 11 — Mesin acuan upah (deterministik)** 

Tidak ada AI di bagian ini. Sepenuhnya aturan. 

```
// lib/mesin/acuan-upah.ts
export function hitungAcuanHarian(input: {
  umk: number                  // UMK kabupaten/kota
  pengaliKeahlian: number      // dari keahlian_baku.pengali_upah
  laporanLapangan: number[]    // upah harian dilaporkan, 90 hari terakhir
}): { acuan: number; metode: string; jumlahLaporan: number } {
  const lantaiHarian = Math.round(input.umk / 26)
  const acuanAturan  = Math.round(lantaiHarian * input.pengaliKeahlian)
  if (input.laporanLapangan.length >= 5) {
    const median = medianDari(input.laporanLapangan)
    // Jangan pernah menurunkan acuan di bawah lantai aturan.
    // Kalau upah lapangan memang ditekan, acuan tidak boleh ikut tertekan —
    // itu akan mengubah platform menjadi alat legitimasi upah rendah.
    const acuan = Math.max(acuanAturan, median)
    return { acuan, metode: 'umk_dan_lapangan', jumlahLaporan: input.laporanLapangan.length }
  }
  return { acuan: acuanAturan, metode: 'umk_saja', jumlahLaporan: input.laporanLapangan.length }
}
export function statusUpah(ditawarkan: number, acuan: number) {
  if (ditawarkan >= acuan)             return 'sesuai_acuan'
  if (ditawarkan >= acuan * 0.85)      return 'sedikit_di_bawah'
  return 'di_bawah_acuan'
}
```

Baris <mark>`Math.max`</mark> itu adalah keputusan produk, bukan keputusan teknis. Kalau median lapangan dipakai apa adanya, platform akan meneguhkan upah rendah yang sedang berlaku dan kehilangan alasan keberadaannya. Sebutkan ini bila juri bertanya soal metodologi. 

**Pengali keahlian awal.** Nilai-nilai ini adalah asumsi awal yang harus dikalibrasi, dan sebutkan demikian di proposal — jangan menyajikannya sebagai angka resmi. 

47 

Kita Kerja — Dokumen Prompt Pembangunan 

|**Keahlian**|**Pengali**|
|---|---|
|Pembantu rumah tangga|1,00|
|Buruh angkut|1,05|
|Tukang bangunan umum|1,15|
|Tukang taman|1,15|
|Plesteran|1,25|
|Pemasangan keramik|1,35|
|Instalasi listrik rumah|1,45|
|Montir motor|1,40|
|Tukang kayu / mebel|1,40|
|Kepala tukang|1,60|



Selalu tampilkan metodenya kepada pengguna dalam satu kalimat: _"Acuan dihitung dari UMK Kabupaten Malang dibagi 26 hari kerja, disesuaikan dengan jenis pekerjaan."_ Transparansi metodologi adalah bagian dari nama fitur ini. 

48 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 12 — Mesin pencocokan (deterministik dan dapat dijelaskan)** 

Tanpa embedding. Alasannya: pekerja berhak tahu mengapa ia dicocokkan, dan pemberi kerja berhak tahu dasar rekomendasi. Taksonomi dapat diaudit, dapat diuji, jauh lebih hemat kuota, dan tidak menghasilkan keluaran aneh yang tidak dapat dipertanggungjawabkan. 

```
// lib/mesin/pencocokan.ts
```

```
// SARINGAN KERAS — keluarkan sepenuhnya
```

- `//   jarak_km > kartu.jangkauan_km` 

- `//   lowongan.jenis_kerja tidak ada dalam kartu.kesediaan` 

```
//   lowongan.status <> 'tayang'
```

- `//   saringan_aman.tingkat = 'berisiko_tinggi' → tetap ditampilkan,` 

- `//     tetapi selalu di bagian bawah dan dengan penanda jelas` 

```
// SKOR
export function skorCocok(kartu: Kartu, lowongan: Lowongan, jarakKm: number) {
  let skor = 0
  const alasan: string[] = []
```

```
  for (const w of lowongan.keahlianWajib) {
    const punya = kartu.keahlian.find(k => k.keahlian_id === w.id)
    if (punya) {
      skor += 10
      if (punya.level === 'ahli') skor += 3
      else if (punya.level === 'terampil') skor += 1
      alasan.push(w.nama_baku)
    } else {
      skor -= 15                       // syarat wajib tidak terpenuhi
    }
  }
  for (const o of lowongan.keahlianOpsional) {
    if (kartu.keahlian.some(k => k.keahlian_id === o.id)) {
      skor += 4
      alasan.push(o.nama_baku)
    }
  }
  skor += Math.min(kartu.jumlahPekerjaanSelesai, 10) * 1.5
  if (kartu.jumlahPenilaian >= 3) skor += (kartu.rataPenilaian - 3) * 2
  skor -= (jarakKm / kartu.jangkauan_km) * 5
  return { skor, alasan }
}
```

49 

Kita Kerja — Dokumen Prompt Pembangunan 

**Tampilkan alasan, jangan tampilkan skor.** Skor angka tidak berarti apa pun bagi pengguna dan justru terasa seperti dinilai. Yang ditampilkan: 

**"Cocok karena Anda menyebut bisa pasang keramik dan plesteran — lowongan ini membutuhkan keduanya."** 

Bila <mark>`alasan`</mark> kosong tetapi lowongan tetap lolos saringan keras, tampilkan: "Belum ada keahlian yang cocok, tapi lokasinya dekat dan tidak butuh keahlian khusus." 

50 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 13 — Saringan Aman (gabungan AI dan aturan)** 

Skor risiko adalah **gabungan** keluaran AI dan aturan deterministik. Ini penting: sebagian sinyal risiko terbaik justru berupa data, bukan bahasa. 

```
skor_akhir = skor_ai (0–60)  +  skor_aturan (0–40)
```

```
skor_aturan:
```

- `+ 20  upah_ditawarkan < 0,70 × acuan` 

- `+ 12  pemberi_kerja.status_verifikasi = 'belum'` 

- `+  8  lokasi_teks < 10 karakter atau tidak memuat nama kecamatan` 

- `+ 10  pemberi kerja memiliki laporan_masalah belum selesai` 

- `+  6  akun pemberi kerja dibuat kurang dari 24 jam dan langsung memasang > 3 lowongan (dibatasi maksimum 40)` 

```
tingkat:
```

```
    < 30   aman
  30–59    hati_hati
   >= 60   berisiko_tinggi  → lowongan berstatus 'moderasi', tidak langsung tayang
```

Untuk lowongan berstatus moderasi, tampilkan kepada pemberi kerja **apa yang perlu diperbaiki** — bukan sekadar penolakan. Sebagian pemberi kerja yang tertandai sesungguhnya hanya menulis dengan buruk, bukan berniat jahat. 

Instruksi sistem Saringan Aman: 

```
Kamu penelaah keselamatan kerja untuk platform pekerja informal Indonesia.
Periksa teks lowongan berikut dan tandai pola yang perlu diwaspadai pekerja.
```

```
Pola yang dicari:
```

- `meminta pembayaran, deposit, atau biaya administrasi sebelum bekerja` 

- `lokasi kerja tidak jelas atau sengaja dikaburkan` 

- `mendesak komunikasi berpindah ke luar platform` 

- `menyertakan nomor pribadi atau tautan di dalam teks lowongan` 

- `janji penghasilan besar tanpa keahlian atau tanpa penjelasan pekerjaan` 

- `desakan agar segera memutuskan` 

- `kondisi sebenarnya disembunyikan: dijanjikan kerja harian tetapi sesungguhnya` 

- `harus menginap atau dikirim ke luar kota` 

- `identitas pemberi kerja tidak konsisten di dalam teks` 

##### `WAJIB` 

- `Setiap temuan menyertakan KUTIPAN dari teks lowongan.` 

- `Jangan pernah menyatakan sebuah lowongan pasti penipuan. Kamu menandai pola.` 

- `Keluarkan daftar pertanyaan konkret yang sebaiknya ditanyakan pekerja sebelum menerima. Ini keluaran yang paling penting — susun dengan sungguh-sungguh.` 

- `Jangan menyebut nominal apa pun.` 

51 

Kita Kerja — Dokumen Prompt Pembangunan 

Skema keluaran: 

```
{
  "skor_ai": 44,
  "temuan": [
    {
      "jenis": "minta_bayar_dimuka",
      "kutipan": "biaya administrasi 150rb ditransfer dulu",
      "penjelasan_untuk_pekerja": "Lowongan yang benar tidak pernah meminta Anda membayar lebih dulu."
    },
    {
      "jenis": "lokasi_tidak_jelas",
      "kutipan": "lokasi nanti diinfokan",
      "penjelasan_untuk_pekerja": "Alamat tempat kerja seharusnya jelas sejak awal."
    }
  ],
  "pertanyaan_disarankan": [
    "Alamat lengkap tempat kerjanya di mana?",
    "Upah dibayar harian atau setelah pekerjaan selesai?",
    "Perlu menginap atau pulang setiap hari?"
  ]
}
```

Di antarmuka, **daftar pertanyaan adalah bagian paling menonjol dari panel** , bukan catatan kecil di bawah. Ini keputusan desain yang membedakan memberdayakan dari menakut-nakuti. 

52 

Kita Kerja — Dokumen Prompt Pembangunan 

# **BAGIAN 14 — Ekstraksi lowongan teks bebas** 

```
Pemberi kerja di sektor informal bukan HRD — mereka ibu rumah tangga, pemilik
warung, kontraktor kecil. Mereka menulis seperti mengirim pesan WhatsApp.
```

```
Ubah teks bebas berikut menjadi lowongan terstruktur.
```

```
Ekstrak juga SYARAT TERSIRAT: hal yang jelas dimaksudkan tetapi tidak
dituliskan. Contoh: "butuh ART, ada bayi" menyiratkan pengalaman merawat
anak kecil. "renov dapur" menyiratkan pekerjaan bongkar dan pasang.
```

```
Tandai apa saja yang belum jelas dan perlu ditanyakan kepada pemberi kerja.
```

```
JANGAN mengarang upah bila tidak disebutkan — setel tercantum: false.
JANGAN mengarang tanggal bila tidak disebutkan.
```

```
{
  "judul_baku": "tukang renovasi dapur",
  "bidang": "konstruksi",
  "keahlian_dibutuhkan": [
    { "nama_diajukan": "pemasangan keramik", "wajib": true },
    { "nama_diajukan": "plesteran", "wajib": false }
  ],
  "jenis_kerja": "borongan",
  "jumlah_pekerja": 2,
  "lokasi_teks": "Sukun, Malang",
  "upah": { "nilai": null, "satuan": null, "tercantum": false },
  "mulai": "2026-08-03",
  "syarat_tersirat": ["bawa alat sendiri", "bisa kerja tim kecil"],
  "kelengkapan": 0.6,
  "yang_belum_jelas": ["besaran upah", "perkiraan lama pengerjaan", "alat disediakan atau tidak"]
}
```

Skor <mark>`kelengkapan`</mark> dihitung deterministik dari jumlah bidang penting yang terisi, bukan oleh AI. Tampilkan sebagai dorongan halus kepada pemberi kerja: "Lowongan yang lengkap terisi rata-rata lebih cepat." 

53 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 15 — Kartu Kerja, QR, dan cetak** 

## **15.1 Penerbitan** 

Kartu diterbitkan hanya setelah pekerja mengonfirmasi minimal satu keahlian. Saat diterbitkan: setel <mark>`diterbitkan_pada`</mark> , hasilkan <mark>`token_publik`</mark> bila belum ada, dan buat QR. 

## **15.2 QR** 

- Isi: <mark>`${APP_URL}/verifikasi/${token_publik}`</mark> — tidak ada data pribadi di dalam QR 

- Tingkat koreksi galat: **M** 

- Ukuran cetak minimum **22 mm** persegi, dengan margin putih 4 modul 

- Hasilkan sebagai **SVG di sisi server** agar tajam saat dicetak 

- Sisipkan huruf "KK" kecil di tengah hanya bila tingkat koreksi galat tetap aman 

## **15.3 Tata letak cetak** 

Sediakan dua ukuran. Halaman <mark>`/pekerja/kartu/cetak`</mark> memakai CSS cetak khusus dan menyembunyikan seluruh navigasi. 

**Kartu saku — 85 × 54 mm.** Ukuran ini dipilih karena sama dengan KTP: pekerja langsung tahu cara menyimpannya, dan dompet mana pun bisa memuatnya. Tiga kartu per lembar A4 dengan garis potong. 



<!-- Start of picture text -->
┌───────────────────────────────────────────────┐<br>│ KITA KERJA                       ┌─────────┐  │<br>│                                  │         │  │<br>│ ┌────┐  WARTO SUGIANTO           │   QR    │  │<br>│ │foto│  Tukang bangunan          │  22mm   │  │<br>│ └────┘  Malang                   │         │  │<br>│                                  └─────────┘  │<br>│ Keramik · Plesteran · Baca gambar             │<br>│                                               │<br>│ 47 pekerjaan selesai  ·  ★ 4,8                │<br>│ Pindai untuk memeriksa   kk.id/v/a3f9c1       │<br>└───────────────────────────────────────────────┘<br><!-- End of picture text -->

**Lembar A5** untuk pekerja yang ingin menunjukkan riwayat lengkap: seluruh keahlian dikelompokkan per lapis kepercayaan, sepuluh pekerjaan terakhir, QR lebih besar. 

CSS cetak: 

54 

Kita Kerja — Dokumen Prompt Pembangunan 

```
@page { size: A4; margin: 10mm; }
@media print {
  nav, .tanpa-cetak { display: none !important; }
  .kartu-saku {
    width: 85mm; height: 54mm;
    break-inside: avoid;
    border: 0.3mm dashed #A69F92;
  }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

Uji dengan mencetak sungguhan di kertas, lalu pindai QR-nya dengan ponsel. Jangan puas dengan pratinjau cetak di peramban. 

## **15.4 Endpoint verifikasi publik** 

```
// app/api/kartu/[token]/route.ts
// Memakai service role. Memilih kolom SECARA EKSPLISIT — jangan pernah select *.
// Rate limit per IP. Header noindex.
const dipilih = {
  nama_tampil: inisialkanNamaBelakang(p.nama),   // "Warto S."
  url_foto: p.url_foto,
  wilayah: w.nama,
  bidang_utama: b.nama,
  diterbitkan_pada: k.diterbitkan_pada,
  keahlian_terverifikasi: [...],
  keahlian_diklaim: [...],
  jumlah_pekerjaan_selesai: n,
  rata_penilaian: r,
  jumlah_penilaian: m,
  pekerjaan_terakhir: [ { bulan, judul, wilayah } ]   // maksimal 5, tanpa nama pemberi kerja
}
// TIDAK PERNAH: no_hp, alamat lengkap, url audio, token lain, id internal
```

Bila <mark>`aktif_publik = false`</mark> atau token tidak ditemukan, kembalikan halaman sopan yang sama untuk kedua kasus — jangan membedakan, agar keberadaan token tidak bisa disimpulkan. 

55 

Kita Kerja — Dokumen Prompt Pembangunan 

# **BAGIAN 16 — Mode demo** 

Bagian ini bukan kelengkapan. Ini asuransi untuk babak final, di mana 25% nilai bergantung pada demo yang berjalan lancar. 

Aktif hanya bila <mark>`DEMO_MODE=true` .</mark> Rute <mark>`/demo`</mark> menyediakan: 

1. **Ganti persona satu klik** — masuk sebagai Pak Warto (pekerja dengan kartu lengkap), Bu Yanti (pekerja baru tanpa kartu), Mbak Dhika (pemberi kerja), atau Pak Slamet (pendamping). Menghindari kehilangan waktu untuk keluar-masuk akun di depan juri. 

2. **Setel ulang data demo** — kembalikan seluruh data ke keadaan awal. Wajib ada; demo yang gagal karena data sisa percobaan sebelumnya adalah kesalahan yang bisa dicegah. 

3. **Rekaman contoh** — sertakan tiga berkas audio bahasa Jawa, Sunda, dan Indonesia yang sudah direkam sebelumnya. Di layar Ngobrol Kerja tampilkan tombol kecil "pakai rekaman contoh". Bila mikrofon di komputer presentasi bermasalah atau ruangan berisik, alur demo tetap bisa berjalan. 

4. **Sakelar simulasi kegagalan** — paksa keadaan kuota habis dan keadaan AI gagal. Ini memungkinkan kalian **mendemokan degradasi berjenjang secara sengaja** saat juri bertanya soal skalabilitas. Menunjukkan sistem turun kelas dengan mulus jauh lebih meyakinkan daripada menjelaskannya. 

Sembunyikan seluruh jejak mode demo bila <mark>`DEMO_MODE=false` .</mark> 

56 

Kita Kerja — Dokumen Prompt Pembangunan 

# **BAGIAN 17 — Data awal** 

Data awal yang meyakinkan menentukan apakah aplikasi terasa hidup atau terasa seperti tugas kuliah. Kerjakan dengan serius. 

**Wilayah** — minimal 6 kabupaten/kota dengan UMK sungguhan tahun berlaku: Kota Malang, Kabupaten Malang, Kota Surabaya, Kabupaten Sidoarjo, Kota Yogyakarta, Kabupaten Sleman. 

**Bidang kerja** — 6: konstruksi, rumah tangga, otomotif, jasa harian, pertanian, perdagangan kecil. 

**Keahlian baku** — minimal 30 butir dengan array <mark>`alias`</mark> yang kaya. Ini yang membuat normalisasi bekerja. Contoh: 

```
pemasangan keramik   alias: {pasang keramik, tukang keramik, keramik, tegel, pasang tegel}
plesteran            alias: {plester, aci, tukang plester, ngaci}
tukang bangunan umum alias: {kuli, kuli bangunan, buruh bangunan, tukang batu, tukang}
pengecoran           alias: {cor, ngecor, bikin cor, tukang cor}
instalasi listrik    alias: {listrik, tukang listrik, pasang listrik, instalatir}
pembantu rumah tangga alias: {art, prt, pembantu, asisten rumah tangga, bibi}
merawat anak         alias: {baby sitter, jaga anak, momong, pengasuh}
montir motor         alias: {montir, tukang motor, bengkel motor, mekanik motor}
```

**Konversi satuan** — untuk normalisasi ucapan. 

**Pengguna** — 12 pekerja dengan Kartu Kerja pada tahap berbeda: 3 lengkap dengan riwayat panjang, 4 lengkap dengan riwayat pendek, 3 baru diterbitkan tanpa riwayat, 2 belum punya kartu. Plus 5 pemberi kerja dan 1 pendamping. 

**Lowongan** — 15 butir, tersebar: 8 aman, 4 hati-hati, dan **3 yang sengaja dibuat berpola penipuan** untuk mendemokan Saringan Aman. Salah satunya harus benar-benar menyerupai lowongan penipuan yang nyata: meminta biaya administrasi, lokasi kabur, mendesak segera memutuskan. 

**Riwayat pekerjaan** — minimal 40 baris <mark>`pekerjaan`</mark> selesai dengan penilaian, tersebar sepanjang delapan bulan, sehingga grafik penghasilan punya bentuk dan Kartu Kerja terasa bertumbuh. 

Semua nama orang, nama tempat, dan nominal harus terasa Indonesia dan wajar. Data karangan yang terasa asing akan merusak kredibilitas demo. 

57 

Kita Kerja — Dokumen Prompt Pembangunan 

# **BAGIAN 18 — Kriteria selesai** 

Jangan menyatakan sebuah fitur selesai sebelum seluruh butirnya tercentang. 

#### **Keamanan** 

- [ ] Pencarian <mark>`GEMINI`</mark> di bundel klien mengembalikan nol hasil 

- 

- [ ] Pencarian <mark>`SERVICE_ROLE`</mark> di bundel klien mengembalikan nol hasil 

- [ ] <mark>`/verifikasi/[token]`</mark> tidak dapat ditebak dengan menaikkan angka 

- [ ] Bucket audio bersifat privat; URL langsung tanpa tanda tangan mengembalikan 403 

- [ ] <mark>`insert`</mark> langsung ke tabel <mark>`pekerjaan`</mark> dari klien ditolak RLS 

- [ ] <mark>`update`</mark> pada <mark>`penilaian`</mark> ditolak RLS 

- [ ] Mengakses <mark>`/pekerja/kartu`</mark> sebagai pemberi kerja dialihkan oleh server, bukan disembunyikan klien 

- [ ] Semua endpoint AI memiliki rate limit yang teruji 

- 

#### **Integritas AI** 

- [ ] Tidak ada baris <mark>`kartu_keahlian`</mark> dengan <mark>`kutipan_bukti`</mark> kosong 

- [ ] Kutipan yang tidak ada di transkrip ditolak lapisan penjaga 

- [ ] Tidak ada nominal mata uang di teks mana pun yang dihasilkan AI 

- [ ] Level otomatis turun ke <mark>`terampil`</mark> bila keyakinan < 0,75 

- [ ] Wawancara berhenti keras di putaran keenam 

- [ ] Cache normalisasi benar-benar mencegah panggilan AI berulang untuk istilah sama 

#### **Aksesibilitas** 

- [ ] Tidak ada teks di bawah 15px kecuali penanda <mark>`mikro`</mark> 

- [ ] Semua target sentuh minimal 48px; CTA utama 56px 

- [ ] Seluruh pasangan warna lulus 4,5:1 — verifikasi dengan alat, bukan perkiraan 

- [ ] Seluruh alur pekerja dapat diselesaikan tanpa mengetik satu kata pun 

- [ ] Jalur manual dapat diakses dari setiap alur AI tanpa harus gagal lebih dulu 

- [ ] Seluruh aplikasi dapat dinavigasi dengan papan tuts 

- [ ] Diuji dengan <mark>`prefers-reduced-motion: reduce`</mark> 

#### **Ketahanan** 

- [ ] Mematikan <mark>`GEMINI_API_KEY`</mark> tidak mematikan aplikasi — jalur manual tetap jalan 

- [ ] Memaksa keadaan kuota habis menampilkan pesan sopan, bukan galat 

- [ ] Memutus jaringan di tengah wawancara tidak menghilangkan audio yang sudah terunggah 

- [ ] Alur rekam berjalan di Chrome Android **dan** Safari iOS 

- [ ] Diuji pada koneksi throttled 3G lambat 

#### **Kelayakan demo** 

- [ ] Kartu Kerja dicetak di kertas sungguhan, QR-nya berhasil dipindai ponsel 

- [ ] <mark>`/demo`</mark> dapat mengganti persona dan menyetel ulang data 

- 

- [ ] Rekaman contoh berfungsi bila mikrofon tidak tersedia 

- 

- [ ] Simulasi kegagalan dapat ditunjukkan atas permintaan 

- 

58 

Kita Kerja — Dokumen Prompt Pembangunan 

- [ ] Basis data berisi data awal yang meyakinkan, bukan tabel kosong 

- [ ] Tautan hasil deploy terbuka dari perangkat dan jaringan lain 

- [ ] Repositori GitHub bersifat publik 

59 

Kita Kerja — Dokumen Prompt Pembangunan 

**BAGIAN 19 — Referensi** 

## **Desain dan antarmuka** 

|**Referensi**|**Diambil untuk**|
|---|---|
|**Plus Jakarta Sans**— Tokotype,<br>Indonesia|huruf utama; dirancang di Indonesia untuk identitas Jakarta|
|**GOV.UK Design System**|bahasa sederhana, pola formulir untuk pengguna berkemampuan beragam,<br>pesan galat yang membantu|
|**Material Design 3**|ukuran target sentuh, lapisan keadaan, pola navigasi bawah|
|**WCAG 2.1 AA**|ambang kontras, urutan fokus, teks alternatif|
|**Aplikasi mitra Gojek dan**<br>**Grab**|antarmuka berikon besar, satu tugas per layar, terbaca di bawah sinar<br>matahari|
|**Interaksi pesan suara**<br>**WhatsApp**|tekan-tahan untuk merekam, gelombang audio, geser untuk membatalkan|
|**Duolingo**|umpan balik kemajuan pada alur bertahap, indikator titik|
|**shadcn/ui + Radix UI**|primitif komponen yang sudah aksesibel|
|**Lucide**|himpunan ikon garis tunggal yang konsisten|
|**Stripe Dashboard**|hanya untuk kerapatan informasi di dasbor pemberi kerja|



## **Teknis** 

|**Referensi**|**Untuk**|
|---|---|
|Dokumentasi Gemini API —_Audio_<br>_understanding_|masukan audio, petunjuk bahasa, batas ukuran|
|Dokumentasi Gemini API —_Structured output_|`responseSchema`,<br>`responseMimeType`|
|Dokumentasi Gemini API —_Rate limits_|batas kuota tingkat gratis|
|Supabase —_Row Level Security_|pola kebijakan,<br>`security definer`|
|Supabase —_Storage access control_|signed URL, bucket privat|
|Next.js —_Route Handlers_,_Server Actions_|pemisahan server dan klien|
|MDN —<br>`MediaRecorder`,<br>`AnalyserNode`|perekaman audio, gelombang, perbedaan MIME antar<br>peramban|
|Zod|validasi di batas server|



60 

Kita Kerja — Dokumen Prompt Pembangunan 

## **Data dan kebijakan** 

|**Sumber**|**Dipakai untuk**|
|---|---|
|BPS — Keadaan Ketenagakerjaan Indonesia, Februari|87,74 juta pekerja informal; 59,42%; komposisi status|
|2026|pekerjaan|
|Keputusan UMK provinsi tahun berlaku|dasar mesin acuan upah|
|World Bank Global Findex|populasi unbanked dan kepemilikan HP|
|OJK — peringatan penipuan berkedok lowongan|pola yang dicari Saringan Aman|



61 

Kita Kerja — Dokumen Prompt Pembangunan 

# **BAGIAN 20 — Urutan pembangunan** 

Kerjakan berurutan. Jangan melompat. Selesaikan kriteria selesai setiap blok sebelum lanjut. 

**Blok 1 — fondasi.** Inisiasi Next.js dan TypeScript. Pasang Tailwind dan token desain dari Bagian 4. Siapkan Supabase, jalankan migrasi Bagian 7, pasang RLS Bagian 8, buat fungsi <mark>`selesaikan_pekerjaan` .</mark> Isi data awal Bagian 17. Autentikasi tiga peran dan proteksi rute di middleware serta server. **Deploy kosong ke Vercel sekarang** — kejutan saat deploy di akhir adalah penyebab kegagalan paling umum pada tenggat pendek. 

**Blok 2 — jalur AI.** Bangun <mark>`lib/ai/klien-gemini.ts`</mark> sebagai satu-satunya pintu ke Gemini. Skema keluaran dan cermin Zod. Lapisan penjaga Bagian 10.6 lengkap dengan pemeriksaan kutipan terhadap transkrip. Kuota dan tangga fallback. Unggah audio ke Storage, mesin keadaan wawancara, layar Ngobrol Kerja, layar konfirmasi, jalur manual. **Uji dengan rekaman bahasa daerah sungguhan** — di situlah seluruh nilai demo berada, dan bahasa Indonesia formal tidak akan menguji apa pun. 

**Blok 3 — Kartu Kerja.** Penerbitan, halaman kartu, tiga lapis kepercayaan yang dibedakan visualnya, QR SVG sisi server, halaman verifikasi publik dengan pemilihan kolom eksplisit dan rate limit, tata letak cetak dua ukuran. **Cetak di kertas sungguhan dan pindai dengan ponsel** sebelum melanjutkan. 

**Blok 4 — lowongan dan mesin.** Ekstraksi teks bebas, layar konfirmasi berikut bagian "yang saya simpulkan" dan "yang belum jelas". Mesin acuan upah. Saringan Aman gabungan AI dan aturan. Mesin pencocokan dengan alasan yang ditampilkan. Daftar dan detail lowongan. 

**Blok 5 — kesepakatan dan riwayat.** Kesepakatan Kerja, OTP dua pihak, konfirmasi selesai lewat fungsi server, penilaian, pelaporan masalah, grafik penghasilan, pelaporan upah yang memperkaya acuan. 

**Blok 6 — mode demo dan penyempurnaan.** Panel <mark>`/demo` ,</mark> rekaman contoh, simulasi kegagalan. Keadaan kosong yang informatif di setiap daftar. Keadaan memuat. Penanganan galat. Halaman pemantauan <mark>`log_ai` .</mark> 

**Blok 7 — pengujian dan pengetatan.** Seluruh daftar Bagian 18. Uji di ponsel sungguhan pada jaringan lambat. Audit kontras dengan alat. Uji di Safari iOS. Latih alur demo minimal lima kali dan rekam video cadangan. 

**Aturan pemotongan, berurutan bila waktu menipis:** buang Kesepakatan Kerja OTP → Upah Terang → Saringan Aman. **Jangan pernah memotong** Ngobrol Kerja, Kartu Kerja beserta halaman verifikasi QR, dan pencocokan. Ketiga itu saja sudah merupakan produk utuh yang dapat dipertahankan di depan juri. 

# **Penutup** 

Kekuatan produk ini bukan pada teknologinya, melainkan pada ketepatan diagnosisnya. Hampir semua peserta lomba akan membangun portal lowongan dan menjelaskan bahwa pekerja informal butuh akses pekerjaan. Yang dibangun di sini menjawab persoalan yang lebih tepat: pekerja informal sudah punya pengalaman dan sudah punya reputasi — masalahnya reputasi itu lisan, lokal, dan hangus setiap kali mereka berpindah. 

Dua hal yang harus tetap terjaga sampai akhir. 

62 

Kita Kerja — Dokumen Prompt Pembangunan 

Pertama, **pemeriksaan kutipan terhadap transkrip** di Bagian 10.6. Itu bukan detail teknis kecil; itu yang membuat klaim "AI kami tidak bisa mengarang" dapat dibuktikan alih-alih dijanjikan. 

Kedua, **Kartu Kerja yang bisa dicetak dan diverifikasi tanpa akun.** Selembar kertas yang dipindai di depan kamera Zoom, lalu halaman verifikasi terbuka di layar bersama. Momen itu bernilai lebih dari sepuluh fitur. 

63 

Kita Kerja — Dokumen Prompt Pembangunan 

