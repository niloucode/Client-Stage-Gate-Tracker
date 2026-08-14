"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { departmentKeys } from "@/shared/query/keys";
import { getDepartmentById } from "./departmentActions";

const departmentQueryOptions = {
	detail: (departmentId: string | undefined) =>
		queryOptions({
			queryKey: departmentKeys.detail(departmentId ?? ""),
			queryFn: () => getDepartmentById(departmentId),
			enabled: !!departmentId,
		}),
};

/** Department name lookup for a profile's `department_id`. */
export function useDepartment(departmentId: string | undefined) {
	return useQuery(departmentQueryOptions.detail(departmentId));
}
