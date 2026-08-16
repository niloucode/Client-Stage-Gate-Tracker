export default async function AnalyticsPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	await params;
	// Intentional stub — feature not built yet. Pattern: wire up the real
	// analytics UI here, keeping the async-params contract and fetching data
	// through entity actions (src/entities) rather than inline prisma calls.
	return <div>Analytics</div>;
}
