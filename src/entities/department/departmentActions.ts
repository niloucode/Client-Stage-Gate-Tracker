"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
