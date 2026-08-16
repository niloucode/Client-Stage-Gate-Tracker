import { IssueDashboard } from "@/features/issue-reporting";

interface PageParams {
	projectId: string;
}

/**
 * Issues route.
 * @returns The rendered component.
 */
export default async function IssueDashboardPage({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <IssueDashboard projectId={projectId} />;
}
