import QRCode from "qrcode";

import { cn } from "@/lib/utils";

/**
 * QrSvg — komponen SERVER. Menghasilkan QR sebagai SVG inline tajam
 * (paket `qrcode`, errorCorrectionLevel 'M'), tanpa kanvas/peramban.
 */
export async function QrSvg({
  teks,
  ukuran = 128,
  className,
}: {
  teks: string;
  ukuran?: number;
  className?: string;
}) {
  const svg = await QRCode.toString(teks, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#1a1814", light: "#00000000" },
  });

  return (
    <span
      role="img"
      aria-label="Kode QR Kartu Kerja"
      className={cn("inline-block [&>svg]:size-full", className)}
      style={{ width: ukuran, height: ukuran }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
