"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X, LogOut, HardHat, UsersRound, HandHeart } from "lucide-react";

import { Button } from "@/component/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser-client";
import type { Peran } from "@/lib/mock";

const TAUTAN_NAV = [
  { label: "Lowongan", href: "/lowongan" },
  { label: "Cara kerja", href: "/cara-kerja" },
];

/**
 * Layout (public) — header publik: logo, nav halaman terbuka, tombol Masuk.
 *
 * Nav di desktop inline (640px+), mobile hamburger (<640px).
 *
 * Pengecualian `/verify/*`: halaman verifikasi dibuka orang asing yang baru
 * memindai QR — layout-nya diminimalkan jadi satu strip identitas agar
 * dipahami dalam 5 detik (Bagian 6.5).
 */
function TombolHeader({ user, peran }: { user?: { id: string } | null; peran?: Peran | null }) {
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <Button asChild variant="outline" className="max-sm:hidden">
        <Link href="/sign-in">
          <LogIn aria-hidden />
          Masuk
        </Link>
      </Button>
    );
  }

  // Role-based button for logged-in users
  const btnConfig = {
    pekerja: { label: "Saya cari kerja", href: "/worker", icon: HardHat },
    pemberi_kerja: { label: "Saya butuh pekerja", href: "/employer", icon: UsersRound },
    pendamping: { label: "Saya dukung pekerja", href: "/companion", icon: HandHeart },
  };

  const config = peran ? btnConfig[peran] : null;

  return (
    <>
      {config && (
        <Button asChild variant="aksen" className="max-sm:hidden">
          <Link href={config.href}>
            {<config.icon aria-hidden />}
            {config.label}
          </Link>
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          setLoading(true);
          const supabase = createClient();
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
        disabled={loading}
        className="max-sm:hidden"
      >
        <LogOut aria-hidden className="size-4" />
      </Button>
    </>
  );
}

export default function LayoutPublik({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const halamanVerifikasi = pathname.startsWith("/verify");
  const [navOpen, setNavOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [peran, setPeran] = useState<Peran | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from("pengguna")
          .select("peran")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) setPeran(data.peran as Peran);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (halamanVerifikasi) {
    return (
      <div className="min-h-dvh bg-tanah-50">
        <header className="tanpa-cetak border-b border-tanah-200 bg-tanah-0">
          <div className="mx-auto flex h-14 w-full max-w-(--max-worker) items-center justify-center px-4">
            <p className="text-label text-tanah-600">
              <span className="font-bold text-biru-600">Kita Kerja</span>
              {" · Verifikasi Kartu Kerja"}
            </p>
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="tanpa-cetak sticky top-0 z-30 border-b border-tanah-200 bg-tanah-0/95 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-(--max-employer) px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="text-h3 -ml-2 flex min-h-12 items-center rounded-md px-2 text-biru-600 focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
            >
              Kita Kerja
            </Link>

            {/* Desktop nav (≥640px) */}
            <nav
              aria-label="Halaman publik"
              className="ml-auto mr-2 max-sm:hidden"
            >
              <ul className="flex items-center gap-1">
                {TAUTAN_NAV.map((t) => (
                  <li key={t.href}>
                    <TautanNav
                      {...t}
                      aktif={pathname.startsWith(t.href)}
                      className="px-4"
                    />
                  </li>
                ))}
              </ul>
            </nav>

            {/* Mobile hamburger toggle */}
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="sm:hidden -mr-2 flex min-h-12 min-w-12 items-center justify-center rounded-md focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none"
              aria-label={navOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={navOpen}
              aria-controls="nav-mobile"
            >
              {navOpen ? (
                <X className="size-6 text-tanah-900" aria-hidden />
              ) : (
                <Menu className="size-6 text-tanah-900" aria-hidden />
              )}
            </button>

            {!loading && <TombolHeader user={user} peran={peran} />}
          </div>

          {/* Mobile nav menu (shown when navOpen) */}
          {navOpen && (
            <nav
              id="nav-mobile"
              aria-label="Halaman publik"
              className="sm:hidden border-t border-tanah-200 px-2 py-2"
            >
              <ul className="flex flex-col gap-1">
                {TAUTAN_NAV.map((t) => (
                  <li key={t.href}>
                    <TautanNav
                      {...t}
                      aktif={pathname.startsWith(t.href)}
                      className="block w-full px-3"
                      onClick={() => setNavOpen(false)}
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-tanah-200 pt-3">
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      setNavOpen(false);
                      window.location.href = "/";
                    }}
                  >
                    <LogOut aria-hidden />
                    Keluar
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/sign-in" onClick={() => setNavOpen(false)}>
                      <LogIn aria-hidden />
                      Masuk
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function TautanNav({
  label,
  href,
  aktif,
  className,
  onClick,
}: Readonly<{
  label: string;
  href: string;
  aktif: boolean;
  className?: string;
  onClick?: () => void;
}>) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "text-label relative flex min-h-12 items-center rounded-md font-semibold",
        "focus-visible:ring-[3px] focus-visible:ring-biru-600/40 focus-visible:outline-none",
        aktif
          ? "text-biru-600"
          : "text-tanah-700 hover:bg-tanah-100 hover:text-tanah-900",
        className,
      )}
    >
      {label}
      {aktif && (
        <span
          aria-hidden
          className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-biru-600"
        />
      )}
    </Link>
  );
}
