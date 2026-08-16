"use client";

import { LoaderCircle } from "lucide-react";

/** Full-area "Searching..." indicator (status role for screen readers). */
export function Searching() {
	return (
		<div
			role="status"
			className="flex w-full h-full justify-center items-center text-neutral-border text-base min-h-60"
		>
			<LoaderCircle aria-hidden className="animate-spin mr-2" />
			Searching...
		</div>
	);
}

/** Full-area "No results found." empty state. */
export function Lacking() {
	return (
		<div className="flex w-full h-full justify-center items-center text-neutral-border text-base min-h-60">
			No results found.
		</div>
	);
}
