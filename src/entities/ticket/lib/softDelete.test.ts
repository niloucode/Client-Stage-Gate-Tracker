import { describe, expect, it, vi } from "vitest";
import { softDeleteWorkflowSubtree } from "./softDelete";

function makeTx() {
	return {
		workflows: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
		tickets: {
			findMany: vi
				.fn()
				.mockResolvedValue([{ ticket_id: "t1" }, { ticket_id: "t2" }]),
			updateMany: vi.fn().mockResolvedValue({ count: 0 }),
		},
	};
}

describe("softDeleteWorkflowSubtree", () => {
	it("is a no-op for an empty workflow list", async () => {
		const tx = makeTx();
		await softDeleteWorkflowSubtree(tx as never, []);
		expect(tx.workflows.updateMany).not.toHaveBeenCalled();
		expect(tx.tickets.findMany).not.toHaveBeenCalled();
		expect(tx.tickets.updateMany).not.toHaveBeenCalled();
	});

	it("soft-deletes the workflows and every ticket under them", async () => {
		const tx = makeTx();
		await softDeleteWorkflowSubtree(tx as never, ["w1", "w2"]);

		expect(tx.workflows.updateMany).toHaveBeenCalledWith({
			where: { workflow_id: { in: ["w1", "w2"] } },
			data: { is_deleted: true, deleted_at: expect.any(Date) },
		});
		expect(tx.tickets.findMany).toHaveBeenCalledWith({
			where: { workflow_id: { in: ["w1", "w2"] }, is_deleted: false },
			select: { ticket_id: true },
		});
		expect(tx.tickets.updateMany).toHaveBeenCalledWith({
			where: { ticket_id: { in: ["t1", "t2"] } },
			data: { is_deleted: true, deleted_at: expect.any(Date) },
		});
	});

	it("skips the ticket update when the workflows have no tickets", async () => {
		const tx = makeTx();
		tx.tickets.findMany.mockResolvedValue([]);
		await softDeleteWorkflowSubtree(tx as never, ["w1"]);
		expect(tx.tickets.updateMany).not.toHaveBeenCalled();
	});
});
