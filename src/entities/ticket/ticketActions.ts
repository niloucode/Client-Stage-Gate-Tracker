"use server";

import { prisma } from "@/lib/prisma";
import {Prisma, status, CommentParentType, ImageParentType } from "@/lib/generated/prisma";

export type EntityFilterStatus = 'active' | 'deleted' | 'all';


export async function selectTicket() {
    try {
        return await prisma.tickets.findMany({
            where: { is_deleted: false },
            include: {
                TicketTags: true,
                TicketSubtasks_TicketSubtasks_ticket_idToTickets: true,
                TicketAssigned: {
                    include: {
                        Profiles: {
                            select: {
                                first_name:true,
                                last_name:true
                            }
                        }
                    }
                },
                Profiles_Tickets_assigner_idToProfiles: {
                    select: {
                        first_name:true,
                        last_name:true
                    }
                },
                Profiles_Tickets_watcher_idToProfiles: {
                    select: {
                        first_name:true,
                        last_name:true
                    }
                }
            },
        });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return [];
    }
}

export async function createTicket({
                                       workflow_id,
                                       name,
                                       deadline_date,
                                       status,
                                       watcher_id,
                                       TicketAssigned,
                                       tagIds,
                                       description,
                                       start_date,
                                       end_date,
                                   }: {
    workflow_id: string | null;
    name: string;
    deadline_date: Date;
    status: status;
    watcher_id: string | null;
    TicketAssigned: string[] | null;
    tagIds: string[] | null;
    description?: string | null;
    start_date?: Date | null;
    end_date?: Date | null;
}) {

    console.log(tagIds)

    return prisma.tickets.create({
        data: {
            name,
            deadline_date,
            status: status,
            workflow_id: workflow_id ?? null,
            watcher_id: watcher_id ?? null,
            description: description ?? null,
            start_date: start_date ?? null,
            end_date: end_date ?? null,

            TicketAssigned: {
                create: TicketAssigned?.map((id) => ({
                    profile_id: id,
                })),
            },
            TicketTags: {
                create: tagIds?.map((id): { tag_id: string } => ({
                    tag_id: id,
                }))
                // create: tagIds?.map((id) => ({
                //     tag_id: id,
                // })),
            },
        },
        include: {
            TicketTags: true,
            TicketAssigned: true,
            Profiles_Tickets_assigner_idToProfiles: true,
            Profiles_Tickets_watcher_idToProfiles: true,
        },
    });
}

export async function updateTicket({
                                       ticket_id,
                                       workflow_id,
                                       name,
                                       deadline_date,
                                       status,
                                       watcher_id,
                                       TicketAssigned,
                                       tagIds,
                                       description,
                                       start_date,
                                       end_date,
                                   }: {
    ticket_id: string;
    workflow_id: string | null;
    name: string;
    deadline_date: Date;
    status: status;
    watcher_id: string | null;
    TicketAssigned: string[];
    tagIds: string[];
    description?: string | null;
    start_date?: Date | null;
    end_date?: Date | null;
}) {
    return prisma.tickets.update({
        where: { ticket_id },
        data: {
            name,
            deadline_date,
            status: status,
            workflow_id: workflow_id ?? null,
            watcher_id: watcher_id ?? null,

            description: description ?? null,
            start_date: start_date ?? null,
            end_date: end_date ?? null,

            TicketAssigned: {
                deleteMany: {},
                create: TicketAssigned.map((profile_id) => ({
                    profile_id,
                })),
            },
            TicketTags: {
                deleteMany: {},
                create: tagIds.map((tag_id) => ({
                    tag_id,
                })),
            },
        },
        include: {
            TicketTags: true,
            TicketAssigned: {
                include: {
                    Profiles: true
                }
            },
            Profiles_Tickets_assigner_idToProfiles: true,
            Profiles_Tickets_watcher_idToProfiles: true,
        },
    });
}

export async function updateTicketStatus(ticketId: string, status: status) {
    return prisma.tickets.update({
        where: { ticket_id: ticketId },
        data: { status },
        include: {
            TicketTags: true,
            TicketAssigned: true,
            TicketSubtasks_TicketSubtasks_ticket_idToTickets: true,
            Profiles_Tickets_assigner_idToProfiles: true,
            Profiles_Tickets_watcher_idToProfiles: true,
        },
    });
}

export async function getSubtasksByTicketId(ticketId: string, status: string = 'active') {
    try {
        const subtasks = await prisma.ticketSubtasks.findMany({
            where: {
                ticket_id: ticketId,
            },
            orderBy: {
                subtask_id: 'asc',
            },
        });
        return { success: true, data: subtasks };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to fetch subtasks" };
    }
}

/**
 * Performs a "soft delete" on a ticket by flagging it as deleted.
 * This removes it from active board views while preserving historical audit data.
 *
 * @param {string} ticketId - The UUID of the ticket to soft delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function cascadeSoftDeleteTicket(ticketId: string, txClient?: Prisma.TransactionClient) {

    // Delete related entries in other tables
    const executeLogic = async (tx: Prisma.TransactionClient) => {

        // Update ticket status
        await tx.tickets.update({
            where: { ticket_id: ticketId },
            data: { is_deleted: true, deleted_at: new Date() }
        });

        // Delete comments, images, and other related entries
        await tx.comments.deleteMany({
            where: { parent_id: ticketId, parent_type: CommentParentType.TICKET },
        });

        await tx.images.deleteMany({
            where: { parent_id: ticketId, parent_type: ImageParentType.TICKET },
        });

        await tx.historyEvent.deleteMany({
            where: { ticket_id: ticketId },
        });

        await tx.ticketAssigned.deleteMany({
            where: { ticket_id: ticketId },
        });

        await tx.ticketTags.deleteMany({
            where: { ticket_id: ticketId },
        });

        const subtasks = await tx.ticketSubtasks.findMany({
            where: { ticket_id: ticketId },
            select: { subtask_id: true }
        })

        for (const s of subtasks) {
            await cascadeSoftDeleteTicket(s.subtask_id, tx);
        }

    };

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
