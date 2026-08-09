import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

/**
 * ADMIN-ONLY Supabase client (service role).
 *
 * WARNING: Runs with full admin privileges and BYPASSES Postgres RLS.
 * Must NEVER be imported from request-handling code. Only use for
 * explicitly isolated background/storage operations (e.g. contract file
 * upload/removal in `src/entities/contract/contractActions.ts`).
 *
 * For normal request-scoped access use `@/lib/supabase/server` (anon key).
 */
export function createAdminClient() {
	return createClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.SUPABASE_SERVICE_ROLE_KEY,
	);
}
