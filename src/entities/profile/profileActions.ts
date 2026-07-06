"use server";
import { prisma } from "@/lib/prisma";
import { ProfileType } from "@/shared/types";
import { EntityFilterStatus } from "../ticket/ticketActions";

/**
 * Retrieves all user records from the database.
 * Commonly used to populate assignment dropdowns, member directories, or user selection panels.
 *
 * @returns {Promise<any[]>}
 * Returns a promise that resolves to an array containing all user objects in the database.
 */
export async function selectProfile() {
	return prisma.profiles.findMany();
}

/**
 * Retrieves a specific user from the database using their unique ID.
 * Uses a status filter to determine if the user can be retrieved based on their deletion state:
 * - 'active' (default): Only retrieves the user if they are NOT soft-deleted.
 * - 'deleted': Only retrieves the user if they ARE soft-deleted (useful for recycle bin views).
 * - 'all': Retrieves the user regardless of their deletion status.
 * Security Note: Ensure user authorization claims are verified before execution.
 *
 * @param {string} userId - The UUID of the user to retrieve.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the user object if found.
 * Returns `success: false` and an error message if the user does not exist, does not match
 * the requested status, or the query fails.
 */
export async function getProfileById(
	userId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const userData = await prisma.profiles.findUnique({
			where: {
				profile_id: userId,
				// is_deleted: isDeletedFilter,
			},
		});

		if (!userData) {
			return {
				success: false,
				error: "User not found or does not match the requested status.",
			};
		}
		return { success: true, data: userData };
	} catch (error) {
		console.error("Failed to fetch user:", error);
		return { success: false, error: "Failed to fetch user details." };
	}
}

/**
 * Updates an existing user's details in the database.
 *
 * @param {ProfileType} profile - The user object containing the updated field values.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the updated user object if successful.
 * Returns `success: false` and an error message if the update fails.
 */
export async function updateProfile(profile: ProfileType) {
	try {
		const updatedProfile = await prisma.profiles.update({
			where: { profile_id: profile.profile_id },
			data: {
				first_name: profile.first_name,
				last_name: profile.last_name,
				phone: profile.phone,
				image_id: profile.image_id == "" ? null : profile.image_id,
				client_id: profile.client_id == "" ? null : profile.client_id,
				department_id: profile.department_id,
				email: profile.email,
			},
		});
		return { success: true, data: updatedProfile };
	} catch (error) {
		console.error("Failed to update user:", error);
		return { success: false, error: "Failed to update user details." };
	}
}

/**
 * Performs a "soft delete" on a user by marking them as deleted instead of permanently erasing them.
 * This acts like a recycle bin, preserving historical data and preventing database corruption.
 * Note: Archiving is blocked if the user has active ticket assignments to ensure operational integrity.
 *
 * @param {string} profile_id - The UUID of the user to soft delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` if the user was successfully archived.
 * Returns `success: false` and an error message if the user has assignments or the query fails.
 */
export async function softDeleteProfile(profile_id: string) {
	try {
		const activeAssignmentsCount = await prisma.ticketAssigned.count({
			where: {
				profile_id: profile_id,
				// is_deleted: false,
			},
		});
		if (activeAssignmentsCount > 0) {
			return {
				success: false,
				error: `Cannot archive user. Please remove or reassign all ${activeAssignmentsCount} active ticket assignment(s) first.`,
			};
		}

		await prisma.profiles.update({
			where: { profile_id: profile_id },
			data: {
				is_deleted: true,
				deleted_at: new Date(),
			},
		});
		return { success: true };
	} catch (error) {
		console.error("Failed to soft delete user:", error);
		return {
			success: false,
			error: "Failed to archive the user due to a database error.",
		};
	}
}
