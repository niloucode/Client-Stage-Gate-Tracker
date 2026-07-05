"use client";

import { useQuery } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import { getStageTree } from "./stageActions";

export function useStageTree(stageId: string | undefined) {
  return useQuery({
    queryKey: stageKeys.tree(stageId!),
    queryFn: () => getStageTree(stageId!),
    enabled: !!stageId,
  });
}
