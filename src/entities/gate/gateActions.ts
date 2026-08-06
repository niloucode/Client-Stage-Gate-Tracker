"use server";

import { prisma } from "@/lib/prisma";
import type { EntityFilterStatus } from "@/entities/types";

export async function getGateById(
	gateId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const gate = await prisma.gates.findUnique({
			where: {
				gate_id: gateId,
				is_deleted: isDeletedFilter,
			},
		});

		if (!gate) {
			return {
				success: false,
				error: "Gate not found or does not match the requested status.",
			};
		}
		return { success: true, data: gate };
	} catch (error) {
		console.error("Failed to fetch gate:", error);
		return { success: false, error: "Failed to fetch gate details." };
	}
}
