"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentKeys } from "@/shared/query/keys";
import { createCommentWithImages } from "./commentActions";
import type { CommentParentType } from "@/lib/generated/prisma";

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profile_id,
      description,
      parent_type,
      parent_id,
      imageUrls,
    }: {
      profile_id: string;
      description: string;
      parent_type: CommentParentType;
      parent_id: string;
      imageUrls?: string[];
    }) =>
      createCommentWithImages({
        profile_id,
        description,
        parent_type,
        parent_id,
        imageUrls,
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(vars.parent_type, vars.parent_id),
      });
      queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
}
