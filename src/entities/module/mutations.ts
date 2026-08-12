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
		mutationFn: (
			params: { phaseId: string; stageId: string } & ModuleCreateInput,
		) => createModule(params.phaseId, params),
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
		mutationFn: (
			params: { moduleId: string; stageId: string } & ModuleUpdateInput,
		) => updateModule(params.moduleId, params),
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
		mutationFn: (params: { moduleId: string; stageId: string }) =>
			cascadeSoftDeleteModule(params.moduleId),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: stageKeys.tree(variables.stageId),
			});
		},
	});
}
