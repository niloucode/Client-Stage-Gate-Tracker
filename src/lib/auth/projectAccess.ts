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

/**
 * Project-membership check that ALSO rejects client profiles (spec 5: the
 * project team and project owners may edit project structure; clients are
 * read-only — their profile links to the project through the contract, not
 * through an editable role). Use for mutating project-structure actions.
 */
export async function assertProjectMemberNotClient(
	projectId: string,
): Promise<AuthResult> {
	const base = await assertProjectMember(projectId);
	if (!base.ok) return base;

	const profile = await prisma.profiles.findUnique({
		where: { profile_id: base.userId },
		select: { client_id: true },
	});
	// Fail closed: an unverifiable profile (missing row) or a client-linked
	// profile gets no mutation rights (security review 2026-08-14).
	if (!profile) {
		return { ok: false, error: "Profile not found." };
	}
	if (profile.client_id) {
		return {
			ok: false,
			error: "Clients cannot modify the project structure.",
		};
	}
	return base;
}

/**
 * Project-access check that ALSO accepts client profiles (issue-reporting
 * spec 2026-08-15: both clients and project team/owners may report issues).
 * Clients are linked to a project through their contract, not through
 * roleAssignments, so the plain member check alone would reject them.
 */
export async function assertProjectMemberOrClient(
	projectId: string,
): Promise<AuthResult> {
	const userId = await getCurrentUserId();
	if (!userId) return { ok: false, error: "Authentication required." };

	const isMember = await requireProjectMember(projectId, userId);
	if (isMember) return { ok: true, userId };

	// Not a role-assigned member — allow if this profile is the project's client.
	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId },
		select: { client_id: true },
	});
	if (!profile?.client_id) {
		return {
			ok: false,
			error: "You are not a member of this project.",
		};
	}
	const contract = await prisma.contracts.findFirst({
		where: { project_id: projectId, client_id: profile.client_id, is_deleted: false },
		select: { contract_id: true },
	});
	if (!contract) {
		return {
			ok: false,
			error: "You are not a member of this project.",
		};
	}
	return { ok: true, userId };
}

/**
 * Client-only project gate (gate-overview spec 2026-08-15): ONLY the client
 * connected to the project (via a non-deleted contract) may approve or
 * decline stage gates. Role-assigned staff are explicitly rejected.
 */
export async function assertProjectClient(
	projectId: string,
): Promise<AuthResult> {
	const userId = await getCurrentUserId();
	if (!userId) return { ok: false, error: "Authentication required." };

	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId },
		select: { client_id: true },
	});
	if (!profile?.client_id) {
		return {
			ok: false,
			error: "Only the project's client can approve or decline stage gates.",
		};
	}
	const contract = await prisma.contracts.findFirst({
		where: { project_id: projectId, client_id: profile.client_id, is_deleted: false },
		select: { contract_id: true },
	});
	if (!contract) {
		return {
			ok: false,
			error: "Only the project's client can approve or decline stage gates.",
		};
	}
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
	// NOT NULL since the 2026-08-14 Supabase edit (gates undeletable).
	return gate?.Stages?.project_id ?? null;
}
