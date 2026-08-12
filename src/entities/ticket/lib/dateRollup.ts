import type { Prisma } from "@/lib/generated/prisma";

/**
 * Ticket-driven timeline rollup (Task 3.2).
 *
 * A Workflow's dates strictly reflect its child tickets:
 *   - planStart  = earliest ticket plan_start_at
 *   - planEnd    = latest   ticket plan_end_at
 *   - actualStart = earliest ticket actual_start_at (falls back to
 *     plan_start_at so a started-but-unrecorded ticket counts)
 *   - actualEnd  = latest ticket actual_end_at, but only when ALL
 *     tickets are FINISHED (matches the tree-query "all finished" rule)
 *
 * The rollup is executed inside ticket mutation transactions (see
 * ticketActions) so parent Workflow/Module boundaries stay in sync with
 * status and date changes.
 */

export interface TicketDateInput {
	plan_start_at: Date;
	plan_end_at: Date;
	actual_start_at: Date | null;
	actual_end_at: Date | null;
	status: string;
}

export interface RolledUpDates {
	plan_start_at: Date | null;
	plan_end_at: Date | null;
	actual_start_at: Date | null;
	actual_end_at: Date | null;
}

/** Roll a list of child tickets up into one Workflow boundary. */
export function rollupWorkflowDates(
	tickets: TicketDateInput[],
): RolledUpDates {
	if (tickets.length === 0) {
		return {
			plan_start_at: null,
			plan_end_at: null,
			actual_start_at: null,
			actual_end_at: null,
		};
	}

	let planStart: Date = tickets[0].plan_start_at;
	let planEnd: Date = tickets[0].plan_end_at;
	let actualStart: Date | null = null;
	let actualEnd: Date | null = null;
	let allFinished = tickets.every((t) => t.status === "FINISHED");

	for (const t of tickets) {
		if (t.plan_start_at < planStart) planStart = t.plan_start_at;
		if (t.plan_end_at > planEnd) planEnd = t.plan_end_at;

		const start = t.actual_start_at ?? t.plan_start_at;
		if (!actualStart || start < actualStart) actualStart = start;

		if (t.actual_end_at && (!actualEnd || t.actual_end_at > actualEnd)) {
			actualEnd = t.actual_end_at;
		}
	}

	return {
		plan_start_at: planStart,
		plan_end_at: planEnd,
		actual_start_at: actualStart,
		actual_end_at: allFinished ? actualEnd : null,
	};
}

/**
 * Roll child Workflows up into a Module boundary. A Module's dates come
 * from its workflows' rolled-up dates; actualEnd additionally requires
 * every workflow to be finished (all tickets finished).
 */
export function rollupModuleDates(
	workflows: {
		plan_start_at: Date | null;
		plan_end_at: Date | null;
		actual_start_at: Date | null;
		actual_end_at: Date | null;
	}[],
): RolledUpDates {
	const withPlan = workflows.filter((w) => w.plan_start_at && w.plan_end_at);
	if (withPlan.length === 0) {
		return {
			plan_start_at: null,
			plan_end_at: null,
			actual_start_at: null,
			actual_end_at: null,
		};
	}

	const planStart = withPlan.reduce<Date>(
		(acc, w) => (w.plan_start_at! < acc ? w.plan_start_at! : acc),
		withPlan[0].plan_start_at!,
	);
	const planEnd = withPlan.reduce<Date>(
		(acc, w) => (w.plan_end_at! > acc ? w.plan_end_at! : acc),
		withPlan[0].plan_end_at!,
	);

	const actualStarts = workflows
		.map((w) => w.actual_start_at)
		.filter((v): v is Date => v !== null);
	const actualEnds = workflows
		.map((w) => w.actual_end_at)
		.filter((v): v is Date => v !== null);

	const allWorkflowsFinished =
		workflows.length > 0 &&
		workflows.every(
			(w) => w.actual_end_at !== null,
		);

	return {
		plan_start_at: planStart,
		plan_end_at: planEnd,
		actual_start_at:
			actualStarts.length > 0
				? new Date(Math.min(...actualStarts.map((d) => d.getTime())))
				: null,
		actual_end_at:
			allWorkflowsFinished && actualEnds.length > 0
				? new Date(Math.max(...actualEnds.map((d) => d.getTime())))
				: null,
	};
}

/**
 * Execute the workflow + module rollup for the workflow a ticket belongs
 * to. Must be called inside the caller's Prisma transaction so the parent
 * boundaries update atomically with the ticket write.
 */
export async function rollupTicketAncestors(
	tx: Prisma.TransactionClient,
	workflowId: string,
): Promise<void> {
	// Roll the workflow from its tickets.
	const tickets = await tx.tickets.findMany({
		where: { workflow_id: workflowId, is_deleted: false },
		select: {
			plan_start_at: true,
			plan_end_at: true,
			actual_start_at: true,
			actual_end_at: true,
			status: true,
		},
	});
	const wfDates = rollupWorkflowDates(tickets);

	await tx.workflows.update({
		where: { workflow_id: workflowId },
		data: {
			plan_start_at: wfDates.plan_start_at ?? undefined,
			plan_end_at: wfDates.plan_end_at ?? undefined,
			actual_start_at: wfDates.actual_start_at ?? undefined,
			actual_end_at: wfDates.actual_end_at ?? undefined,
		},
	});

	// Roll the parent module from its workflows.
	const workflow = await tx.workflows.findUnique({
		where: { workflow_id: workflowId },
		select: { module_id: true },
	});
	if (!workflow?.module_id) return;

	const moduleWorkflows = await tx.workflows.findMany({
		where: { module_id: workflow.module_id, is_deleted: false },
		select: {
			plan_start_at: true,
			plan_end_at: true,
			actual_start_at: true,
			actual_end_at: true,
		},
	});
	const modDates = rollupModuleDates(moduleWorkflows);

	await tx.modules.update({
		where: { module_id: workflow.module_id },
		data: {
			plan_start_at: modDates.plan_start_at ?? undefined,
			plan_end_at: modDates.plan_end_at ?? undefined,
			actual_start_at: modDates.actual_start_at ?? undefined,
			actual_end_at: modDates.actual_end_at ?? undefined,
		},
	});
}
