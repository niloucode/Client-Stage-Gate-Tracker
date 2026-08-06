export interface PlannedView {
	/** Route where the view will live once built (and where the temp page lives now). */
	route: string;
	/** Human-readable name shown on the placeholder and the dev hub. */
	label: string;
	/** Short description of what the view will be. */
	description: string;
}

/**
 * Views that are planned but not built yet. Each entry gets a dev-only
 * placeholder page (see `PlannedViewPlaceholder`) so the UI can be routed
 * and tested before the real implementation lands. All temporary pages
 * return 404 in production (see `guardDevOnly`).
 *
 * To add a view:
 *   1. add one entry here,
 *   2. create the page file at `route` that calls `guardDevOnly()` and
 *      renders `<PlannedViewPlaceholder view={view} />`.
 */
export const PLANNED_VIEWS: PlannedView[] = [
	{
		route: "/dashboard",
		label: "Landing Dashboard",
		description:
			"Post-login landing page for project owners and team (temporarily routed to /projects until built).",
	},
	{
		route: "/client",
		label: "Client Portal",
		description:
			"Client-facing portal — clients currently land on /contracts until this is built.",
	},
];

export function getPlannedView(route: string): PlannedView | undefined {
	return PLANNED_VIEWS.find((v) => v.route === route);
}
