-- AlterTable
-- 2026-08-15 spec: ticket planned-start is optional (nullable); planned end stays NOT NULL.
ALTER TABLE "Tickets" ALTER COLUMN "plan_start_at" DROP NOT NULL;
