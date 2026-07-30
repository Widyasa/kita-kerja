"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserPlus, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * NavBawahPendamping — 2 tab besar (Bagian 4.5), meniru gaya NavBawahPekerja.
 * Tinggi 64px, ikon + label selalu berpasangan, state aktif jelas,
 * target sentuh >= 48px per tab.
 */

const TAB: { href: string; label: string; ikon: LucideIcon }[] = [
  { href: "/companion", label: "Pekerja Saya", ikon: Users },
  { href: "/companion/register", label: "Daftarkan", ikon: UserPlus },
];

function tabAktif(pathname: string, href: string): boolean {
  if (href === "/companion") return pathname === "/companion";
  return pathname.startsWith(href);
}

export function NavBawahPendamping() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama pendamping"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-tanah-200 bg-tanah-0 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid h-16 max-w-(--max-worker) grid-cols-2">
        {TAB.map((tab) => {
          const aktif = tabAktif(pathname, tab.href);
          const Ikon = tab.ikon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex h-16 min-w-12 flex-col items-center justify-center gap-0.5 text-label transition-colors duration-(--duration-fast)",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-biru-600/40",
                  aktif
                    ? "font-bold text-biru-600"
                    : "text-tanah-500 hover:text-tanah-700",
                )}
              >
                <Ikon
                  className={cn("size-6", aktif && "fill-biru-50")}
                  aria-hidden
                />
                {tab.label}
                <span
                  className={cn(
                    "h-1 w-8 rounded-pill",
                    aktif ? "bg-biru-600" : "bg-transparent",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
