"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contractKeys, stageKeys } from "@/shared/query/keys";
import {
	uploadContract,
	deleteContract,
	approveContract,
} from "./contractActions";

/**
 *
 * @returns The result.
 */
export function useUploadContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: {
			projectId: string;
			file: File;
			contractName: string;
		}) => {
			const formData = new FormData();
			formData.append("projectId", params.projectId);
			formData.append("file", params.file);
			formData.append("contractName", params.contractName);
			return uploadContract(formData);
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: contractKeys.detail(variables.projectId),
			});
		},
	});
}

/**
 *
 * @returns The result.
 */
export function useDeleteContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: { projectId: string; filePath: string }) =>
			deleteContract(params.projectId, params.filePath),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: contractKeys.detail(variables.projectId),
			});
		},
	});
}

/**
 *
 * @returns The result.
 */
export function useApproveContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: { projectId: string; role: "client" | "owner" }) =>
			approveContract(params.projectId, params.role),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: contractKeys.detail(variables.projectId),
			});
			// Both approvals materialize the first stage's actual start.
			await queryClient.invalidateQueries({ queryKey: stageKeys.all });
		},
	});
}
