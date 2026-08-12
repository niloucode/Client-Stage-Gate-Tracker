import "server-only";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

/**
 * Shared authorization helpers for server actions.
 *
 * Every mutating entity action must resolve its parent project and call
 * `assertProjectMember(projectId)` before touching the database. Reads that
 * return project data to the UI are filtered by membership upstream
 * (`selectProjects`), so the guard here targets mutations.
 */

// React `cache()` dedupes per request: the Supabase auth round trip happens
// once per request instead of once per entity action call.
export const getCurrentUserId = cache(async (): Promise<string | null> => {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return null;
		return user.id;
	} catch (error) {
		console.error("getCurrentUserId error:", error);
		return null;
	}
});

export async function requireProjectMember(
	projectId: string,
	userId: string,
): Promise<boolean> {
	const assignment = await prisma.roleAssignments.findFirst({
		where: { project_id: projectId, user_id: userId },
	});
	return !!assignment;
}

const PROJECT_OWNER_ROLE = "Project Owner";

export async function requireProjectOwner(
	projectId: string,
	userId: string,
): Promise<boolean> {
	const ownerRole = await prisma.roles.findUnique({
		where: { name: PROJECT_OWNER_ROLE },
		select: { role_id: true },
	});
	if (!ownerRole) return false;
	const assignment = await prisma.roleAssignments.findFirst({
		where: {
			project_id: projectId,
			user_id: userId,
			role_id: ownerRole.role_id,
		},
	});
	return !!assignment;
}

type AuthResult = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Verifies the current session user is a member of the project.
 * Returns `{ ok: true, userId }` on success, or a user-facing error.
 */
export async function assertProjectMember(
	projectId: string,
): Promise<AuthResult> {
	const userId = await getCurrentUserId();
	if (!userId) return { ok: false, error: "Authentication required." };
	const isMember = await requireProjectMember(projectId, userId);
	if (!isMember)
		return {
			ok: false,
			error: "You are not a member of this project.",
		};
	return { ok: true, userId };
}

// ── project_id resolvers for child entities ─────────────────────────────────

export async function resolveStageProject(
	stageId: string,
): Promise<string | null> {
	const stage = await prisma.stages.findUnique({
		where: { stage_id: stageId },
		select: { project_id: true },
	});
	return stage?.project_id ?? null;
}

export async function resolvePhaseProject(
	phaseId: string,
): Promise<string | null> {
	const phase = await prisma.phases.findUnique({
		where: { phase_id: phaseId },
		select: { stage_id: true },
	});
	if (!phase) return null;
	return resolveStageProject(phase.stage_id);
}

export async function resolveModuleProject(
	moduleId: string,
): Promise<string | null> {
	const moduleRow = await prisma.modules.findUnique({
		where: { module_id: moduleId },
		select: { phase_id: true },
	});
	if (!moduleRow) return null;
	return resolvePhaseProject(moduleRow.phase_id);
}

export async function resolveWorkflowProject(
	workflowId: string,
): Promise<string | null> {
	const workflow = await prisma.workflows.findUnique({
		where: { workflow_id: workflowId },
		select: { module_id: true },
	});
	if (!workflow) return null;
	return resolveModuleProject(workflow.module_id);
}

export async function resolveTicketProject(
	ticketId: string,
): Promise<string | null> {
	const ticket = await prisma.tickets.findUnique({
		where: { ticket_id: ticketId },
		select: { workflow_id: true },
	});
	if (!ticket) return null;
	// workflow_id is NOT NULL (schema invariant), so no null guard needed.
	return resolveWorkflowProject(ticket.workflow_id);
}

export async function resolveGateProject(
	gateId: string,
): Promise<string | null> {
	const gate = await prisma.gates.findUnique({
		where: { gate_id: gateId },
		select: {
			Stages: { select: { project_id: true } },
		},
	});
	// Gates link to a Stage; the project resolves through it. stage_id is
	// nullable until legacy gates are re-mapped (migration 4 backfill note).
	return gate?.Stages?.project_id ?? null;
}
