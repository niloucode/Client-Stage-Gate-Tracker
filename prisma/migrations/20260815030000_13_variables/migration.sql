-- 2026-08-15 variables integration spec:
--   - New Variables table: project-scoped credentials/links/repos.
--   - client_visible gates what the client portal sees (the value/address
--     column); hidden rows are never sent to client viewers (user decision).
--   - notes_team is team-only; notes_client is what clients see.
--   - Soft delete via is_deleted/deleted_at (project rule 1).
-- Hand-written: `migrate dev` is blocked by pre-existing shadow-DB drift
-- (P3018 on migration 4). Apply to Supabase out-of-band. Rollback = revert.

CREATE TYPE "VariableType" AS ENUM ('LINK', 'CREDENTIAL', 'REPOSITORY');

CREATE TABLE "Variables" (
  "variable_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "name" text NOT NULL,
  "type" "VariableType" NOT NULL,
  "value" text NOT NULL,
  "client_visible" boolean NOT NULL DEFAULT false,
  "notes_team" text NOT NULL DEFAULT '',
  "notes_client" text NOT NULL DEFAULT '',
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz(6),
  CONSTRAINT "Variables_pkey" PRIMARY KEY ("variable_id")
);

CREATE INDEX "Variables_project_id_is_deleted_idx" ON "public"."Variables"("project_id", "is_deleted");

ALTER TABLE "public"."Variables" ADD CONSTRAINT "Variables_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."Projects"("project_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
