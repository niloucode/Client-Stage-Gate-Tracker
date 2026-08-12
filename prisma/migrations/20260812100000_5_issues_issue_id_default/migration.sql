-- Review follow-up: Issues.issue_id DB default.
--
-- schema.prisma declares
--   issue_id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
-- but migration 4 (20260811213000_4_gate_issue_ticket_evolution) created the
-- column with no DEFAULT, so the first INSERT of an issue via Prisma would
-- violate NOT NULL (Prisma omits dbgenerated columns from inserts).
-- gen_random_uuid() is a core function since PostgreSQL 13 (Supabase PG15+),
-- no extension required.

ALTER TABLE "Issues" ALTER COLUMN "issue_id" SET DEFAULT gen_random_uuid();
