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
		DIRECT_URL: z.string().min(1).optional(),
		SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
	},
	client: {
		NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
		NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		DIRECT_URL: process.env.DIRECT_URL,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
	},
	emptyStringAsUndefined: true,
	// Client vars must be explicitly referenced so they're inlined.
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
