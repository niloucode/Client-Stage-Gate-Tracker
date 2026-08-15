-- 2026-08-15 tag-manager integration spec:
--   - Tags.is_protected: system tags (API, Bugs, Integration, Production)
--     cannot be deleted — enforced server-side (softDeleteTag), not by
--     hardcoded UI name checks.
--   - Existing rows matching the protected names are flagged; the two
--     missing system tags (Integration, Production) are seeded so the
--     pinned set is real.
-- Hand-written: `migrate dev` is blocked by pre-existing shadow-DB drift.
-- Apply to Supabase out-of-band. Rollback = revert.

ALTER TABLE "public"."Tags" ADD COLUMN "is_protected" boolean NOT NULL DEFAULT false;

UPDATE "public"."Tags" SET "is_protected" = true
WHERE "name" IN ('API', 'Bugs', 'Integration', 'Production') AND "is_deleted" = false;

INSERT INTO "public"."Tags" ("name", "description", "color", "is_deleted", "is_protected") VALUES
('Integration', 'Third-party system integrations', '#0EA5E9', false, true),
('Production', 'Production-environment concerns', '#F59E0B', false, true)
ON CONFLICT ("name") DO NOTHING;
