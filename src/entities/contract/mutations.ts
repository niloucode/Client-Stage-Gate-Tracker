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
    }) => {
      const formData = new FormData();
      formData.append("clientId", params.clientId);
      formData.append("projectId", params.projectId);
      formData.append("file", params.file);
      formData.append("contractName", params.contractName);
      return uploadContract(formData);
    },
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
