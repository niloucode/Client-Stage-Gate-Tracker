/**
 * One-off seeding utility: backfills `sort_key` (fractional-indexing keys) for
 * existing Stages / Phases / Workflows rows, ordered by their legacy `number`
 * column. Idempotent: only rows with `sort_key IS NULL` are touched.
 *
 * Run from the repo root:  node scripts/seed-sort-keys.mjs
 */
import "dotenv/config";
import pg from "pg";
import { generateKeyBetween } from "fractional-indexing";

const pool = new pg.Pool({
	connectionString: process.env.DIRECT_URL,
	ssl: { rejectUnauthorized: false },
});

async function assignKeys(table, idColumn, rows) {
	let prev = null;
	let count = 0;
	for (const row of rows) {
		const key = generateKeyBetween(prev, null);
		await pool.query(`UPDATE "${table}" SET sort_key = $1 WHERE "${idColumn}" = $2`, [
			key,
			row[idColumn],
		]);
		prev = key;
		count++;
	}
	return count;
}

async function main() {
	let total = 0;

	const stages = await pool.query(
		`SELECT stage_id FROM "Stages" WHERE is_deleted = false AND sort_key IS NULL ORDER BY number ASC NULLS LAST`,
	);
	const stagesByProject = new Map();
	for (const s of stages.rows) {
		const { project_id } = (
			await pool.query(
				`SELECT project_id FROM "Stages" WHERE stage_id = $1`,
				[s.stage_id],
			)
		).rows[0];
		if (!stagesByProject.has(project_id)) stagesByProject.set(project_id, []);
		stagesByProject.get(project_id).push(s);
	}
	for (const [, group] of stagesByProject) {
		total += await assignKeys("Stages", "stage_id", group);
	}

	const phases = await pool.query(
		`SELECT phase_id, stage_id FROM "Phases" WHERE is_deleted = false AND sort_key IS NULL ORDER BY number ASC NULLS LAST`,
	);
	const phasesByStage = new Map();
	for (const p of phases.rows) {
		if (!phasesByStage.has(p.stage_id)) phasesByStage.set(p.stage_id, []);
		phasesByStage.get(p.stage_id).push(p);
	}
	for (const [, group] of phasesByStage) {
		total += await assignKeys("Phases", "phase_id", group);
	}

	const workflows = await pool.query(
		`SELECT workflow_id, module_id FROM "Workflows" WHERE is_deleted = false AND sort_key IS NULL ORDER BY number ASC NULLS LAST`,
	);
	const wfsByModule = new Map();
	for (const w of workflows.rows) {
		if (!wfsByModule.has(w.module_id)) wfsByModule.set(w.module_id, []);
		wfsByModule.get(w.module_id).push(w);
	}
	for (const [, group] of wfsByModule) {
		total += await assignKeys("Workflows", "workflow_id", group);
	}

	console.log(`Seeded sort_key for ${total} rows.`);
	await pool.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
