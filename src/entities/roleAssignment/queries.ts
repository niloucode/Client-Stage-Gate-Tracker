"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "@/shared/query/keys";
import { getMyDashboardRole } from "./roleAssignmentActions";

const roleQueryOptions = {
	role: () =>
		queryOptions({
			queryKey: dashboardKeys.role(),
			queryFn: getMyDashboardRole,
		}),
};

/** Global dashboard-role query — owner iff the user holds a Project Owner
 * roleAssignment on any project (resolveDashboardRole).
 * @returns Whether the caller is a project owner.
 */
export function useDashboardRole() {
	return useQuery(roleQueryOptions.role());
}
