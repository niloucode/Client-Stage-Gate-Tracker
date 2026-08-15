import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Canary for the WebStorm stale-buffer problem (2026-08-15): the running IDE
 * has repeatedly written an old in-memory copy of prisma/schema.prisma back
 * over external edits, silently reverting relations (Issues.Tickets became
 * `Tickets?`, GateSignatures reappeared, migration-12 fields vanished). Each
 * revert produced confusing runtime Prisma validation errors. This test
 * fails loudly if the schema drifts from the integration state.
 */
const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");

function modelBlock(model: string): string {
	const start = schema.indexOf(`model ${model} {`);
	expect(start).toBeGreaterThan(-1); // model exists
	return schema.slice(start, schema.indexOf("}", start));
}

describe("prisma/schema.prisma integration state (WebStorm-revert canary)", () => {
	it("keeps Issues.Tickets as a to-many relation (countable)", () => {
		// `Tickets?` (to-one) makes `_count.select.Tickets` fail at runtime —
		// exactly the getIssueStats error seen on 2026-08-15.
		expect(modelBlock("Issues")).toMatch(/Tickets\s+Tickets\[\]/);
	});

	it("keeps the migration-12 Gates state (no GateSignatures, no creation_date, comment_id present)", () => {
		const gates = modelBlock("Gates");
		expect(gates).not.toContain("GateSignatures");
		expect(gates).not.toContain("creation_date");
		expect(gates).toMatch(/comment_id\s+String\?\s+@unique\s+@db\.Uuid/);
		expect(schema).not.toContain("model GateSignatures {");
	});

	it("keeps the issue-integration Issues fields", () => {
		const issues = modelBlock("Issues");
		expect(issues).toContain("project_id");
		expect(issues).toContain("reported_by");
		expect(issues).toContain("status");
		expect(issues).toContain("IssueStatus");
	});
});
