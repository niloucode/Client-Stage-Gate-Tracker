import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		// `npx prisma db seed` runs this idempotent backfill utility
		// (only touches rows with sort_key IS NULL; safe to re-run).
		seed: "node scripts/seed-sort-keys.mjs",
	},
	datasource: {
		// Migrations run against the direct Supabase connection (pgBouncer
		// doesn't support all migration operations); fall back to DATABASE_URL
		// so CLI commands still work when DIRECT_URL is unset locally.
		url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
		// Supabase's managed Postgres cannot create databases, so `prisma
		// migrate dev` needs a LOCAL Postgres as its shadow database:
		//   docker run -d --name pg-shadow -e POSTGRES_PASSWORD=postgres \
		//     -e POSTGRES_DB=shadow -p 5433:5432 postgres:16-alpine
		// then set SHADOW_DATABASE_URL (see .env.example).
		shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
	},
});
