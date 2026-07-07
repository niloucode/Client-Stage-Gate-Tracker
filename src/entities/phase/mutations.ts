"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import { swapPhaseOrder } from "./phaseActions";
import {
	createPhase,
	updatePhase,
	cascadeSoftDeletePhase,
} from "./phaseActions";
import type { PhaseCreateInput, PhaseUpdateInput } from "@/shared/schemas";

export function useCreatePhase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: { stageId: string } & PhaseCreateInput) =>
			createPhase(
				params.stageId,
				params.name,
				params.creation_date,
				params.end_date,
				params.deadline_date,
			),
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
		mutationFn: (
			params: { phaseId: string; stageId: string } & PhaseUpdateInput,
		) =>
			updatePhase(
				params.phaseId,
				params.name,
				params.description,
				params.creation_date,
				params.end_date,
				params.deadline_date,
			),
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
		mutationFn: (params: { phaseId: string; stageId: string }) =>
			cascadeSoftDeletePhase(params.phaseId),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export function useSwapPhaseOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: {
			phaseId1: string;
			phaseId2: string;
			stageId: string;
		}) => swapPhaseOrder(params.phaseId1, params.phaseId2),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}
