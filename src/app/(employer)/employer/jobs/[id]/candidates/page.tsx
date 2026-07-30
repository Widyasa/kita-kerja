export default async function EmployerCandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-[var(--max-employer)] p-6">
      <h1 className="text-h1">Calon Pekerja</h1>
      <p className="text-body text-tanah-600">Lowongan ID: {id}</p>
    </main>
  );
}
