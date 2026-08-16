"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, status } from "@/lib/generated/prisma";
import {
	ticketCreateSchema,
	ticketUpdateSchema,
	type CreateTicketParams,
	type UpdateTicketParams,
} from "@/shared/schemas";
import { ticketInclude } from "./types";
import { rollupTicketAncestors } from "./lib/dateRollup";
import { computeActualDates } from "./lib/statusTransitions";
import { logHistoryEvent } from "./lib/logHistoryEvent";
import {
	deriveIssueStatus,
	shouldKeepLinkOnDelete,
} from "@/shared/lib/issueStatus";
import {
	currentWeekStart,
	previousWeekStart,
	nextWeekStart,
	weekdayIndex,
	startOfToday,
	endOfToday,
	riskLabel,
	velocityChange,
	upcomingSummary,
} from "./lib/activityStats";
import { z } from "zod";
import {
	assertProjectMember,
	assertProjectMemberNotClient,
	getCurrentUserId,
	resolveTicketProject,
	resolveWorkflowProject,
} from "@/lib/auth/projectAccess";

type DbClient = Prisma.TransactionClient | typeof prisma;

/**
 * Recomputes Issues.status for the given issue from its (1-to-1) linked
 * ticket: RESOLVED when the ticket is FINISHED, LINKED while pending/in
 * progress, UNLINKED when no active ticket is linked. A soft-deleted ticket
 * keeps the link only when FINISHED (spec rule), so the derived status is
 * computed from the active ticket only.
 */
async function syncLinkedIssueStatus(issueId: string, db: DbClient = prisma) {
	const issue = await db.issues.findUnique({
		where: { issue_id: issueId },
		select: {
			Tickets: {
				select: { status: true, is_deleted: true },
				take: 1,
			},
		},
	});
	if (!issue) return;
	const ticket = issue.Tickets[0] ?? null;
	const activeTicket =
		ticket && (!ticket.is_deleted || ticket.status === "FINISHED")
			? ticket
			: null;
	const next = deriveIssueStatus(activeTicket ? activeTicket.status : null);
	await db.issues.update({
		where: { issue_id: issueId },
		data: { status: next },
	});
}

/**
 * Maps a Prisma unique-constraint error on the 1-to-1 issue link (an issue
 * can only be linked to a ticket once) to a user-facing message. Other
 * P2002s (join-table composite keys) are rethrown untouched.
 */
function rethrowIssueLinkConflict(error: unknown): never {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2002"
	) {
		// Prisma reports P2002 `meta.target` as FIELD names (repo convention,
		// see clientActions.ts invite_code_hash); keep the index name as a
		// robustness fallback for driver variants.
		const target = error.meta?.target;
		const targets = Array.isArray(target) ? target : [target];
		if (
			targets.includes("issue_id") ||
			targets.includes("Tickets_issue_id_key")
		) {
			throw new Error("This issue is already linked to another ticket.");
		}
	}
	throw error;
}

/**
 * Guards the 1-to-1 link against cross-project issues: a project member may
 * only link issues belonging to the ticket's own project (defense in depth —
 * the picker already lists project-scoped issues only).
 */
async function assertIssueInProject(
	db: DbClient,
	issueId: string,
	projectId: string,
) {
	const issue = await db.issues.findUnique({
		where: { issue_id: issueId },
		select: { project_id: true },
	});
	if (!issue || issue.project_id !== projectId) {
		throw new Error("This issue does not belong to this project.");
	}
}

export async function createTicket(
	data: CreateTicketParams & { performed_by?: string },
) {
	ticketCreateSchema.parse(data);

	// Authorization: caller must be a member of the parent project
	if (!data.workflow_id) throw new Error("Ticket must belong to a workflow.");
	const projectId = await resolveWorkflowProject(data.workflow_id);
	if (!projectId) throw new Error("Workflow not found.");
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) throw new Error(auth.error);

	return await prisma.$transaction(async (tx) => {
		// 1-to-1 link guard: the issue must belong to the ticket's project.
		if (data.issue_id) {
			await assertIssueInProject(tx, data.issue_id, projectId);
		}

		let created;
		try {
			created = await tx.tickets.create({
				data: {
					name: data.name,
					// Spec: plan_start_at optional (nullable); plan_end_at required
					plan_start_at: data.plan_start_at ?? null,
					plan_end_at: data.plan_end_at,
					status: data.status,
					workflow_id: data.workflow_id,
					watcher_id: data.watcher_id ?? null,
					description: data.description ?? null,
					actual_end_at: data.actual_end_at ?? null,
					api_route: data.api_route ?? null,
					api_method: data.api_method ?? null,
					issue_id: data.issue_id ?? null,

					TicketAssigned: {
						create: data.TicketAssigned?.map((id: string) => ({
							profile_id: id,
						})),
					},
					TicketTags: {
						create: data.tagIds?.map((id: string): { tag_id: string } => ({
							tag_id: id,
						})),
					},
				},
				include: ticketInclude,
			});
		} catch (error) {
			// 1-to-1: linking an issue already claimed by another ticket.
			rethrowIssueLinkConflict(error);
		}

		if (data.issue_id) {
			await syncLinkedIssueStatus(data.issue_id, tx);
		}

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
}

export async function updateTicket(
	data: UpdateTicketParams & { performed_by?: string },
) {
	ticketUpdateSchema.parse(data);

	// Authorization: caller must be a member of the parent project
	const projectId = await resolveTicketProject(data.ticket_id);
	if (!projectId) throw new Error("Ticket not found.");
	const auth = await assertProjectMemberNotClient(projectId);
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
				issue_id: true,
				TicketAssigned: { select: { profile_id: true } },
				TicketTags: { select: { tag_id: true } },
			},
		});

		const existingAssigneeIds =
			existing?.TicketAssigned.map(
				(a: { profile_id: string }) => a.profile_id,
			) ?? [];
		const existingTagIds =
			existing?.TicketTags.map((t: { tag_id: string }) => t.tag_id) ?? [];

		const assigneesToAdd = data.TicketAssigned.filter(
			(id: string) => !existingAssigneeIds.includes(id),
		);
		const assigneesToRemove = existingAssigneeIds.filter(
			(id: string) => !data.TicketAssigned.includes(id),
		);
		const tagsToAdd = data.tagIds.filter(
			(id: string) => !existingTagIds.includes(id),
		);
		const tagsToRemove = existingTagIds.filter(
			(id: string) => !data.tagIds.includes(id),
		);

		// Spec: actual dates derive from the status transition (pure helper).
		const oldStatus = existing?.status;
		const newStatus = data.status ?? oldStatus ?? "PENDING";
		const now = new Date();
		const actualPatch = computeActualDates(oldStatus!, newStatus, now);

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

		// 1-to-1 link guard: the issue must belong to the ticket's project.
		if (data.issue_id) {
			await assertIssueInProject(tx, data.issue_id, projectId);
		}

		let updated;
		try {
			updated = await tx.tickets.update({
				where: { ticket_id: data.ticket_id },
				data: {
					name: data.name,
					// undefined = don't touch; null = explicitly clear; Date = set
					plan_start_at:
						data.plan_start_at === undefined ? undefined : data.plan_start_at,
					plan_end_at: data.plan_end_at,
					status: data.status,
					workflow_id: data.workflow_id,
					watcher_id: data.watcher_id ?? null,
					description: data.description ?? null,
					// Spec: actual dates derive from the status transition (pure helper)
					...actualPatch,
					api_route: data.api_route ?? null,
					api_method: data.api_method ?? null,
					// 1-to-1 issue link: undefined = don't touch; null = unlink;
					// uuid = link (P2002 when the issue is already claimed).
					issue_id: data.issue_id === undefined ? undefined : data.issue_id,

					...((assigneesToRemove.length > 0 || assigneesToAdd.length > 0) && {
						TicketAssigned: {
							...(assigneesToRemove.length > 0 && {
								deleteMany: { profile_id: { in: assigneesToRemove } },
							}),
							...(assigneesToAdd.length > 0 && {
								create: assigneesToAdd.map((profile_id: string) => ({
									profile_id,
								})),
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
		} catch (error) {
			// 1-to-1: linking an issue already claimed by another ticket.
			rethrowIssueLinkConflict(error);
		}

		// Issue-status sync (spec): link/unlink recomputes the issue status
		// (UNLINKED when unlinked; RESOLVED immediately if the ticket is
		// FINISHED, otherwise LINKED). Sync both the previous and the new
		// issue when the link moved.
		if (data.issue_id !== undefined) {
			if (existing?.issue_id && existing.issue_id !== data.issue_id) {
				await syncLinkedIssueStatus(existing.issue_id, tx);
			}
			if (data.issue_id) {
				await syncLinkedIssueStatus(data.issue_id, tx);
			}
		} else if (
			existing?.issue_id &&
			data.status !== undefined &&
			data.status !== existing.status
		) {
			// Status-only change through updateTicket (the editor always sends
			// issue_id, but direct callers may not): a FINISHED transition
			// resolves the linked issue, a regression re-links it.
			await syncLinkedIssueStatus(existing.issue_id, tx);
		}

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

export async function updateTicketStatus(
	ticketId: string,
	status: status,
	performed_by?: string,
) {
	z.uuid().parse(ticketId);
	z.enum(["PENDING", "IN_PROGRESS", "FINISHED"]).parse(status);

	// Authorization: caller must be a member of the parent project
	const projectId = await resolveTicketProject(ticketId);
	if (!projectId) return { success: false, error: "Ticket not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) throw new Error(auth.error);

	return await prisma.$transaction(async (tx) => {
		// Fetch old status inside the transaction for consistency
		const existing = await tx.tickets.findUnique({
			where: { ticket_id: ticketId },
			select: { status: true, workflow_id: true, issue_id: true },
		});

		const updated = await tx.tickets.update({
			where: { ticket_id: ticketId },
			data: {
				status,
				// Spec: actual dates derive from the status transition (pure helper)
				...computeActualDates(
					existing?.status ?? "PENDING",
					status,
					new Date(),
				),
			},
			include: ticketInclude,
		});

		// Issue-status sync (spec): a FINISHED transition resolves the linked
		// issue; a regression back to PENDING/IN_PROGRESS re-links it.
		if (existing?.issue_id && existing.status !== status) {
			await syncLinkedIssueStatus(existing.issue_id, tx);
		}

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
 * @param ticketId - The UUID of the ticket to softly delete.
 * @param performed_by - The UUID of the profile performing the deletion.
 * @param _txClient - Optional Prisma transaction client when invoked inside an existing transaction.
 * @returns `{ success: boolean, error?: string }`.
 */
export async function cascadeSoftDeleteTicket(
	ticketId: string,
	performed_by?: string,
	mode: "cascade" | "promote" = "cascade",
	_txClient?: Prisma.TransactionClient,
) {
	z.uuid().parse(ticketId);

	// Authorization: caller must be a member of the parent project
	const projectId = await resolveTicketProject(ticketId);
	if (!projectId) return { success: false, error: "Ticket not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const db = _txClient ?? prisma;
		// Fetch ticket name before soft-deleting so we can record it in history
		const ticket = await db.tickets.findUnique({
			where: { ticket_id: ticketId },
			select: { name: true, workflow_id: true, issue_id: true, status: true },
		});

		// Spec: a non-FINISHED ticket releases its issue link when soft-deleted
		// (the issue goes back to UNLINKED); a FINISHED ticket keeps the link
		// (the issue stays resolved).
		const linkReleasePairs: { ticket_id: string; issue_id: string }[] = [];
		const collectReleases = (
			rows: { ticket_id: string; issue_id: string | null; status: status }[],
		) => {
			for (const row of rows) {
				if (row.issue_id && !shouldKeepLinkOnDelete(row.status)) {
					linkReleasePairs.push({
						ticket_id: row.ticket_id,
						issue_id: row.issue_id,
					});
				}
			}
		};

		if (mode === "cascade") {
			// Spec: deleting a parent cascades to the whole parent_id subtree.
			const idsToDelete = [ticketId];
			let frontier = [ticketId];
			const subtreeRows: {
				ticket_id: string;
				issue_id: string | null;
				status: status;
			}[] = [];
			while (frontier.length > 0) {
				const children = await db.tickets.findMany({
					where: { parent_id: { in: frontier }, is_deleted: false },
					select: { ticket_id: true, issue_id: true, status: true },
				});
				subtreeRows.push(...children);
				frontier = children.map((c) => c.ticket_id);
				idsToDelete.push(...frontier);
			}

			collectReleases(
				ticket
					? [
							{
								ticket_id: ticketId,
								issue_id: ticket.issue_id,
								status: ticket.status,
							},
						]
					: [],
			);
			collectReleases(subtreeRows);

			await db.tickets.updateMany({
				where: { ticket_id: { in: idsToDelete } },
				data: { is_deleted: true, deleted_at: new Date() },
			});
		} else {
			// Spec: "promote" — subtasks become top-level tickets first.
			await db.tickets.updateMany({
				where: { parent_id: ticketId, is_deleted: false },
				data: { parent_id: null },
			});

			await db.tickets.update({
				where: { ticket_id: ticketId },
				data: {
					is_deleted: true,
					deleted_at: new Date(),
				},
			});

			collectReleases(
				ticket
					? [
							{
								ticket_id: ticketId,
								issue_id: ticket.issue_id,
								status: ticket.status,
							},
						]
					: [],
			);
		}

		// Release the links, then recompute each affected issue's status.
		if (linkReleasePairs.length > 0) {
			await db.tickets.updateMany({
				where: { ticket_id: { in: linkReleasePairs.map((p) => p.ticket_id) } },
				data: { issue_id: null },
			});
			for (const pair of linkReleasePairs) {
				await syncLinkedIssueStatus(pair.issue_id, db);
			}
		}

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
		return {
			success: false,
			error: "Failed to delete the ticket due to a database error.",
		};
	}
}

export async function selectTicketsByWorkflow(workflow_id: string) {
	// No catch: a thrown error lets React Query retry and surface isError.
	z.uuid().parse(workflow_id);

	// Membership guard (2026-08-14 ticket deep-link audit): the action is
	// independently callable — non-members must not read another project's
	// ticket tree (assignees, tags). Clients pass as members (read-only).
	const projectId = await resolveWorkflowProject(workflow_id);
	if (!projectId) return [];
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) throw new Error(auth.error);

	return prisma.tickets.findMany({
		where: { is_deleted: false, workflow_id },
		include: ticketInclude,
	});
}

/**
 * Fetches the full history log for a ticket, including the names of both the
 * performer (who did the action) and the target profile (who was assigned/unassigned).
 */
export async function selectTicketHistory(ticketId: string) {
	// No catch: a thrown error lets React Query retry and surface isError.
	z.uuid().parse(ticketId);

	// Membership guard (2026-08-14): same rationale as selectTicketsByWorkflow.
	const projectId = await resolveTicketProject(ticketId);
	if (!projectId) return [];
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) throw new Error(auth.error);

	return prisma.historyEvent.findMany({
		where: { ticket_id: ticketId },
		orderBy: { performed_at: "desc" },
		include: {
			Performer: {
				select: { first_name: true, last_name: true },
			},
			TargetProfile: {
				select: { first_name: true, last_name: true },
			},
		},
	});
}

export async function updateTicketParent(
	ticketId: string,
	parentId: string | null,
) {
	z.uuid().parse(ticketId);
	if (parentId !== null) z.uuid().parse(parentId);

	const projectId = await resolveTicketProject(ticketId);
	if (!projectId) return { success: false, error: "Ticket not found." };

	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) throw new Error(auth.error);

	return await prisma.$transaction(async (tx) => {
		const updated = await tx.tickets.update({
			where: { ticket_id: ticketId },
			data: { parent_id: parentId },
			include: ticketInclude,
		});

		// Timeline rollup: changing a subtask might affect workflow boundaries
		if (updated.workflow_id) {
			await rollupTicketAncestors(tx, updated.workflow_id);
		}

		return updated;
	});
}

/**
 * Dashboard table shape for a ticket: nested project/module/workflow names,
 * first tag, and assignees. Shared by "my tickets" and "watched tickets".
 */
const ticketDashboardSelect = {
	ticket_id: true,
	name: true,
	status: true,
	plan_end_at: true,
	Workflows: {
		select: {
			workflow_id: true,
			name: true,
			Modules: {
				select: {
					name: true,
					Phases: {
						select: {
							name: true,
							Stages: {
								select: {
									name: true,
									Projects: {
										select: { project_id: true, name: true },
									},
								},
							},
						},
					},
				},
			},
		},
	},
	TicketTags: {
		where: { Tags: { is_deleted: false } },
		select: { Tags: { select: { name: true, color: true } } },
	},
	TicketAssigned: {
		select: {
			Profile: {
				select: { profile_id: true, first_name: true, last_name: true },
			},
		},
	},
} satisfies Prisma.TicketsSelect;

export type DashboardTicketRow = Prisma.TicketsGetPayload<{
	select: typeof ticketDashboardSelect;
}>;

/** Tickets assigned to the signed-in user, soonest plan_end_at first. */
export async function selectMyTickets() {
	const userId = await getCurrentUserId();
	if (!userId) return [];
	return prisma.tickets.findMany({
		where: {
			is_deleted: false,
			TicketAssigned: { some: { profile_id: userId } },
		},
		select: ticketDashboardSelect,
		orderBy: { plan_end_at: "asc" },
	});
}

/** Tickets the signed-in user is watching (Tickets.watcher_id), soonest first. */
export async function selectWatchedTickets() {
	const userId = await getCurrentUserId();
	if (!userId) return [];
	return prisma.tickets.findMany({
		where: { is_deleted: false, watcher_id: userId },
		select: ticketDashboardSelect,
		orderBy: { plan_end_at: "asc" },
	});
}

/**
 * Landing-dashboard activity stats for the signed-in user:
 *  - Weekly Velocity: tickets finished in the current week (Mon–Sun) vs the
 *    previous week, plus per-weekday counts for the sparkline bars.
 *  - Risk Factor: ratio-based Low/Medium/High from overdue / active tickets.
 *  - Upcoming Deadlines: unfinished tickets due within the next 7 days
 *    (includes overdue), with a "Today" flag when any is due today.
 *
 * Returns null when there is no authenticated user.
 */
export async function getActivitySparklines() {
	const userId = await getCurrentUserId();
	if (!userId) return null;

	const now = new Date();
	const weekStart = currentWeekStart(now);
	const lastWeekStart = previousWeekStart(now);
	const nextWeekStartBound = nextWeekStart(now);

	const myAssigned = {
		is_deleted: false,
		TicketAssigned: { some: { profile_id: userId } },
	} satisfies Prisma.TicketsWhereInput;

	const UPCOMING_WINDOW_MS = 7 * 86_400_000;

	const [
		thisWeekTickets,
		lastWeekCount,
		activeCount,
		overdueCount,
		upcomingTickets,
	] = await Promise.all([
		// Finished this week — full rows so daily bars can be bucketed.
		// Upper bound guards against future-dated actual_end_at values
		// (re-saving a finished ticket passes actual_end_at through).
		prisma.tickets.findMany({
			where: {
				...myAssigned,
				status: "FINISHED",
				actual_end_at: { gte: weekStart, lt: nextWeekStartBound },
			},
			select: { actual_end_at: true },
		}),
		prisma.tickets.count({
			where: {
				...myAssigned,
				status: "FINISHED",
				actual_end_at: { gte: lastWeekStart, lt: weekStart },
			},
		}),
		prisma.tickets.count({
			where: { ...myAssigned, status: { not: "FINISHED" } },
		}),
		prisma.tickets.count({
			where: {
				...myAssigned,
				status: { not: "FINISHED" },
				plan_end_at: { lt: now },
			},
		}),
		prisma.tickets.findMany({
			where: {
				...myAssigned,
				status: { not: "FINISHED" },
				plan_end_at: { lte: new Date(now.getTime() + UPCOMING_WINDOW_MS) },
			},
			select: { plan_end_at: true },
		}),
	]);

	// Bucket finished tickets into weekday bars (index 0 = Monday).
	const daily = new Array<number>(7).fill(0);
	for (const t of thisWeekTickets) {
		daily[weekdayIndex(t.actual_end_at!)] += 1;
	}

	const todayStart = startOfToday(now);
	const todayEnd = endOfToday(now);
	const dueToday = upcomingTickets.some(
		(t) => t.plan_end_at >= todayStart && t.plan_end_at <= todayEnd,
	);

	const { change, changePositive } = velocityChange(
		thisWeekTickets.length,
		lastWeekCount,
	);
	const { urgencyLabel, isUrgent } = upcomingSummary(
		upcomingTickets.length,
		dueToday,
	);

	return {
		weeklyVelocity: {
			value: thisWeekTickets.length,
			change,
			changePositive,
			daily,
		},
		riskFactor: { label: riskLabel(overdueCount, activeCount) },
		upcomingDeadlines: {
			count: upcomingTickets.length,
			urgencyLabel,
			isUrgent,
		},
	};
}
