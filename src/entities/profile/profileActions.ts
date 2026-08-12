"use server";
import { prisma } from "@/lib/prisma";
import { ProfileType } from "@/shared/types";
import type { EntityFilterStatus } from "@/entities/types";

export async function selectProfile() {
	return prisma.profiles.findMany();
}

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

export async function getProfilesByClientId(clientId: string) {
  try {

    const usersArray = await prisma.profiles.findMany({
      where: {
        client_id: clientId,
        is_deleted: false,
      },
    });

    if (!usersArray) {
      return { success: false, error: "User not found or does not match the requested status." };
    }
    return { success: true, data: usersArray };
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return { success: false, error: "Failed to fetch user details." };
  }
}

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