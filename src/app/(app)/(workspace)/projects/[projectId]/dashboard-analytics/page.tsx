import { DashboardAnalyticsPage } from "@/features/dashboard-analytics";

interface PageParams {
	projectId: string;
}

/**
 * Gantt dashboard route.
 * @returns The rendered component.
 */
export default async function DashboardAnalyticsRoute({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <DashboardAnalyticsPage projectId={projectId} />;
}
