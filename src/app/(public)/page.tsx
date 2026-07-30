export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-tanah-50 p-6 text-center">
      <h1 className="text-display text-tanah-900">Kita Kerja</h1>
      <p className="text-body-lg max-w-[var(--max-worker)] text-tanah-700">
        Pengalaman Anda selama ini belum punya bukti. Sekarang punya.
      </p>
      <div className="flex flex-col gap-4">
        <a
          href="/sign-in"
          className="inline-flex h-[var(--cta-height)] min-w-[var(--touch-min)] items-center justify-center rounded-pill bg-kuning-600 px-8 text-button font-semibold text-white shadow-2"
        >
          Saya cari kerja
        </a>
        <a
          href="/sign-in"
          className="inline-flex h-[var(--cta-height)] min-w-[var(--touch-min)] items-center justify-center rounded-pill border-2 border-biru-600 bg-tanah-0 px-8 text-button font-semibold text-biru-600"
        >
          Saya butuh pekerja
        </a>
      </div>
    </main>
  );
}
