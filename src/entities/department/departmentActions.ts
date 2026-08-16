"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateInviteCode, hashInviteCode } from "@/shared/lib/inviteCode";
import { getCurrentUserId } from "@/lib/auth/projectAccess";

/**
 * Resolves a department by id (or the caller's own when omitted).
 * @param departmentId
 * @returns The result.
 */
export async function getDepartmentById(departmentId?: string) {
	if (!departmentId) return null;

	try {
		z.uuid().parse(departmentId);
		return await prisma.department.findUnique({
			where: {
				department_id: departmentId,
			},
			select: {
				department_id: true,
				name: true,
			},
		});
	} catch (error) {
		console.error("Failed to fetch department:", error);
		return null;
	}
}

/**
 * Generates an invite code for a staff member (Project Team or Project Owner).
 * Owner-only (spec: clients and project team members cannot generate codes):
 * the caller must be a member of the "Project Owner" department — the same
 * department-name convention the client registry uses.
 * @returns The result.
 */
/**
 * Owner-gated: generates + persists a new staff invite code (hash only).
 * @param departmentName
 * @returns The result.
 */
export async function generateStaffInviteCode(
	departmentName: "Project Team" | "Project Owner",
) {
	const userId = await getCurrentUserId();
	if (!userId) {
		return { success: false, error: "Authentication required." };
	}

	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId },
		include: { Department: { select: { name: true } } },
	});
	if (
		!profile ||
		profile.client_id !== null ||
		profile.Department?.name !== "Project Owner"
	) {
		return {
			success: false,
			error: "Only the project owner can generate invite codes.",
		};
	}

	// Store only the HMAC-SHA256 hash on the Department row (the same
	// technique as the client invite codes); the plaintext is returned
	// exactly once. Retrying with a fresh code on the vanishingly rare
	// P2002 hash collision.
	for (let attempt = 0; attempt < 3; attempt++) {
		const code = generateInviteCode();
		try {
			const updated = await prisma.department.updateMany({
				where: { name: departmentName, is_deleted: false },
				data: { invite_code_hash: hashInviteCode(code) },
			});
			if (updated.count === 0) {
				return {
					success: false,
					error: `Department "${departmentName}" not found.`,
				};
			}
			return {
				success: true,
				inviteCode: code,
				department: departmentName,
			};
		} catch (error) {
			const meta = (error as { code?: unknown; meta?: { target?: unknown } })
				.meta;
			const isCollision =
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === "P2002" &&
				Array.isArray(meta?.target) &&
				(meta.target as string[]).includes("invite_code_hash");
			if (isCollision) continue;
			console.error("Failed to store invite code:", error);
			return { success: false, error: "Failed to generate invite code." };
		}
	}
	return { success: false, error: "Could not allocate a unique invite code." };
}
