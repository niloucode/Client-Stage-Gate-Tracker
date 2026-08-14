import type { Prisma } from "@/lib/generated/prisma";

/**
 * Soft-delete a workflow subtree: the workflows themselves and every ticket
 * under them (batch updateMany per level). Shared by the stage / phase /
 * module cascade-soft-delete actions — the same block was previously
 * copy-pasted in each cascade (WebStorm duplicate-fragment finding,
 * 2026-08-14).
 *
 * Must be called inside the caller's Prisma transaction.
 */
export async function softDeleteWorkflowSubtree(
	tx: Prisma.TransactionClient,
	workflowIds: string[],
): Promise<void> {
	if (workflowIds.length === 0) return;

	await tx.workflows.updateMany({
		where: { workflow_id: { in: workflowIds } },
		data: { is_deleted: true, deleted_at: new Date() },
	});

	const childTickets = await tx.tickets.findMany({
		where: { workflow_id: { in: workflowIds }, is_deleted: false },
		select: { ticket_id: true },
	});
	const ticketIds = childTickets.map((t) => t.ticket_id);

	if (ticketIds.length > 0) {
		await tx.tickets.updateMany({
			where: { ticket_id: { in: ticketIds } },
			data: { is_deleted: true, deleted_at: new Date() },
		});
	}
}
