"use client";

import type { PlannedView } from "@/shared/lib/plannedViews";

/**
 * Consistent placeholder for not-yet-built views. Only ever rendered by
 * dev-gated pages (the page itself calls `guardDevOnly`), so this UI never
 * reaches production.
 */
export function PlannedViewPlaceholder({ view }: { view: PlannedView }) {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
			<span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
				Dev-only — not built yet
			</span>
			<h1 className="text-2xl font-bold text-ink">{view.label}</h1>
			<p className="max-w-md text-sm text-plum-400">{view.description}</p>
			<p className="text-xs text-plum-400">
				Temporary route for testing. Returns 404 in production builds.
			</p>
		</div>
	);
}
