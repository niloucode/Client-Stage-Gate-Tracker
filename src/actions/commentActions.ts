"use server";

import { prisma } from "@/lib/prisma";
import {Prisma, status, CommentParentType, ImageParentType } from "@/lib/generated/prisma";
import {Profile, TicketAssigned, TicketSubtask, TicketTag} from "@/components/tickets/types";

export type EntityFilterStatus = 'active' | 'deleted' | 'all';

export async function selectComment() {
    try {
        // Fetch all comments first
        const comments = await prisma.comments.findMany({
            where: { is_deleted: false },
        });

        // If no comments, then just return nothing
        if (comments.length === 0) return [];

        // If there are comments, make a String array of comment ids
        const commentIds = comments.map(c => c.comment_id);

        // Afterward, let's find for images, ONLY that are linked to these comments
        // Essentially, ur left with [img1] [img2] both of whos parent ids are ones that arent delted
        const images = await prisma.images.findMany({
            where: {
                parent_id: { in: commentIds },
                parent_type: ImageParentType.COMMENT
            }
        });

        // Lastly, let's link list of comments to the images related to them.
        // Essentially -> comment1: [img1, img2]
        // Can I get my chagee now?
        return comments.map(comment => ({
            ...comment,
            images: images.filter(img => img.parent_id === comment.comment_id)
        }));

    } catch (error) {
        console.error("Error fetching comments with images:", error);
        return [];
    }
}

export async function selectTicketComment() {
    try {
        return await prisma.comments.findMany({
            where: { is_deleted: false },
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
}

export async function createCommentWithImages({
  profile_id,
  description,
  parent_type,
  parent_id,
  imageUrls = [],
}: {
    profile_id: string;
    description: string;
    parent_type: CommentParentType;
    parent_id: string;
    imageUrls?: string[];
}) {
    return await prisma.$transaction(async (tx) => {
        const comment = await tx.comments.create({
            data: {
                profile_id,
                description,
                parent_type,
                parent_id,
            },
        });

        if (imageUrls.length > 0) {
            const imageData = imageUrls.map((url) => ({
                image_src: url,
                parent_id: comment.comment_id,
                parent_type: ImageParentType.COMMENT,
            }));

            await tx.images.createMany({
                data: imageData,
            });
        }

        return comment;
    });
}