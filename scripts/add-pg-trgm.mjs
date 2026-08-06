/**
 * Enables the pg_trgm extension and creates GIN trigram indexes on the
 * Profiles name/email columns, powering the ILIKE '%term%' profile search
 * used by searchProfilesForProject. Idempotent (IF NOT EXISTS).
 *
 * Run from the repo root:  node scripts/add-pg-trgm.mjs
 */
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
	connectionString: process.env.DIRECT_URL,
	ssl: { rejectUnauthorized: false },
});

async function main() {
	await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
	await pool.query(
		`CREATE INDEX IF NOT EXISTS "Profiles_first_name_trgm_idx"
		 ON "Profiles" USING gin (first_name gin_trgm_ops)`,
	);
	await pool.query(
		`CREATE INDEX IF NOT EXISTS "Profiles_last_name_trgm_idx"
		 ON "Profiles" USING gin (last_name gin_trgm_ops)`,
	);
	await pool.query(
		`CREATE INDEX IF NOT EXISTS "Profiles_email_trgm_idx"
		 ON "Profiles" USING gin (email gin_trgm_ops)`,
	);

	const { rows } = await pool.query(
		`SELECT indexname FROM pg_indexes
		 WHERE tablename = 'Profiles' AND indexdef ILIKE '%gin_trgm_ops%'
		 ORDER BY indexname`,
	);
	console.log("Trigram indexes present:", rows.map((r) => r.indexname).join(", "));
	await pool.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
