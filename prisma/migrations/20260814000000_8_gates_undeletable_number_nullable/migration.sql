-- 2026-08-14: Gates model synced to the Supabase-side edit (gates are
-- undeletable and gate numbers are nullable).
--
-- Two directions are supported:
--   1. Environment WITHOUT the manual edit: `prisma migrate deploy` applies
--      this migration from scratch (idempotent DDL below).
--   2. Environment that already got the manual Supabase edit: record this
--      migration as applied without re-running it —
--        npx prisma migrate resolve --applied 20260814000000_8_gates_undeletable_number_nullable
--      (the IF EXISTS forms also make a plain `deploy` a safe no-op there).

-- DropIndex: partial unique index was predicated on is_deleted (now gone)
DROP INDEX IF EXISTS "Gates_stage_id_number_key";

-- AlterTable: gates can no longer be soft-deleted
ALTER TABLE "Gates" DROP COLUMN IF EXISTS "is_deleted";
ALTER TABLE "Gates" DROP COLUMN IF EXISTS "deleted_at";

-- AlterTable: gate number is optional
ALTER TABLE "Gates" ALTER COLUMN "number" DROP NOT NULL;

-- AlterTable: every gate belongs to a stage. Guarded: migration 4 kept
-- stage_id nullable because legacy gates had no stage link to backfill
-- from. If such rows still exist here, abort with an actionable message
-- instead of failing mid-migration.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Gates" WHERE "stage_id" IS NULL) THEN
        RAISE EXCEPTION
            'Cannot set Gates.stage_id NOT NULL: % legacy gate(s) have no stage link. '
            'Backfill Gates.stage_id first (matching the 2026-08-14 Supabase edit).',
            (SELECT COUNT(*) FROM "Gates" WHERE "stage_id" IS NULL);
    END IF;
END $$;

ALTER TABLE "Gates" ALTER COLUMN "stage_id" SET NOT NULL;
