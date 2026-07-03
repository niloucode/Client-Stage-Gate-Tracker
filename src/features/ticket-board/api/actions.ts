"use server";

import {prisma} from "@/lib/prisma";
import { z } from "zod";

export async function selectTicketsByWorkflow(workflow_id:string) {
    z.string().uuid().parse(workflow_id);
	try {
		return await prisma.tickets.findMany({
			where: { is_deleted: false, workflow_id: workflow_id },
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
