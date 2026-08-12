export default async function CredentialsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await params;
  // Intentional stub — feature not built yet. Pattern: wire up the real
  // credentials UI here, keeping the async-params contract and fetching data
  // through entity actions (src/entities) rather than inline prisma calls.
  return <div>Credentials</div>;
}
