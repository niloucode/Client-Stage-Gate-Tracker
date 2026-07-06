"use client";

import { useQuery } from "@tanstack/react-query";
import { phaseKeys } from "@/shared/query/keys";
import { getPhaseById, getModulesByPhaseId } from "./phaseActions";

export function usePhase(phaseId: string | undefined) {
  return useQuery({
    queryKey: phaseKeys.detail(phaseId!),
    queryFn: () => getPhaseById(phaseId!),
    enabled: !!phaseId,
  });
}

export function useModulesByPhase(phaseId: string | undefined) {
  return useQuery({
    queryKey: phaseKeys.modules(phaseId!),
    queryFn: () => getModulesByPhaseId(phaseId!),
    enabled: !!phaseId,
  });
}
