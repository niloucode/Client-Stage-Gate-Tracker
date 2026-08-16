-- AlterTable
-- 2026-08-15 spec: ticket planned-start is optional (nullable); planned end stays NOT NULL.
-- NOTE (2026-08-16): `Tickets.plan_start_at` was missing from the migration
-- chain (present only out-of-band on the live Supabase DB) — a fresh
-- shadow-DB replay failed here. ADD COLUMN IF NOT EXISTS is a no-op on the
-- live DB and creates the nullable column on fresh databases.
ALTER TABLE "Tickets" ADD COLUMN IF NOT EXISTS "plan_start_at" TIMESTAMPTZ(6);
ALTER TABLE "Tickets" ALTER COLUMN "plan_start_at" DROP NOT NULL;
