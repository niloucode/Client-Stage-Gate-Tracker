"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contractKeys } from "@/shared/query/keys";
import {
	uploadContract,
	deleteContract,
	signContract,
} from "./contractActions";

export function useUploadContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: {
			clientId: string;
			projectId: string;
			file: File;
			contractName: string;
		}) =>
			uploadContract(
				params.clientId,
				params.projectId,
				params.file,
				params.contractName,
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: contractKeys.detail(variables.projectId),
			});
		},
	});
}

export function useDeleteContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: { projectId: string; filePath: string }) =>
			deleteContract(params.projectId, params.filePath),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: contractKeys.detail(variables.projectId),
			});
		},
	});
}

export function useSignContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: {
			projectId: string;
			role: "Client Viewer" | "Project Owner";
			fullName: string;
			initials: string;
		}) =>
			signContract(
				params.projectId,
				params.role,
				params.fullName,
				params.initials,
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: contractKeys.detail(variables.projectId),
			});
		},
	});
}
