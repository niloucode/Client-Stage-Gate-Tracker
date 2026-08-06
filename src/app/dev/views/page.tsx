import Link from "next/link";
import { guardDevOnly } from "@/shared/lib/devOnly";
import { PLANNED_VIEWS } from "@/shared/lib/plannedViews";

/**
 * Dev-only hub listing every registered planned view, so the team can click
 * through the temporary routes. 404s in production like all dev routes.
 */
export default function DevViewsPage() {
	guardDevOnly();

	return (
		<div className="p-8">
			<h1 className="text-xl font-bold mb-1">Planned views (dev only)</h1>
			<p className="text-sm text-gray-600 mb-6">
				Temporary routes for not-yet-built features. All return 404 in
				production builds. Add new views in{" "}
				<code className="rounded bg-gray-100 px-1">src/shared/lib/plannedViews.ts</code>
				.
			</p>
			<ul className="space-y-4">
				{PLANNED_VIEWS.map((view) => (
					<li key={view.route} className="rounded-lg border border-gray-200 p-4">
						<Link
							href={view.route}
							className="font-semibold text-brand-600 hover:underline"
						>
							{view.label}
							<span className="ml-2 text-xs font-normal text-gray-500">
								{view.route}
							</span>
						</Link>
						<p className="mt-1 text-sm text-gray-600">{view.description}</p>
					</li>
				))}
			</ul>
		</div>
	);
}
