"use server";

import { z } from "zod";
import {
	authActionClient,
	ActionError,
	ACTION_ERROR_CODES,
} from "@/lib/safe-action";
import {
	assertProjectMemberNotClient,
	resolvePhaseProject,
	resolveStageProject,
} from "@/lib/auth/projectAccess";
import { phaseCreateSchema, phaseUpdateSchema } from "@/shared/schemas";
import { cascadeSoftDeletePhase } from "./phaseActions";
import { prisma } from "@/lib/prisma";
import { generateKeyBetween } from "fractional-indexing";

/**
 * Pilot slice for the typed server-action pipeline (Task 1.7).
 *
 * Middleware chain guarantees, in order:
 *   1. `authActionClient` — the caller is signed in (cannot be skipped).
 *   2. `useValidated` — input is validated by Zod AND the caller is a
 *      member of the resolved parent project (authz cannot be skipped).
 *   3. Action body runs with typed, validated `parsedInput` + `ctx`.
 *
 * Failures surface as stable `ActionErrorCode` strings, never raw
 * exceptions.
 * @returns The result.
 */

/**
 * Resolves the parent project of a phase/ stage and asserts the caller is
 * a member — the same check for every phase action. Throws stable
 * ActionError codes (NOT_FOUND / FORBIDDEN) so the client never sees a
 * raw exception.
 * @param phaseId
 * @returns The result.
 */
async function requirePhaseMemberOrThrow(phaseId: string): Promise<string> {
	const projectId = await resolvePhaseProject(phaseId);
	if (!projectId) {
		throw new ActionError(ACTION_ERROR_CODES.NOT_FOUND, "Phase not found.");
	}
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) {
		throw new ActionError(ACTION_ERROR_CODES.FORBIDDEN, auth.error);
	}
	return projectId;
}

async function requireStageMemberOrThrow(stageId: string): Promise<string> {
	const projectId = await resolveStageProject(stageId);
	if (!projectId) {
		throw new ActionError(ACTION_ERROR_CODES.NOT_FOUND, "Stage not found.");
	}
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) {
		throw new ActionError(ACTION_ERROR_CODES.FORBIDDEN, auth.error);
	}
	return projectId;
}

const createPhaseInputSchema = phaseCreateSchema.extend({
	stageId: z.uuid(),
});

export const createPhaseAction = authActionClient
	.inputSchema(createPhaseInputSchema)
	.useValidated(async ({ parsedInput, ctx, next }) => {
		const projectId = await requireStageMemberOrThrow(parsedInput.stageId);
		return next({ ctx: { ...ctx, projectId } });
	})
	.action(async ({ parsedInput }) => {
		const lastPhase = await prisma.phases.findFirst({
			where: { stage_id: parsedInput.stageId, is_deleted: false },
			orderBy: { sort_key: { sort: "desc", nulls: "last" } },
			select: { sort_key: true },
		});
		const nextKey = generateKeyBetween(lastPhase?.sort_key ?? null, null);

		return prisma.phases.create({
			data: {
				name: parsedInput.name,
				description: parsedInput.description ?? null,
				sort_key: nextKey,
				// Date rules: plan dates required (schema-enforced) — no fallback
				plan_start_at: parsedInput.planStart,
				actual_end_at: parsedInput.actualEnd ?? null,
				actual_start_at: parsedInput.actualStart ?? null,
				plan_end_at: parsedInput.planEnd,
				stage_id: parsedInput.stageId,
			},
		});
	});

const updatePhaseInputSchema = phaseUpdateSchema.extend({
	phaseId: z.uuid(),
});

export const updatePhaseAction = authActionClient
	.inputSchema(updatePhaseInputSchema)
	.useValidated(async ({ parsedInput, ctx, next }) => {
		const projectId = await requirePhaseMemberOrThrow(parsedInput.phaseId);
		return next({ ctx: { ...ctx, projectId } });
	})
	.action(async ({ parsedInput }) =>
		prisma.phases.update({
			where: { phase_id: parsedInput.phaseId },
			data: {
				name: parsedInput.name ?? undefined,
				description: parsedInput.description ?? undefined,
				plan_start_at: parsedInput.planStart ?? undefined,
				actual_end_at: parsedInput.actualEnd ?? undefined,
				actual_start_at: parsedInput.actualStart ?? undefined,
				plan_end_at: parsedInput.planEnd ?? undefined,
			},
		}),
	);

const deletePhaseInputSchema = z.object({
	phaseId: z.uuid(),
});

export const deletePhaseAction = authActionClient
	.inputSchema(deletePhaseInputSchema)
	.useValidated(async ({ parsedInput, ctx, next }) => {
		const projectId = await requirePhaseMemberOrThrow(parsedInput.phaseId);
		return next({ ctx: { ...ctx, projectId } });
	})
	.action(async ({ parsedInput }) => {
		// Reuse the production cascade logic (blocks when active children
		// exist, soft-deletes the whole subtree in batch).
		const result = await cascadeSoftDeletePhase(parsedInput.phaseId);
		if (!result.success) {
			throw new ActionError(
				result.error?.startsWith("Cannot delete")
					? ACTION_ERROR_CODES.CONFLICT
					: ACTION_ERROR_CODES.INTERNAL,
				result.error ?? "Failed to delete phase.",
			);
		}
		return { phaseId: parsedInput.phaseId };
	});
