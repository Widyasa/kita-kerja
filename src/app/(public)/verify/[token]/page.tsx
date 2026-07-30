export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-h1">Verifikasi Kartu Kerja</h1>
      <p className="text-body text-tanah-600">Token: {token}</p>
    </main>
  );
}
