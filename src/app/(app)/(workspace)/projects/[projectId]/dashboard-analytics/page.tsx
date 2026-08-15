import { DashboardAnalyticsPage } from "@/features/dashboard-analytics";

interface PageParams {
	projectId: string;
}

export default async function DashboardAnalyticsRoute({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <DashboardAnalyticsPage projectId={projectId} />;
}
