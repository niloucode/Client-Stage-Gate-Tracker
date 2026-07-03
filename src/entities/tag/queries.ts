"use client";

import { useQuery } from "@tanstack/react-query";
import { tagKeys } from "@/shared/query/keys";
import { selectTag } from "./tagActions";

export function useTags() {
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: selectTag,
  });
}
