import type { DashboardRole } from "@/entities/types";

/**
 * Pure dashboard-view resolution. Client profiles (Profiles.client_id set)
 * always get the contracts-only view; otherwise a Project Owner on any
 * project gets the full view; everyone else gets the staff view.
 */
export function resolveDashboardRole(input: {
	clientId: string | null;
	ownerProjectIds: string[];
}): DashboardRole {
	if (input.clientId) return "client";
	return input.ownerProjectIds.length > 0 ? "owner" : "staff";
}
