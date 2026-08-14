-- 2026-08-15 issue-reporting integration spec:
--   - Issues become project-scoped (project_id FK, NOT NULL — every issue
--     belongs to exactly one project; same invariant style as contracts.client_id).
--   - Issues record the reporter (reported_by FK) and a created timestamp
--     (reported_at) so the UI can show "Reported By X on <date>" with real data.
--   - Issues gain a status column (UNLINKED/LINKED/RESOLVED): an issue is
--     RESOLVED when its linked ticket is FINISHED; LINKED while the linked
--     ticket is pending/in progress; UNLINKED when no ticket is linked.
--   - Tickets.issue_id becomes UNIQUE (1-to-1 issue<->ticket per spec: an
--     issue can only be linked to a ticket once).
-- Hand-written: `migrate dev` is blocked by pre-existing shadow-DB drift
-- (P3018 on migration 4). Apply to Supabase out-of-band. Rollback = revert.

-- Issue status enum
CREATE TYPE "IssueStatus" AS ENUM ('UNLINKED', 'LINKED', 'RESOLVED');

-- Project scoping + reporter + timestamp
ALTER TABLE "public"."Issues" ADD COLUMN "project_id" uuid;
ALTER TABLE "public"."Issues" ADD COLUMN "reported_by" uuid;
ALTER TABLE "public"."Issues" ADD COLUMN "reported_at" timestamptz(6) NOT NULL DEFAULT now();
ALTER TABLE "public"."Issues" ADD COLUMN "status" "IssueStatus" NOT NULL DEFAULT 'UNLINKED';

-- No create-issue path existed before this migration, so any pre-existing
-- rows are manual/test inserts without a project; drop them so the NOT NULL
-- constraint is enforceable.
DELETE FROM "public"."Issues" WHERE "project_id" IS NULL;

ALTER TABLE "public"."Issues" ALTER COLUMN "project_id" SET NOT NULL;

ALTER TABLE "public"."Issues" ADD CONSTRAINT "Issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."Projects"("project_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."Issues" ADD CONSTRAINT "Issues_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."Profiles"("profile_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX "Issues_project_id_idx" ON "public"."Issues"("project_id");

-- 1-to-1 issue<->ticket: replace the plain index with a unique index
-- (nullable column, so multiple NULLs remain allowed).
DROP INDEX IF EXISTS "public"."Tickets_issue_id_idx";
CREATE UNIQUE INDEX "Tickets_issue_id_key" ON "public"."Tickets"("issue_id");
