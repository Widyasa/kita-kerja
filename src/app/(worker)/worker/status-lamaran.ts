import type { StatusLamaran } from "@/lib/mock";

/**
 * Arti tiap status lamaran dalam bahasa sederhana —
 * tiap butir selalu menjelaskan arti status DAN langkah berikutnya
 * dalam satu kalimat (dipakai beranda + halaman lamaran).
 */
export const INFO_STATUS_LAMARAN: Record<
  StatusLamaran,
  { label: string; penjelasan: string; kelas: string }
> = {
  dilamar: {
    label: "Sudah dilamar",
    penjelasan:
      "Lamaran Anda sudah terkirim — pemberi kerja sedang memeriksa Kartu Kerja Anda, tidak perlu melamar ulang.",
    kelas: "bg-tanah-100 text-tanah-700",
  },
  diundang: {
    label: "Diundang",
    penjelasan:
      "Pemberi kerja tertarik dengan Kartu Kerja Anda — hubungi beliau dan sepakati upah serta tanggal mulai secara jelas.",
    kelas: "bg-kuning-50 text-kuning-800",
  },
  disepakati: {
    label: "Disepakati",
    penjelasan:
      "Kesepakatan sudah dibuat — periksa tanggal pembayaran yang dijanjikan di halaman kesepakatan.",
    kelas: "bg-aman-50 text-aman-600",
  },
  ditolak: {
    label: "Tidak berlanjut",
    penjelasan:
      "Lowongan ini tidak berlanjut — masih banyak lowongan lain yang cocok dengan keahlian Anda.",
    kelas: "bg-tanah-100 text-tanah-600",
  },
};
