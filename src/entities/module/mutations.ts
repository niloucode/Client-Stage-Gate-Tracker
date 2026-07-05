"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import { createModule, updateModule, cascadeSoftDeleteModule } from "./moduleActions";
import type { ModuleCreateInput, ModuleUpdateInput } from "@/shared/schemas";

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { phaseId: string; stageId: string } & ModuleCreateInput) =>
      createModule(params.phaseId, params.name, params.start_date, params.end_date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: stageKeys.tree(variables.stageId) });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { moduleId: string; stageId: string } & ModuleUpdateInput) =>
      updateModule(params.moduleId, params.name, params.start_date, params.end_date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: stageKeys.tree(variables.stageId) });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { moduleId: string; stageId: string }) =>
      cascadeSoftDeleteModule(params.moduleId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: stageKeys.tree(variables.stageId) });
    },
  });
}
