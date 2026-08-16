-- AlterTable
-- NOTE (2026-08-16): the 0_init baseline has no Stages.sort_key (it was
-- already gone from the introspected DB), so a fresh shadow-DB replay
-- failed here. IF EXISTS keeps the drop a no-op on fresh databases and
-- still drops the legacy column where it exists.
ALTER TABLE "Stages" DROP COLUMN IF EXISTS "sort_key";
