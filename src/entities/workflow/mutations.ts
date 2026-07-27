"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import {
	createWorkflow,
	updateWorkflow,
	cascadeSoftDeleteWorkflow,
	reorderWorkflow,
} from "./workflowActions";
import type {
	WorkflowCreateInput,
	WorkflowUpdateInput,
} from "@/shared/schemas";

export function useCreateWorkflow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (
			params: { moduleId: string; stageId: string } & WorkflowCreateInput,
		) =>
			createWorkflow(
				params.moduleId,
				params.name,
				params.start_date,
				params.finish_date,
				params.deadline_date,
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export function useUpdateWorkflow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (
			params: { workflowId: string; stageId: string } & WorkflowUpdateInput,
		) =>
			updateWorkflow(
				params.workflowId,
				params.name,
				params.start_date,
				params.finish_date,
				undefined,
				params.deadline_date,
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export function useDeleteWorkflow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: { workflowId: string; stageId: string }) =>
			cascadeSoftDeleteWorkflow(params.workflowId),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export function useReorderWorkflow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: {
			workflowId: string;
			targetNumber: number;
			stageId: string;
		}) => reorderWorkflow(params.workflowId, params.targetNumber),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}
