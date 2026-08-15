"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, assertProjectMember } from "@/lib/auth/projectAccess";
import type { Profiles } from "@/lib/generated/prisma";
import { hashInviteCode } from "@/shared/lib/inviteCode";
import type { EntityFilterStatus } from "@/entities/types";

/** Assignee-dropdown profile shape (what `selectProfile` returns). */
export type ProfileSelect = Awaited<ReturnType<typeof selectProfile>>[number];

export async function selectProfile() {
	// Assignee-dropdown shape only — never the full row (phone, job_title…).
	return prisma.profiles.findMany({
		where: { is_deleted: false },
		select: {
			profile_id: true,
			first_name: true,
			last_name: true,
			email: true,
		},
	});
}

/**
 * Profiles that can be ASSIGNED to tickets of a project: everyone with a
 * RoleAssignments row in the project (team + owners). Client profiles are
 * excluded (spec: clients are never assignable). Membership-guarded read.
 */
export async function selectProjectMembers(projectId: string) {
	z.uuid().parse(projectId);

	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return [];

	const rows = await prisma.roleAssignments.findMany({
		where: {
			project_id: projectId,
			Profile: { client_id: null, is_deleted: false },
		},
		select: {
			user_id: true,
			Profile: {
				select: {
					profile_id: true,
					first_name: true,
					last_name: true,
					email: true,
				},
			},
		},
		orderBy: { Profile: { first_name: "asc" } },
	});

	return rows
		.map((r) => r.Profile)
		.filter((p): p is NonNullable<typeof p> => p !== null);
}

export async function getProfileById(
	profileId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		z.uuid().parse(profileId);
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const profileData = await prisma.profiles.findUnique({
			where: {
				profile_id: profileId,
				is_deleted: isDeletedFilter,
			},
		});

		if (!profileData) {
			return {
				success: false,
				error: "Profile not found or does not match the requested status.",
			};
		}
		return { success: true, data: profileData };
	} catch (error) {
		console.error("Failed to fetch profile:", error);
		return { success: false, error: "Failed to fetch profile details." };
	}
}

/**
 * The signed-in user's own profile, or null when unauthenticated/archived.
 * Prisma-backed so the client never touches the DB directly (RLS and the
 * server-action layer stay the only data paths).
 */
export async function getCurrentUserProfile() {
	const userId = await getCurrentUserId();
	if (!userId) return null;
	return prisma.profiles.findUnique({
		where: { profile_id: userId, is_deleted: false },
	});
}

// ── Profile creation (signup flows) ─────────────────────────────────────────

const createProfileInputSchema = z.object({
	first_name: z.string().trim().min(1),
	last_name: z.string().trim().min(1),
	email: z.email(),
	phone: z.string().nullable(),
	job_title: z.string().nullable(),
	department_id: z.uuid().nullable().optional(),
	/**
	 * Client-employee signups: the INVITE CODE, never a client_id. The code
	 * is resolved to a client server-side so a caller cannot provision a
	 * profile under an arbitrary client without a valid code.
	 */
	inviteCode: z.string().optional(),
	/**
	 * Staff signups: the department invite code (Department.invite_code_hash).
	 * Resolved server-side to the department_id — the code determines the
	 * department, so no caller-supplied department is trusted. Same format
	 * as the client invite codes (6-12 alphanumeric).
	 */
	departmentInviteCode: z
		.string()
		.regex(/^[a-zA-Z0-9]{6,12}$/)
		.optional(),
	/**
	 * Auth user id from the client `signUp` response. Used ONLY when no
	 * session exists yet (email-confirmation flow); verified server-side
	 * against `auth.users` before the profile is created. Ignored when a
	 * session is present — the session id always wins.
	 */
	userId: z.uuid().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileInputSchema>;

type CreateProfileResult =
	{ success: true; data: Profiles } | { success: false; error: string };

/**
 * Creates the Profiles row for a freshly-signed-up auth user. The id never
 * comes from the client unchecked:
 * - with a session, the server-side `getCurrentUserId()` wins (any
 *   client-supplied id is ignored);
 * - without a session (email confirmation pending), the claimed id is
 *   verified against `auth.users` and must match the input email.
 * Client profiles are only created when a valid invite code is supplied —
 * the code is resolved server-side (never a caller-supplied client_id).
 * Idempotent: if the row already exists (external auth trigger, retried
 * submit), the unique violation is absorbed and the existing profile is
 * returned so signup flows can't double-create.
 */
export async function createProfileForCurrentUser(
	input: CreateProfileInput,
): Promise<CreateProfileResult> {
	try {
		createProfileInputSchema.parse(input);
	} catch {
		return { success: false, error: "Invalid profile data." };
	}

	const normalizedEmail = input.email.toLowerCase();
	// Authenticate FIRST (security review 2026-08-14): an unauthenticated
	// caller must not be able to probe which invite codes are valid — the
	// auth error is returned before any code lookup runs.
	let userId = await getCurrentUserId();
	if (!userId) {
		// No session yet — only accept a claimed id that provably belongs to
		// the auth user with this email AND was created moments ago (the
		// signup just happened). Prevents claiming an arbitrary existing
		// auth user's id.
		if (!input.userId)
			return { success: false, error: "Authentication required." };
		const authUser = await prisma.users.findUnique({
			where: { id: input.userId },
			select: { id: true, email: true, created_at: true },
		});
		const authUserEmail = authUser?.email?.toLowerCase();
		if (!authUser || authUserEmail !== normalizedEmail) {
			return { success: false, error: "Authentication required." };
		}
		const createdAt = authUser.created_at
			? new Date(authUser.created_at).getTime()
			: 0;
		if (Date.now() - createdAt > 15 * 60 * 1000) {
			return { success: false, error: "Authentication required." };
		}
		userId = authUser.id;
	}

	// A signup must carry a valid invite code (client or department) — the
	// server does not create credential-less staff profiles.
	if (!input.inviteCode && !input.departmentInviteCode) {
		return {
			success: false,
			error: "An invite code is required to create an account.",
		};
	}

	// Resolve the invite code authoritatively when one was supplied.
	let clientId: string | null = null;
	if (input.inviteCode) {
		const client = await prisma.clients.findUnique({
			where: { invite_code_hash: hashInviteCode(input.inviteCode) },
			select: { client_id: true, is_deleted: true },
		});
		if (!client || client.is_deleted) {
			return {
				success: false,
				error:
					"Invalid invite code. Ask your project owner for the current code.",
			};
		}
		clientId = client.client_id;
	}

	// Staff signups: the department invite code determines the department.
	// The caller-supplied department_id (if any) is IGNORED for signups that
	// carry a department code — the code is authoritative.
	let departmentId: string | null = input.department_id ?? null;
	if (input.departmentInviteCode) {
		const department = await prisma.department.findUnique({
			where: { invite_code_hash: hashInviteCode(input.departmentInviteCode) },
			select: { department_id: true, is_deleted: true },
		});
		if (!department || department.is_deleted) {
			return {
				success: false,
				error:
					"Invalid invite code. Ask your project owner for the current code.",
			};
		}
		departmentId = department.department_id;
	}

	try {
		const profile = await prisma.profiles.create({
			data: {
				profile_id: userId,
				first_name: input.first_name,
				last_name: input.last_name,
				email: normalizedEmail,
				phone: input.phone,
				job_title: input.job_title,
				department_id: departmentId,
				client_id: clientId,
			},
		});
		return { success: true, data: profile };
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			// Row already exists (duplicate submit or external trigger) —
			// idempotent when the row is genuinely this user's profile
			// (profile_id + case-insensitive email match). Note: a P2002 can
			// also come from a phone/@unique collision on an otherwise fresh
			// create; the profile_id lookup then finds no row or a different
			// user, so those still error.
			const existing = await prisma.profiles.findUnique({
				where: { profile_id: userId },
			});
			if (existing && existing.email.toLowerCase() === normalizedEmail) {
				// Hardening (2026-08-14 staff-signup audit): a retried submit
				// must not keep a STAFF profile that is missing the
				// department the signup just authorized with an invite code.
				// Client profiles are never stamped (and keep idempotent
				// success on retried submits).
				if (
					existing.client_id === null &&
					departmentId &&
					existing.department_id === null
				) {
					let stamped = existing;
					try {
						stamped = await prisma.profiles.update({
							where: { profile_id: userId },
							data: { department_id: departmentId },
						});
					} catch (stampError) {
						// The stamp is best-effort on an idempotent retry —
						// never break the success contract for the caller.
						console.error("Failed to stamp department on retry:", stampError);
					}
					return {
						success: true,
						data: stamped.department_id === departmentId ? stamped : existing,
					};
				}
				return { success: true, data: existing };
			}
		}
		console.error("Failed to create profile:", error);
		return { success: false, error: "Failed to create profile." };
	}
}

export async function getProfileByEmail(profileEmail: string) {
	try {
		z.email().parse(profileEmail);
		const profileData = await prisma.profiles.findUnique({
			where: {
				email: profileEmail,
			},
		});

		if (!profileData) {
			return {
				success: false,
				error: "User not found or does not match the requested status.",
			};
		}
		return { success: true, data: profileData };
	} catch (error) {
		console.error("Failed to fetch user:", error);
		return { success: false, error: "Failed to fetch user details." };
	}
}

/**
 * Fetches all non-deleted staff profiles (internal team members), ordered by
 * name. Any signed-in user may read the list (clients see it read-only on
 * the team page); unauthenticated callers get nothing.
 */
export async function selectTeamProfiles() {
	const userId = await getCurrentUserId();
	if (!userId) return [];
	return prisma.profiles.findMany({
		where: {
			is_deleted: false,
			client_id: null,
		},
		orderBy: { first_name: "asc" },
		select: {
			profile_id: true,
			first_name: true,
			last_name: true,
			email: true,
			phone: true,
			job_title: true,
			department_id: true,
			Department: {
				select: {
					department_id: true,
					name: true,
				},
			},
		},
	});
}
