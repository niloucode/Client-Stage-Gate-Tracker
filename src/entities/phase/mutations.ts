"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import {
	createPhaseAction,
	updatePhaseAction,
	deletePhaseAction,
} from "./safeActions";
import { reorderPhase } from "./phaseActions";
import type { PhaseCreateInput, PhaseUpdateInput } from "@/shared/schemas";

/**
 * next-safe-action results are discriminated unions: `{ data }` on
 * success, `{ serverError }` on failure (stable ActionErrorCode), or
 * `{ validationErrors }`. These helpers normalize them into thrown errors
 * so TanStack Query's error machinery (and form `errorMap.onSubmit`)
 * works. Exported for unit testing.
 */
export function throwIfActionFailed<T>(
	result: { data?: T; serverError?: string; validationErrors?: unknown },
): T {
	if (result.data) return result.data;
	if (result.validationErrors) {
		throw new Error("Please fix the highlighted fields.");
	}
	throw new Error(result.serverError ?? "Server action failed.");
}

export function useCreatePhase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { stageId: string } & PhaseCreateInput) =>
			throwIfActionFailed(await createPhaseAction(params)),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export function useUpdatePhase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			params: { phaseId: string; stageId: string } & PhaseUpdateInput,
		) => throwIfActionFailed(await updatePhaseAction(params)),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export function useDeletePhase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { phaseId: string; stageId: string }) =>
			throwIfActionFailed(
				await deletePhaseAction({ phaseId: params.phaseId }),
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export { reorderPhase } from "./phaseActions";
export function useReorderPhase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: {
			phaseId: string;
			targetNumber: number;
			stageId: string;
		}) => {
			// Reorder stays on the legacy action for now; the pilot slice is
			// create/update/delete (Task 1.7).
			return reorderPhase(params.phaseId, params.targetNumber);
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}
