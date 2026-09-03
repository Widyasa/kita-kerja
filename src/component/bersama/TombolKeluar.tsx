"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/component/ui/alert-dialog";

/**
 * TombolKeluar — logout dengan konfirmasi modal sebelum memanggil API.
 * Tersedia dalam varian vertikal (bottom nav) atau horizontal (sidebar).
 */
export function TombolKeluar({
  variant = "vertical",
  className,
}: {
  variant?: "vertical" | "horizontal";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal keluar.");
      router.push("/sign-in");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const horizontal = variant === "horizontal";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={loading}
          className={cn(
            "rounded-lg text-label transition-colors duration-(--duration-fast)",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-biru-600/40",
            "text-tanah-600 hover:bg-tanah-100 hover:text-tanah-800 disabled:opacity-60",
            horizontal
              ? "flex min-h-12 w-full items-center gap-3 px-4"
              : "flex h-16 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden px-1",
            className,
          )}
        >
          {loading ? (
            <Loader2
              className={cn("animate-spin", horizontal ? "size-6" : "size-5 sm:size-6")}
              aria-hidden
            />
          ) : (
            <LogOut className={cn(horizontal ? "size-6" : "size-5 sm:size-6")} aria-hidden />
          )}
          <span
            className={cn(
              horizontal
                ? "text-left"
                : "max-w-full truncate text-center text-[0.8125rem] leading-tight max-sm:hidden",
            )}
          >
            {loading ? "Memuat..." : "Keluar"}
          </span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Yakin ingin keluar?</AlertDialogTitle>
          <AlertDialogDescription>
            Anda akan keluar dari akun Kita Kerja di perangkat ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={logout}>Keluar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
