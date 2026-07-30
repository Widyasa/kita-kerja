"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
    toast.error("Terjadi kesalahan. Silakan coba lagi.");
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Halaman Bermasalah
        </h2>
        <p className="mb-6 text-gray-600">
          Maaf, halaman ini tidak bisa dimuat. Coba muat ulang.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Muat Ulang
        </button>
      </div>
    </div>
  );
}
