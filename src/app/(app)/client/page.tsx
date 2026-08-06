import { notFound } from "next/navigation";
import { guardDevOnly } from "@/shared/lib/devOnly";
import { getPlannedView } from "@/shared/lib/plannedViews";
import { PlannedViewPlaceholder } from "@/shared/ui/PlannedViewPlaceholder";

export default function ClientPortalPage() {
	guardDevOnly();
	const view = getPlannedView("/client");
	if (!view) notFound();
	return <PlannedViewPlaceholder view={view} />;
}
