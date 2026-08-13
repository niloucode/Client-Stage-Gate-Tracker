"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import {
	projectCreateSchema,
	projectUpdateSchema,
	type ProjectCreateInput,
	type ProjectUpdateInput,
} from "@/shared/schemas";

import {
	getCurrentUserId,
	requireProjectMember,
	requireProjectOwner,
} from "@/lib/auth/projectAccess";
import { computeProjectStatus, isProjectOwnerRole } from "./projectStatus";

// ── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus = "PENDING" | "ACTIVE" | "COMPLETED";

export interface ProjectWithStatus {
	project_id: string;
	name: string;
	description: string | null;
	start_date: Date | null;
	finish_date: Date | null;
	deadline_date: Date | null;
	is_deleted: boolean;
	deleted_at: Date | null;
	project_status: ProjectStatus;
	is_owner: boolean;
	client_name: string | null;
	client_id: string | null;
}

/**
 * Fetches all non-deleted projects, ordered by name.
 */
export async function selectProjects() {
	// No catch: a thrown error lets React Query retry and surface isError.
	const userId = await getCurrentUserId();
	if (!userId) return [];

	return prisma.projects.findMany({
		where: { is_deleted: false },
		orderBy: { name: "asc" },
		take: 200, // bound the list; paginate when callers need more
	});
}

/**
 * Fetches projects the current user is a member of (any role), with
 * per-project `is_owner` and computed status.
 *
 * Reads the existing Projects.status column, computes the correct status
 * from Contracts + Stages data, and updates the DB if they differ.
 *
 * Status rules (see computeProjectStatus):
 * - PENDING:   project exists but the associated contract is not fully signed
 * - ACTIVE:    contract fully signed, but not all stages are finished
 * - COMPLETED: contract fully signed AND all stages are finished
 */
export async function selectProjectsForMember(): Promise<ProjectWithStatus[]> {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return [];

		// Fetch every project the user belongs to (owner, team, or client
		// viewer) together with the role name for the is_owner flag.
		const assignments = await prisma.roleAssignments.findMany({
			where: { user_id: userId, Projects: { is_deleted: false } },
			select: {
				project_id: true,
				Roles: { select: { name: true } },
			},
		});

		if (assignments.length === 0) return [];

		const projectIds = assignments.map((a) => a.project_id);
		const roleByProject = new Map(
			assignments.map((a) => [a.project_id, a.Roles?.name ?? null]),
		);

		// Fetch all member projects (includes existing status column)
		const projects = await prisma.projects.findMany({
			where: { project_id: { in: projectIds }, is_deleted: false },
			take: 200, // bound the list; paginate when callers need more
		});

		// Fetch contracts for these projects
		const contracts = await prisma.contracts.findMany({
			where: { project_id: { in: projectIds }, is_deleted: false },
			select: {
				project_id: true,
				client_signature: true,
				project_owner_signature: true,
				client_id: true,
				Clients: { select: { client_name: true } },
			},
		});

		// Fetch stage completion per project
		const stageCounts = await prisma.stages.groupBy({
			by: ["project_id"],
			where: { project_id: { in: projectIds }, is_deleted: false },
			_count: { _all: true },
		});
		const finishedStageCounts = await prisma.stages.groupBy({
			by: ["project_id"],
			where: {
				project_id: { in: projectIds },
				is_deleted: false,
				actual_end_at: { not: null },
			},
			_count: { _all: true },
		});

		const stageStats = new Map<string, { finished: number; total: number }>();
		const finishedMap = new Map(
			finishedStageCounts.map((s) => [s.project_id, s._count?._all ?? 0]),
		);
		for (const s of stageCounts) {
			stageStats.set(s.project_id, {
				finished: finishedMap.get(s.project_id) ?? 0,
				total: s._count?._all ?? 0,
			});
		}

		const contractMap = new Map(contracts.map((c) => [c.project_id, c]));

		const results: ProjectWithStatus[] = [];

		for (const p of projects) {
			const contract = contractMap.get(p.project_id);
			const stagesOfProject = stageStats.get(p.project_id);

			const contractSigned =
				!!contract?.client_signature && !!contract?.project_owner_signature;

			const computedStatus = computeProjectStatus({
				contractSigned,
				totalStages: stagesOfProject?.total ?? 0,
				finishedStages: stagesOfProject?.finished ?? 0,
			});

			// Reconcile the stored status column when it drifted (idempotent:
			// only writes when different, so steady-state reads are read-only).
			// NOTE: a query with a write side-effect is an anti-pattern for
			// React Query — keep this reconciliation, but revisit if status
			// ever becomes a source for other reads.
			if ((p.status as ProjectStatus) !== computedStatus) {
				try {
					await prisma.projects.update({
						where: { project_id: p.project_id },
						data: { status: computedStatus },
					});
				} catch (e) {
					console.warn("Failed to sync project status:", e);
				}
			}

			results.push({
				project_id: p.project_id,
				name: p.name,
				description: p.description,
				start_date: p.plan_start_at,
				finish_date: p.actual_end_at,
				deadline_date: p.plan_end_at,
				is_deleted: p.is_deleted,
				deleted_at: p.deleted_at,
				project_status: computedStatus,
				is_owner: isProjectOwnerRole(roleByProject.get(p.project_id)),
				client_name: contract?.Clients?.client_name ?? null,
				client_id: contract?.client_id ?? null,
			});
		}

		return results;
	} catch (error) {
		console.error("Failed to fetch member projects:", error);
		return [];
	}
}

/**
 * Fetches a single project by its ID.
 */
export async function getProjectById(projectId: string) {
	const userId = await getCurrentUserId();
	if (!userId) return null;

	return prisma.projects.findUnique({
		where: { project_id: projectId, is_deleted: false },
	});
}

/**
 * Creates a new project and assigns the current user as "Project Owner".
 * The user ID is obtained from the server-side Supabase session.
 */
export async function createProject(data: ProjectCreateInput) {
	try {
		projectCreateSchema.parse(data);

		// The session user id IS the profile id (auth.users <-> Profiles 1:1 bridge).
		const userId = await getCurrentUserId();
		if (!userId) {
			return {
				success: false,
				error: "You must be logged in to create a project.",
			};
		}

		// Look up the "Project Owner" role
		const ownerRole = await prisma.roles.findUnique({
			where: { name: "Project Owner" },
			select: { role_id: true },
		});
		if (!ownerRole) {
			return { success: false, error: "Project Owner role not found." };
		}

		const clientViewerRole = await prisma.roles.findUnique({
			where: { name: "Client Viewer" },
			select: { role_id: true },
		});

		const newProject = await prisma.$transaction(async (tx) => {
			const project = await tx.projects.create({
				data: {
					name: data.name,
					description: data.description ?? null,
					// plan dates are Zod-required (non-nullable) — never
					// fall back to new Date() to fill the requirement.
					plan_start_at: data.start_date,
					plan_end_at: data.deadline_date,
				},
			});

			// Assign the creator as Project Owner
			await tx.roleAssignments.create({
				data: {
					role_id: ownerRole.role_id,
					user_id: userId,
					project_id: project.project_id,
				},
			});

			// A project always has a client (Contracts.client_id NOT NULL —
			// REASONIX invariant): create the contract unconditionally.
			await tx.contracts.create({
				data: {
					project_id: project.project_id,
					client_id: data.client_id,
				},
			});

			// Find all profiles connected to this client
			const clientProfiles = await tx.profiles.findMany({
				where: { client_id: data.client_id, is_deleted: false },
				select: { profile_id: true },
			});

			// Assign each client profile the "Client Viewer" role — one
			// batched insert, duplicates silently skipped.
			if (clientProfiles.length > 0 && clientViewerRole) {
				await tx.roleAssignments.createMany({
					data: clientProfiles.map((cp) => ({
						role_id: clientViewerRole.role_id,
						user_id: cp.profile_id,
						project_id: project.project_id,
					})),
					skipDuplicates: true,
				});
			}

			return project;
		});

		return { success: true, data: newProject };
	} catch (error) {
		console.error("Failed to create project:", error);
		return { success: false, error: "Failed to create project." };
	}
}

/**
 * Updates an existing project's details.
 * Only fields that are provided in the input will be updated.
 */
export async function updateProject(data: ProjectUpdateInput) {
	projectUpdateSchema.parse(data);

	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		// Editing project details is owner-only (matches the UI: the
		// ellipsis menu is rendered solely for Project Owners).
		const isOwner = await requireProjectOwner(data.project_id, userId);
		if (!isOwner)
			return {
				success: false,
				error: "Only the Project Owner can edit this project.",
			};

		const updateData: Prisma.ProjectsUpdateInput = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined)
			updateData.description = data.description;
		// plan_start_at/plan_end_at are NOT NULL; update dates are
		// non-nullable in the schema, so only absent (undefined) means
		// "leave unchanged" — never send null to the DB.
		if (data.start_date !== undefined)
			updateData.plan_start_at = data.start_date;
		if (data.deadline_date !== undefined)
			updateData.plan_end_at = data.deadline_date;

		// The client linkage lives on the Contracts row (NOT NULL invariant);
		// update it atomically with the project fields.
		const updated = await prisma.$transaction(async (tx) => {
			const project = await tx.projects.update({
				where: { project_id: data.project_id },
				data: updateData,
			});

			if (data.client_id !== undefined) {
				await tx.contracts.update({
					where: { project_id: data.project_id },
					data: { client_id: data.client_id },
				});
			}

			return project;
		});

		return { success: true, data: updated };
	} catch (error) {
		console.error("Failed to update project:", error);
		return { success: false, error: "Failed to update project." };
	}
}

/**
 * Soft-deletes a project after verifying the confirmation name matches
 * the project's current name.
 */
export async function softDeleteProject(
	projectId: string,
	confirmationName: string,
) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		const isOwner = await requireProjectOwner(projectId, userId);
		if (!isOwner)
			return {
				success: false,
				error: "Only the Project Owner can delete this project.",
			};

		const project = await prisma.projects.findUnique({
			where: { project_id: projectId },
			select: { name: true },
		});

		if (!project) {
			return { success: false, error: "Project not found." };
		}

		if (confirmationName !== project.name) {
			return { success: false, error: "Project name does not match." };
		}

		await prisma.projects.update({
			where: { project_id: projectId },
			data: {
				is_deleted: true,
				deleted_at: new Date(),
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to delete project:", error);
		return { success: false, error: "Failed to delete project." };
	}
}

/**
 * Fetches all members of a project, including their profile and role info.
 */
export async function getProjectMembers(projectId: string) {
	const userId = await getCurrentUserId();
	if (!userId) return [];

	const isMember = await requireProjectMember(projectId, userId);
	if (!isMember) return [];

	return prisma.roleAssignments.findMany({
		where: { project_id: projectId },
		include: {
			Profile: {
				select: {
					profile_id: true,
					first_name: true,
					last_name: true,
					email: true,
					client_id: true,
					department_id: true,
					Department: { select: { name: true } },
				},
			},
			Roles: {
				select: { role_id: true, name: true },
			},
		},
	});
}

/**
 * Searches for profiles that can be added to a project.
 * Searches by first_name, last_name, or email, limited to 20 results.
 * Excludes soft-deleted profiles.
 */
export async function searchProfilesForProject(query: string) {
	const userId = await getCurrentUserId();
	if (!userId) return [];

	if (!query || query.trim().length < 1) return [];

	return prisma.profiles.findMany({
		where: {
			is_deleted: false,
			OR: [
				{ first_name: { contains: query, mode: "insensitive" } },
				{ last_name: { contains: query, mode: "insensitive" } },
				{ email: { contains: query, mode: "insensitive" } },
			],
		},
		select: {
			profile_id: true,
			first_name: true,
			last_name: true,
			email: true,
			client_id: true,
			department_id: true,
			Department: { select: { name: true } },
		},
		take: 20,
	});
}

/**
 * Adds a profile to a project with the given role name.
 * Throws if the assignment already exists (unique constraint).
 */
export async function addProjectMember(
	projectId: string,
	profileId: string,
	roleName: string,
) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		const isOwner = await requireProjectOwner(projectId, userId);
		if (!isOwner)
			return {
				success: false,
				error: "Only the Project Owner can add members.",
			};

		// Look up the role
		const role = await prisma.roles.findUnique({
			where: { name: roleName },
			select: { role_id: true },
		});

		if (!role) {
			return { success: false, error: `Role "${roleName}" not found.` };
		}

		// Check for duplicate
		const existing = await prisma.roleAssignments.findUnique({
			where: {
				role_id_user_id_project_id: {
					role_id: role.role_id,
					user_id: profileId,
					project_id: projectId,
				},
			},
		});

		if (existing) {
			return {
				success: false,
				error: "This user is already a member of the project.",
			};
		}

		await prisma.roleAssignments.create({
			data: {
				role_id: role.role_id,
				user_id: profileId,
				project_id: projectId,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to add project member:", error);
		return { success: false, error: "Failed to add member to project." };
	}
}

/**
 * Removes a profile from a project by deleting the RoleAssignments row.
 * Prevents removing the last remaining Project Owner.
 */
export async function removeProjectMember(
	projectId: string,
	profileId: string,
) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		const isOwner = await requireProjectOwner(projectId, userId);
		if (!isOwner)
			return {
				success: false,
				error: "Only the Project Owner can remove members.",
			};

		// Check if this user is a Project Owner
		const ownerRole = await prisma.roles.findUnique({
			where: { name: "Project Owner" },
			select: { role_id: true },
		});

		if (ownerRole) {
			const targetAssignment = await prisma.roleAssignments.findFirst({
				where: {
					project_id: projectId,
					user_id: profileId,
					role_id: ownerRole.role_id,
				},
			});

			if (targetAssignment) {
				// Count remaining owners
				const ownerCount = await prisma.roleAssignments.count({
					where: {
						project_id: projectId,
						role_id: ownerRole.role_id,
					},
				});

				if (ownerCount <= 1) {
					return {
						success: false,
						error: "Cannot remove the last Project Owner from the project.",
					};
				}
			}
		}

		await prisma.roleAssignments.deleteMany({
			where: {
				project_id: projectId,
				user_id: profileId,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to remove project member:", error);
		return { success: false, error: "Failed to remove member from project." };
	}
}
