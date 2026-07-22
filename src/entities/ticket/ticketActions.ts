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

export async function createTicket(data: CreateTicketParams & { performed_by?: string }) {
    ticketCreateSchema.parse(data);

    const ticket = await prisma.tickets.create({
        data: {
            name: data.name,
            deadline_date: data.deadline_date,
            status: data.status,
            workflow_id: data.workflow_id ?? null,
            watcher_id: data.watcher_id ?? null,
            description: data.description ?? null,
            finish_date: data.finish_date ?? null,
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

    if (data.performed_by) {
        await prisma.historyEvent.create({
            data: {
                action: "CREATED",
                performed_by: data.performed_by,
                ticket_id: ticket.ticket_id,
                details: JSON.stringify({ ticket_name: data.name }),
            },
        });
    }

    return ticket;
}

export async function updateTicket(data: UpdateTicketParams & { performed_by?: string }) {
    ticketUpdateSchema.parse(data);

    // ── Fetch existing record to diff changes ──────────────────────────────
    const existing = await prisma.tickets.findUnique({
        where: { ticket_id: data.ticket_id },
        select: {
            name: true,
            status: true,
            watcher_id: true,
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

    // Auto-manage finish_date based on status transition
    const oldStatus = existing?.status;
    const newStatus = data.status;
    const finishDate = newStatus === "FINISHED" && oldStatus !== "FINISHED"
        ? new Date()
        : newStatus !== "FINISHED"
        ? null
        : data.finish_date;

    const updated = await prisma.tickets.update({
        where: { ticket_id: data.ticket_id },
        data: {
            name: data.name,
            deadline_date: data.deadline_date,
            status: data.status,
            workflow_id: data.workflow_id ?? null,
            watcher_id: data.watcher_id ?? null,
            description: data.description ?? null,
            finish_date: finishDate,
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

    // ── Write HistoryEvent rows ────────────────────────────────────────────
    if (data.performed_by) {
        const ticketId = data.ticket_id;

        // RENAMED
        if (existing && data.name !== existing.name) {
            await prisma.historyEvent.create({
                data: {
                    action: "RENAMED",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    details: JSON.stringify({ from: existing.name, to: data.name }),
                },
            });
        }

        // Status change — FINISHED or UPDATED_STATUS
        if (existing && oldStatus && oldStatus !== newStatus) {
            if (newStatus === "FINISHED") {
                await prisma.historyEvent.create({
                    data: {
                        action: "FINISHED",
                        performed_by: data.performed_by,
                        ticket_id: ticketId,
                        details: JSON.stringify({ from: oldStatus }),
                    },
                });
            } else {
                await prisma.historyEvent.create({
                    data: {
                        action: "UPDATED_STATUS",
                        performed_by: data.performed_by,
                        ticket_id: ticketId,
                        details: JSON.stringify({ from: oldStatus, to: newStatus }),
                    },
                });
            }
        }

        // ASSIGNED (per new assignee)
        for (const profileId of assigneesToAdd) {
            await prisma.historyEvent.create({
                data: {
                    action: "ASSIGNED",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    target_profile_id: profileId,
                },
            });
        }

        // UNASSIGNED (per removed assignee)
        for (const profileId of assigneesToRemove) {
            await prisma.historyEvent.create({
                data: {
                    action: "UNASSIGNED",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    target_profile_id: profileId,
                },
            });
        }

        // WATCHER_CHANGED
        const oldWatcher = existing?.watcher_id ?? null;
        const newWatcher = data.watcher_id ?? null;
        if (existing && oldWatcher !== newWatcher) {
            await prisma.historyEvent.create({
                data: {
                    action: "WATCHER_CHANGED",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    target_profile_id: newWatcher || oldWatcher,
                    details: JSON.stringify({ from: oldWatcher, to: newWatcher }),
                },
            });
        }
    }

    return updated;
}

export async function updateTicketStatus(ticketId: string, status: status, performed_by?: string) {
    z.string().uuid().parse(ticketId);
    z.enum(["PENDING", "IN_PROGRESS", "FINISHED"]).parse(status);

    return await prisma.$transaction(async (tx) => {
        // Fetch old status inside the transaction for consistency
        const existing = await tx.tickets.findUnique({
            where: { ticket_id: ticketId },
            select: { status: true },
        });

        const updated = await tx.tickets.update({
            where: { ticket_id: ticketId },
            data: {
                status,
                finish_date: status === "FINISHED" ? new Date() : null,
            },
            include: ticketInclude,
        });

        if (performed_by && existing && existing.status !== status) {
            if (status === "FINISHED") {
                await tx.historyEvent.create({
                    data: {
                        action: "FINISHED",
                        performed_by,
                        ticket_id: ticketId,
                        details: JSON.stringify({ from: existing.status }),
                    },
                });
            } else {
                await tx.historyEvent.create({
                    data: {
                        action: "UPDATED_STATUS",
                        performed_by,
                        ticket_id: ticketId,
                        details: JSON.stringify({ from: existing.status, to: status }),
                    },
                });
            }
        }

        return updated;
    });
}

/**
 * Performs a "soft delete" on a ticket by flagging it as deleted.
 * This removes it from active board views while preserving historical audit data.
 *
 * @param {string} ticketId - The UUID of the ticket to soft delete.
 * @param {string} [performed_by] - The UUID of the profile performing the deletion.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function cascadeSoftDeleteTicket(ticketId: string, performed_by?: string, _txClient?: Prisma.TransactionClient) {
    try {
        // Fetch ticket name before soft-deleting so we can record it in history
        const ticket = await prisma.tickets.findUnique({
            where: { ticket_id: ticketId },
            select: { name: true },
        });

        await prisma.tickets.update({
            where: { ticket_id: ticketId },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
            },
        });

        if (performed_by) {
            await prisma.historyEvent.create({
                data: {
                    action: "DELETE",
                    performed_by,
                    ticket_id: ticketId,
                    details: JSON.stringify({ ticket_name: ticket?.name ?? null }),
                },
            });
        }

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

/**
 * Fetches the full history log for a ticket, including the names of both the
 * performer (who did the action) and the target profile (who was assigned/unassigned).
 */
export async function selectTicketHistory(ticketId: string) {
    z.string().uuid().parse(ticketId);
    try {
        return await prisma.historyEvent.findMany({
            where: { ticket_id: ticketId },
            orderBy: { date_performed: "desc" },
            include: {
                Profiles_HistoryEvent_performed_byToProfiles: {
                    select: { first_name: true, last_name: true },
                },
                Profiles: {
                    select: { first_name: true, last_name: true },
                },
            },
        });
    } catch (error) {
        console.error("Error fetching ticket history:", error);
        return [];
    }
}