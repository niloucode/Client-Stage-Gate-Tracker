"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { dashboardKeys, issueKeys } from "@/shared/query/keys";
import {
	selectMyTickets,
	selectWatchedTickets,
	getActivitySparklines,
} from "@/entities/ticket";
import { getIssueStats } from "@/entities/issue";
import { getMyContracts } from "@/entities/contract";
import { mapDashboardTicketRow, mapContractRow } from "./mappers";

const dashboardQueryOptions = {
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
	sparklines: (enabled: boolean) =>
		queryOptions({
			queryKey: dashboardKeys.sparklines(),
			queryFn: getActivitySparklines,
			enabled,
		}),
	issueStats: (enabled: boolean) =>
		queryOptions({
			queryKey: issueKeys.stats(),
			queryFn: getIssueStats,
			enabled,
		}),
};

export { useDashboardRole } from "@/entities/roleAssignment";

/** Dashboard query: tickets assigned to me. */
export function useMyTickets(enabled: boolean) {
	return useQuery(dashboardQueryOptions.myTickets(enabled));
}

/** Dashboard query: tickets I watch. */
export function useWatchedTickets(enabled: boolean) {
	return useQuery(dashboardQueryOptions.watchedTickets(enabled));
}

/** Dashboard query: my pending contracts. */
export function useMyContracts(enabled: boolean) {
	return useQuery(dashboardQueryOptions.myContracts(enabled));
}

/** Dashboard query: weekly velocity/risk/deadline sparkline data. */
export function useActivitySparklines(enabled: boolean) {
	return useQuery(dashboardQueryOptions.sparklines(enabled));
}

/** Dashboard query: issue severity + assignment stats. */
export function useIssueStats(enabled: boolean) {
	return useQuery(dashboardQueryOptions.issueStats(enabled));
}
