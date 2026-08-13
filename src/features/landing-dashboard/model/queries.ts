"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "@/shared/query/keys";
import { getMyDashboardRole } from "@/entities/roleAssignment";
import {
	selectMyTickets,
	selectWatchedTickets,
} from "@/entities/ticket";
import { getMyContracts } from "@/entities/contract";
import { mapDashboardTicketRow, mapContractRow } from "./mappers";

const dashboardQueryOptions = {
	role: () =>
		queryOptions({
			queryKey: dashboardKeys.role(),
			queryFn: getMyDashboardRole,
		}),
	myTickets: (enabled: boolean) =>
		queryOptions({
			queryKey: dashboardKeys.myTickets(),
			queryFn: async () => (await selectMyTickets()).map(mapDashboardTicketRow),
			enabled,
		}),
	watchedTickets: (enabled: boolean) =>
		queryOptions({
			queryKey: dashboardKeys.watchedTickets(),
			queryFn: async () =>
				(await selectWatchedTickets()).map(mapDashboardTicketRow),
			enabled,
		}),
	myContracts: (enabled: boolean) =>
		queryOptions({
			queryKey: dashboardKeys.myContracts(),
			queryFn: async () => (await getMyContracts()).map(mapContractRow),
			enabled,
		}),
};

export function useDashboardRole() {
	return useQuery(dashboardQueryOptions.role());
}

export function useMyTickets(enabled: boolean) {
	return useQuery(dashboardQueryOptions.myTickets(enabled));
}

export function useWatchedTickets(enabled: boolean) {
	return useQuery(dashboardQueryOptions.watchedTickets(enabled));
}

export function useMyContracts(enabled: boolean) {
	return useQuery(dashboardQueryOptions.myContracts(enabled));
}
