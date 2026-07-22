"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
	projectCreateSchema,
	projectUpdateSchema,
	type ProjectCreateInput,
	type ProjectUpdateInput,
} from "@/shared/schemas";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireProjectMember(projectId: string, userId: string): Promise<boolean> {
	const assignment = await prisma.roleAssignments.findFirst({
		where: { project_id: projectId, user_id: userId },
	});
	return !!assignment;
}

async function requireProjectOwner(projectId: string, userId: string): Promise<boolean> {
	const ownerRole = await prisma.roles.findUnique({
		where: { name: "Project Owner" },
		select: { role_id: true },
	});
	if (!ownerRole) return false;
	const assignment = await prisma.roleAssignments.findFirst({
		where: { project_id: projectId, user_id: userId, role_id: ownerRole.role_id },
	});
	return !!assignment;
}

async function getCurrentUserId(): Promise<string | null> {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return null;
		return user.id;
	} catch {
		return null;
	}
}

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
	status: ProjectStatus;
	project_status: ProjectStatus;
	client_name: string | null;
	client_id: string | null;
}

/**
 * Fetches all non-deleted projects, ordered by name.
 */
export async function selectProjects() {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return [];

		return await prisma.projects.findMany({
			where: { is_deleted: false },
			orderBy: { name: "asc" },
		});
	} catch (error) {
		console.error("Failed to fetch projects:", error);
		return [];
	}
}

/**
 * Fetches projects owned by the current user with computed status.
 *
 * Reads the existing Projects.status column, computes the correct status
 * from Contracts + Stages data, and updates the DB if they differ.
 *
 * Status rules:
 * - PENDING:   project exists but the associated contract is not fully signed
 * - ACTIVE:    contract fully signed, but not all stages are finished
 * - COMPLETED: contract fully signed AND all stages are finished
 */
export async function selectProjectsByOwner(): Promise<ProjectWithStatus[]> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return [];

		const ownerRole = await prisma.roles.findUnique({
			where: { name: "Project Owner" },
			select: { role_id: true },
		});
		if (!ownerRole) return [];

		// Fetch project IDs where this user is Project Owner
		const assignments = await prisma.roleAssignments.findMany({
			where: {
				user_id: user.id,
				role_id: ownerRole.role_id,
				Projects: { is_deleted: false },
			},
			select: { project_id: true },
		});

		if (assignments.length === 0) return [];

		const projectIds = assignments.map((a) => a.project_id);

		// Fetch all owned projects (includes existing status column)
		const projects = await prisma.projects.findMany({
			where: { project_id: { in: projectIds }, is_deleted: false },
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
			_count: { finish_date: true, stage_id: true },
		});

		const stageStats = new Map<
			string,
			{ finished: number; total: number }
		>();
		for (const s of stageCounts) {
			stageStats.set(s.project_id, {
				finished: s._count.finish_date,
				total: s._count.stage_id,
			});
		}

		const contractMap = new Map(contracts.map((c) => [c.project_id, c]));

		const results: ProjectWithStatus[] = [];

		for (const p of projects) {
			const contract = contractMap.get(p.project_id);
			const stagesOfProject = stageStats.get(p.project_id);

			const contractSigned =
				!!contract?.client_signature &&
				!!contract?.project_owner_signature;

			const totalStages = stagesOfProject?.total ?? 0;
			const finishedStages = stagesOfProject?.finished ?? 0;
			const hasStages = totalStages > 0;
			const allStagesFinished = hasStages && finishedStages === totalStages;

			// Compute expected status
			let computedStatus: ProjectStatus = "PENDING";
			if (contractSigned && allStagesFinished) {
				computedStatus = "COMPLETED";
			} else if (contractSigned) {
				computedStatus = "ACTIVE";
			}

			// Sync the DB if stored status differs from computed
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
				start_date: p.start_date,
				finish_date: p.finish_date,
				deadline_date: p.deadline_date,
				is_deleted: p.is_deleted,
				deleted_at: p.deleted_at,
				status: computedStatus,
				project_status: computedStatus,
				client_name: contract?.Clients?.client_name ?? null,
				client_id: contract?.client_id ?? null,
			});
		}

		return results;
	} catch (error) {
		console.error("Failed to fetch owned projects:", error);
		return [];
	}
}

/**
 * Fetches a single project by its ID.
 */
export async function getProjectById(projectId: string) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return null;

		return await prisma.projects.findUnique({
			where: { project_id: projectId },
		});
	} catch (error) {
		console.error("Failed to fetch project:", error);
		return null;
	}
}

/**
 * Creates a new project and assigns the current user as "Project Owner".
 * The user ID is obtained from the server-side Supabase session.
 */
export async function createProject(data: ProjectCreateInput) {
	projectCreateSchema.parse(data);

	try {
		// Get the current user from the server session
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return { success: false, error: "You must be logged in to create a project." };
		}

		// Look up the Profile ID for this auth user
		const profile = await prisma.profiles.findUnique({
			where: { profile_id: user.id },
			select: { profile_id: true },
		});
		if (!profile) {
			return { success: false, error: "Profile not found." };
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
					start_date: data.start_date ?? null,
					deadline_date: data.deadline_date ?? null,
				},
			});

			// Assign the creator as Project Owner
			await tx.roleAssignments.create({
				data: {
					role_id: ownerRole.role_id,
					user_id: profile.profile_id,
					project_id: project.project_id,
				},
			});

			// If a client was selected, create a contract and assign client profiles
			if (data.client_id && clientViewerRole) {
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

				// Assign each client profile the "Client Viewer" role
				for (const cp of clientProfiles) {
					await tx.roleAssignments.create({
						data: {
							role_id: clientViewerRole.role_id,
							user_id: cp.profile_id,
							project_id: project.project_id,
						},
					}).catch((err) => {
						// Ignore unique constraint violations (duplicate assignments); log others
						if ((err as { code?: string })?.code !== "P2002") {
							console.warn("Failed to assign client profile to project:", err);
						}
						// Ignore unique constraint errors (duplicate assignments)
					});
				}
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

		const isMember = await requireProjectMember(data.project_id, userId);
		if (!isMember) return { success: false, error: "You are not a member of this project." };

		const updateData: Record<string, unknown> = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.start_date !== undefined) updateData.start_date = data.start_date;
		if (data.deadline_date !== undefined) updateData.deadline_date = data.deadline_date;

		const updated = await prisma.projects.update({
			where: { project_id: data.project_id },
			data: updateData,
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
export async function softDeleteProject(projectId: string, confirmationName: string) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		const isOwner = await requireProjectOwner(projectId, userId);
		if (!isOwner) return { success: false, error: "Only the Project Owner can delete this project." };

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
	try {
		const userId = await getCurrentUserId();
		if (!userId) return [];

		const isMember = await requireProjectMember(projectId, userId);
		if (!isMember) return [];

		return await prisma.roleAssignments.findMany({
			where: { project_id: projectId },
			include: {
				Users: {
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
	} catch (error) {
		console.error("Failed to fetch project members:", error);
		return [];
	}
}

/**
 * Searches for profiles that can be added to a project.
 * Searches by first_name, last_name, or email, limited to 20 results.
 * Excludes soft-deleted profiles.
 */
export async function searchProfilesForProject(query: string) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return [];

		if (!query || query.trim().length < 1) return [];

		return await prisma.profiles.findMany({
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
	} catch (error) {
		console.error("Failed to search profiles:", error);
		return [];
	}
}

/**
 * Adds a profile to a project with the given role name.
 * Throws if the assignment already exists (unique constraint).
 */
export async function addProjectMember(projectId: string, profileId: string, roleName: string) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		const isOwner = await requireProjectOwner(projectId, userId);
		if (!isOwner) return { success: false, error: "Only the Project Owner can add members." };

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
			return { success: false, error: "This user is already a member of the project." };
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
export async function removeProjectMember(projectId: string, profileId: string) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		const isOwner = await requireProjectOwner(projectId, userId);
		if (!isOwner) return { success: false, error: "Only the Project Owner can remove members." };

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
