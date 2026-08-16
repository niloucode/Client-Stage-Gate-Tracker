// src/app/(app)/layout.tsx — the (app) group shell (Sidebar + TopNav).
//
// TODO(authz): this layout has NO auth/role guard — any signed-in user
// (including client profiles) can reach every (app) route. Pages currently
// gate their own data server-side (e.g. /clients), but a layout-level
// redirect for client profiles should land when the Client Portal exists.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import Sidebar from "@/shared/ui/sidebar";
import TopNav from "@/features/navigation/ui/TopNav";
import { getCurrentUserProfile } from "@/entities/profile/profileActions";

// The shell reads the session on every request (getCurrentUserProfile →
// cookies) and TopNav calls useSearchParams (breadcrumbs) without a
// Suspense boundary — static Prerender of any (app) page trips both and
// fails the build. The whole group is session-dependent anyway, so render
// it dynamically (2026-08-15 — unblocks `next build`).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Client Stage Gate Tracker",
	description: "Acesoft project tracker",
};

/**
 * App shell: sidebar + top nav around the workspace children.
 * @returns The rendered component.
 */
export default async function AppLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	// Role-aware navigation: client profiles must not see the Clients
	// registry entry ("no access from the start"). Resolved server-side and
	// passed as a boolean — nav items with icons stay in the client Sidebar.
	const profile = await getCurrentUserProfile();

	return (
		<Sidebar showClientsLink={!profile?.client_id}>
			<TopNav />
			<div className="min-h-[80vh] max-w-[75vw] mx-auto p-8">
				<>{children}</>
			</div>
		</Sidebar>
	);
}
