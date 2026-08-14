"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import {
	createModule,
	updateModule,
	cascadeSoftDeleteModule,
} from "./moduleActions";
import type { ModuleCreateInput, ModuleUpdateInput } from "@/shared/schemas";

/**
 * Module mutations use the canonical scheduling vocabulary
 * (planStart/planEnd/actualStart/actualEnd) — see Task 3.1.
 */
export function useCreateModule() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			params: { phaseId: string; stageId: string } & ModuleCreateInput,
		) => {
			const result = await createModule(params.phaseId, params);
			if (!result.success) throw new Error(result.error ?? "Failed to create module.");
			return result;
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export function useUpdateModule() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			params: { moduleId: string; stageId: string } & ModuleUpdateInput,
		) => {
			const result = await updateModule(params.moduleId, params);
			if (!result.success) throw new Error(result.error ?? "Failed to update module.");
			return result;
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}

export function useDeleteModule() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { moduleId: string; stageId: string }) => {
			const result = await cascadeSoftDeleteModule(params.moduleId);
			if (!result.success) throw new Error(result.error ?? "Failed to delete module.");
			return result;
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}
