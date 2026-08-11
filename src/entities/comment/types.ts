import { Prisma } from "@/lib/generated/prisma";

export const commentInclude = {
	Profile: true,
} as const;

export type CommentPayload = Prisma.CommentsGetPayload<{
	include: typeof commentInclude;
}>;

export type CommentWithImages = CommentPayload & {
	images: Prisma.ImagesGetPayload<object>[];
};
