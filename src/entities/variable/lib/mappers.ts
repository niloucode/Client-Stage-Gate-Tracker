import type {
	VariableClientPayload,
	VariableItem,
	VariablePayload,
	VariableType,
} from "../types";

const DB_TYPE_TO_UI: Record<VariablePayload["type"], VariableType> = {
	LINK: "link",
	CREDENTIAL: "credential",
	REPOSITORY: "repository",
};

export const uiTypeToDbType: Record<VariableType, VariablePayload["type"]> = {
	link: "LINK",
	credential: "CREDENTIAL",
	repository: "REPOSITORY",
};

/**

 * Team/owner view: every column.

 * @returns The mapped UI item.
 * @param row
 */
export function mapVariableRow(row: VariablePayload): VariableItem {
	return {
		id: row.variable_id,
		name: row.name,
		type: DB_TYPE_TO_UI[row.type],
		value: row.value,
		clientVisibility: row.client_visible,
		notesTeam: row.notes_team,
		notesClient: row.notes_client,
		createdAt: row.created_at.toISOString(),
	};
}

/**

 * Client view: team notes replaced with "" — the column is never sent.

 * @returns The mapped UI item.
 * @param row
 */
export function mapClientVariableRow(row: VariableClientPayload): VariableItem {
	return {
		id: row.variable_id,
		name: row.name,
		type: DB_TYPE_TO_UI[row.type],
		value: row.value,
		clientVisibility: row.client_visible,
		notesTeam: "",
		notesClient: row.notes_client,
		createdAt: row.created_at.toISOString(),
	};
}
