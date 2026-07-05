"use server";
import {prisma} from "@/lib/prisma";
import { tagCreateSchema, type TagCreateInput, type TagUpdateInput } from "@/shared/schemas";
import { z } from "zod";

/**
 * Retrieves all tag records from the database.
 * Typically used for cross-ticket categorization management or initializing global filtering options.
 *
 * @returns {Promise<any[]>}
 * Returns a promise that resolves to an array of all available tag objects.
 */
export async function selectTag() {
    return prisma.tags.findMany(
        {
            where: { is_deleted: false },
            orderBy: {name: 'asc'},
        },);
}

export async function createTag(data: TagCreateInput) {
    tagCreateSchema.parse(data);
    try {
        const newTag = await prisma.tags.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                color: data.color ?? null,
            }
        });
        return { success: true, data: newTag };
    } catch (error) {
        console.error("Create tag error:", error);
        return { success: false, error: "Failed to create tag" };
    }
}

export async function updateTag(data: TagUpdateInput) {
    z.string().uuid().parse(data.tag_id);
    tagCreateSchema.parse({ name: data.name, description: data.description, color: data.color });
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
 * Performs a "soft delete" on a ticket by flagging it as deleted.
 * This removes it from active board views while preserving historical audit data.
 *
 * @param {string} tagId - The UUID of the ticket to soft delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function softDeleteTag(tagId: string) {
    try {
        await prisma.tags.update({
            where: {
                tag_id: tagId
            },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to soft delete tag:", error);
        return { success: false, error: "Failed to delete the tag due to a database error." };
    }
}
