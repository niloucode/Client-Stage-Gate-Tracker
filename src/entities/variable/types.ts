import type { Prisma } from "@/lib/generated/prisma";
import type { VariableCreateInput } from "@/shared/schemas/variable";

/** Full row — team/owner view. */
export const variableSelect = {
	variable_id: true,
	name: true,
	type: true,
	value: true,
	client_visible: true,
	notes_team: true,
	notes_client: true,
	created_at: true,
} as const;

export type VariablePayload = Prisma.VariablesGetPayload<{
	select: typeof variableSelect;
}>;

/** Client-visible subset — notes_team is NEVER sent to client viewers. */
export const variableClientSelect = {
	variable_id: true,
	name: true,
	type: true,
	value: true,
	client_visible: true,
	notes_client: true,
	created_at: true,
} as const;

export type VariableClientPayload = Prisma.VariablesGetPayload<{
	select: typeof variableClientSelect;
}>;

export type VariableType = VariableCreateInput["type"];

/** UI-facing row shape (camelCase; createdAt as ISO string). */
export interface VariableItem {
	id: string;
	name: string;
	type: VariableType;
	value: string;
	clientVisibility: boolean;
	notesTeam: string;
	notesClient: string;
	createdAt: string;
}
