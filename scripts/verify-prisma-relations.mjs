#!/usr/bin/env node
/**
 * Post-`db pull` guard: verifies that `prisma/schema.prisma` still carries
 * the relation declarations the APPLICATION code depends on.
 *
 * WHY THIS EXISTS
 * ---------------
 * `prisma db pull` re-infers relations from DB constraints and silently
 * rewrites app-authored cardinalities. The known case (2026-08-16):
 * `Issues.Tickets` is deliberately modeled as 1:n (`Tickets[]`) even though
 * `Tickets.issue_id` is UNIQUE in the DB — the code relies on
 * `_count.select.Tickets`, `include: { Tickets: { take: 1 } }` and
 * `row.Tickets[0]`, which only work on a to-many relation. A pull flips it
 * to `Tickets?` (1:1) and the regenerated client fails at runtime with
 * `Unknown field 'Tickets' for select statement on model
 * 'IssuesCountOutputType'`.
 *
 * Run after `npx prisma db pull` (before `prisma generate`):
 *   node scripts/verify-prisma-relations.mjs
 * Also wired into CI so accidental schema edits fail fast.
 *
 * Exit code 1 + a remediation hint on violation; 0 when all invariants hold.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Optional override for testing: --schema <path>
const schemaArgIndex = process.argv.indexOf("--schema");
const schemaPath =
	schemaArgIndex >= 0
		? process.argv[schemaArgIndex + 1]
		: path.resolve(
				path.dirname(fileURLToPath(import.meta.url)),
				"../prisma/schema.prisma",
			);
const schema = readFileSync(schemaPath, "utf8");

/** Extract one `model X { ... }` block by name. */
function modelBlock(name) {
	const re = new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`, "m");
	const m = schema.match(re);
	return m ? m[0] : null;
}

const violations = [];

/** Invariant: the relation field is a LIST (1:n) with a specific name. */
function expectListRelation(model, field, target) {
	const block = modelBlock(model);
	if (!block) {
		violations.push(`model ${model} not found in prisma/schema.prisma`);
		return;
	}
	const lineRe = new RegExp(`^\\s*${field}\\s+${target}\\[\\]$`, "m");
	const listLine = block.match(lineRe);
	const singularLine = block.match(
		new RegExp(`^\\s*${field}\\s+${target}\\??$`, "m"),
	);
	if (!listLine) {
		if (singularLine) {
			violations.push(
				`${model}.${field} is declared as 1:1 (${target}?) but the app ` +
					`requires 1:n (${target}[]) — restore the list form (see the ` +
					`CONTRIBUTING.md refresh section) before running prisma generate.`,
			);
		} else {
			violations.push(
				`${model}.${field} relation field is missing or malformed ` +
					`(expected: ${target}[]).`,
			);
		}
	}
}

/** Invariant: the field is NOT NULL (no `?` on the scalar type). */
function expectNotNull(model, field) {
	const block = modelBlock(model);
	if (!block) {
		violations.push(`model ${model} not found in prisma/schema.prisma`);
		return;
	}
	const line = block.split("\n").find((l) => l.trim().startsWith(`${field} `));
	if (!line) {
		violations.push(`${model}.${field} field not found.`);
		return;
	}
	if (/\?\s+@/.test(line) || /\?\s*$/.test(line.trim())) {
		violations.push(
			`${model}.${field} must be NOT NULL — it is declared nullable.`,
		);
	}
}

// ── App-authored invariants (add new ones here as they become canonical) ────

// 1. Issues → Tickets stays 1:n (unique FK modeled as a list on purpose —
//    _count.select.Tickets / take:1 / row.Tickets[0] depend on it).
expectListRelation("Issues", "Tickets", "Tickets");

// 2. Contracts.client_id is the ONLY Clients↔Projects link and is NOT NULL.
expectNotNull("Contracts", "client_id");

// 3. Every ticket belongs to a workflow (NOT NULL).
expectNotNull("Tickets", "workflow_id");

if (violations.length > 0) {
	console.error("verify-prisma-relations: schema invariants violated:");
	for (const v of violations) console.error(`  - ${v}`);
	console.error(
		"\nRemediation: restore the app-authored declarations in prisma/schema.prisma" +
			" (git checkout prisma/schema.prisma or hand-edit), then re-run:" +
			"\n  node scripts/verify-prisma-relations.mjs && npx prisma validate && npx prisma generate",
	);
	process.exit(1);
}

console.log("verify-prisma-relations: all schema invariants hold.");
