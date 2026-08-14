import { describe, expect, it } from "vitest";
import { formatIssueDateTime, mapIssueRow, type IssueRow } from "./mappers";

// Local-time construction so the formatted output is timezone-independent.
const reportedAt = new Date(2026, 7, 2, 14, 30); // Aug 2, 2026 14:30 local

const baseRow: IssueRow = {
	issue_id: "11111111-1111-1111-1111-111111111111",
	project_id: "22222222-2222-2222-2222-222222222222",
	reported_by: "33333333-3333-3333-3333-333333333333",
	reported_at: reportedAt,
	status: "LINKED",
	name: "Authentication Token Expiration Bug",
	type: "not_saving",
	description: "Session terminates unexpectedly.",
	urgency: "HIGH",
	system_environment: "Chrome v126 / macOS Sonoma",
	time_of_error: new Date(2026, 7, 2, 14, 28),
	IssueSteps: [
		{ number: 1, step: "Navigate to the dashboard.", image: null },
		{ number: 2, step: "Click Save repeatedly.", image: "https://cdn.example.com/step.png" },
	],
	Tickets: [{ ticket_id: "44444444-4444-4444-4444-444444444444", name: "TICK-1042" }],
	Profile: { first_name: "Jane", last_name: "Smith" },
};

describe("mapIssueRow", () => {
	it("maps a fully linked issue row to the UI shape", () => {
		const issue = mapIssueRow(baseRow);
		expect(issue).toEqual({
			id: "11111111-1111-1111-1111-111111111111",
			name: "Authentication Token Expiration Bug",
			type: "not_saving",
			urgency: "high",
			status: "linked",
			clientName: "Jane Smith",
			reportedAt: "08/02/2026, 14:30",
			description: "Session terminates unexpectedly.",
			systemEnv: "Chrome v126 / macOS Sonoma",
			timeOfError: "08/02/2026, 14:28",
			ticketName: "TICK-1042",
			ticketId: "44444444-4444-4444-4444-444444444444",
			steps: [
				{ id: "1", description: "Navigate to the dashboard." },
				{
					id: "2",
					description: "Click Save repeatedly.",
					image: "https://cdn.example.com/step.png",
				},
			],
		});
	});

	it("maps an unlinked issue with no reporter to fallbacks", () => {
		const issue = mapIssueRow({
			...baseRow,
			status: "UNLINKED",
			urgency: "LOW",
			description: null,
			system_environment: null,
			time_of_error: null,
			IssueSteps: [],
			Tickets: [],
			Profile: null,
		});
		expect(issue.status).toBe("unlinked");
		expect(issue.urgency).toBe("low");
		expect(issue.clientName).toBe("Unknown");
		expect(issue.description).toBe("");
		expect(issue.systemEnv).toBe("");
		expect(issue.timeOfError).toBe("N/A");
		expect(issue.ticketName).toBeUndefined();
		expect(issue.ticketId).toBeUndefined();
		expect(issue.steps).toEqual([]);
	});

	it("keeps a free-text type for 'other' issues untouched", () => {
		const issue = mapIssueRow({ ...baseRow, type: "UI Bug" });
		expect(issue.type).toBe("UI Bug");
	});
});

describe("formatIssueDateTime", () => {
	it("formats like the legacy mock (MM/DD/YYYY, HH:MM 24h)", () => {
		expect(formatIssueDateTime(reportedAt)).toBe("08/02/2026, 14:30");
	});
});
