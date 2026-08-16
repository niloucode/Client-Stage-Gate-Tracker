-- Schema evolution: gates → stages, ticket invariants, issues (Task: schema review)
--
-- NOTE FOR OPERATORS
-- 1. This migration was hand-written because prisma/schema.prisma now prunes
--    the Supabase-managed auth tables (kept: auth.users only). Running
--    `prisma migrate dev` with auto-diff would generate DROPs for those
--    tables — never apply such a diff. Create new migrations with
--    `prisma migrate dev --create-only` and review, or hand-write like this.
-- 2. Constraint/index names below follow Prisma's default naming
--    ({table}_{col1}_{col2}_key / {table}_{col}_idx). Verify with
--    `\d "Gates"` etc. before applying if the DB drifted from the last
--    migration.
-- 3. Backfill requirements:
--    - "Tickets"."workflow_id" SET NOT NULL fails if orphan tickets exist
--      (workflow_id IS NULL). Resolve orphans BEFORE applying.
--    - "Gates"."stage_id" is nullable on purpose: existing gates have no
--      stage link to backfill from. Re-map gates to stages in app data,
--      then make the column NOT NULL in a later migration.
--    - "Clients"."tin" unique index fails if duplicate TINs exist.

-- ── 1. New enum types ───────────────────────────────────────────────────────
CREATE TYPE "GateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "IssueUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- ── 2. Gates: project_id → stage_id, status ─────────────────────────────────
ALTER TABLE "Gates" DROP COLUMN "project_id"; -- drops FK + project_id index
ALTER TABLE "Gates" ADD COLUMN "stage_id" uuid;
ALTER TABLE "Gates" ADD CONSTRAINT "Gates_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "Stages"("stage_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "Gates" ADD COLUMN "status" "GateStatus" NOT NULL DEFAULT 'PENDING';
CREATE INDEX "Gates_stage_id_idx" ON "Gates"("stage_id");
-- Old full unique on (project_id, number) is gone with the column; recreate
-- as a partial unique so soft-deleted gates don't block number reuse.
CREATE UNIQUE INDEX "Gates_stage_id_number_key" ON "Gates"("stage_id", "number") WHERE "is_deleted" = false;

-- ── 3. Partial unique indexes (numbers reusable after soft-delete) ──────────
-- NOTE (2026-08-16): the DROP CONSTRAINTs below originally failed on fresh
-- shadow-DB replays (P3018, "migrate dev" blocker). `0_init` creates these
-- names as UNIQUE INDEXes (Prisma baseline), while the live Supabase DB has
-- (or had) them as table constraints — DROP CONSTRAINT works on one form and
-- fails on the other. The DO-blocks drop whichever form exists and are
-- no-ops when neither does, so the migration replays on any Postgres.
DO $$
BEGIN
  BEGIN
    ALTER TABLE "Stages" DROP CONSTRAINT "Stages_project_id_number_key";
  EXCEPTION WHEN undefined_object THEN
    DROP INDEX IF EXISTS "Stages_project_id_number_key";
  END;
END $$;
CREATE UNIQUE INDEX "Stages_project_id_number_key" ON "Stages"("project_id", "number") WHERE "is_deleted" = false;

DO $$
BEGIN
  BEGIN
    ALTER TABLE "Phases" DROP CONSTRAINT "Phases_stage_id_number_key";
  EXCEPTION WHEN undefined_object THEN
    DROP INDEX IF EXISTS "Phases_stage_id_number_key";
  END;
END $$;
CREATE UNIQUE INDEX "Phases_stage_id_number_key" ON "Phases"("stage_id", "number") WHERE "is_deleted" = false;

DO $$
BEGIN
  BEGIN
    ALTER TABLE "Workflows" DROP CONSTRAINT "unique_workflow_number_module";
  EXCEPTION WHEN undefined_object THEN
    DROP INDEX IF EXISTS "unique_workflow_number_module";
  END;
END $$;
-- NOTE (2026-08-16): `Workflows.number` was missing from the migration
-- chain entirely (present only out-of-band on the live Supabase DB) — a
-- fresh replay failed here. The schema declares it nullable (`Int?`).
ALTER TABLE "Workflows" ADD COLUMN "number" INTEGER;
CREATE UNIQUE INDEX "unique_workflow_number_module" ON "Workflows"("number", "module_id") WHERE "is_deleted" = false;

-- ── 4. Clients.tin unique ───────────────────────────────────────────────────
CREATE UNIQUE INDEX "Clients_tin_key" ON "Clients"("tin");

-- ── 5. Tickets: workflow_id NOT NULL, subtask self-relation, issue link ─────
ALTER TABLE "Tickets" ALTER COLUMN "workflow_id" SET NOT NULL;
ALTER TABLE "Tickets" ADD COLUMN "parent_id" uuid;
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Tickets"("ticket_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
CREATE INDEX "Tickets_parent_id_idx" ON "Tickets"("parent_id");

ALTER TABLE "Tickets" ADD COLUMN "issue_id" uuid;
-- FK + index for issue_id are added AFTER the Issues table is created below:
-- PostgreSQL rejects a FK referencing a table that does not exist yet.

CREATE INDEX "Tickets_workflow_id_status_idx" ON "Tickets"("workflow_id", "status");
CREATE INDEX "Tickets_status_is_deleted_idx" ON "Tickets"("status", "is_deleted");

-- ── 6. New tables: Issues / IssueSteps ──────────────────────────────────────
CREATE TABLE "Issues" (
    "issue_id" uuid NOT NULL,
    "name" text NOT NULL,
    "type" text NOT NULL,
    "description" text,
    "urgency" "IssueUrgency" NOT NULL,
    "system_environment" text,
    "time_of_error" timestamptz(6),
    CONSTRAINT "Issues_pkey" PRIMARY KEY ("issue_id")
);

CREATE TABLE "IssueSteps" (
    "issue_id" uuid NOT NULL,
    "number" integer NOT NULL,
    "step" text NOT NULL,
    "image" text,
    CONSTRAINT "IssueSteps_pkey" PRIMARY KEY ("issue_id", "number")
);

ALTER TABLE "IssueSteps" ADD CONSTRAINT "IssueSteps_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "Issues"("issue_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Tickets.issue_id link (moved here: Issues must exist before the FK is added)
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "Issues"("issue_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
CREATE INDEX "Tickets_issue_id_idx" ON "Tickets"("issue_id");

-- ── 7. ImageParentType gains ISSUE_STEP ─────────────────────────────────────
ALTER TYPE "ImageParentType" ADD VALUE 'ISSUE_STEP';
