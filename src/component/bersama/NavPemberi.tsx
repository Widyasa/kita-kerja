"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  SquarePlus,
  BriefcaseBusiness,
  Handshake,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { TombolKeluar } from "./TombolKeluar";

/**
 * NavPemberi — sidebar di layar >= lg, bottom nav di layar sempit.
 * Menu mengikuti rute (employer) yang ada: /employer, /employer/post,
 * /employer/jobs (lewat detail lowongan), /employer/agreements.
 * Ikon SELALU berpasangan dengan label teks.
 */

const MENU: { href: string; label: string; ikon: LucideIcon }[] = [
  { href: "/employer", label: "Dasbor", ikon: LayoutDashboard },
  { href: "/employer/post", label: "Pasang Lowongan", ikon: SquarePlus },
  { href: "/employer/jobs", label: "Lowongan Saya", ikon: BriefcaseBusiness },
  { href: "/employer/agreements", label: "Kesepakatan", ikon: Handshake },
];

function menuAktif(pathname: string, href: string): boolean {
  if (href === "/employer") return pathname === "/employer";
  return pathname.startsWith(href);
}

export function NavPemberi() {
  const pathname = usePathname();

  const tautan = (item: (typeof MENU)[number], sempit: boolean) => {
    const aktif = menuAktif(pathname, item.href);
    const Ikon = item.ikon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={aktif ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 text-label transition-colors duration-(--duration-fast)",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
          sempit
            ? "h-16 min-w-12 flex-col justify-center gap-0.5 px-2"
            : "min-h-12 w-full",
          aktif
            ? "bg-biru-50 font-bold text-biru-600"
            : "text-tanah-600 hover:bg-tanah-100 hover:text-tanah-800",
        )}
      >
        <Ikon className="size-6 shrink-0" aria-hidden />
        <span className={cn(sempit && "text-center leading-tight")}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Sidebar >= lg */}
      <nav
        aria-label="Navigasi pemberi kerja"
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-tanah-200 bg-tanah-0 p-4 lg:flex"
      >
        <p className="mb-4 px-4 py-2 text-h3 text-biru-600">Kita Kerja</p>
        {MENU.map((m) => tautan(m, false))}
        <div className="mt-auto pt-4">
          <TombolKeluar variant="horizontal" />
        </div>
      </nav>

      {/* Bottom nav < lg */}
      <nav
        aria-label="Navigasi pemberi kerja"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-tanah-200 bg-tanah-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="mx-auto grid h-16 grid-cols-5">
          {MENU.map((m) => tautan(m, true))}
          <TombolKeluar variant="vertical" />
        </div>
      </nav>
    </>
  );
}
