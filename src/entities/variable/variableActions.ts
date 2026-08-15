"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
	assertProjectMemberNotClient,
	assertProjectMemberOrClient,
	resolveVariableProject,
} from "@/lib/auth/projectAccess";
import {
	variableCreateSchema,
	type VariableCreateInput,
} from "@/shared/schemas";
import { mapClientVariableRow, mapVariableRow, uiTypeToDbType } from "./lib/mappers";
import { variableClientSelect, variableSelect } from "./types";

/**
 * Project-scoped variable list. Team/owners see everything; client viewers
 * receive ONLY client_visible rows (value included) and never notes_team.
 * Hidden rows are not sent at all (2026-08-15 user decision).
 */
export async function getProjectVariables(projectId: string) {
	z.uuid().parse(projectId);
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const profile = await prisma.profiles.findUnique({
			where: { profile_id: auth.userId },
			select: { client_id: true },
		});
		const isClient = Boolean(profile?.client_id);

		if (isClient) {
			const rows = await prisma.variables.findMany({
				where: { project_id: projectId, is_deleted: false, client_visible: true },
				orderBy: { created_at: "asc" },
				select: variableClientSelect,
			});
			return { success: true as const, data: rows.map(mapClientVariableRow) };
		}

		const rows = await prisma.variables.findMany({
			where: { project_id: projectId, is_deleted: false },
			orderBy: { created_at: "asc" },
			select: variableSelect,
		});
		return { success: true as const, data: rows.map(mapVariableRow) };
	} catch (error) {
		console.error("Failed to fetch project variables:", error);
		return { success: false as const, error: "Failed to load variables." };
	}
}

/** Team/owner only. Creates a variable with client visibility OFF. */
export async function createVariable(projectId: string, input: VariableCreateInput) {
	z.uuid().parse(projectId);
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const data = variableCreateSchema.parse(input);
		const created = await prisma.variables.create({
			data: {
				project_id: projectId,
				name: data.name,
				type: uiTypeToDbType[data.type],
				value: data.value,
				notes_team: data.notesTeam,
				notes_client: data.notesClient,
			},
			select: variableSelect,
		});
		return { success: true as const, data: mapVariableRow(created) };
	} catch (error) {
		console.error("Failed to create variable:", error);
		return { success: false as const, error: "Failed to create the variable." };
	}
}

/** Team/owner only. Updates name/type/value/notes (not visibility). */
export async function updateVariable(
	variableId: string,
	input: VariableCreateInput,
) {
	z.uuid().parse(variableId);
	const projectId = await resolveVariableProject(variableId);
	if (!projectId) return { success: false as const, error: "Variable not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const data = variableCreateSchema.parse(input);
		const updated = await prisma.variables.update({
			where: { variable_id: variableId },
			data: {
				name: data.name,
				type: uiTypeToDbType[data.type],
				value: data.value,
				notes_team: data.notesTeam,
				notes_client: data.notesClient,
			},
			select: variableSelect,
		});
		return { success: true as const, data: mapVariableRow(updated) };
	} catch (error) {
		console.error("Failed to update variable:", error);
		return { success: false as const, error: "Failed to update the variable." };
	}
}

/** Team/owner only. Flips client_visible (the confirm-gated toggle). */
export async function toggleVariableVisibility(variableId: string) {
	z.uuid().parse(variableId);
	const projectId = await resolveVariableProject(variableId);
	if (!projectId) return { success: false as const, error: "Variable not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const current = await prisma.variables.findUnique({
			where: { variable_id: variableId },
			select: { client_visible: true },
		});
		if (!current) return { success: false as const, error: "Variable not found." };
		const updated = await prisma.variables.update({
			where: { variable_id: variableId },
			data: { client_visible: !current.client_visible },
			select: { variable_id: true },
		});
		return { success: true as const, data: updated };
	} catch (error) {
		console.error("Failed to toggle variable visibility:", error);
		return { success: false as const, error: "Failed to change client visibility." };
	}
}

/** Team/owner only. Soft delete (project rule 1). */
export async function softDeleteVariable(variableId: string) {
	z.uuid().parse(variableId);
	const projectId = await resolveVariableProject(variableId);
	if (!projectId) return { success: false as const, error: "Variable not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		await prisma.variables.update({
			where: { variable_id: variableId },
			data: { is_deleted: true, deleted_at: new Date() },
		});
		return { success: true as const };
	} catch (error) {
		console.error("Failed to delete variable:", error);
		return { success: false as const, error: "Failed to delete the variable." };
	}
}
