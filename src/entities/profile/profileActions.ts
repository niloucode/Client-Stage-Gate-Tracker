"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/projectAccess";
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

export async function getProfilesByClientId(clientId: string) {
	try {
		z.uuid().parse(clientId);
		const usersArray = await prisma.profiles.findMany({
			where: {
				client_id: clientId,
				is_deleted: false,
			},
		});

		return { success: true, data: usersArray };
	} catch (error) {
		console.error("Failed to fetch user:", error);
		return { success: false, error: "Failed to fetch user details." };
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
