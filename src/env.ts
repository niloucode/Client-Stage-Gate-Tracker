import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Build-time validated environment variables (Task 1.8).
 *
 * - Server-only vars (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY) can never
 *   be referenced from client bundles — importing `env` server-side is
 *   required and the t3 runtime schema throws if a server var is missing.
 * - Client vars are prefixed NEXT_PUBLIC_ and inlined by Next.js.
 * - Fails fast at build/runtime start on missing required config instead
 *   of silently producing `undefined` behavior.
 */
export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		// Direct Postgres connection used by prisma.config.ts for migrations
		// and by scripts/seed-sort-keys.mjs. Optional: the Prisma CLI falls
		// back to DATABASE_URL when it's unset.
		DIRECT_URL: z.string().min(1).optional(),
		SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
		// Optional HMAC pepper for client invite codes (Clients.invite_code_hash).
		// Falls back to an in-code dev pepper with a warning when unset.
		CLIENT_INVITE_PEPPER: z.string().optional(),
		// Optional comma-separated Prisma log levels (query,info,warn,error).
		// Parsed in src/lib/prisma.ts; defaults to ["error","warn"].
		PRISMA_LOG_LEVEL: z.string().optional(),
	},
	client: {
		NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
		// Optional so local dev works without it; used for site URLs
		// (email links / redirects).
		NEXT_PUBLIC_SITE_URL: z.url().optional(),
		// Optional comma-separated extra origins for the CSP connect-src
		// allowlist; consumed in src/proxy.ts.
		NEXT_PUBLIC_ALLOWED_CONNECT_ORIGINS: z.string().optional(),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		DIRECT_URL: process.env.DIRECT_URL,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		CLIENT_INVITE_PEPPER: process.env.CLIENT_INVITE_PEPPER,
		PRISMA_LOG_LEVEL: process.env.PRISMA_LOG_LEVEL,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
		NEXT_PUBLIC_ALLOWED_CONNECT_ORIGINS:
			process.env.NEXT_PUBLIC_ALLOWED_CONNECT_ORIGINS,
	},
	emptyStringAsUndefined: true,
	// Client vars must be explicitly referenced so they're inlined.
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
