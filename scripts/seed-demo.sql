-- ============================================================================
-- DEMO SEED — Stage-Gate Tracker
-- 2026-08-15 · Dense demo data around the 3 demonstration accounts:
--   • JP Castillo   (Project Owner)  jpcastillo@gmail.com
--   • Angela Lim    (Project Team)   angela.lim@gmail.com
--   • Jacob Ong     (Client)         jacob_ong@primefoods.com
--
-- PREREQUISITES
--   1. The 3 accounts must already exist (they do — verified against the
--      DB dump; Profiles.profile_id == auth.users.id, so auth is untouched).
--   2. Upload the demo assets FIRST (storage buckets):
--        node --env-file=.env scripts/seed-demo-assets.mjs
--      (uploads Lorem_ipsum.png → images/demo/lorem-ipsum-{1..4}.png and the
--      PDF → contracts/<project>/primefoods-portal-agreement.pdf)
--   3. Apply this file:
--        npx prisma db execute --file scripts/seed-demo.sql
--
-- IDEMPOTENCY
--   Every demo row uses fixed `d3adbeef-…` UUIDs. Re-running fails on the
--   first PK conflict and the whole transaction rolls back — safe.
--   To RESET the demo data, run the ROLLBACK block at the bottom first.
--
-- CONSISTENCY
--   Ticket actual dates drive the rollup columns (Workflows ← Tickets,
--   Modules ← Workflows, Phases ← Modules) using the same rules as
--   src/entities/ticket/lib/dateRollup.ts; gate approval materializes
--   stage dates (stage N actual_end_at = approval, stage N+1 actual_start_at
--   = same date) per entities/gate/gateActions.ts.
-- ============================================================================

BEGIN;

-- ── Tags (2 new) ────────────────────────────────────────────────────────────
INSERT INTO "public"."Tags" ("tag_id", "name", "description", "color", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000401', 'Frontend', 'Portal UI work', '#6366F1', false),
('d3adbeef-0000-4000-8000-000000000402', 'Backend', 'API & integration work', '#10B981', false);

-- ── Demo project + contract + role assignments ──────────────────────────────
INSERT INTO "public"."Projects" ("project_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000001', 'PrimeFoods Customer Portal', 'Self-service customer portal with order history, warehouse dashboards and checkout for PrimeFoods Corporation.', 'ACTIVE', '2026-06-15T08:00:00Z', '2026-10-30T17:00:00Z', '2026-06-16T09:00:00Z', NULL, false);

INSERT INTO "public"."Contracts" ("contract_id", "project_id", "client_id", "contract_name", "file_path", "client_signature", "project_owner_signature", "client_initials", "project_owner_initials", "client_signed_at", "project_owner_signed_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000002', 'd3adbeef-0000-4000-8000-000000000001', '7a97516b-3ce6-44fd-bc4e-e500d53f44b3', 'PrimeFoods Portal Agreement', 'd3adbeef-0000-4000-8000-000000000001/primefoods-portal-agreement.pdf', 'Jacob Ong', 'John Paul Castillo', 'JO', 'JC', '2026-06-20T09:00:00Z', '2026-06-20T10:30:00Z', false);

INSERT INTO "public"."RoleAssignments" ("role_id", "user_id", "project_id") VALUES
('c140ee09-cf1e-409d-9b0a-c1ab705a694b', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'd3adbeef-0000-4000-8000-000000000001'),
('01795de2-f46b-4224-84c2-93fbf7fb56d7', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', 'd3adbeef-0000-4000-8000-000000000001'),
('01795de2-f46b-4224-84c2-93fbf7fb56d7', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', 'd3adbeef-0000-4000-8000-000000000001'),
('01795de2-f46b-4224-84c2-93fbf7fb56d7', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', 'd3adbeef-0000-4000-8000-000000000001');

-- ── Stage 1 — Discovery & Planning (APPROVED gate) ─────────────────────────
INSERT INTO "public"."Stages" ("stage_id", "project_id", "number", "name", "description", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000101', 'd3adbeef-0000-4000-8000-000000000001', 1, 'Discovery & Planning', 'Requirements, UX and system architecture — locked at the gate review.', '2026-06-16T09:00:00Z', '2026-07-11T17:00:00Z', '2026-06-16T09:00:00Z', '2026-07-14T14:00:00Z', false);

INSERT INTO "public"."Comments" ("comment_id", "profile_id", "description", "parent_type", "parent_id", "creation_date", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000103', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'Discovery phase approved. Requirements and architecture are locked — proceeding to build.', 'GATE_COMMENT', 'd3adbeef-0000-4000-8000-000000000102', '2026-07-14T14:00:00Z', false);

INSERT INTO "public"."Gates" ("gate_id", "stage_id", "number", "status", "comment_id") VALUES
('d3adbeef-0000-4000-8000-000000000102', 'd3adbeef-0000-4000-8000-000000000101', 1, 'APPROVED', 'd3adbeef-0000-4000-8000-000000000103');

INSERT INTO "public"."Images" ("image_id", "image_src", "parent_type", "parent_id", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000801', 'https://gwpcywphjekefzoftntk.supabase.co/storage/v1/object/public/images/demo/lorem-ipsum-4.png', 'GATE_COMMENT', 'd3adbeef-0000-4000-8000-000000000103', false);

-- ── Stage 1 phases / modules / workflows / tickets ─────────────────────────
INSERT INTO "public"."Phases" ("phase_id", "stage_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000111', 'd3adbeef-0000-4000-8000-000000000101', 1, 'Requirements & UX Research', 'a0', '2026-06-16T09:00:00Z', '2026-06-28T17:00:00Z', '2026-06-16T09:00:00Z', '2026-07-01T17:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000112', 'd3adbeef-0000-4000-8000-000000000101', 2, 'System Architecture', 'a1', '2026-07-01T09:00:00Z', '2026-07-10T17:00:00Z', '2026-07-01T09:00:00Z', '2026-07-14T13:00:00Z', false);

INSERT INTO "public"."Modules" ("module_id", "phase_id", "name", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000121', 'd3adbeef-0000-4000-8000-000000000111', 'UX Prototyping', '2026-06-16T09:00:00Z', '2026-06-28T17:00:00Z', '2026-06-16T09:00:00Z', '2026-07-01T17:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000122', 'd3adbeef-0000-4000-8000-000000000112', 'Architecture Design', '2026-07-01T09:00:00Z', '2026-07-10T17:00:00Z', '2026-07-01T09:00:00Z', '2026-07-14T13:00:00Z', false);

INSERT INTO "public"."Workflows" ("workflow_id", "module_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000131', 'd3adbeef-0000-4000-8000-000000000121', 1, 'Wireframes & Prototypes', 'a0', '2026-06-16T09:00:00Z', '2026-06-28T17:00:00Z', '2026-06-16T09:00:00Z', '2026-06-30T17:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000132', 'd3adbeef-0000-4000-8000-000000000122', 1, 'Architecture & Data Model', 'a0', '2026-07-01T09:00:00Z', '2026-07-10T17:00:00Z', '2026-07-01T09:00:00Z', '2026-07-14T13:00:00Z', false);

INSERT INTO "public"."Tickets" ("ticket_id", "workflow_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "watcher_id", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000141', 'd3adbeef-0000-4000-8000-000000000131', 'Landing page wireframes', 'Home, catalog and product pages for the customer portal.', 'FINISHED', '2026-06-16T09:00:00Z', '2026-06-20T17:00:00Z', '2026-06-16T09:00:00Z', '2026-06-20T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000142', 'd3adbeef-0000-4000-8000-000000000131', 'Checkout flow prototypes', 'Interactive prototype of the 3-step checkout.', 'FINISHED', '2026-06-20T09:00:00Z', '2026-06-25T17:00:00Z', '2026-06-20T09:00:00Z', '2026-06-26T15:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000143', 'd3adbeef-0000-4000-8000-000000000131', 'Client review of UX mockups', 'Walkthrough with PrimeFoods stakeholders; collect feedback.', 'FINISHED', '2026-06-25T09:00:00Z', '2026-06-28T17:00:00Z', '2026-06-26T09:00:00Z', '2026-06-30T17:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000144', 'd3adbeef-0000-4000-8000-000000000132', 'Database schema for orders & inventory', 'Design and document the orders/inventory data model.', 'FINISHED', '2026-07-01T09:00:00Z', '2026-07-06T17:00:00Z', '2026-07-01T09:00:00Z', '2026-07-07T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000145', 'd3adbeef-0000-4000-8000-000000000132', 'API contract design', 'REST contracts for orders, catalog and warehouse endpoints.', 'FINISHED', '2026-07-04T09:00:00Z', '2026-07-08T17:00:00Z', '2026-07-04T09:00:00Z', '2026-07-09T16:00:00Z', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', false),
('d3adbeef-0000-4000-8000-000000000146', 'd3adbeef-0000-4000-8000-000000000132', 'Infra blueprint + security review', 'Hosting architecture, secrets strategy and threat model.', 'FINISHED', '2026-07-08T09:00:00Z', '2026-07-10T17:00:00Z', '2026-07-08T09:00:00Z', '2026-07-14T13:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false);

-- ── Stage 2 — Build & Launch (PENDING gate) ─────────────────────────────────
INSERT INTO "public"."Stages" ("stage_id", "project_id", "number", "name", "description", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000201', 'd3adbeef-0000-4000-8000-000000000001', 2, 'Build & Launch', 'Portal build, integrations, QA and launch — gate pending until all phases finish.', '2026-07-14T09:00:00Z', '2026-10-30T17:00:00Z', '2026-07-14T14:00:00Z', NULL, false);

INSERT INTO "public"."Gates" ("gate_id", "stage_id", "number", "status", "comment_id") VALUES
('d3adbeef-0000-4000-8000-000000000202', 'd3adbeef-0000-4000-8000-000000000201', 1, 'PENDING', NULL);

INSERT INTO "public"."Phases" ("phase_id", "stage_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000211', 'd3adbeef-0000-4000-8000-000000000201', 1, 'Core Development', 'a0', '2026-07-14T09:00:00Z', '2026-08-14T17:00:00Z', '2026-07-15T09:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000212', 'd3adbeef-0000-4000-8000-000000000201', 2, 'QA & Launch Prep', 'a1', '2026-09-01T09:00:00Z', '2026-10-25T17:00:00Z', NULL, NULL, false);

INSERT INTO "public"."Modules" ("module_id", "phase_id", "name", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000221', 'd3adbeef-0000-4000-8000-000000000211', 'Portal Frontend', '2026-07-14T09:00:00Z', '2026-08-12T17:00:00Z', '2026-07-15T09:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000222', 'd3adbeef-0000-4000-8000-000000000211', 'API & Integrations', '2026-07-21T09:00:00Z', '2026-08-14T17:00:00Z', '2026-07-22T09:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000223', 'd3adbeef-0000-4000-8000-000000000212', 'QA, UAT & Release', '2026-09-01T09:00:00Z', '2026-10-25T17:00:00Z', NULL, NULL, false);

INSERT INTO "public"."Workflows" ("workflow_id", "module_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000231', 'd3adbeef-0000-4000-8000-000000000221', 1, 'Frontend Development', 'a0', '2026-07-14T09:00:00Z', '2026-08-12T17:00:00Z', '2026-07-15T09:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000232', 'd3adbeef-0000-4000-8000-000000000222', 1, 'Backend & Integrations', 'a0', '2026-07-21T09:00:00Z', '2026-08-14T17:00:00Z', '2026-07-22T09:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000233', 'd3adbeef-0000-4000-8000-000000000223', 1, 'QA & UAT', 'a0', '2026-09-01T09:00:00Z', '2026-09-26T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000234', 'd3adbeef-0000-4000-8000-000000000223', 2, 'Release & Deployment', 'a1', '2026-10-05T09:00:00Z', '2026-10-25T17:00:00Z', NULL, NULL, false);

-- Tickets (stage 2). t10 has two subtasks (t12, t13) via parent_id.
INSERT INTO "public"."Tickets" ("ticket_id", "workflow_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "parent_id", "watcher_id", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000241', 'd3adbeef-0000-4000-8000-000000000231', 'Set up Next.js app shell + routing', 'Project scaffolding, layouts and route structure.', 'FINISHED', '2026-07-14T09:00:00Z', '2026-07-18T17:00:00Z', '2026-07-15T09:00:00Z', '2026-07-18T16:00:00Z', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000242', 'd3adbeef-0000-4000-8000-000000000231', 'Order history page', 'List orders with status, invoice download and reorder action.', 'FINISHED', '2026-07-18T09:00:00Z', '2026-07-25T17:00:00Z', '2026-07-18T09:00:00Z', '2026-07-24T16:00:00Z', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000243', 'd3adbeef-0000-4000-8000-000000000231', 'Shopping cart state + checkout UI', 'Cart store, quantity editing and the 3-step checkout screens.', 'IN_PROGRESS', '2026-07-24T09:00:00Z', '2026-07-31T17:00:00Z', '2026-07-28T09:00:00Z', NULL, NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', false),
('d3adbeef-0000-4000-8000-000000000244', 'd3adbeef-0000-4000-8000-000000000231', 'Warehouse dashboard (client view)', 'Role-gated dashboard for PrimeFoods warehouse staff.', 'PENDING', '2026-07-31T09:00:00Z', '2026-08-12T17:00:00Z', NULL, NULL, NULL, '32cde982-9911-46a1-8560-c68cbc73cd5a', false),
('d3adbeef-0000-4000-8000-000000000245', 'd3adbeef-0000-4000-8000-000000000231', 'Account settings + password change', 'Profile, security and notification preferences.', 'PENDING', '2026-08-05T09:00:00Z', '2026-08-12T17:00:00Z', NULL, NULL, NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000246', 'd3adbeef-0000-4000-8000-000000000231', 'Warehouse dashboard — inventory widgets', 'Low-stock and reorder-point widgets.', 'PENDING', '2026-08-01T09:00:00Z', '2026-08-08T17:00:00Z', NULL, NULL, 'd3adbeef-0000-4000-8000-000000000244', NULL, false),
('d3adbeef-0000-4000-8000-000000000247', 'd3adbeef-0000-4000-8000-000000000231', 'Warehouse dashboard — shipment list', 'Inbound/outbound shipment tracking table.', 'PENDING', '2026-08-05T09:00:00Z', '2026-08-10T17:00:00Z', NULL, NULL, 'd3adbeef-0000-4000-8000-000000000244', NULL, false),
('d3adbeef-0000-4000-8000-000000000251', 'd3adbeef-0000-4000-8000-000000000232', 'Orders API (CRUD + filters)', 'Orders endpoints with status/pagination filters.', 'FINISHED', '2026-07-21T09:00:00Z', '2026-07-29T17:00:00Z', '2026-07-22T09:00:00Z', '2026-07-29T16:00:00Z', NULL, '99aa1b75-022d-4fd7-ac97-3249f334e4c6', false),
('d3adbeef-0000-4000-8000-000000000252', 'd3adbeef-0000-4000-8000-000000000232', 'PrimeFoods inventory sync (ERP)', 'Nightly sync of stock levels from the PrimeFoods ERP.', 'IN_PROGRESS', '2026-07-29T09:00:00Z', '2026-08-10T17:00:00Z', '2026-08-01T09:00:00Z', NULL, NULL, '99aa1b75-022d-4fd7-ac97-3249f334e4c6', false),
('d3adbeef-0000-4000-8000-000000000253', 'd3adbeef-0000-4000-8000-000000000232', 'Payment gateway integration', 'Card payments via the processor; webhooks for settlement events.', 'PENDING', '2026-08-03T09:00:00Z', '2026-08-14T17:00:00Z', NULL, NULL, NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000261', 'd3adbeef-0000-4000-8000-000000000233', 'End-to-end test suite', 'Playwright suite covering checkout and order history.', 'PENDING', '2026-09-01T09:00:00Z', '2026-09-12T17:00:00Z', NULL, NULL, NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000262', 'd3adbeef-0000-4000-8000-000000000233', 'UAT with PrimeFoods warehouse team', 'Structured UAT sessions with Jacob''s warehouse staff.', 'PENDING', '2026-09-12T09:00:00Z', '2026-09-26T17:00:00Z', NULL, NULL, NULL, '32cde982-9911-46a1-8560-c68cbc73cd5a', false),
('d3adbeef-0000-4000-8000-000000000271', 'd3adbeef-0000-4000-8000-000000000234', 'CI/CD pipeline setup', 'Build, test and deploy pipelines for staging/production.', 'PENDING', '2026-10-05T09:00:00Z', '2026-10-15T17:00:00Z', NULL, NULL, NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', false),
('d3adbeef-0000-4000-8000-000000000272', 'd3adbeef-0000-4000-8000-000000000234', 'Production launch runbook', 'Deployment checklist, rollback plan and go-live checklist.', 'PENDING', '2026-10-15T09:00:00Z', '2026-10-25T17:00:00Z', NULL, NULL, NULL, NULL, false);

-- ── Issues (reported by the client too) + steps ─────────────────────────────
INSERT INTO "public"."Issues" ("issue_id", "project_id", "reported_by", "reported_at", "name", "type", "description", "urgency", "system_environment", "time_of_error", "status") VALUES
('d3adbeef-0000-4000-8000-000000000501', 'd3adbeef-0000-4000-8000-000000000001', '32cde982-9911-46a1-8560-c68cbc73cd5a', '2026-07-30T11:20:00Z', 'Checkout fails when applying promo code', 'not_saving', 'Promo code field accepts the code but the order never completes.', 'HIGH', 'Chrome v126 / Windows 11', '2026-07-30T11:18:00Z', 'LINKED'),
('d3adbeef-0000-4000-8000-000000000502', 'd3adbeef-0000-4000-8000-000000000001', '32cde982-9911-46a1-8560-c68cbc73cd5a', '2026-08-05T09:05:00Z', 'Warehouse dashboard shows stale stock counts', 'missing_fields', 'Stock counts are a day old when the ERP sync is delayed.', 'MEDIUM', 'Safari v18 / macOS', NULL, 'RESOLVED'),
('d3adbeef-0000-4000-8000-000000000503', 'd3adbeef-0000-4000-8000-000000000001', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-10T14:40:00Z', 'Slow page loads on the catalog', 'slow_loading', 'Catalog pages take 4-6s on the staging environment.', 'LOW', 'Chrome v126 / Windows 11', '2026-08-10T14:38:00Z', 'UNLINKED'),
('d3adbeef-0000-4000-8000-000000000504', 'd3adbeef-0000-4000-8000-000000000001', '32cde982-9911-46a1-8560-c68cbc73cd5a', '2026-08-12T08:30:00Z', 'Request: export orders to CSV', 'feature_request', 'Warehouse admins would like to export filtered order lists to CSV.', 'MEDIUM', NULL, NULL, 'UNLINKED');

INSERT INTO "public"."IssueSteps" ("issue_id", "number", "step", "image") VALUES
('d3adbeef-0000-4000-8000-000000000501', 1, 'Add any item to the cart and open checkout.', 'https://gwpcywphjekefzoftntk.supabase.co/storage/v1/object/public/images/demo/lorem-ipsum-3.png'),
('d3adbeef-0000-4000-8000-000000000501', 2, 'Type SAVE10 in the promo field and click Apply.', NULL),
('d3adbeef-0000-4000-8000-000000000501', 3, 'Observe that the order never reaches the confirmation screen.', NULL);

-- ── Variables (client visibility mix) ───────────────────────────────────────
INSERT INTO "public"."Variables" ("variable_id", "project_id", "name", "type", "value", "client_visible", "notes_team", "notes_client", "created_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000601', 'd3adbeef-0000-4000-8000-000000000001', 'Staging Preview URL', 'LINK', 'https://staging.primefoods-portal.dev', true, 'Auto-deployed on merge to develop.', 'Use this live URL for gate review approvals.', '2026-06-18T09:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000602', 'd3adbeef-0000-4000-8000-000000000001', 'Production Database URI', 'CREDENTIAL', 'postgresql://primefoods:demo-secret@db.internal:5432/portal', false, 'Direct connection URI for the production cluster. Owner tier only.', '', '2026-06-18T09:05:00Z', false),
('d3adbeef-0000-4000-8000-000000000603', 'd3adbeef-0000-4000-8000-000000000001', 'Figma Design System', 'LINK', 'https://www.figma.com/file/primefoods-portal-design-system', true, 'Main component library and prototype boards.', 'Inspect assets and leave comments on the prototypes.', '2026-06-19T10:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000604', 'd3adbeef-0000-4000-8000-000000000001', 'Stripe Live Secret Key', 'CREDENTIAL', 'sk_live_51DEMOxxxxxPrimeFoods', false, 'Production secret. Never share outside the owner tier.', '', '2026-06-20T11:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000605', 'd3adbeef-0000-4000-8000-000000000001', 'Frontend Monorepo', 'REPOSITORY', 'git@github.com:acesoft-studio/primefoods-portal.git', true, 'CI must pass before merging to main.', 'Read-only access for deployment auditing.', '2026-06-21T09:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000606', 'd3adbeef-0000-4000-8000-000000000001', 'PrimeFoods ERP API Key', 'CREDENTIAL', 'pf-erp-live-7f3k9d2m', false, 'Used by the nightly inventory sync job.', '', '2026-07-22T09:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000607', 'd3adbeef-0000-4000-8000-000000000001', 'Support Mailbox', 'LINK', 'https://mail.primefoods.com/support', true, '', 'Open a ticket here for account or order issues.', '2026-07-25T09:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000608', 'd3adbeef-0000-4000-8000-000000000001', 'Admin Panel URL', 'LINK', 'https://admin.primefoods-portal.dev', false, 'Owner + operations only.', '', '2026-07-28T09:00:00Z', false);

-- ── Ticket comments + images ─────────────────────────────────────────────────
INSERT INTO "public"."Comments" ("comment_id", "profile_id", "description", "parent_type", "parent_id", "creation_date", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000701', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', 'Order history page is done — invoice download works, ready for review.', 'TICKET_COMMENT', 'd3adbeef-0000-4000-8000-000000000242', '2026-07-24T16:30:00Z', false),
('d3adbeef-0000-4000-8000-000000000702', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', 'Cart state machine is wired; needs a design pass on the empty state.', 'TICKET_COMMENT', 'd3adbeef-0000-4000-8000-000000000243', '2026-07-29T10:15:00Z', false),
('d3adbeef-0000-4000-8000-000000000703', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', 'ERP sync is mid-flight; the warehouse API rate-limits us on peak hours.', 'TICKET_COMMENT', 'd3adbeef-0000-4000-8000-000000000252', '2026-08-04T15:45:00Z', false),
('d3adbeef-0000-4000-8000-000000000704', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'Payment gateway credentials requested from PrimeFoods finance — waiting on their side.', 'TICKET_COMMENT', 'd3adbeef-0000-4000-8000-000000000253', '2026-08-08T09:20:00Z', false);

INSERT INTO "public"."Images" ("image_id", "image_src", "parent_type", "parent_id", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000802', 'https://gwpcywphjekefzoftntk.supabase.co/storage/v1/object/public/images/demo/lorem-ipsum-1.png', 'TICKET_COMMENT', 'd3adbeef-0000-4000-8000-000000000701', false),
('d3adbeef-0000-4000-8000-000000000803', 'https://gwpcywphjekefzoftntk.supabase.co/storage/v1/object/public/images/demo/lorem-ipsum-2.png', 'TICKET_COMMENT', 'd3adbeef-0000-4000-8000-000000000703', false);

-- ── History events (stage-1 + stage-2 tickets) ──────────────────────────────
INSERT INTO "public"."HistoryEvent" ("history_event_id", "action", "ticket_id", "target_profile_id", "performed_by", "performed_at", "details") VALUES
('d3adbeef-0000-4000-8000-000000000901', 'CREATED', 'd3adbeef-0000-4000-8000-000000000141', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-06-16T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000902', 'CREATED', 'd3adbeef-0000-4000-8000-000000000142', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-06-20T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000903', 'CREATED', 'd3adbeef-0000-4000-8000-000000000143', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-06-25T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000904', 'CREATED', 'd3adbeef-0000-4000-8000-000000000144', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-01T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000905', 'CREATED', 'd3adbeef-0000-4000-8000-000000000145', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-04T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000906', 'CREATED', 'd3adbeef-0000-4000-8000-000000000146', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-08T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000907', 'CREATED', 'd3adbeef-0000-4000-8000-000000000241', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-14T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000908', 'CREATED', 'd3adbeef-0000-4000-8000-000000000242', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-18T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000909', 'CREATED', 'd3adbeef-0000-4000-8000-000000000243', NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-07-24T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000910', 'CREATED', 'd3adbeef-0000-4000-8000-000000000244', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-31T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000911', 'CREATED', 'd3adbeef-0000-4000-8000-000000000245', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-05T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000912', 'CREATED', 'd3adbeef-0000-4000-8000-000000000246', NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-08-01T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000913', 'CREATED', 'd3adbeef-0000-4000-8000-000000000247', NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-08-05T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000914', 'CREATED', 'd3adbeef-0000-4000-8000-000000000251', NULL, '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '2026-07-21T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000915', 'CREATED', 'd3adbeef-0000-4000-8000-000000000252', NULL, '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '2026-07-29T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000916', 'CREATED', 'd3adbeef-0000-4000-8000-000000000253', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-03T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000917', 'CREATED', 'd3adbeef-0000-4000-8000-000000000261', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-09-01T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000918', 'CREATED', 'd3adbeef-0000-4000-8000-000000000262', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-09-12T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000919', 'CREATED', 'd3adbeef-0000-4000-8000-000000000271', NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-10-05T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000920', 'CREATED', 'd3adbeef-0000-4000-8000-000000000272', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-10-15T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000921', 'ASSIGNED', 'd3adbeef-0000-4000-8000-000000000143', '5f029f34-81df-4d95-9d9b-89e7f511778d', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-06-26T09:00:00Z', 'Assigned to John Paul Castillo'),
('d3adbeef-0000-4000-8000-000000000922', 'ASSIGNED', 'd3adbeef-0000-4000-8000-000000000144', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-01T09:00:00Z', 'Assigned to Angela Lim'),
('d3adbeef-0000-4000-8000-000000000923', 'ASSIGNED', 'd3adbeef-0000-4000-8000-000000000145', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-04T09:00:00Z', 'Assigned to Gabriel Aquino'),
('d3adbeef-0000-4000-8000-000000000924', 'ASSIGNED', 'd3adbeef-0000-4000-8000-000000000241', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-15T09:00:00Z', 'Assigned to Angela Lim'),
('d3adbeef-0000-4000-8000-000000000925', 'ASSIGNED', 'd3adbeef-0000-4000-8000-000000000243', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-28T09:00:00Z', 'Assigned to Gabriel Aquino'),
('d3adbeef-0000-4000-8000-000000000926', 'ASSIGNED', 'd3adbeef-0000-4000-8000-000000000251', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-22T09:00:00Z', 'Assigned to Ryan Bautista'),
('d3adbeef-0000-4000-8000-000000000927', 'ASSIGNED', 'd3adbeef-0000-4000-8000-000000000252', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-01T09:00:00Z', 'Assigned to Ryan Bautista'),
('d3adbeef-0000-4000-8000-000000000928', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000141', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-06-20T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000929', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000142', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-06-26T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000930', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000143', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-06-30T17:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000931', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000144', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-07T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000932', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000145', NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-07-09T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000933', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000146', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-14T13:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000934', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000241', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-18T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000935', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000242', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-24T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000936', 'UPDATED_STATUS', 'd3adbeef-0000-4000-8000-000000000243', NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-07-28T09:00:00Z', 'Status changed to IN_PROGRESS'),
('d3adbeef-0000-4000-8000-000000000937', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000251', NULL, '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '2026-07-29T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000938', 'UPDATED_STATUS', 'd3adbeef-0000-4000-8000-000000000252', NULL, '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '2026-08-01T09:00:00Z', 'Status changed to IN_PROGRESS');

-- ── Ticket assignments + tags ────────────────────────────────────────────────
INSERT INTO "public"."TicketAssigned" ("ticket_id", "profile_id", "assigned_date") VALUES
('d3adbeef-0000-4000-8000-000000000141', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-06-16T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000143', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-06-26T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000144', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-01T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000145', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-07-04T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000146', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-08T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000241', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-15T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000242', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-18T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000243', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-07-28T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000251', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '2026-07-22T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000252', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '2026-08-01T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000253', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-03T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000271', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-10-05T09:00:00Z');

INSERT INTO "public"."TicketTags" ("ticket_id", "tag_id") VALUES
('d3adbeef-0000-4000-8000-000000000146', '49a8936a-66c0-4dfc-9c1b-a4dea05627ef'),
('d3adbeef-0000-4000-8000-000000000253', '49a8936a-66c0-4dfc-9c1b-a4dea05627ef'),
('d3adbeef-0000-4000-8000-000000000251', 'b40ee935-ccdb-4705-81b5-95cb05e8a4f1'),
('d3adbeef-0000-4000-8000-000000000252', 'b40ee935-ccdb-4705-81b5-95cb05e8a4f1'),
('d3adbeef-0000-4000-8000-000000000252', 'd3adbeef-0000-4000-8000-000000000402'),
('d3adbeef-0000-4000-8000-000000000241', 'd3adbeef-0000-4000-8000-000000000401'),
('d3adbeef-0000-4000-8000-000000000242', 'd3adbeef-0000-4000-8000-000000000401'),
('d3adbeef-0000-4000-8000-000000000243', 'd3adbeef-0000-4000-8000-000000000401'),
('d3adbeef-0000-4000-8000-000000000244', 'd3adbeef-0000-4000-8000-000000000401'),
('d3adbeef-0000-4000-8000-000000000262', 'b637dd11-9b47-42a7-afcd-905ce945209d');

-- ── Small project 1: Summit Construction — Site Tracker ─────────────────────
INSERT INTO "public"."Projects" ("project_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000201', 'Summit Construction — Site Tracker', 'Field reporting and site-activity tracking for Summit Construction Group.', 'ACTIVE', '2026-07-01T08:00:00Z', '2026-11-15T17:00:00Z', '2026-07-02T09:00:00Z', NULL, false);

INSERT INTO "public"."Contracts" ("contract_id", "project_id", "client_id", "contract_name", "file_path", "client_signature", "project_owner_signature", "client_initials", "project_owner_initials", "client_signed_at", "project_owner_signed_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000202', 'd3adbeef-0000-4000-8000-000000000201', '0de786c6-1b2d-472f-9105-857f761178ef', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false);

INSERT INTO "public"."RoleAssignments" ("role_id", "user_id", "project_id") VALUES
('c140ee09-cf1e-409d-9b0a-c1ab705a694b', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'd3adbeef-0000-4000-8000-000000000201'),
('01795de2-f46b-4224-84c2-93fbf7fb56d7', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', 'd3adbeef-0000-4000-8000-000000000201');

INSERT INTO "public"."Stages" ("stage_id", "project_id", "number", "name", "description", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000211', 'd3adbeef-0000-4000-8000-000000000201', 1, 'Field Ops Rollout', 'Mobile field app for daily site reports.', '2026-07-01T08:00:00Z', '2026-11-15T17:00:00Z', '2026-07-02T09:00:00Z', NULL, false);

INSERT INTO "public"."Gates" ("gate_id", "stage_id", "number", "status", "comment_id") VALUES
('d3adbeef-0000-4000-8000-000000000212', 'd3adbeef-0000-4000-8000-000000000211', 1, 'PENDING', NULL);

INSERT INTO "public"."Phases" ("phase_id", "stage_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000221', 'd3adbeef-0000-4000-8000-000000000211', 1, 'Site Tracking', 'a0', '2026-07-01T08:00:00Z', '2026-09-30T17:00:00Z', '2026-07-02T09:00:00Z', NULL, false);

INSERT INTO "public"."Modules" ("module_id", "phase_id", "name", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000231', 'd3adbeef-0000-4000-8000-000000000221', 'Mobile Field App', '2026-07-01T08:00:00Z', '2026-09-30T17:00:00Z', '2026-07-02T09:00:00Z', NULL, false);

INSERT INTO "public"."Workflows" ("workflow_id", "module_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000241', 'd3adbeef-0000-4000-8000-000000000231', 1, 'Field Reports', 'a0', '2026-07-01T08:00:00Z', '2026-09-30T17:00:00Z', '2026-07-02T09:00:00Z', NULL, false);

INSERT INTO "public"."Tickets" ("ticket_id", "workflow_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "watcher_id", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000281', 'd3adbeef-0000-4000-8000-000000000241', 'Daily site report form', 'Structured daily report: weather, crew, hazards, photos.', 'FINISHED', '2026-07-01T08:00:00Z', '2026-07-10T17:00:00Z', '2026-07-02T09:00:00Z', '2026-07-10T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000282', 'd3adbeef-0000-4000-8000-000000000241', 'Photo upload with GPS tagging', 'Capture site photos with location stamps.', 'FINISHED', '2026-07-10T09:00:00Z', '2026-07-20T17:00:00Z', '2026-07-10T09:00:00Z', '2026-07-20T16:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000283', 'd3adbeef-0000-4000-8000-000000000241', 'Offline sync queue', 'Queue reports when the site has no connectivity.', 'IN_PROGRESS', '2026-07-20T09:00:00Z', '2026-08-10T17:00:00Z', '2026-07-20T09:00:00Z', NULL, '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', false),
('d3adbeef-0000-4000-8000-000000000284', 'd3adbeef-0000-4000-8000-000000000241', 'Manager approvals dashboard', 'Approve/reject submitted reports from the web dashboard.', 'PENDING', '2026-08-10T09:00:00Z', '2026-09-10T17:00:00Z', NULL, NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000285', 'd3adbeef-0000-4000-8000-000000000241', 'Report export to PDF', 'Export weekly report bundles for client records.', 'PENDING', '2026-09-10T09:00:00Z', '2026-09-30T17:00:00Z', NULL, NULL, NULL, false);

-- ── Small project 2: EcoVision Energy Dashboard ─────────────────────────────
INSERT INTO "public"."Projects" ("project_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000301', 'EcoVision Energy Dashboard', 'Smart-meter consumption analytics for EcoVision Corporation.', 'ACTIVE', '2026-08-01T08:00:00Z', '2026-12-15T17:00:00Z', '2026-08-01T09:00:00Z', NULL, false);

INSERT INTO "public"."Contracts" ("contract_id", "project_id", "client_id", "contract_name", "file_path", "client_signature", "project_owner_signature", "client_initials", "project_owner_initials", "client_signed_at", "project_owner_signed_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000302', 'd3adbeef-0000-4000-8000-000000000301', '5152c1d3-aa55-4976-bacf-955db3305b1d', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false);

INSERT INTO "public"."RoleAssignments" ("role_id", "user_id", "project_id") VALUES
('c140ee09-cf1e-409d-9b0a-c1ab705a694b', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'd3adbeef-0000-4000-8000-000000000301'),
('01795de2-f46b-4224-84c2-93fbf7fb56d7', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', 'd3adbeef-0000-4000-8000-000000000301');

INSERT INTO "public"."Stages" ("stage_id", "project_id", "number", "name", "description", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000311', 'd3adbeef-0000-4000-8000-000000000301', 1, 'MVP Build', 'Core analytics dashboard for smart-meter data.', '2026-08-01T08:00:00Z', '2026-12-15T17:00:00Z', '2026-08-01T09:00:00Z', NULL, false);

INSERT INTO "public"."Gates" ("gate_id", "stage_id", "number", "status", "comment_id") VALUES
('d3adbeef-0000-4000-8000-000000000312', 'd3adbeef-0000-4000-8000-000000000311', 1, 'PENDING', NULL);

INSERT INTO "public"."Phases" ("phase_id", "stage_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000321', 'd3adbeef-0000-4000-8000-000000000311', 1, 'Analytics', 'a0', '2026-08-01T08:00:00Z', '2026-11-15T17:00:00Z', '2026-08-01T09:00:00Z', NULL, false);

INSERT INTO "public"."Modules" ("module_id", "phase_id", "name", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000331', 'd3adbeef-0000-4000-8000-000000000321', 'Energy Analytics', '2026-08-01T08:00:00Z', '2026-11-15T17:00:00Z', '2026-08-01T09:00:00Z', NULL, false);

INSERT INTO "public"."Workflows" ("workflow_id", "module_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000341', 'd3adbeef-0000-4000-8000-000000000331', 1, 'Consumption Analytics', 'a0', '2026-08-01T08:00:00Z', '2026-11-15T17:00:00Z', '2026-08-01T09:00:00Z', NULL, false);

INSERT INTO "public"."Tickets" ("ticket_id", "workflow_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "watcher_id", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000351', 'd3adbeef-0000-4000-8000-000000000341', 'Ingest smart-meter readings', 'Batch ingestion pipeline for meter readings.', 'FINISHED', '2026-08-01T08:00:00Z', '2026-08-12T17:00:00Z', '2026-08-01T09:00:00Z', '2026-08-12T16:00:00Z', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', false),
('d3adbeef-0000-4000-8000-000000000352', 'd3adbeef-0000-4000-8000-000000000341', 'Daily/weekly consumption charts', 'Time-series charts with date-range filters.', 'IN_PROGRESS', '2026-08-12T09:00:00Z', '2026-09-20T17:00:00Z', '2026-08-12T09:00:00Z', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000353', 'd3adbeef-0000-4000-8000-000000000341', 'Anomaly alerts (thresholds)', 'Alert rules when consumption crosses configured thresholds.', 'PENDING', '2026-09-20T09:00:00Z', '2026-11-15T17:00:00Z', NULL, NULL, NULL, false);

-- ── Small-project history + assignments + tags ──────────────────────────────
INSERT INTO "public"."HistoryEvent" ("history_event_id", "action", "ticket_id", "target_profile_id", "performed_by", "performed_at", "details") VALUES
('d3adbeef-0000-4000-8000-000000000a01', 'CREATED', 'd3adbeef-0000-4000-8000-000000000281', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-01T08:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a02', 'CREATED', 'd3adbeef-0000-4000-8000-000000000282', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-10T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a03', 'CREATED', 'd3adbeef-0000-4000-8000-000000000283', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-20T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a04', 'CREATED', 'd3adbeef-0000-4000-8000-000000000284', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-10T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a05', 'CREATED', 'd3adbeef-0000-4000-8000-000000000285', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-09-10T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a06', 'CREATED', 'd3adbeef-0000-4000-8000-000000000351', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-01T08:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a07', 'CREATED', 'd3adbeef-0000-4000-8000-000000000352', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-12T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a08', 'CREATED', 'd3adbeef-0000-4000-8000-000000000353', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-09-20T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a09', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000281', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-10T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a10', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000282', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-20T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a11', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000351', NULL, '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '2026-08-12T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000a12', 'ASSIGNED', 'd3adbeef-0000-4000-8000-000000000351', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-01T09:00:00Z', 'Assigned to Ryan Bautista');

INSERT INTO "public"."TicketAssigned" ("ticket_id", "profile_id", "assigned_date") VALUES
('d3adbeef-0000-4000-8000-000000000281', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-02T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000283', '21400605-9ffa-4dff-a9e3-2f6f2a9d34b1', '2026-07-20T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000284', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-10T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000351', '99aa1b75-022d-4fd7-ac97-3249f334e4c6', '2026-08-01T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000352', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-12T09:00:00Z');

-- ── Variables for the small projects ────────────────────────────────────────
INSERT INTO "public"."Variables" ("variable_id", "project_id", "name", "type", "value", "client_visible", "notes_team", "notes_client", "created_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000621', 'd3adbeef-0000-4000-8000-000000000201', 'Field App Staging Build', 'LINK', 'https://staging.fieldapp.summit-construction.ph', true, 'Point releases on every sprint merge.', 'Use this build for field trials.', '2026-07-03T09:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000622', 'd3adbeef-0000-4000-8000-000000000201', 'Site Reports Bucket', 'CREDENTIAL', 's3://summit-field-reports/demo-key', false, 'Upload destination for report exports.', '', '2026-07-03T09:05:00Z', false),
('d3adbeef-0000-4000-8000-000000000631', 'd3adbeef-0000-4000-8000-000000000301', 'Meter Data Warehouse', 'CREDENTIAL', 'postgresql://ecovision:demo-secret@analytics.internal:5432/meters', false, 'Read-only analytics replica.', '', '2026-08-02T09:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000632', 'd3adbeef-0000-4000-8000-000000000301', 'Energy API Docs', 'LINK', 'https://docs.ecovision-api.dev/v2', true, 'Publish docs on every minor release.', 'Reference for integration partners.', '2026-08-02T09:05:00Z', false);

COMMIT;

-- ============================================================================
-- ROLLBACK (run these DELETEs first to reset the demo data, then re-apply):
--
-- DELETE FROM "public"."TicketTags" WHERE "tag_id" IN
--   ('d3adbeef-0000-4000-8000-000000000401','d3adbeef-0000-4000-8000-000000000402')
--   OR "ticket_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."TicketAssigned" WHERE "ticket_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."HistoryEvent" WHERE "history_event_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Images" WHERE "image_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Comments" WHERE "comment_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."IssueSteps" WHERE "issue_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Issues" WHERE "issue_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Variables" WHERE "variable_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Tickets" WHERE "ticket_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Workflows" WHERE "workflow_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Modules" WHERE "module_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Phases" WHERE "phase_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Gates" WHERE "gate_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Stages" WHERE "stage_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."RoleAssignments" WHERE "project_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Contracts" WHERE "contract_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Projects" WHERE "project_id" LIKE 'd3adbeef-%';
-- DELETE FROM "public"."Tags" WHERE "tag_id" LIKE 'd3adbeef-%';
-- ============================================================================
