-- Task 2.4: pg_trgm GIN indexes for profile search.
-- `searchProfilesForProject` uses ILIKE (contains, mode: insensitive) across
-- first_name / last_name / email; btree cannot serve that pattern, so the
-- trigram GIN indexes below turn the sequential scan into an index scan.
-- Requires the pg_trgm extension (Supabase ships it by default).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Profiles_email_trgm_idx" ON "Profiles" USING GIN ("email" gin_trgm_ops);
CREATE INDEX "Profiles_first_name_trgm_idx" ON "Profiles" USING GIN ("first_name" gin_trgm_ops);
CREATE INDEX "Profiles_last_name_trgm_idx" ON "Profiles" USING GIN ("last_name" gin_trgm_ops);
