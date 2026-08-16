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

/**
 * Workflow mutations use the canonical scheduling vocabulary
 * (planStart/planEnd/actualStart/actualEnd) — see Task 3.1.
 * @returns The result.
 */
/**
 * Mutation hook: create a workflow.
 * @returns The result.
 */
export function useCreateWorkflow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			params: { moduleId: string; stageId: string } & WorkflowCreateInput,
		) => {
			const result = await createWorkflow(params.moduleId, params);
			if (!result.success)
				throw new Error(result.error ?? "Failed to create workflow.");
			return result;
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

/**
 * Mutation hook: update a workflow.
 * @returns The result.
 */
export function useUpdateWorkflow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			params: { workflowId: string; stageId: string } & WorkflowUpdateInput,
		) => {
			const result = await updateWorkflow(params.workflowId, params);
			if (!result.success)
				throw new Error(result.error ?? "Failed to update workflow.");
			return result;
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

/**
 * Mutation hook: cascade-soft-delete a workflow.
 * @returns The result.
 */
export function useDeleteWorkflow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { workflowId: string; stageId: string }) => {
			const result = await cascadeSoftDeleteWorkflow(params.workflowId);
			if (!result.success)
				throw new Error(result.error ?? "Failed to delete workflow.");
			return result;
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

/**
 * Mutation hook: reorder workflows within a module.
 * @returns The result.
 */
export function useReorderWorkflow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: {
			workflowId: string;
			targetNumber: number;
			stageId: string;
		}) => reorderWorkflow(params.workflowId, params.targetNumber),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}
