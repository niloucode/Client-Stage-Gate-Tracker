"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
	getCurrentUserId,
	requireProjectMember,
	requireProjectOwner,
} from "@/lib/auth/projectAccess";
import { resolveDashboardRole } from "./dashboardRole";

/**
 * The caller's own role assignment for a project, or null. Scoped to the
 * caller's profile id — no other profile can be looked up.
 */
export async function getRoleAssignmentByProfileProjectId(
	profileId: string,
	projectId: string,
) {
	const userId = await getCurrentUserId();
	if (!userId) return null;

	z.uuid().parse(profileId);
	z.uuid().parse(projectId);

	if (profileId !== userId) return null;
	if (!(await requireProjectMember(projectId, userId))) return null;

	return prisma.roleAssignments.findFirst({
		where: {
			user_id: profileId,
			project_id: projectId,
		},
		select: {
			role_id: true,
			user_id: true,
			project_id: true,
			Profile: {
				select: {
					profile_id: true,
					first_name: true,
					last_name: true,
					email: true,
				},
			},
			Roles: { select: { role_id: true, name: true } },
		},
	});
}

/**
 * The project's Client Viewer assignment (or null). Requires membership —
 * the client's own profile data must not leak to non-members.
 */
export async function getClientByProjectId(projectId: string) {
	const userId = await getCurrentUserId();
	if (!userId) return null;

	z.uuid().parse(projectId);
	if (!(await requireProjectMember(projectId, userId))) return null;

	return prisma.roleAssignments.findFirst({
		where: {
			project_id: projectId,
			Roles: { name: "Client Viewer" },
			Profile: { is_deleted: false },
		},
		select: {
			role_id: true,
			user_id: true,
			project_id: true,
			Profile: {
				select: {
					profile_id: true,
					first_name: true,
					last_name: true,
					email: true,
				},
			},
			Roles: { select: { role_id: true, name: true } },
		},
	});
}

/**
 * The project's Project Owner assignment (or null). Requires membership.
 */
export async function getProjectOwnerByProjectId(projectId: string) {
	const userId = await getCurrentUserId();
	if (!userId) return null;

	z.uuid().parse(projectId);
	if (!(await requireProjectMember(projectId, userId))) return null;

	return prisma.roleAssignments.findFirst({
		where: {
			project_id: projectId,
			Roles: { name: "Project Owner" },
			Profile: { is_deleted: false },
		},
		select: {
			role_id: true,
			user_id: true,
			project_id: true,
			Profile: {
				select: {
					profile_id: true,
					first_name: true,
					last_name: true,
					email: true,
				},
			},
			Roles: { select: { role_id: true, name: true } },
		},
	});
}

/** Resolves the "Client Viewer" role id, or null when the role is missing. */
async function getClientViewerRoleId() {
	const clientRole = await prisma.roles.findFirst({
		where: { name: "Client Viewer" },
		select: { role_id: true },
	});
	return clientRole?.role_id ?? null;
}

/**
 * Grants the Client Viewer role on a project. Owner-only: assigning roles
 * is a privilege escalation and must not be callable by non-owners.
 */
export async function createClientRoleAssignment(
	profileId: string,
	projectId: string,
) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		z.uuid().parse(profileId);
		z.uuid().parse(projectId);

		if (!(await requireProjectOwner(projectId, userId))) {
			return {
				success: false,
				error: "Only the Project Owner can manage client signatories.",
			};
		}

		const clientRoleId = await getClientViewerRoleId();
		if (!clientRoleId) {
			return { success: false, error: "Client Viewer role not found." };
		}

		await prisma.roleAssignments.create({
			data: {
				role_id: clientRoleId,
				user_id: profileId,
				project_id: projectId,
			},
		});
		return { success: true };
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			return {
				success: false,
				error: "This profile is already a client signatory.",
			};
		}
		console.error("Failed to assign client role:", error);
		return { success: false, error: "Failed to assign client role." };
	}
}

/**
 * Revokes the Client Viewer role on a project. Owner-only.
 */
export async function deleteClientRoleAssignment(
	profileId: string,
	projectId: string,
) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		z.uuid().parse(profileId);
		z.uuid().parse(projectId);

		if (!(await requireProjectOwner(projectId, userId))) {
			return {
				success: false,
				error: "Only the Project Owner can manage client signatories.",
			};
		}

		const clientRoleId = await getClientViewerRoleId();
		if (!clientRoleId) {
			return { success: false, error: "Client Viewer role not found." };
		}

		await prisma.roleAssignments.delete({
			where: {
				role_id_user_id_project_id: {
					role_id: clientRoleId,
					user_id: profileId,
					project_id: projectId,
				},
			},
		});
		return { success: true };
	} catch (error) {
		console.error("Failed to revoke client role:", error);
		return { success: false, error: "Failed to revoke client role." };
	}
}

const PROJECT_OWNER_ROLE = "Project Owner";

/**
 * The signed-in user's landing-dashboard view: "client" (Profiles.client_id
 * set), "owner" (Project Owner on any project), or "staff". Unauthenticated
 * and archived users resolve to "staff" — the app shell guards the route.
 */
export async function getMyDashboardRole() {
	const userId = await getCurrentUserId();
	if (!userId) return "staff" as const;

	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId, is_deleted: false },
		select: { client_id: true },
	});
	if (!profile) return "staff" as const;

	const ownerRole = await prisma.roles.findUnique({
		where: { name: PROJECT_OWNER_ROLE },
		select: { role_id: true },
	});
	if (!ownerRole) return "staff" as const;

	const assignment = await prisma.roleAssignments.findFirst({
		where: { user_id: userId, role_id: ownerRole.role_id },
		select: { project_id: true },
	});

	return resolveDashboardRole({
		clientId: profile.client_id,
		ownerProjectIds: assignment ? [assignment.project_id] : [],
	});
}
