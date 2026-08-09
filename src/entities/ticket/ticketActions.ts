"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, status } from "@/lib/generated/prisma";
import { ticketCreateSchema, ticketUpdateSchema, type CreateTicketParams, type UpdateTicketParams } from "@/shared/schemas";
import { ticketInclude } from "./types";
import { rollupTicketAncestors } from "./lib/dateRollup";
import { logHistoryEvent } from "./lib/logHistoryEvent";
import { z } from "zod";
import {
	assertProjectMember,
	resolveTicketProject,
	resolveWorkflowProject,
} from "@/lib/auth/projectAccess";
import type { EntityFilterStatus } from "@/entities/types";


export async function selectTicket() {
    try {
        return await prisma.tickets.findMany({
            where: { is_deleted: false },
            include: ticketInclude,
            take: 200, // bound the list; paginate when callers need more
        });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return [];
    }
}

export async function createTicket(data: CreateTicketParams & { performed_by?: string }) {
    ticketCreateSchema.parse(data);

    // Authorization: caller must be a member of the parent project
    if (!data.workflow_id)
        throw new Error("Ticket must belong to a workflow.");
    const projectId = await resolveWorkflowProject(data.workflow_id);
    if (!projectId) throw new Error("Workflow not found.");
    const auth = await assertProjectMember(projectId);
    if (!auth.ok) throw new Error(auth.error);

    const ticket = await prisma.$transaction(async (tx) => {
        const created = await tx.tickets.create({
            data: {
                name: data.name,
                plan_start_at: new Date(),
                plan_end_at: data.deadline_date,
                status: data.status,
                workflow_id: data.workflow_id ?? null,
                watcher_id: data.watcher_id ?? null,
                description: data.description ?? null,
                actual_end_at: data.finish_date ?? null,
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
            await tx.images.createMany({
                data: data.image_urls.map((url) => ({
                    image_src: url,
                    parent_type: "TICKET",
                    parent_id: created.ticket_id,
                })),
            });
        }

        if (data.performed_by) {
            await logHistoryEvent(tx, {
                ticketId: created.ticket_id,
                performedBy: data.performed_by,
                action: "CREATED",
                details: { ticket_name: data.name },
            });
        }

        // Timeline rollup (Task 3.2): a new ticket extends the workflow/module
        // boundaries.
        if (created.workflow_id) {
            await rollupTicketAncestors(tx, created.workflow_id);
        }

        return created;
    });

    return ticket;
}

export async function updateTicket(data: UpdateTicketParams & { performed_by?: string }) {
    ticketUpdateSchema.parse(data);

    // Authorization: caller must be a member of the parent project
    const projectId = await resolveTicketProject(data.ticket_id);
    if (!projectId) throw new Error("Ticket not found.");
    const auth = await assertProjectMember(projectId);
    if (!auth.ok) throw new Error(auth.error);

    // ── Single transaction: diff → update → one batched history write ─────
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const existing = await tx.tickets.findUnique({
            where: { ticket_id: data.ticket_id },
            select: {
                name: true,
                status: true,
                watcher_id: true,
                workflow_id: true,
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

        // Collect all history rows first, write them once with createMany.
        const historyRows: Prisma.HistoryEventUncheckedCreateInput[] = [];
        if (data.performed_by) {
            const ticketId = data.ticket_id;

            // RENAMED
            if (existing && data.name !== undefined && data.name !== existing.name) {
                historyRows.push({
                    action: "RENAMED",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    details: JSON.stringify({ from: existing.name, to: data.name }),
                });
            }

            // Status change — FINISHED or UPDATED_STATUS
            if (existing && oldStatus && oldStatus !== newStatus) {
                historyRows.push({
                    action: newStatus === "FINISHED" ? "FINISHED" : "UPDATED_STATUS",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    details: JSON.stringify(
                        newStatus === "FINISHED"
                            ? { from: oldStatus }
                            : { from: oldStatus, to: newStatus },
                    ),
                });
            }

            // ASSIGNED (per new assignee)
            for (const profileId of assigneesToAdd) {
                historyRows.push({
                    action: "ASSIGNED",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    target_profile_id: profileId,
                });
            }

            // UNASSIGNED (per removed assignee)
            for (const profileId of assigneesToRemove) {
                historyRows.push({
                    action: "UNASSIGNED",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    target_profile_id: profileId,
                });
            }

            // WATCHER_CHANGED
            const oldWatcher = existing?.watcher_id ?? null;
            const newWatcher = data.watcher_id ?? null;
            if (existing && oldWatcher !== newWatcher) {
                historyRows.push({
                    action: "WATCHER_CHANGED",
                    performed_by: data.performed_by,
                    ticket_id: ticketId,
                    target_profile_id: newWatcher || oldWatcher,
                    details: JSON.stringify({ from: oldWatcher, to: newWatcher }),
                });
            }
        }

        const updated = await tx.tickets.update({
            where: { ticket_id: data.ticket_id },
            data: {
                name: data.name,
                plan_end_at: data.deadline_date,
                status: data.status,
                workflow_id: data.workflow_id ?? null,
                watcher_id: data.watcher_id ?? null,
                description: data.description ?? null,
                actual_end_at: finishDate,
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

        if (historyRows.length > 0) {
            await tx.historyEvent.createMany({ data: historyRows });
        }

        // Timeline rollup: keep the parent Workflow + Module boundaries in
        // sync with this ticket's dates/status (Task 3.2). Roll both the
        // old and new workflow when the ticket moved between them.
        const oldWorkflowId = existing?.workflow_id ?? null;
        const newWorkflowId = data.workflow_id ?? null;
        if (oldWorkflowId) await rollupTicketAncestors(tx, oldWorkflowId);
        if (newWorkflowId && newWorkflowId !== oldWorkflowId) {
            await rollupTicketAncestors(tx, newWorkflowId);
        }

        return updated;
    });
}

export async function updateTicketStatus(ticketId: string, status: status, performed_by?: string) {
    z.string().uuid().parse(ticketId);
    z.enum(["PENDING", "IN_PROGRESS", "FINISHED"]).parse(status);

    // Authorization: caller must be a member of the parent project
    const projectId = await resolveTicketProject(ticketId);
    if (!projectId) return { success: false, error: "Ticket not found." };
    const auth = await assertProjectMember(projectId);
    if (!auth.ok) throw new Error(auth.error);

    return await prisma.$transaction(async (tx) => {
        // Fetch old status inside the transaction for consistency
        const existing = await tx.tickets.findUnique({
            where: { ticket_id: ticketId },
            select: { status: true, workflow_id: true },
        });

        const updated = await tx.tickets.update({
            where: { ticket_id: ticketId },
            data: {
                status,
                actual_end_at: status === "FINISHED" ? new Date() : null,
            },
            include: ticketInclude,
        });

        if (performed_by && existing && existing.status !== status) {
            await logHistoryEvent(tx, {
                ticketId,
                performedBy: performed_by,
                action: status === "FINISHED" ? "FINISHED" : "UPDATED_STATUS",
                details:
                    status === "FINISHED"
                        ? { from: existing.status }
                        : { from: existing.status, to: status },
            });
        }

        // Timeline rollup: status change moves the workflow/module boundary
        // (Task 3.2) — e.g. transitioning to FINISHED sets actualEnd.
        if (existing?.workflow_id) {
            await rollupTicketAncestors(tx, existing.workflow_id);
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
    // Authorization: caller must be a member of the parent project
    const projectId = await resolveTicketProject(ticketId);
    if (!projectId) return { success: false, error: "Ticket not found." };
    const auth = await assertProjectMember(projectId);
    if (!auth.ok) return { success: false, error: auth.error };
	try {
		const db = _txClient ?? prisma;
		// Fetch ticket name before soft-deleting so we can record it in history
		const ticket = await db.tickets.findUnique({
			where: { ticket_id: ticketId },
			select: { name: true, workflow_id: true },
		});

		await db.tickets.update({
			where: { ticket_id: ticketId },
			data: {
				is_deleted: true,
				deleted_at: new Date(),
			},
		});

		if (performed_by) {
			await logHistoryEvent(db, {
				ticketId,
				performedBy: performed_by,
				action: "DELETE",
				details: { ticket_name: ticket?.name ?? null },
			});
		}

		// Timeline rollup (Task 3.2): removing a ticket narrows the parent
		// boundaries. Runs on `db` (the caller's transaction when provided).
		if (ticket?.workflow_id) {
			await rollupTicketAncestors(db, ticket.workflow_id);
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
            orderBy: { performed_at: "desc" },
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