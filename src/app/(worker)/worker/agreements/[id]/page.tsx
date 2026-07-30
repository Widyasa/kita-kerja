export default async function WorkerAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-[var(--max-worker)] p-6">
      <h1 className="text-h1">Kesepakatan Kerja</h1>
      <p className="text-body text-tanah-600">ID: {id}</p>
    </main>
  );
}
