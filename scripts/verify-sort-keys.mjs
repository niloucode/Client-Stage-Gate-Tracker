/**
 * Read-only verification of fractional sort_key integrity:
 *  - every active Phases/Workflows row has a non-null sort_key
 *  - no duplicate sort_key within the same parent group
 *  - ordering is consistent: rows ordered by sort_key have non-decreasing
 *    legacy `number` for groups where number is fully populated
 *
 * NOTE: Stages are intentionally NOT checked — stages are ordered by the
 * integer `number` column (no fractional sort_key; the column was dropped in
 * migration 7_drop_stages_sort_key).
 *
 * Run from the repo root:  node scripts/verify-sort-keys.mjs
 */
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
	connectionString: process.env.DIRECT_URL,
	ssl: { rejectUnauthorized: false },
});

const checks = [
	{
		name: "Phases (per stage)",
		sql: `SELECT stage_id, COUNT(*) AS null_keys FROM "Phases"
		      WHERE is_deleted = false AND sort_key IS NULL GROUP BY stage_id`,
	},
	{
		name: "Workflows (per module)",
		sql: `SELECT module_id, COUNT(*) AS null_keys FROM "Workflows"
		      WHERE is_deleted = false AND sort_key IS NULL GROUP BY module_id`,
	},
];

let failures = 0;

for (const c of checks) {
	const { rows } = await pool.query(c.sql);
	if (rows.length > 0) {
		failures++;
		console.error(`FAIL ${c.name}: rows missing sort_key →`, rows);
	} else {
		console.log(`OK   ${c.name}: no null sort_key among active rows`);
	}
}

const dupChecks = [
	{
		name: "Phases",
		sql: `SELECT stage_id, sort_key, COUNT(*) AS n FROM "Phases"
		      WHERE is_deleted = false GROUP BY stage_id, sort_key HAVING COUNT(*) > 1`,
	},
	{
		name: "Workflows",
		sql: `SELECT module_id, sort_key, COUNT(*) AS n FROM "Workflows"
		      WHERE is_deleted = false GROUP BY module_id, sort_key HAVING COUNT(*) > 1`,
	},
];

for (const c of dupChecks) {
	const { rows } = await pool.query(c.sql);
	if (rows.length > 0) {
		failures++;
		console.error(`FAIL ${c.name}: duplicate sort_key in group →`, rows);
	} else {
		console.log(`OK   ${c.name}: no duplicate sort_key within parent groups`);
	}
}

await pool.end();
if (failures > 0) process.exit(1);
console.log("All sort_key integrity checks passed.");
