"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { EntityFilterStatus } from "@/entities/types";
import {
	assertProjectMember,
	resolveGateProject,
} from "@/lib/auth/projectAccess";

export async function getGateById(
	gateId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const gate = await prisma.gates.findUnique({
			where: {
				gate_id: gateId,
				is_deleted: isDeletedFilter,
			},
		});

		if (!gate) {
			return {
				success: false,
				error: "Gate not found or does not match the requested status.",
			};
		}
		return { success: true, data: gate };
	} catch (error) {
		console.error("Failed to fetch gate:", error);
		return { success: false, error: "Failed to fetch gate details." };
	}
}

/**
 * Rejects a gate (Task 3.3).
 *
 * Rejection semantics:
 *   - The gate's signature row is removed (a gate is approved by the
 *     presence of a GateSignatures row — REASONIX.md rule 5).
 *   - All active execution dates (`actual_start_at` / `actual_end_at`)
 *     are stripped from the project's Stages AND their child Phases, so
 *     rejected work no longer carries execution timelines.
 *
 * Runs inside a single transaction: signature removal + date resets
 * either all commit or all roll back.
 */
export async function rejectGate(gateId: string) {
	z.string().uuid().parse(gateId);

	// Authorization: caller must be a member of the gate's project
	const projectId = await resolveGateProject(gateId);
	if (!projectId) return { success: false, error: "Gate not found." };
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return { success: false, error: auth.error };

	try {
		await prisma.$transaction(async (tx) => {
			// Remove the approval signature — this IS the rejection.
			await tx.gateSignatures.deleteMany({
				where: { gate_id: gateId },
			});

			// Strip execution dates from all project stages.
			const stages = await tx.stages.findMany({
				where: { project_id: projectId, is_deleted: false },
				select: { stage_id: true },
			});
			const stageIds = stages.map((s) => s.stage_id);

			if (stageIds.length > 0) {
				await tx.stages.updateMany({
					where: { stage_id: { in: stageIds } },
					data: {
						actual_start_at: null,
						actual_end_at: null,
					},
				});

				// And their child phases.
				await tx.phases.updateMany({
					where: { stage_id: { in: stageIds }, is_deleted: false },
					data: {
						actual_start_at: null,
						actual_end_at: null,
					},
				});
			}
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to reject gate:", error);
		return { success: false, error: "Failed to reject the gate." };
	}
}
