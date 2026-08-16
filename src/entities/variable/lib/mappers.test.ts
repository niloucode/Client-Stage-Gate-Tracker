import { describe, expect, it } from "vitest";
import {
	mapClientVariableRow,
	mapVariableRow,
	uiTypeToDbType,
} from "./mappers";
import type { VariableClientPayload, VariablePayload } from "../types";

const createdAt = new Date("2026-08-01T10:00:00.000Z");

const teamRow: VariablePayload = {
	variable_id: "11111111-1111-1111-1111-111111111111",
	name: "Production Database",
	type: "CREDENTIAL",
	value: "postgresql://u:secret@host:5432/main",
	client_visible: false,
	notes_team: "Internal only.",
	notes_client: "",
	created_at: createdAt,
};

const clientRow: VariableClientPayload = {
	variable_id: "11111111-1111-1111-1111-111111111111",
	name: "Production Database",
	type: "CREDENTIAL",
	value: "postgresql://u:secret@host:5432/main",
	client_visible: true,
	notes_client: "Read-only access.",
	created_at: createdAt,
};

describe("mapVariableRow", () => {
	it("maps every column to the camelCase UI shape", () => {
		expect(mapVariableRow(teamRow)).toEqual({
			id: teamRow.variable_id,
			name: "Production Database",
			type: "credential",
			value: teamRow.value,
			clientVisibility: false,
			notesTeam: "Internal only.",
			notesClient: "",
			createdAt: "2026-08-01T10:00:00.000Z",
		});
	});

	it("maps all three DB enum values to lowercase", () => {
		expect(mapVariableRow({ ...teamRow, type: "LINK" }).type).toBe("link");
		expect(mapVariableRow({ ...teamRow, type: "CREDENTIAL" }).type).toBe(
			"credential",
		);
		expect(mapVariableRow({ ...teamRow, type: "REPOSITORY" }).type).toBe(
			"repository",
		);
	});
});

describe("mapClientVariableRow", () => {
	it("never leaks team notes", () => {
		expect(mapClientVariableRow(clientRow).notesTeam).toBe("");
		expect(mapClientVariableRow(clientRow).notesClient).toBe(
			"Read-only access.",
		);
	});

	it("keeps the value for visible rows", () => {
		expect(mapClientVariableRow(clientRow).value).toBe(clientRow.value);
	});
});

describe("uiTypeToDbType", () => {
	it("round-trips the UI vocabulary to the DB enum", () => {
		expect(uiTypeToDbType.link).toBe("LINK");
		expect(uiTypeToDbType.credential).toBe("CREDENTIAL");
		expect(uiTypeToDbType.repository).toBe("REPOSITORY");
	});
});
