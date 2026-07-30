export default async function EmployerCompletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-[var(--max-employer)] p-6">
      <h1 className="text-h1">Selesai & Penilaian</h1>
      <p className="text-body text-tanah-600">ID: {id}</p>
    </main>
  );
}
