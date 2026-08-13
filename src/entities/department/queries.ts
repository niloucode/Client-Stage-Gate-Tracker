"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { departmentKeys } from "@/shared/query/keys";
import { getDepartmentById, selectDepartments } from "./departmentActions";

const departmentQueryOptions = {
	list: () =>
		queryOptions({
			queryKey: departmentKeys.lists(),
			queryFn: selectDepartments,
		}),
	detail: (departmentId: string | undefined) =>
		queryOptions({
			queryKey: departmentKeys.detail(departmentId ?? ""),
			queryFn: () => getDepartmentById(departmentId),
			enabled: !!departmentId,
		}),
};

/** All non-deleted departments (id + name) for selects/dropdowns. */
export function useDepartments() {
	return useQuery(departmentQueryOptions.list());
}

/** Department name lookup for a profile's `department_id`. */
export function useDepartment(departmentId: string | undefined) {
	return useQuery(departmentQueryOptions.detail(departmentId));
}
