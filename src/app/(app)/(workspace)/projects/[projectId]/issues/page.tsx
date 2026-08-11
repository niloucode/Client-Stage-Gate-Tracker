import { notFound } from "next/navigation";
import { guardDevOnly } from "@/shared/lib/devOnly";
import { getPlannedView } from "@/shared/lib/plannedViews";
import { IssueDashboard } from "@/features/issue-reporting/ui/IssueDashboard"; // Adjust path as needed

export default function IssueDashboardPage() {
	guardDevOnly();

	return <IssueDashboard/>;
}