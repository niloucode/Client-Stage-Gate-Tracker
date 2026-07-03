"use server";
import {prisma} from "@/lib/prisma";

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

export async function createTag(
    name: string,
    description?: string | null,
    color?: string | null
) {
    try {
        const newTicket = await prisma.tags.create({
            data: {
                name,
                description,
                color
            }
        });
        return { success: true, data: newTicket };
    } catch (error) {
        console.error("Create tag error:", error);
        return { success: false, error: "Failed to create tag" };
    }
}

export async function updateTag(id: string, name:string, description?: string | null, color?: string | null) {
    return prisma.tags.update({
        where: { tag_id: id },
        data: {
            name:name,
            description:description ?? null,
            color:color ?? null
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
