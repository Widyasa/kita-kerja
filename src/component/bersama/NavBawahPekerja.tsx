"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  BriefcaseBusiness,
  Inbox,
  IdCard,
  History,
  CircleUser,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { TombolKeluar } from "./TombolKeluar";

/**
 * NavBawahPekerja — tab besar (Bagian 4.5).
 * Tinggi 64px, ikon + label selalu berpasangan, state aktif jelas,
 * target sentuh >= 48px per tab.
 */

const TAB: { href: string; label: string; ikon: LucideIcon }[] = [
  { href: "/worker", label: "Beranda", ikon: House },
  { href: "/worker/jobs", label: "Lowongan", ikon: BriefcaseBusiness },
  { href: "/worker/applications", label: "Lamaran", ikon: Inbox },
  { href: "/worker/card", label: "Kartu", ikon: IdCard },
  { href: "/worker/history", label: "Riwayat", ikon: History },
  { href: "/worker/profile", label: "Profil", ikon: CircleUser },
];

function tabAktif(pathname: string, href: string): boolean {
  if (href === "/worker") return pathname === "/worker";
  return pathname.startsWith(href);
}

export function NavBawahPekerja() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama pekerja"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-tanah-200 bg-tanah-0 pb-[env(safe-area-inset-bottom)] pt-2"
    >
      <ul className="mx-auto grid h-16 max-w-(--max-worker) grid-cols-7">
        {TAB.map((tab) => {
          const aktif = tabAktif(pathname, tab.href);
          const Ikon = tab.ikon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex h-16 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden px-0.5 transition-colors duration-(--duration-fast)",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-biru-600/40",
                  aktif
                    ? "font-bold text-biru-600"
                    : "text-tanah-500 hover:text-tanah-700",
                )}
              >
                <Ikon
                  className={cn("size-5 sm:size-6", aktif && "fill-biru-50")}
                  aria-hidden
                />
                <span className="max-w-full truncate text-center text-[0.75rem] leading-tight max-sm:hidden">
                  {tab.label}
                </span>
                <span
                  className={cn(
                    "h-1 w-6 rounded-pill",
                    aktif ? "bg-biru-600" : "bg-transparent",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
        <li>
          <TombolKeluar variant="vertical" />
        </li>
      </ul>
    </nav>
  );
}
