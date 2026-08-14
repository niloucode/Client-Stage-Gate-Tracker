export type VariableType = "link" | "credential" | "repository";

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

export type VariableSortField = "name" | "type" | "clientVisibility";
export type SortDirection = "asc" | "desc";

export interface VariableFormData {
	name: string;
	type: VariableType;
	value: string;
	notesTeam: string;
	notesClient: string;
}