import { Prisma } from "@/lib/generated/prisma";

/** Include shape used by selectComment queries. */
export const commentInclude = {
  Profiles: true,
} as const;

/** Prisma-generated comment payload matching the query include. */
export type CommentPayload = Prisma.CommentsGetPayload<{
  include: typeof commentInclude;
}>;

/** Augmented type — selectComment injects related images at runtime. */
export type CommentWithImages = CommentPayload & {
  images: Prisma.ImagesGetPayload<object>[];
};
