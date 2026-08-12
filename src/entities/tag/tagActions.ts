"use server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/projectAccess";
import {
	tagCreateSchema,
	tagUpdateSchema,
	type TagCreateInput,
	type TagUpdateInput,
} from "@/shared/schemas";
import { z } from "zod";

/**
 * Global tag reference list (cross-ticket categorization). Bounded to 100.
 */
export async function selectTag() {
	return prisma.tags.findMany({
		where: { is_deleted: false },
		orderBy: { name: "asc" },
		take: 100, // bound the list; paginate when callers need more
	});
}

export async function createTag(data: TagCreateInput) {
	tagCreateSchema.parse(data);
	// Authorization: any authenticated user may manage global tags
	const userId = await getCurrentUserId();
	if (!userId) return { success: false, error: "Authentication required." };
	try {
		const newTag = await prisma.tags.create({
			data: {
				name: data.name,
				description: data.description ?? null,
				color: data.color ?? null,
			},
		});
		return { success: true, data: newTag };
	} catch (error: unknown) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			throw new Error("A tag with this name already exists.");
		}
		console.error("Create tag error:", error);
		throw new Error("Failed to create tag");
	}
}

export async function updateTag(data: TagUpdateInput) {
	// Partial updates validated with the update schema, not the create one.
	z.uuid().parse(data.tag_id);
	tagUpdateSchema.parse(data);
	// Authorization: any authenticated user may manage global tags
	const userId = await getCurrentUserId();
	if (!userId) return { success: false, error: "Authentication required." };
	return prisma.tags.update({
		where: { tag_id: data.tag_id },
		data: {
			name: data.name,
			description: data.description ?? null,
			color: data.color ?? null,
		},
	});
}

/**
 * Soft-deletes a global tag (keeps history; no longer offered to new tickets).
 *
 * @param tagId - UUID of the tag to archive.
 */
export async function softDeleteTag(tagId: string) {
	z.uuid().parse(tagId);

	// Authorization: any authenticated user may manage global tags
	const userId = await getCurrentUserId();
	if (!userId) return { success: false, error: "Authentication required." };
	try {
		await prisma.tags.update({
			where: {
				tag_id: tagId,
			},
			data: {
				is_deleted: true,
				deleted_at: new Date(),
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to soft delete tag:", error);
		return {
			success: false,
			error: "Failed to delete the tag due to a database error.",
		};
	}
}
