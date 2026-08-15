-- 2026-08-15 gate-overview integration spec:
--   - GateSignatures is DROPPED: the approval model is status-based now
--     (Gates.status = APPROVED/REJECTED + a per-gate feedback comment),
--     so the table would stay unused (user decision 2026-08-15).
--   - Gates.creation_date is dropped (spec 3): gates are ordered by `number`.
--   - Gates gains comment_id (spec 4-5): FK to the approve/decline feedback
--     comment (Comments row with parent_type = GATE_COMMENT, parent_id = gate).
-- Hand-written: `migrate dev` is blocked by pre-existing shadow-DB drift
-- (P3018 on migration 4). Apply to Supabase out-of-band. Rollback = revert.

DROP TABLE "public"."GateSignatures";

ALTER TABLE "public"."Gates" DROP COLUMN "creation_date";

ALTER TABLE "public"."Gates" ADD COLUMN "comment_id" uuid;
ALTER TABLE "public"."Gates" ADD CONSTRAINT "Gates_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."Comments"("comment_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
-- 1:1 feedback comment per gate (Prisma relation requires the unique side).
CREATE UNIQUE INDEX "Gates_comment_id_key" ON "public"."Gates"("comment_id");
