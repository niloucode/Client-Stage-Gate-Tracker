import { IssueDashboard } from "@/features/issue-reporting";

interface PageParams {
	projectId: string;
}

/** Issues route. */
export default async function IssueDashboardPage({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <IssueDashboard projectId={projectId} />;
}
