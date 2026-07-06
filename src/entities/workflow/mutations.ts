"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import { createWorkflow, updateWorkflow, cascadeSoftDeleteWorkflow } from "./workflowActions";
import type { WorkflowCreateInput, WorkflowUpdateInput } from "@/shared/schemas";

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { moduleId: string; stageId: string } & WorkflowCreateInput) =>
      createWorkflow(params.moduleId, params.name, params.creation_date, params.end_date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: stageKeys.tree(variables.stageId) });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { workflowId: string; stageId: string } & WorkflowUpdateInput) =>
      updateWorkflow(params.workflowId, params.name, params.creation_date, params.end_date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: stageKeys.tree(variables.stageId) });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { workflowId: string; stageId: string }) =>
      cascadeSoftDeleteWorkflow(params.workflowId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: stageKeys.tree(variables.stageId) });
    },
  });
}
