import Link from "next/link";
import { LogIn } from "lucide-react";

import { Button } from "@/component/ui/button";

/**
 * Layout (public) — header publik minimal:
 * logo "Kita Kerja" + tombol Masuk. Tanpa nav peran.
 */
export default function LayoutPublik({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-tanah-200 bg-tanah-0">
        <div className="mx-auto flex h-16 w-full max-w-(--max-employer) items-center justify-between px-4">
          <Link
            href="/"
            className="text-h3 text-biru-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40"
          >
            Kita Kerja
          </Link>
          <Button asChild variant="outline">
            <Link href="/sign-in">
              <LogIn aria-hidden />
              Masuk
            </Link>
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
