import { notFound } from "next/navigation";

/**
 * Development-only route guard for temporary/planned pages: returns 404 in
 * production builds so unfinished views can never be shipped. Same pattern
 * as the `/dev/ui` component showcase.
 */
export function guardDevOnly() {
	if (process.env.NODE_ENV === "production") notFound();
}
