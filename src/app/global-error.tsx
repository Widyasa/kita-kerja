"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for debugging
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              Terjadi Kesalahan
            </h1>
            <p className="mb-8 text-lg text-gray-600">
              Maaf, aplikasi mengalami masalah. Tim kami telah diberitahu.
            </p>
            {error.digest && (
              <p className="mb-4 text-sm text-gray-400">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={() => {
                reset();
                toast.info("Mencoba memuat ulang...");
              }}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
