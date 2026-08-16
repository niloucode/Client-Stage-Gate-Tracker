import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression guard for the Next.js "use server" rule: a module with the
 * directive may only export async functions — an exported plain object
 * crashes every import of that module at runtime with
 * `"use server" file can only export async functions, found object`
 * (hit 2026-08-15: `export const issueDetailInclude` in issueActions.ts).
 */
function collectSourceFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) collectSourceFiles(p, out);
		else if (
			(p.endsWith(".ts") || p.endsWith(".tsx")) &&
			!p.includes(".test.")
		) {
			out.push(p);
		}
	}
	return out;
}

/** Strip block + line comments so directives/exports are read from real code. */
function stripComments(src: string): string {
	return src
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.split("\n")
		.map((line) => line.replace(/\/\/.*$/, ""))
		.join("\n");
}

describe("'use server' files (Next.js export rule)", () => {
	it("never export objects/arrays or non-async functions", () => {
		const violations: string[] = [];
		for (const file of collectSourceFiles(join(process.cwd(), "src"))) {
			const src = stripComments(readFileSync(file, "utf8"));
			const hasDirective = src
				.split("\n")
				.some((line) => line.trim() === '"use server";');
			if (!hasDirective) continue;

			src.split("\n").forEach((line, i) => {
				const t = line.trim();
				// `export const X = {` / `export const X = [` → the "found object" error.
				if (/^export\s+const\s+\w+\s*=\s*[{\[]/.test(t)) {
					violations.push(`${file}:${i + 1}: ${t}`);
				}
				// Plain (non-async) function exports are also forbidden.
				if (/^export\s+function\s+/.test(t)) {
					violations.push(`${file}:${i + 1}: ${t}`);
				}
			});
		}
		expect(violations).toEqual([]);
	});
});
