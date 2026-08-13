"use client";

import { useParams } from "next/navigation";
import { DashboardAnalyticsPage } from "@/features/dashboard-analytics";

export default function DashboardAnalyticsRoute() {
	const params = useParams<{ projectId: string }>();
	const projectId = params?.projectId ?? "";

	return <DashboardAnalyticsPage projectId={projectId} />;
}
