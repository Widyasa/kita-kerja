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

export const metadata: Metadata = {
  title: "Kita Kerja — Bukti Pengalaman untuk Pekerja Informal",
  description:
    "Ubah cerita kerja Anda menjadi Kartu Kerja yang bisa dibawa ke mana pun.",
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
