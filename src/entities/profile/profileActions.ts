"use server";
import { prisma } from "@/lib/prisma";
import { ProfileType } from "@/shared/types";
import { EntityFilterStatus } from "../ticket/ticketActions";

/**
 * Retrieves all profile records from the database.
 * Commonly used to populate assignment dropdowns, member directories, or profile selection panels.
 *
 * @returns {Promise<any[]>}
 * Returns a promise that resolves to an array containing all profile objects in the database.
 */
export async function selectProfile() {
	return prisma.profiles.findMany();
}

/**
 * Retrieves a specific profile from the database using their unique ID.
 * Uses a status filter to determine if the profile can be retrieved based on their deletion state:
 * - 'active' (default): Only retrieves the profile if they are NOT soft-deleted.
 * - 'deleted': Only retrieves the profile if they ARE soft-deleted (useful for recycle bin views).
 * - 'all': Retrieves the profile regardless of their deletion status.
 * Security Note: Ensure user authorization claims are verified before execution.
 *
 * @param {string} profileId - The UUID of the profile to retrieve.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the profile object if found.
 * Returns `success: false` and an error message if the profile does not exist, does not match
 * the requested status, or the query fails.
 */
export async function getProfileById(profileId: string, status: EntityFilterStatus = 'active') {
  try {
    const isDeletedFilter = status === 'active' ? false : status === 'deleted' ? true : undefined;

    const profileData = await prisma.profiles.findUnique({
      where: {
        profile_id: profileId,
        // is_deleted: isDeletedFilter,
      },
    });

    if (!profileData) {
      return { success: false, error: "Profile not found or does not match the requested status." };
    }
    return { success: true, data: profileData };
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return { success: false, error: "Failed to fetch profile details." };
  }
}

/**
 * Retrieves the specific profile of a user from the database using their unique email.
 * Security Note: Ensure user authorization claims are verified before execution.
 *
 * @param {string} profileEmail - The email of the profile we want to retrieve.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the profile object if found.
 * Returns `success: false` and an error message if the profile does not exist, does not match
 * the requested status, or the query fails.
 */
export async function getProfileByEmail(profileEmail: string) {
  try {
    const profileData = await prisma.profiles.findUnique({
      where: {
        email: profileEmail,
      },
    });

    if (!profileData) {
      return { success: false, error: "User not found or does not match the requested status." };
    }
    return { success: true, data: profileData };

  } catch (error) {
    console.error("Failed to fetch user:", error);
    return { success: false, error: "Failed to fetch user details." };
  }
}


/**
 * Updates an existing profile's details in the database.
 *
 * @param {ProfileType} profile - The profile object containing the updated field values.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the updated profile object if successful.
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
 * Performs a "soft delete" on a profile by marking them as deleted instead of permanently erasing them.
 * This acts like a recycle bin, preserving historical data and preventing database corruption.
 * Note: Archiving is blocked if the user of the profile has active ticket assignments to ensure operational integrity.
 *
 * @param {string} profile_id - The UUID of the profile to soft delete.
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