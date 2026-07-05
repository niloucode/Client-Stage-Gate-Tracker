"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, status } from "@/lib/generated/prisma";
import { ticketCreateSchema, ticketUpdateSchema, type CreateTicketParams, type UpdateTicketParams } from "@/shared/schemas";
import { ticketInclude } from "./types";
import { z } from "zod";

export type EntityFilterStatus = 'active' | 'deleted' | 'all';


export async function selectTicket() {
    try {
        return await prisma.tickets.findMany({
            where: { is_deleted: false },
            include: ticketInclude,
        });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return [];
    }
}

export async function createTicket(data: CreateTicketParams) {
    ticketCreateSchema.parse(data);

    const ticket = await prisma.tickets.create({
        data: {
            name: data.name,
            deadline_date: data.deadline_date,
            status: data.status,
            workflow_id: data.workflow_id ?? null,
            watcher_id: data.watcher_id ?? null,
            description: data.description ?? null,            end_date: data.end_date ?? null,
            api_route: data.api_route ?? null,
            api_method: data.api_method ?? null,

            TicketAssigned: {
                create: data.TicketAssigned?.map((id: string) => ({
                    profile_id: id,
                })),
            },
            TicketTags: {
                create: data.tagIds?.map((id: string): { tag_id: string } => ({
                    tag_id: id,
                }))
            },
        },
        include: ticketInclude,
    });

    if (data.image_urls && data.image_urls.length > 0) {
        await prisma.images.createMany({
            data: data.image_urls.map((url) => ({
                image_src: url,
                parent_type: "TICKET",
                parent_id: ticket.ticket_id,
            })),
        });
    }

    return ticket;
}

export async function updateTicket(data: UpdateTicketParams) {
    ticketUpdateSchema.parse(data);

    // ── Diff existing assignments & tags to preserve assigned_date ──────────
    const existing = await prisma.tickets.findUnique({
        where: { ticket_id: data.ticket_id },
        select: {
            status: true,
            TicketAssigned: { select: { profile_id: true } },
            TicketTags:      { select: { tag_id: true } },
        },
    });

    const existingAssigneeIds = existing?.TicketAssigned.map((a: { profile_id: string }) => a.profile_id) ?? [];
    const existingTagIds      = existing?.TicketTags.map((t: { tag_id: string }) => t.tag_id) ?? [];

    const assigneesToAdd    = data.TicketAssigned.filter((id: string) => !existingAssigneeIds.includes(id));
    const assigneesToRemove = existingAssigneeIds.filter((id: string) => !data.TicketAssigned.includes(id));
    const tagsToAdd         = data.tagIds.filter((id: string) => !existingTagIds.includes(id));
    const tagsToRemove      = existingTagIds.filter((id: string) => !data.tagIds.includes(id));

    // Auto-manage end_date based on status transition
    const oldStatus = existing?.status;
    const newStatus = data.status;
    const endDate = newStatus === "FINISHED" && oldStatus !== "FINISHED"
        ? new Date()
        : newStatus !== "FINISHED"
        ? null
        : data.end_date;

    return prisma.tickets.update({
        where: { ticket_id: data.ticket_id },
        data: {
            name: data.name,
            deadline_date: data.deadline_date,
            status: data.status,
            workflow_id: data.workflow_id ?? null,
            watcher_id: data.watcher_id ?? null,
            description: data.description ?? null,
            end_date: endDate,
            api_route: data.api_route ?? null,
            api_method: data.api_method ?? null,

            ...((assigneesToRemove.length > 0 || assigneesToAdd.length > 0) && {
                TicketAssigned: {
                    ...(assigneesToRemove.length > 0 && {
                        deleteMany: { profile_id: { in: assigneesToRemove } },
                    }),
                    ...(assigneesToAdd.length > 0 && {
                        create: assigneesToAdd.map((profile_id: string) => ({ profile_id })),
                    }),
                },
            }),
            ...((tagsToRemove.length > 0 || tagsToAdd.length > 0) && {
                TicketTags: {
                    ...(tagsToRemove.length > 0 && {
                        deleteMany: { tag_id: { in: tagsToRemove } },
                    }),
                    ...(tagsToAdd.length > 0 && {
                        create: tagsToAdd.map((tag_id: string) => ({ tag_id })),
                    }),
                },
            }),
        },
        include: ticketInclude,
    });
}

export async function updateTicketStatus(ticketId: string, status: status) {
    z.string().uuid().parse(ticketId);
    z.enum(["PENDING", "IN_PROGRESS", "FINISHED"]).parse(status);
    return prisma.tickets.update({
        where: { ticket_id: ticketId },
        data: {
            status,
            end_date: status === "FINISHED" ? new Date() : null,
        },
        include: ticketInclude,
    });
}

/**
 * Performs a "soft delete" on a ticket by flagging it as deleted.
 * This removes it from active board views while preserving historical audit data.
 *
 * @param {string} ticketId - The UUID of the ticket to soft delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function cascadeSoftDeleteTicket(ticketId: string, _txClient?: Prisma.TransactionClient) {

    try {
        await prisma.tickets.update({
            where: {
                ticket_id: ticketId
            },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
            },
    });
        return { success: true };
    } catch (error) {
        console.error("Failed to soft delete ticket:", error);
        return { success: false, error: "Failed to delete the ticket due to a database error." };
    }
}

export async function selectTicketsByWorkflow(workflow_id: string) {
    z.string().uuid().parse(workflow_id);
    try {
        return await prisma.tickets.findMany({
            where: { is_deleted: false, workflow_id },
            include: ticketInclude,
        });
    } catch (error) {
        console.error("Error fetching tickets by workflow:", error);
        return [];
    }
}
