#!/usr/bin/env node
/**
 * Re-prunes Supabase's auth tables from prisma/schema.prisma after a
 * `prisma db pull`.
 *
 * WHY THIS EXISTS
 * --------------
 * `db pull` introspects every table in the datasource schemas. Because
 * `public.Profiles.profile_id` has a cross-schema FK to `auth.users`
 * (constraint `Users_user_id_fkey`), introspection MUST include the `auth`
 * schema — `--schemas public` alone fails with P4002. So the pull brings
 * back all ~22 Supabase auth models, and this script strips them again,
 * keeping only `auth.users` (the 1:1 bridge used by Profiles).
 *
 * USAGE (after a schema refresh):
 *   npx prisma db pull
 *   node scripts/prune-auth-models.mjs
 *   npx prisma generate
 *
 * IDEMPOTENT: safe to run on an already-pruned schema (no-op).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const schemaPath = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../prisma/schema.prisma",
);

// Every auth-schema model/enum that is pruned (users is KEPT).
const REMOVED = new Set([
	"audit_log_entries",
	"custom_oauth_providers",
	"flow_state",
	"identities",
	"instances",
	"mfa_amr_claims",
	"mfa_challenges",
	"mfa_factors",
	"oauth_authorizations",
	"oauth_client_states",
	"oauth_clients",
	"oauth_consents",
	"one_time_tokens",
	"refresh_tokens",
	"saml_providers",
	"saml_relay_states",
	"schema_migrations",
	"sessions",
	"sso_domains",
	"sso_providers",
	"webauthn_challenges",
	"webauthn_credentials",
	"aal_level",
	"code_challenge_method",
	"factor_status",
	"factor_type",
	"oauth_authorization_status",
	"oauth_client_type",
	"oauth_registration_type",
	"oauth_response_type",
	"one_time_token_type",
]);

/** Remove `model`/`enum` blocks that belong to the auth schema (keep `users`). */
function stripAuthBlocks(source, kind) {
	const pattern = new RegExp(`${kind} (\\w+) \\{[\\s\\S]*?\\n\\}`, "g");
	const spans = [];
	for (const m of source.matchAll(pattern)) {
		const name = m[1];
		if (m[0].includes('@@schema("auth")') && name !== "users") {
			spans.push([m.index, m.index + m[0].length]);
		}
	}
	// Also consume the `/// ...` doc comments that sit directly above each
	// removed block (they belonged to the removed table). db pull separates
	// the comments from the model with a blank line, so allow blank lines
	// between comment lines — but stop at the first real content.
	for (const [start, end] of spans.reverse()) {
		let s = start;
		while (s > 0 && source[s - 1] === "\n") {
			// Previous line (without its trailing newline): [prevStart, s-1)
			const prevStart = source.lastIndexOf("\n", s - 2) + 1;
			const line = source.slice(prevStart, s - 1);
			if (/^\s*\/\/\/.*$/.test(line.trimEnd()) || line.trim() === "") {
				s = prevStart;
			} else {
				break;
			}
		}
		source = source.slice(0, s) + source.slice(end);
	}
	return { source, removed: spans.length };
}

/** Drop relation fields inside `users` that point at removed auth models. */
function stripUsersRelations(source) {
	const start = source.indexOf("model users {");
	const end = source.indexOf("\n}", start) + 2;
	const block = source.slice(start, end);
	const kept = [];
	let removed = 0;
	for (const line of block.split("\n")) {
		const m = line.match(/^  (\w+)\s+(\w+)/);
		if (m && REMOVED.has(m[2])) {
			removed += 1;
			continue;
		}
		kept.push(line);
	}
	return {
		source: source.slice(0, start) + kept.join("\n") + source.slice(end),
		removed,
	};
}

let schema = readFileSync(schemaPath, "utf8");
const models = stripAuthBlocks(schema, "model");
schema = models.source;
const enums = stripAuthBlocks(schema, "enum");
schema = enums.source;
const users = stripUsersRelations(schema);
schema = users.source;
schema = schema.replace(/\n{3,}/g, "\n\n");

const total = models.removed + enums.removed + users.removed;
if (total === 0) {
	console.log("prune-auth-models: schema already pruned — no changes.");
} else {
	writeFileSync(schemaPath, schema);
	console.log(
		`prune-auth-models: removed ${models.removed} auth model(s), ` +
			`${enums.removed} auth enum(s), ${users.removed} dangling relation field(s) from users.`,
	);
	console.log("Next: npx prisma validate && npx prisma generate");
}
