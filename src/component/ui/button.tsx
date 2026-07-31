import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Tombol Kita Kerja — token Bagian 4.
 * - Target sentuh >= 48px (min-h-12), CTA utama 56px (size="lg").
 * - Teks tombol selalu >= 19px (text-button).
 * - Kontras terverifikasi:
 *   putih #FFFFFF di atas biru-600 #2547EB  = 5,96:1 (AA)
 *   tanah-900 #1A1814 di atas kuning-600 #D97706 = 5,45:1 (AA)
 */
const buttonVariants = cva(
  // `whitespace-normal` + `max-w-full` (BUG-011): sebelumnya `whitespace-nowrap`
  // memaksa label panjang tetap satu baris, sehingga CTA "Lihat seperti yang
  // dilihat pemindai QR" melebar 392px di viewport 375px dan memicu scroll
  // horizontal pada beranda.
  "inline-flex max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-center text-button font-semibold whitespace-normal transition-colors duration-(--duration-fast) ease-(--ease-default) outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-biru-600 text-tanah-0 shadow-1 hover:bg-biru-700",
        aksen: "bg-kuning-500 text-tanah-900 shadow-1 hover:bg-kuning-400",
        destructive: "bg-bahaya-600 text-tanah-0 shadow-1 hover:bg-bahaya-600/90",
        outline:
          "border border-tanah-300 bg-tanah-0 text-tanah-800 shadow-1 hover:bg-tanah-100",
        secondary: "bg-tanah-100 text-tanah-800 hover:bg-tanah-200",
        ghost: "text-tanah-700 hover:bg-tanah-100",
        link: "text-biru-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-12 px-5 py-2",
        // `min-h-14`, bukan `h-14` (BUG-012): tinggi tetap bisa ditimpa saat
        // tombol jadi flex item ber-`flex-1` di kontainer kolom — dua CTA hero
        // sempat mengecil jadi 28px dan 32px di layar <=768px.
        lg: "min-h-14 px-6 py-2", // CTA utama 56px
        sm: "min-h-12 px-4",
        icon: "size-12",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
