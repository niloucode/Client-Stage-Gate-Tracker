import { Prisma } from "@/lib/generated/prisma";

export type CommentWithImages = Prisma.CommentsGetPayload<{
	include: { Profile: true };
}> & {
	images: Prisma.ImagesGetPayload<object>[];
};
