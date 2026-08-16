"use client";

import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { variableKeys } from "@/shared/query/keys";
import type { VariableCreateInput } from "@/shared/schemas/variable";
import {
	createVariable,
	getProjectVariables,
	softDeleteVariable,
	toggleVariableVisibility,
	updateVariable,
} from "./variableActions";

const variableQueryOptions = {
	list: (projectId: string | undefined) =>
		queryOptions({
			queryKey: variableKeys.list(projectId ?? ""),
			queryFn: async () => {
				const result = await getProjectVariables(projectId!);
				if (!result.success) throw new Error(result.error);
				return result.data;
			},
			enabled: !!projectId,
		}),
};

export function useProjectVariables(projectId: string | undefined) {
	return useQuery(variableQueryOptions.list(projectId));
}

function useInvalidateList(projectId: string) {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({ queryKey: variableKeys.list(projectId) });
}

export function useCreateVariable(projectId: string) {
	const invalidate = useInvalidateList(projectId);
	return useMutation({
		mutationFn: async (data: VariableCreateInput) => {
			const result = await createVariable(projectId, data);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: async () => {
			await invalidate();
		},
	});
}

export function useUpdateVariable(projectId: string) {
	const invalidate = useInvalidateList(projectId);
	return useMutation({
		mutationFn: async (args: {
			variableId: string;
			input: VariableCreateInput;
		}) => {
			const result = await updateVariable(args.variableId, args.input);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: async () => {
			await invalidate();
		},
	});
}

export function useToggleVariableVisibility(projectId: string) {
	const invalidate = useInvalidateList(projectId);
	return useMutation({
		mutationFn: async (variableId: string) => {
			const result = await toggleVariableVisibility(variableId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: async () => {
			await invalidate();
		},
	});
}

export function useDeleteVariable(projectId: string) {
	const invalidate = useInvalidateList(projectId);
	return useMutation({
		mutationFn: async (variableId: string) => {
			const result = await softDeleteVariable(variableId);
			if (!result.success) throw new Error(result.error);
		},
		onSuccess: async () => {
			await invalidate();
		},
	});
}
