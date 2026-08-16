"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
	getCurrentUserId,
	requireProjectMember,
} from "@/lib/auth/projectAccess";
import { resolveDashboardRole } from "./dashboardRole";

/**
 * The caller's own role assignment for a project, or null. Scoped to the
 * caller's profile id — no other profile can be looked up.
 */
/**
 * The project's Client Viewer assignment (or null). Requires membership —
 * the client's own profile data must not leak to non-members.
 */
/**
 * The project's Project Owner assignment (or null). Requires membership.
 * @returns The owner profile, or null.
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

/**
 * Grants the Client Viewer role on a project. Owner-only: assigning roles
 * is a privilege escalation and must not be callable by non-owners.
 */
/**
 * Revokes the Client Viewer role on a project. Owner-only.
 */
const PROJECT_OWNER_ROLE = "Project Owner";

/**
 * The signed-in user's landing-dashboard view: "client" (Profiles.client_id
 * set), "owner" (Project Owner on any project), or "staff". Unauthenticated
 * and archived users resolve to "staff" — the app shell guards the route.
 * @returns The caller's dashboard role.
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
