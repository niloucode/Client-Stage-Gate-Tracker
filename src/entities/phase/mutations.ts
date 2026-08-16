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
 * @returns The result, or throws when it failed.
 */
export function throwIfActionFailed<T>(result: {
	data?: T;
	serverError?: string;
	validationErrors?: unknown;
}): T {
	if (result.data) return result.data;
	if (result.validationErrors) {
		throw new Error("Please fix the highlighted fields.");
	}
	throw new Error(result.serverError ?? "Server action failed.");
}

/** Mutation hook: create a phase. */
export function useCreatePhase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { stageId: string } & PhaseCreateInput) =>
			throwIfActionFailed(await createPhaseAction(params)),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

/** Mutation hook: update a phase. */
export function useUpdatePhase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			params: { phaseId: string; stageId: string } & PhaseUpdateInput,
		) => throwIfActionFailed(await updatePhaseAction(params)),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

/** Mutation hook: cascade-soft-delete a phase. */
export function useDeletePhase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { phaseId: string; stageId: string }) =>
			throwIfActionFailed(await deletePhaseAction({ phaseId: params.phaseId })),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

/** Mutation hook: reorder phases within a stage. */
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
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}
