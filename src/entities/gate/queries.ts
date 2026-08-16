"use client";

import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { gateKeys, stageKeys } from "@/shared/query/keys";
import {
	createGateComment,
	decideGate,
	getGateComments,
	getStageGates,
} from "./gateActions";

const gateQueryOptions = {
	list: (stageId: string | undefined) =>
		queryOptions({
			queryKey: gateKeys.list(stageId ?? ""),
			queryFn: () => getStageGates(stageId!),
			enabled: !!stageId,
		}),
	comments: (gateId: string | undefined) =>
		queryOptions({
			queryKey: gateKeys.comments(gateId ?? ""),
			queryFn: () => getGateComments(gateId!),
			enabled: !!gateId,
		}),
};

/** Query hook: a stage's gates + canDecide. */
export function useStageGates(stageId: string | undefined) {
	return useQuery(gateQueryOptions.list(stageId));
}

/** Query hook: a gate's discussion thread. */
export function useGateComments(gateId: string | undefined) {
	return useQuery(gateQueryOptions.comments(gateId));
}

/** Mutation hook: decide (approve/decline) a stage gate. */
export function useDecideGate(stageId: string | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			gateId,
			decision,
			feedback,
			imageUrls,
		}: {
			gateId: string;
			decision: "APPROVED" | "REJECTED";
			feedback: string;
			imageUrls?: string[];
		}) => decideGate(gateId, decision, feedback, imageUrls),
		onSuccess: async () => {
			// Status/comment changed and stage dates materialized — refresh
			// the gate list and the stage tree/project-structure summaries.
			if (stageId) {
				await queryClient.invalidateQueries({
					queryKey: gateKeys.list(stageId),
				});
			}
			await queryClient.invalidateQueries({ queryKey: stageKeys.all });
		},
	});
}

export function useCreateGateComment(
	gateId: string | undefined,
	stageId: string | undefined,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			description,
			imageUrls,
		}: {
			description: string;
			imageUrls?: string[];
		}) => createGateComment(gateId!, description, imageUrls),
		onSuccess: async () => {
			if (gateId) {
				await queryClient.invalidateQueries({
					queryKey: gateKeys.comments(gateId),
				});
			}
			if (stageId) {
				await queryClient.invalidateQueries({
					queryKey: gateKeys.list(stageId),
				});
			}
		},
	});
}
