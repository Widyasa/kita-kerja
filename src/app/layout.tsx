import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "@/gaya/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
});

const JUDUL_UTAMA = "Kita Kerja — Bukti Pengalaman untuk Pekerja Informal";
const DESKRIPSI_UTAMA =
  "Ubah cerita kerja Anda menjadi Kartu Kerja yang bisa dibawa ke mana pun.";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://kita-kerja.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  // `template` membuat tiap halaman cukup menulis judulnya sendiri (BUG-022).
  title: { default: JUDUL_UTAMA, template: "%s — Kita Kerja" },
  description: DESKRIPSI_UTAMA,
  applicationName: "Kita Kerja",
  // Tautan Kartu Kerja paling sering dibagikan lewat WhatsApp (BUG-023).
  openGraph: {
    type: "website",
    siteName: "Kita Kerja",
    locale: "id_ID",
    url: BASE_URL,
    title: JUDUL_UTAMA,
    description: DESKRIPSI_UTAMA,
  },
  twitter: {
    card: "summary_large_image",
    title: JUDUL_UTAMA,
    description: DESKRIPSI_UTAMA,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2547eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans), sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
