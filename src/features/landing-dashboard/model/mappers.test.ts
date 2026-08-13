import { describe, expect, it } from "vitest";
import {
	mapDashboardTicketRow,
	mapContractRow,
	tagToBadge,
} from "./mappers";
import type { DashboardTicketRow } from "@/entities/ticket";
import type { ContractRow } from "@/entities/contract";

const baseRow = {
	ticket_id: "t1",
	name: "Fix auth",
	status: "IN_PROGRESS",
	plan_end_at: new Date("2026-09-01T10:00:00Z"),
	Workflows: {
		name: "Auth Flow",
		Modules: {
			name: "Auth",
			Phases: { name: "Build", Stages: { name: "S1", Projects: { project_id: "p1", name: "Portal 2.0" } } },
		},
	},
	TicketTags: [{ Tags: { name: "Critical", color: "#93000a" } }],
	TicketAssigned: [
		{
			Profile: { profile_id: "u1", first_name: "John", last_name: "Doe" },
		},
	],
} as unknown as DashboardTicketRow;

describe("mapDashboardTicketRow", () => {
	it("flattens the nested project/module/workflow chain", () => {
		const item = mapDashboardTicketRow(baseRow);
		expect(item.project).toBe("Portal 2.0");
		expect(item.module).toBe("Auth");
		expect(item.workflow).toEqual({ label: "Auth Flow" });
		expect(item.status).toBe("IN_PROGRESS");
		expect(item.dueAt).toBe(baseRow.plan_end_at);
	});

	it("derives assignee initials from the profile", () => {
		const item = mapDashboardTicketRow(baseRow);
		expect(item.assignees?.[0]).toMatchObject({
			initials: "JD",
			name: "John Doe",
		});
	});

	it("uses the first tag's label and color-derived badge", () => {
		const item = mapDashboardTicketRow(baseRow);
		expect(item.tag.label).toBe("Critical");
		expect(item.tag.text).toBe("#93000a");
	});

	it("tolerates a tagless ticket", () => {
		const row = { ...baseRow, TicketTags: [] };
		expect(mapDashboardTicketRow(row).tag.label).toBe("Untagged");
	});
});

describe("tagToBadge", () => {
	it("derives a translucent bg from the color", () => {
		expect(tagToBadge("X", "#123456")).toEqual({
			label: "X",
			bg: "#1234561A",
			text: "#123456",
		});
	});

	it("falls back to neutral colors without a tag color", () => {
		expect(tagToBadge("X", null).bg).toBeTruthy();
		expect(tagToBadge(null, null).label).toBe("Untagged");
	});
});

describe("mapContractRow", () => {
	it("maps a pending contract (no owner signature yet)", () => {
		const row = {
			contract_id: "c1",
			contract_name: "MSA",
			project_id: "p1",
			client_signature: "sig",
			project_owner_signature: null,
			client_signed_at: null,
			project_owner_signed_at: null,
			Projects: { name: "Portal 2.0" },
		};
		expect(mapContractRow(row as ContractRow)).toEqual({
			id: "c1",
			projectId: "p1",
			documentName: "MSA",
			projectName: "Portal 2.0",
			status: "pending",
		});
	});

	it("maps an executed contract when both signatures exist", () => {
		const row = {
			contract_id: "c2",
			contract_name: "MSA",
			project_id: "p2",
			client_signature: "a",
			project_owner_signature: "b",
			client_signed_at: null,
			project_owner_signed_at: null,
			Projects: { name: "Nexus" },
		};
		expect(mapContractRow(row as ContractRow).status).toBe("executed");
	});
});
