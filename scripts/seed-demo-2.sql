-- ============================================================================
-- DEMO SEED 2 — velocity data, completed projects, extra stages
-- 2026-08-15 · Incremental seed on top of scripts/seed-demo.sql.
--
-- Adds:
--   A. Weekly-velocity data for BOTH demo staff accounts (JP Castillo +
--      Angela Lim): assigned FINISHED tickets with actual_end_at in the
--      current week (Mon 2026-08-10 … Sun 08-16, server-local) and the
--      previous week (08-03…08-09) — getActivitySparklines reads exactly
--      these two windows per logged-in user.
--   B. Two COMPLETED projects (Trench Realty Tenant Portal, Subtle
--      Messaging Campaign Platform) with signed contracts + every stage
--      finished (actual_end_at set) — the status rule for COMPLETED.
--      Role-assigned to BOTH JP and Angela so the dashboard looks the
--      same on both accounts.
--   C. PrimeFoods stages 3–4 with phases/modules/workflows so the project
--      stepper and stage tree look populated.
--
-- Apply:  npx prisma db execute --file scripts/seed-demo-2.sql
-- Rollback: DELETE statements at the bottom.
-- ============================================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════
-- A. VELOCITY TICKETS (PrimeFoods project, workflows 0231 + 0232)
--    Rollup-safe: both workflows still have PENDING tickets, so their
--    actual_end_at stays NULL regardless of the new FINISHED rows.
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."Tickets" ("ticket_id", "workflow_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "watcher_id", "is_deleted") VALUES
-- JP — last week (Aug 3–7)
('d3adbeef-0000-4000-8000-000000000b01', 'd3adbeef-0000-4000-8000-000000000232', 'API: order status webhook retry', 'Retry with exponential backoff for the order-status webhook.', 'FINISHED', '2026-07-28T09:00:00Z', '2026-08-04T17:00:00Z', '2026-07-29T09:00:00Z', '2026-08-03T15:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000b02', 'd3adbeef-0000-4000-8000-000000000231', 'Catalog search debounce', 'Debounce the catalog search input to 300ms.', 'FINISHED', '2026-07-30T09:00:00Z', '2026-08-05T17:00:00Z', '2026-07-30T09:00:00Z', '2026-08-04T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000b03', 'd3adbeef-0000-4000-8000-000000000232', 'Invoice PDF download regression fix', 'Fix truncated invoice PDFs for orders with many line items.', 'FINISHED', '2026-08-01T09:00:00Z', '2026-08-06T17:00:00Z', '2026-08-01T09:00:00Z', '2026-08-05T15:30:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
-- JP — this week (Aug 10–14, one finishing Aug 15 00:30 +08)
('d3adbeef-0000-4000-8000-000000000b04', 'd3adbeef-0000-4000-8000-000000000231', 'Fix cart quantity stepper edge case', 'Stepper allowed negative quantities on rapid clicks.', 'FINISHED', '2026-08-05T09:00:00Z', '2026-08-11T17:00:00Z', '2026-08-05T09:00:00Z', '2026-08-10T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000b05', 'd3adbeef-0000-4000-8000-000000000231', 'Add promo-code validation', 'Server-side validation for promo codes with friendly errors.', 'FINISHED', '2026-08-06T09:00:00Z', '2026-08-12T17:00:00Z', '2026-08-06T09:00:00Z', '2026-08-11T15:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000b06', 'd3adbeef-0000-4000-8000-000000000232', 'Order confirmation email template', 'Transactional email with line items and delivery estimate.', 'FINISHED', '2026-08-07T09:00:00Z', '2026-08-13T17:00:00Z', '2026-08-07T09:00:00Z', '2026-08-12T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000b07', 'd3adbeef-0000-4000-8000-000000000231', 'Guest checkout flow', 'Complete checkout without an account, with order lookup by email.', 'FINISHED', '2026-08-08T09:00:00Z', '2026-08-14T17:00:00Z', '2026-08-08T09:00:00Z', '2026-08-13T15:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000b08', 'd3adbeef-0000-4000-8000-000000000232', 'Deploy staging hotfix (checkout)', 'Hotfix release to staging; verify checkout under load.', 'FINISHED', '2026-08-10T09:00:00Z', '2026-08-14T17:00:00Z', '2026-08-12T09:00:00Z', '2026-08-14T16:30:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
-- Angela — last week (Aug 3–7)
('d3adbeef-0000-4000-8000-000000000b09', 'd3adbeef-0000-4000-8000-000000000232', 'API: pagination cursor fix', 'Cursor pagination returned duplicate rows on page 3.', 'FINISHED', '2026-07-29T09:00:00Z', '2026-08-04T17:00:00Z', '2026-07-29T09:00:00Z', '2026-08-04T15:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000b0a', 'd3adbeef-0000-4000-8000-000000000231', 'Shipment list date filters', 'Filter shipments by date range on the warehouse dashboard.', 'FINISHED', '2026-07-30T09:00:00Z', '2026-08-05T17:00:00Z', '2026-07-30T09:00:00Z', '2026-08-05T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000b0b', 'd3adbeef-0000-4000-8000-000000000231', 'Unit tests for cart store', 'Cover add/remove/quantity edge cases in the cart store.', 'FINISHED', '2026-08-01T09:00:00Z', '2026-08-07T17:00:00Z', '2026-08-01T09:00:00Z', '2026-08-07T15:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
-- Angela — this week (Aug 10–14)
('d3adbeef-0000-4000-8000-000000000b0c', 'd3adbeef-0000-4000-8000-000000000231', 'Warehouse: low-stock email alerts', 'Notify warehouse staff when SKUs drop below reorder points.', 'FINISHED', '2026-08-04T09:00:00Z', '2026-08-11T17:00:00Z', '2026-08-04T09:00:00Z', '2026-08-10T15:30:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000b0d', 'd3adbeef-0000-4000-8000-000000000231', 'Checkout empty-state design pass', 'Polish empty cart and empty order states.', 'FINISHED', '2026-08-05T09:00:00Z', '2026-08-12T17:00:00Z', '2026-08-05T09:00:00Z', '2026-08-11T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000b0e', 'd3adbeef-0000-4000-8000-000000000231', 'Fix mobile nav overflow', 'Navigation menu clipped on small viewports.', 'FINISHED', '2026-08-06T09:00:00Z', '2026-08-13T17:00:00Z', '2026-08-06T09:00:00Z', '2026-08-12T15:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000b0f', 'd3adbeef-0000-4000-8000-000000000231', 'Order history pagination', 'Client-side pagination for long order histories.', 'FINISHED', '2026-08-07T09:00:00Z', '2026-08-14T17:00:00Z', '2026-08-07T09:00:00Z', '2026-08-13T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000b10', 'd3adbeef-0000-4000-8000-000000000231', 'Accessibility pass on forms', 'Labels, focus states and ARIA for checkout + account forms.', 'FINISHED', '2026-08-10T09:00:00Z', '2026-08-14T17:00:00Z', '2026-08-10T09:00:00Z', '2026-08-14T15:30:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false);

-- ══════════════════════════════════════════════════════════════════════════
-- B. COMPLETED PROJECT 1 — Trench Realty Tenant Portal
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."Projects" ("project_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000401', 'Trench Realty Tenant Portal', 'Tenant self-service portal: rent payments, maintenance requests and lease documents.', 'COMPLETED', '2025-11-01T08:00:00Z', '2026-05-30T17:00:00Z', '2025-11-03T09:00:00Z', '2026-05-28T16:00:00Z', false);

INSERT INTO "public"."Contracts" ("contract_id", "project_id", "client_id", "contract_name", "file_path", "client_signature", "project_owner_signature", "client_initials", "project_owner_initials", "client_signed_at", "project_owner_signed_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000402', 'd3adbeef-0000-4000-8000-000000000401', '113cd0bb-fd8c-4e11-9610-4070e95cb225', 'Trench Realty Tenant Portal Agreement', NULL, 'Maria Santos', 'John Paul Castillo', 'MS', 'JC', '2025-11-05T09:00:00Z', '2025-11-05T10:00:00Z', false);

INSERT INTO "public"."RoleAssignments" ("role_id", "user_id", "project_id") VALUES
('c140ee09-cf1e-409d-9b0a-c1ab705a694b', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'd3adbeef-0000-4000-8000-000000000401'),
('01795de2-f46b-4224-84c2-93fbf7fb56d7', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', 'd3adbeef-0000-4000-8000-000000000401');

-- Stages 1–3 (ALL finished → COMPLETED status rule)
INSERT INTO "public"."Stages" ("stage_id", "project_id", "number", "name", "description", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000411', 'd3adbeef-0000-4000-8000-000000000401', 1, 'Discovery & Requirements', 'Tenant interviews, lease document audit and portal scope.', '2025-11-03T09:00:00Z', '2025-12-12T17:00:00Z', '2025-11-03T09:00:00Z', '2025-12-15T15:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000412', 'd3adbeef-0000-4000-8000-000000000401', 2, 'Build', 'Portal development: payments, maintenance tickets and documents.', '2025-12-15T09:00:00Z', '2026-03-20T17:00:00Z', '2025-12-16T09:00:00Z', '2026-03-18T16:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000413', 'd3adbeef-0000-4000-8000-000000000401', 3, 'Launch & Handover', 'UAT with Trench Realty, tenant rollout and training.', '2026-03-20T09:00:00Z', '2026-05-30T17:00:00Z', '2026-03-19T09:00:00Z', '2026-05-28T16:00:00Z', false);

INSERT INTO "public"."Comments" ("comment_id", "profile_id", "description", "parent_type", "parent_id", "creation_date", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000471', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'Launch complete — tenant portal is live and handover signed off.', 'GATE_COMMENT', 'd3adbeef-0000-4000-8000-000000000423', '2026-05-28T16:00:00Z', false);

INSERT INTO "public"."Gates" ("gate_id", "stage_id", "number", "status", "comment_id") VALUES
('d3adbeef-0000-4000-8000-000000000421', 'd3adbeef-0000-4000-8000-000000000411', 1, 'APPROVED', NULL),
('d3adbeef-0000-4000-8000-000000000422', 'd3adbeef-0000-4000-8000-000000000412', 1, 'APPROVED', NULL),
('d3adbeef-0000-4000-8000-000000000423', 'd3adbeef-0000-4000-8000-000000000413', 1, 'APPROVED', 'd3adbeef-0000-4000-8000-000000000471');

INSERT INTO "public"."Phases" ("phase_id", "stage_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000431', 'd3adbeef-0000-4000-8000-000000000411', 1, 'Requirements & Lease Audit', 'a0', '2025-11-03T09:00:00Z', '2025-12-10T17:00:00Z', '2025-11-03T09:00:00Z', '2025-12-15T15:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000432', 'd3adbeef-0000-4000-8000-000000000412', 1, 'Portal Development', 'a0', '2025-12-15T09:00:00Z', '2026-03-18T17:00:00Z', '2025-12-16T09:00:00Z', '2026-03-18T16:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000433', 'd3adbeef-0000-4000-8000-000000000413', 1, 'UAT & Tenant Rollout', 'a0', '2026-03-19T09:00:00Z', '2026-05-28T17:00:00Z', '2026-03-19T09:00:00Z', '2026-05-28T16:00:00Z', false);

INSERT INTO "public"."Modules" ("module_id", "phase_id", "name", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000441', 'd3adbeef-0000-4000-8000-000000000431', 'Lease & Requirements Docs', '2025-11-03T09:00:00Z', '2025-12-10T17:00:00Z', '2025-11-03T09:00:00Z', '2025-12-15T15:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000442', 'd3adbeef-0000-4000-8000-000000000432', 'Tenant Portal App', '2025-12-15T09:00:00Z', '2026-03-18T17:00:00Z', '2025-12-16T09:00:00Z', '2026-03-18T16:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000443', 'd3adbeef-0000-4000-8000-000000000433', 'Rollout & Training', '2026-03-19T09:00:00Z', '2026-05-28T17:00:00Z', '2026-03-19T09:00:00Z', '2026-05-28T16:00:00Z', false);

INSERT INTO "public"."Workflows" ("workflow_id", "module_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000451', 'd3adbeef-0000-4000-8000-000000000441', 1, 'Requirements Gathering', 'a0', '2025-11-03T09:00:00Z', '2025-12-10T17:00:00Z', '2025-11-03T09:00:00Z', '2025-12-15T15:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000452', 'd3adbeef-0000-4000-8000-000000000442', 1, 'Payments & Maintenance', 'a0', '2025-12-15T09:00:00Z', '2026-03-18T17:00:00Z', '2025-12-16T09:00:00Z', '2026-03-18T16:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000453', 'd3adbeef-0000-4000-8000-000000000443', 1, 'UAT & Rollout', 'a0', '2026-03-19T09:00:00Z', '2026-05-28T17:00:00Z', '2026-03-19T09:00:00Z', '2026-05-28T16:00:00Z', false);

INSERT INTO "public"."Tickets" ("ticket_id", "workflow_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "watcher_id", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000461', 'd3adbeef-0000-4000-8000-000000000451', 'Tenant interviews (12 units)', 'Synthesize payment pain points and portal wishlist.', 'FINISHED', '2025-11-03T09:00:00Z', '2025-11-21T17:00:00Z', '2025-11-03T09:00:00Z', '2025-11-20T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000462', 'd3adbeef-0000-4000-8000-000000000451', 'Lease document digitization', 'Scan and index lease agreements for the portal.', 'FINISHED', '2025-11-14T09:00:00Z', '2025-12-05T17:00:00Z', '2025-11-14T09:00:00Z', '2025-12-04T16:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000463', 'd3adbeef-0000-4000-8000-000000000451', 'Portal scope sign-off', 'Scope freeze with Trench Realty management.', 'FINISHED', '2025-12-05T09:00:00Z', '2025-12-10T17:00:00Z', '2025-12-05T09:00:00Z', '2025-12-15T15:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000464', 'd3adbeef-0000-4000-8000-000000000452', 'Online rent payments', 'Card and GCash payments with auto-receipts.', 'FINISHED', '2025-12-16T09:00:00Z', '2026-01-30T17:00:00Z', '2025-12-16T09:00:00Z', '2026-01-29T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000465', 'd3adbeef-0000-4000-8000-000000000452', 'Maintenance request tickets', 'Tenant-submitted maintenance requests with photos.', 'FINISHED', '2026-01-15T09:00:00Z', '2026-02-20T17:00:00Z', '2026-01-15T09:00:00Z', '2026-02-19T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000466', 'd3adbeef-0000-4000-8000-000000000452', 'Lease documents in portal', 'Tenant-facing lease library with download.', 'FINISHED', '2026-02-10T09:00:00Z', '2026-03-10T17:00:00Z', '2026-02-10T09:00:00Z', '2026-03-09T16:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000467', 'd3adbeef-0000-4000-8000-000000000452', 'Landlord admin dashboard', 'Payment status, request queue and unit management.', 'FINISHED', '2026-02-20T09:00:00Z', '2026-03-18T17:00:00Z', '2026-02-20T09:00:00Z', '2026-03-18T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000468', 'd3adbeef-0000-4000-8000-000000000453', 'UAT with Trench Realty', 'Two-week UAT cycle with tenant representatives.', 'FINISHED', '2026-03-19T09:00:00Z', '2026-04-23T17:00:00Z', '2026-03-19T09:00:00Z', '2026-04-22T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000469', 'd3adbeef-0000-4000-8000-000000000453', 'Tenant rollout + training', 'Phased tenant onboarding and training sessions.', 'FINISHED', '2026-04-23T09:00:00Z', '2026-05-28T17:00:00Z', '2026-04-23T09:00:00Z', '2026-05-28T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false);

-- ══════════════════════════════════════════════════════════════════════════
-- B2. COMPLETED PROJECT 2 — Subtle Messaging Campaign Platform
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."Projects" ("project_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000501', 'Subtle Messaging Campaign Platform', 'Multi-channel campaign builder with audience segmentation and analytics.', 'COMPLETED', '2026-01-05T08:00:00Z', '2026-07-31T17:00:00Z', '2026-01-06T09:00:00Z', '2026-07-24T16:00:00Z', false);

INSERT INTO "public"."Contracts" ("contract_id", "project_id", "client_id", "contract_name", "file_path", "client_signature", "project_owner_signature", "client_initials", "project_owner_initials", "client_signed_at", "project_owner_signed_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000502', 'd3adbeef-0000-4000-8000-000000000501', '1b5063c3-dce5-438a-8f83-7e9a99380df2', 'Subtle Messaging Campaign Platform Agreement', NULL, 'Dana Cruz', 'John Paul Castillo', 'DC', 'JC', '2026-01-08T09:00:00Z', '2026-01-08T10:00:00Z', false);

INSERT INTO "public"."RoleAssignments" ("role_id", "user_id", "project_id") VALUES
('c140ee09-cf1e-409d-9b0a-c1ab705a694b', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'd3adbeef-0000-4000-8000-000000000501'),
('01795de2-f46b-4224-84c2-93fbf7fb56d7', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', 'd3adbeef-0000-4000-8000-000000000501');

INSERT INTO "public"."Stages" ("stage_id", "project_id", "number", "name", "description", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000511', 'd3adbeef-0000-4000-8000-000000000501', 1, 'Discovery', 'Channel strategy, audience model and platform scope.', '2026-01-06T09:00:00Z', '2026-02-13T17:00:00Z', '2026-01-06T09:00:00Z', '2026-02-12T15:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000512', 'd3adbeef-0000-4000-8000-000000000501', 2, 'Build', 'Campaign builder, segmentation and analytics engine.', '2026-02-12T09:00:00Z', '2026-05-29T17:00:00Z', '2026-02-13T09:00:00Z', '2026-05-28T16:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000513', 'd3adbeef-0000-4000-8000-000000000501', 3, 'Launch', 'Pilot campaigns, training and go-live.', '2026-05-29T09:00:00Z', '2026-07-31T17:00:00Z', '2026-05-29T09:00:00Z', '2026-07-24T16:00:00Z', false);

INSERT INTO "public"."Comments" ("comment_id", "profile_id", "description", "parent_type", "parent_id", "creation_date", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000571', '5f029f34-81df-4d95-9d9b-89e7f511778d', 'Platform is live — pilot campaigns delivered and handover complete.', 'GATE_COMMENT', 'd3adbeef-0000-4000-8000-000000000523', '2026-07-24T16:00:00Z', false);

INSERT INTO "public"."Gates" ("gate_id", "stage_id", "number", "status", "comment_id") VALUES
('d3adbeef-0000-4000-8000-000000000521', 'd3adbeef-0000-4000-8000-000000000511', 1, 'APPROVED', NULL),
('d3adbeef-0000-4000-8000-000000000522', 'd3adbeef-0000-4000-8000-000000000512', 1, 'APPROVED', NULL),
('d3adbeef-0000-4000-8000-000000000523', 'd3adbeef-0000-4000-8000-000000000513', 1, 'APPROVED', 'd3adbeef-0000-4000-8000-000000000571');

INSERT INTO "public"."Phases" ("phase_id", "stage_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000531', 'd3adbeef-0000-4000-8000-000000000511', 1, 'Strategy & Segmentation Model', 'a0', '2026-01-06T09:00:00Z', '2026-02-10T17:00:00Z', '2026-01-06T09:00:00Z', '2026-02-12T15:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000532', 'd3adbeef-0000-4000-8000-000000000512', 1, 'Platform Build', 'a0', '2026-02-13T09:00:00Z', '2026-05-27T17:00:00Z', '2026-02-13T09:00:00Z', '2026-05-28T16:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000533', 'd3adbeef-0000-4000-8000-000000000513', 1, 'Pilot & Launch', 'a0', '2026-05-29T09:00:00Z', '2026-07-24T17:00:00Z', '2026-05-29T09:00:00Z', '2026-07-24T16:00:00Z', false);

INSERT INTO "public"."Modules" ("module_id", "phase_id", "name", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000541', 'd3adbeef-0000-4000-8000-000000000531', 'Segmentation Strategy', '2026-01-06T09:00:00Z', '2026-02-10T17:00:00Z', '2026-01-06T09:00:00Z', '2026-02-12T15:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000542', 'd3adbeef-0000-4000-8000-000000000532', 'Campaign Platform', '2026-02-13T09:00:00Z', '2026-05-27T17:00:00Z', '2026-02-13T09:00:00Z', '2026-05-28T16:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000543', 'd3adbeef-0000-4000-8000-000000000533', 'Pilot Campaigns', '2026-05-29T09:00:00Z', '2026-07-24T17:00:00Z', '2026-05-29T09:00:00Z', '2026-07-24T16:00:00Z', false);

INSERT INTO "public"."Workflows" ("workflow_id", "module_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000551', 'd3adbeef-0000-4000-8000-000000000541', 1, 'Audience Modeling', 'a0', '2026-01-06T09:00:00Z', '2026-02-10T17:00:00Z', '2026-01-06T09:00:00Z', '2026-02-12T15:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000552', 'd3adbeef-0000-4000-8000-000000000542', 1, 'Builder & Analytics', 'a0', '2026-02-13T09:00:00Z', '2026-05-27T17:00:00Z', '2026-02-13T09:00:00Z', '2026-05-28T16:00:00Z', false),
('d3adbeef-0000-4000-8000-000000000553', 'd3adbeef-0000-4000-8000-000000000543', 1, 'Pilot Delivery', 'a0', '2026-05-29T09:00:00Z', '2026-07-24T17:00:00Z', '2026-05-29T09:00:00Z', '2026-07-24T16:00:00Z', false);

INSERT INTO "public"."Tickets" ("ticket_id", "workflow_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "watcher_id", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000561', 'd3adbeef-0000-4000-8000-000000000551', 'Audience segmentation model', 'RFM-based segments across email/SMS/push.', 'FINISHED', '2026-01-06T09:00:00Z', '2026-01-23T17:00:00Z', '2026-01-06T09:00:00Z', '2026-01-22T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000562', 'd3adbeef-0000-4000-8000-000000000551', 'Channel strategy doc', 'Email, SMS and push channel mix for clients.', 'FINISHED', '2026-01-20T09:00:00Z', '2026-02-05T17:00:00Z', '2026-01-20T09:00:00Z', '2026-02-04T16:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000563', 'd3adbeef-0000-4000-8000-000000000551', 'Scope sign-off', 'Feature freeze with Subtle Messaging.', 'FINISHED', '2026-02-05T09:00:00Z', '2026-02-10T17:00:00Z', '2026-02-05T09:00:00Z', '2026-02-12T15:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000564', 'd3adbeef-0000-4000-8000-000000000552', 'Visual campaign builder', 'Drag-and-drop builder with A/B variants.', 'FINISHED', '2026-02-13T09:00:00Z', '2026-03-27T17:00:00Z', '2026-02-13T09:00:00Z', '2026-03-26T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000565', 'd3adbeef-0000-4000-8000-000000000552', 'Delivery + analytics pipeline', 'Send pipeline with open/click/conversion tracking.', 'FINISHED', '2026-03-10T09:00:00Z', '2026-04-24T17:00:00Z', '2026-03-10T09:00:00Z', '2026-04-23T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000566', 'd3adbeef-0000-4000-8000-000000000552', 'Template library', 'Responsive email/SMS templates with variables.', 'FINISHED', '2026-04-10T09:00:00Z', '2026-05-15T17:00:00Z', '2026-04-10T09:00:00Z', '2026-05-14T16:00:00Z', NULL, false),
('d3adbeef-0000-4000-8000-000000000567', 'd3adbeef-0000-4000-8000-000000000552', 'Client admin console', 'Campaign scheduling, approval flow and role management.', 'FINISHED', '2026-04-24T09:00:00Z', '2026-05-27T17:00:00Z', '2026-04-24T09:00:00Z', '2026-05-28T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false),
('d3adbeef-0000-4000-8000-000000000568', 'd3adbeef-0000-4000-8000-000000000553', 'Pilot campaigns (3 clients)', 'Run pilot campaigns and tune deliverability.', 'FINISHED', '2026-05-29T09:00:00Z', '2026-06-26T17:00:00Z', '2026-05-29T09:00:00Z', '2026-06-25T16:00:00Z', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', false),
('d3adbeef-0000-4000-8000-000000000569', 'd3adbeef-0000-4000-8000-000000000553', 'Training + go-live', 'Admin training and production launch.', 'FINISHED', '2026-06-26T09:00:00Z', '2026-07-24T17:00:00Z', '2026-06-26T09:00:00Z', '2026-07-24T16:00:00Z', '5f029f34-81df-4d95-9d9b-89e7f511778d', false);

-- ══════════════════════════════════════════════════════════════════════════
-- C. PRIMEFOODS — STAGES 3 & 4 (stepper + stage tree)
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."Stages" ("stage_id", "project_id", "number", "name", "description", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000601', 'd3adbeef-0000-4000-8000-000000000001', 3, 'Deployment & Stabilization', 'Environments, monitoring and stabilization after build.', '2026-09-01T09:00:00Z', '2026-10-10T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000602', 'd3adbeef-0000-4000-8000-000000000001', 4, 'Handover & Support', 'Training, documentation and support handover.', '2026-10-15T09:00:00Z', '2026-10-30T17:00:00Z', NULL, NULL, false);

INSERT INTO "public"."Gates" ("gate_id", "stage_id", "number", "status", "comment_id") VALUES
('d3adbeef-0000-4000-8000-000000000611', 'd3adbeef-0000-4000-8000-000000000601', 1, 'PENDING', NULL),
('d3adbeef-0000-4000-8000-000000000612', 'd3adbeef-0000-4000-8000-000000000602', 1, 'PENDING', NULL);

INSERT INTO "public"."Phases" ("phase_id", "stage_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000621', 'd3adbeef-0000-4000-8000-000000000601', 1, 'Deployment & Environments', 'a0', '2026-09-01T09:00:00Z', '2026-09-20T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000622', 'd3adbeef-0000-4000-8000-000000000601', 2, 'Stabilization & Monitoring', 'a1', '2026-09-15T09:00:00Z', '2026-10-10T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000623', 'd3adbeef-0000-4000-8000-000000000602', 1, 'Training & Documentation', 'a0', '2026-10-15T09:00:00Z', '2026-10-25T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000624', 'd3adbeef-0000-4000-8000-000000000602', 2, 'Support Handover', 'a1', '2026-10-20T09:00:00Z', '2026-10-30T17:00:00Z', NULL, NULL, false);

INSERT INTO "public"."Modules" ("module_id", "phase_id", "name", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000631', 'd3adbeef-0000-4000-8000-000000000621', 'Environments & CI/CD', '2026-09-01T09:00:00Z', '2026-09-20T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000632', 'd3adbeef-0000-4000-8000-000000000622', 'Monitoring Stack', '2026-09-15T09:00:00Z', '2026-10-10T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000633', 'd3adbeef-0000-4000-8000-000000000623', 'Training Materials', '2026-10-15T09:00:00Z', '2026-10-25T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000634', 'd3adbeef-0000-4000-8000-000000000624', 'Support Handover Kit', '2026-10-20T09:00:00Z', '2026-10-30T17:00:00Z', NULL, NULL, false);

INSERT INTO "public"."Workflows" ("workflow_id", "module_id", "number", "name", "sort_key", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000641', 'd3adbeef-0000-4000-8000-000000000631', 1, 'Production Environments', 'a0', '2026-09-01T09:00:00Z', '2026-09-20T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000642', 'd3adbeef-0000-4000-8000-000000000632', 1, 'Monitoring & Alerting', 'a0', '2026-09-15T09:00:00Z', '2026-10-10T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000643', 'd3adbeef-0000-4000-8000-000000000633', 1, 'User Training', 'a0', '2026-10-15T09:00:00Z', '2026-10-25T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000644', 'd3adbeef-0000-4000-8000-000000000634', 1, 'Support Handover', 'a0', '2026-10-20T09:00:00Z', '2026-10-30T17:00:00Z', NULL, NULL, false);

INSERT INTO "public"."Tickets" ("ticket_id", "workflow_id", "name", "description", "status", "plan_start_at", "plan_end_at", "actual_start_at", "actual_end_at", "is_deleted") VALUES
('d3adbeef-0000-4000-8000-000000000651', 'd3adbeef-0000-4000-8000-000000000641', 'Provision production environment', 'Production hosting, DNS and TLS setup.', 'PENDING', '2026-09-01T09:00:00Z', '2026-09-12T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000652', 'd3adbeef-0000-4000-8000-000000000641', 'Database migrations runbook', 'Safe migration + rollback runbook for production.', 'PENDING', '2026-09-08T09:00:00Z', '2026-09-20T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000653', 'd3adbeef-0000-4000-8000-000000000642', 'Uptime + error monitoring', 'Synthetic checks, error tracking and alert routing.', 'PENDING', '2026-09-15T09:00:00Z', '2026-09-30T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000654', 'd3adbeef-0000-4000-8000-000000000642', 'Performance budget dashboards', 'Core Web Vitals dashboards with budgets.', 'PENDING', '2026-09-25T09:00:00Z', '2026-10-10T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000655', 'd3adbeef-0000-4000-8000-000000000643', 'Warehouse admin training', 'Hands-on training for PrimeFoods warehouse admins.', 'PENDING', '2026-10-15T09:00:00Z', '2026-10-22T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000656', 'd3adbeef-0000-4000-8000-000000000643', 'User documentation', 'Portal guides for customers and warehouse staff.', 'PENDING', '2026-10-18T09:00:00Z', '2026-10-25T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000657', 'd3adbeef-0000-4000-8000-000000000644', 'Support escalation matrix', 'Define L1/L2/L3 escalation paths and SLAs.', 'PENDING', '2026-10-20T09:00:00Z', '2026-10-27T17:00:00Z', NULL, NULL, false),
('d3adbeef-0000-4000-8000-000000000658', 'd3adbeef-0000-4000-8000-000000000644', 'Handover to support team', 'Knowledge transfer sessions and access handover.', 'PENDING', '2026-10-25T09:00:00Z', '2026-10-30T17:00:00Z', NULL, NULL, false);

-- ══════════════════════════════════════════════════════════════════════════
-- Assignments (velocity tickets + completed projects + Angela parity)
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."TicketAssigned" ("ticket_id", "profile_id", "assigned_date") VALUES
-- Velocity — JP
('d3adbeef-0000-4000-8000-000000000b01', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-29T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b02', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-30T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b03', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-01T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b04', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-05T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b05', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-06T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b06', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-07T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b07', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-08T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b08', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-12T09:00:00Z'),
-- Velocity — Angela
('d3adbeef-0000-4000-8000-000000000b09', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-29T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b0a', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-30T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b0b', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-01T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b0c', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-04T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b0d', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-05T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b0e', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-06T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b0f', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-07T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000b10', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-10T09:00:00Z'),
-- Completed projects — P4 (Trench Realty)
('d3adbeef-0000-4000-8000-000000000461', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2025-11-03T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000464', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2025-12-16T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000465', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-01-15T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000467', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-02-20T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000468', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-03-19T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000469', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-04-23T09:00:00Z'),
-- Completed projects — P5 (Subtle Messaging)
('d3adbeef-0000-4000-8000-000000000561', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-01-06T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000564', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-02-13T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000565', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-03-10T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000567', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-04-24T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000568', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-05-29T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000569', '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-06-26T09:00:00Z'),
-- Angela parity: an overdue ticket + an upcoming ticket so her risk/upcoming sparklines show too
('d3adbeef-0000-4000-8000-000000000245', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-05T09:00:00Z'),
('d3adbeef-0000-4000-8000-000000000261', '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-09-01T09:00:00Z');

-- ══════════════════════════════════════════════════════════════════════════
-- History events (velocity 16×2, completed projects 18×2, new stages 8)
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."HistoryEvent" ("history_event_id", "action", "ticket_id", "target_profile_id", "performed_by", "performed_at", "details") VALUES
-- Velocity CREATED (16)
('d3adbeef-0000-4000-8000-000000000c01', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b01', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-28T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c02', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b02', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-30T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c03', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b03', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-01T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c04', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b04', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-05T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c05', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b05', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-06T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c06', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b06', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-07T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c07', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b07', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-08T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c08', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b08', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-10T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c09', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b09', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-29T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c0a', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b0a', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-07-30T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c0b', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b0b', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-01T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c0c', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b0c', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-04T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c0d', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b0d', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-05T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c0e', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b0e', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-06T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c0f', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b0f', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-07T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c10', 'CREATED', 'd3adbeef-0000-4000-8000-000000000b10', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-10T09:00:00Z', NULL),
-- Velocity FINISHED (16)
('d3adbeef-0000-4000-8000-000000000c11', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b01', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-03T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c12', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b02', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-04T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c13', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b03', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-05T15:30:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c14', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b04', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-10T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c15', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b05', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-11T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c16', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b06', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-12T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c17', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b07', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-13T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c18', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b08', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-08-14T16:30:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c19', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b09', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-04T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c1a', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b0a', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-05T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c1b', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b0b', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-07T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c1c', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b0c', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-10T15:30:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c1d', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b0d', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-11T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c1e', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b0e', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-12T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c1f', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b0f', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-13T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000c20', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000b10', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-08-14T15:30:00Z', NULL),
-- Completed project P4 CREATED (9)
('d3adbeef-0000-4000-8000-000000000d01', 'CREATED', 'd3adbeef-0000-4000-8000-000000000461', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2025-11-03T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d02', 'CREATED', 'd3adbeef-0000-4000-8000-000000000462', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2025-11-14T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d03', 'CREATED', 'd3adbeef-0000-4000-8000-000000000463', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2025-12-05T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d04', 'CREATED', 'd3adbeef-0000-4000-8000-000000000464', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2025-12-16T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d05', 'CREATED', 'd3adbeef-0000-4000-8000-000000000465', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-01-15T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d06', 'CREATED', 'd3adbeef-0000-4000-8000-000000000466', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-02-10T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d07', 'CREATED', 'd3adbeef-0000-4000-8000-000000000467', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-02-20T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d08', 'CREATED', 'd3adbeef-0000-4000-8000-000000000468', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-03-19T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d09', 'CREATED', 'd3adbeef-0000-4000-8000-000000000469', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-04-23T09:00:00Z', NULL),
-- Completed project P4 FINISHED (9)
('d3adbeef-0000-4000-8000-000000000d0a', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000461', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2025-11-20T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d0b', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000462', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2025-12-04T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d0c', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000463', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2025-12-15T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d0d', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000464', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-01-29T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d0e', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000465', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-02-19T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d0f', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000466', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-03-09T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d10', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000467', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-03-18T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d11', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000468', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-04-22T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000d12', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000469', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-05-28T16:00:00Z', NULL),
-- Completed project P5 CREATED (9)
('d3adbeef-0000-4000-8000-000000000e01', 'CREATED', 'd3adbeef-0000-4000-8000-000000000561', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-01-06T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e02', 'CREATED', 'd3adbeef-0000-4000-8000-000000000562', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-01-20T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e03', 'CREATED', 'd3adbeef-0000-4000-8000-000000000563', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-02-05T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e04', 'CREATED', 'd3adbeef-0000-4000-8000-000000000564', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-02-13T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e05', 'CREATED', 'd3adbeef-0000-4000-8000-000000000565', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-03-10T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e06', 'CREATED', 'd3adbeef-0000-4000-8000-000000000566', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-04-10T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e07', 'CREATED', 'd3adbeef-0000-4000-8000-000000000567', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-04-24T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e08', 'CREATED', 'd3adbeef-0000-4000-8000-000000000568', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-05-29T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e09', 'CREATED', 'd3adbeef-0000-4000-8000-000000000569', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-06-26T09:00:00Z', NULL),
-- Completed project P5 FINISHED (9)
('d3adbeef-0000-4000-8000-000000000e0a', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000561', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-01-22T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e0b', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000562', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-02-04T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e0c', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000563', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-02-12T15:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e0d', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000564', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-03-26T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e0e', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000565', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-04-23T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e0f', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000566', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-05-14T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e10', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000567', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-05-28T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e11', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000568', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-06-25T16:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000e12', 'FINISHED', 'd3adbeef-0000-4000-8000-000000000569', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-07-24T16:00:00Z', NULL),
-- New PrimeFoods stages 3–4 CREATED (8)
('d3adbeef-0000-4000-8000-000000000f01', 'CREATED', 'd3adbeef-0000-4000-8000-000000000651', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-09-01T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000f02', 'CREATED', 'd3adbeef-0000-4000-8000-000000000652', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-09-08T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000f03', 'CREATED', 'd3adbeef-0000-4000-8000-000000000653', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-09-15T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000f04', 'CREATED', 'd3adbeef-0000-4000-8000-000000000654', NULL, '5f029f34-81df-4d95-9d9b-89e7f511778d', '2026-09-25T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000f05', 'CREATED', 'd3adbeef-0000-4000-8000-000000000655', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-10-15T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000f06', 'CREATED', 'd3adbeef-0000-4000-8000-000000000656', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-10-18T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000f07', 'CREATED', 'd3adbeef-0000-4000-8000-000000000657', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-10-20T09:00:00Z', NULL),
('d3adbeef-0000-4000-8000-000000000f08', 'CREATED', 'd3adbeef-0000-4000-8000-000000000658', NULL, '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2', '2026-10-25T09:00:00Z', NULL);

-- Rollup consistency: velocity tickets extend workflow 0231's plan window to
-- 08-14 (rollup rule: plan_end = max ticket plan_end), which propagates to
-- module 0221. Phase 0211 already spans 08-14.
UPDATE "public"."Workflows" SET "plan_end_at" = '2026-08-14T17:00:00Z' WHERE "workflow_id" = 'd3adbeef-0000-4000-8000-000000000231';
UPDATE "public"."Modules" SET "plan_end_at" = '2026-08-14T17:00:00Z' WHERE "module_id" = 'd3adbeef-0000-4000-8000-000000000221';

COMMIT;

-- ============================================================================
-- ROLLBACK (run BEFORE re-applying either seed):
--
-- DELETE FROM "public"."TicketAssigned" WHERE "ticket_id" IN
--   ('d3adbeef-0000-4000-8000-000000000b01','d3adbeef-0000-4000-8000-000000000b02',
--    'd3adbeef-0000-4000-8000-000000000b03','d3adbeef-0000-4000-8000-000000000b04',
--    'd3adbeef-0000-4000-8000-000000000b05','d3adbeef-0000-4000-8000-000000000b06',
--    'd3adbeef-0000-4000-8000-000000000b07','d3adbeef-0000-4000-8000-000000000b08',
--    'd3adbeef-0000-4000-8000-000000000b09','d3adbeef-0000-4000-8000-000000000b0a',
--    'd3adbeef-0000-4000-8000-000000000b0b','d3adbeef-0000-4000-8000-000000000b0c',
--    'd3adbeef-0000-4000-8000-000000000b0d','d3adbeef-0000-4000-8000-000000000b0e',
--    'd3adbeef-0000-4000-8000-000000000b0f','d3adbeef-0000-4000-8000-000000000b10',
--    'd3adbeef-0000-4000-8000-000000000245','d3adbeef-0000-4000-8000-000000000261',
--    'd3adbeef-0000-4000-8000-000000000461','d3adbeef-0000-4000-8000-000000000464',
--    'd3adbeef-0000-4000-8000-000000000465','d3adbeef-0000-4000-8000-000000000467',
--    'd3adbeef-0000-4000-8000-000000000468','d3adbeef-0000-4000-8000-000000000469',
--    'd3adbeef-0000-4000-8000-000000000561','d3adbeef-0000-4000-8000-000000000564',
--    'd3adbeef-0000-4000-8000-000000000565','d3adbeef-0000-4000-8000-000000000567',
--    'd3adbeef-0000-4000-8000-000000000568','d3adbeef-0000-4000-8000-000000000569');
-- DELETE FROM "public"."HistoryEvent" WHERE "history_event_id"::text LIKE 'd3adbeef-0000-4000-8000-000000000[cd ef]%';
-- DELETE FROM "public"."Comments" WHERE "comment_id" IN
--   ('d3adbeef-0000-4000-8000-000000000471','d3adbeef-0000-4000-8000-000000000571');
-- DELETE FROM "public"."Tickets" WHERE "ticket_id" IN ('d3adbeef-0000-4000-8000-000000000b01','d3adbeef-0000-4000-8000-000000000b02','d3adbeef-0000-4000-8000-000000000b03','d3adbeef-0000-4000-8000-000000000b04','d3adbeef-0000-4000-8000-000000000b05','d3adbeef-0000-4000-8000-000000000b06','d3adbeef-0000-4000-8000-000000000b07','d3adbeef-0000-4000-8000-000000000b08','d3adbeef-0000-4000-8000-000000000b09','d3adbeef-0000-4000-8000-000000000b0a','d3adbeef-0000-4000-8000-000000000b0b','d3adbeef-0000-4000-8000-000000000b0c','d3adbeef-0000-4000-8000-000000000b0d','d3adbeef-0000-4000-8000-000000000b0e','d3adbeef-0000-4000-8000-000000000b0f','d3adbeef-0000-4000-8000-000000000b10','d3adbeef-0000-4000-8000-000000000461','d3adbeef-0000-4000-8000-000000000462','d3adbeef-0000-4000-8000-000000000463','d3adbeef-0000-4000-8000-000000000464','d3adbeef-0000-4000-8000-000000000465','d3adbeef-0000-4000-8000-000000000466','d3adbeef-0000-4000-8000-000000000467','d3adbeef-0000-4000-8000-000000000468','d3adbeef-0000-4000-8000-000000000469','d3adbeef-0000-4000-8000-000000000561','d3adbeef-0000-4000-8000-000000000562','d3adbeef-0000-4000-8000-000000000563','d3adbeef-0000-4000-8000-000000000564','d3adbeef-0000-4000-8000-000000000565','d3adbeef-0000-4000-8000-000000000566','d3adbeef-0000-4000-8000-000000000567','d3adbeef-0000-4000-8000-000000000568','d3adbeef-0000-4000-8000-000000000569','d3adbeef-0000-4000-8000-000000000651','d3adbeef-0000-4000-8000-000000000652','d3adbeef-0000-4000-8000-000000000653','d3adbeef-0000-4000-8000-000000000654','d3adbeef-0000-4000-8000-000000000655','d3adbeef-0000-4000-8000-000000000656','d3adbeef-0000-4000-8000-000000000657','d3adbeef-0000-4000-8000-000000000658');
-- DELETE FROM "public"."Workflows" WHERE "workflow_id" IN ('d3adbeef-0000-4000-8000-000000000451','d3adbeef-0000-4000-8000-000000000452','d3adbeef-0000-4000-8000-000000000453','d3adbeef-0000-4000-8000-000000000551','d3adbeef-0000-4000-8000-000000000552','d3adbeef-0000-4000-8000-000000000553','d3adbeef-0000-4000-8000-000000000641','d3adbeef-0000-4000-8000-000000000642','d3adbeef-0000-4000-8000-000000000643','d3adbeef-0000-4000-8000-000000000644');
-- DELETE FROM "public"."Modules" WHERE "module_id" IN ('d3adbeef-0000-4000-8000-000000000441','d3adbeef-0000-4000-8000-000000000442','d3adbeef-0000-4000-8000-000000000443','d3adbeef-0000-4000-8000-000000000541','d3adbeef-0000-4000-8000-000000000542','d3adbeef-0000-4000-8000-000000000543','d3adbeef-0000-4000-8000-000000000631','d3adbeef-0000-4000-8000-000000000632','d3adbeef-0000-4000-8000-000000000633','d3adbeef-0000-4000-8000-000000000634');
-- DELETE FROM "public"."Phases" WHERE "phase_id" IN ('d3adbeef-0000-4000-8000-000000000431','d3adbeef-0000-4000-8000-000000000432','d3adbeef-0000-4000-8000-000000000433','d3adbeef-0000-4000-8000-000000000531','d3adbeef-0000-4000-8000-000000000532','d3adbeef-0000-4000-8000-000000000533','d3adbeef-0000-4000-8000-000000000621','d3adbeef-0000-4000-8000-000000000622','d3adbeef-0000-4000-8000-000000000623','d3adbeef-0000-4000-8000-000000000624');
-- DELETE FROM "public"."Gates" WHERE "gate_id" IN ('d3adbeef-0000-4000-8000-000000000421','d3adbeef-0000-4000-8000-000000000422','d3adbeef-0000-4000-8000-000000000423','d3adbeef-0000-4000-8000-000000000521','d3adbeef-0000-4000-8000-000000000522','d3adbeef-0000-4000-8000-000000000523','d3adbeef-0000-4000-8000-000000000611','d3adbeef-0000-4000-8000-000000000612');
-- DELETE FROM "public"."Stages" WHERE "stage_id" IN ('d3adbeef-0000-4000-8000-000000000411','d3adbeef-0000-4000-8000-000000000412','d3adbeef-0000-4000-8000-000000000413','d3adbeef-0000-4000-8000-000000000511','d3adbeef-0000-4000-8000-000000000512','d3adbeef-0000-4000-8000-000000000513','d3adbeef-0000-4000-8000-000000000601','d3adbeef-0000-4000-8000-000000000602');
-- DELETE FROM "public"."RoleAssignments" WHERE "project_id" IN ('d3adbeef-0000-4000-8000-000000000401','d3adbeef-0000-4000-8000-000000000501');
-- DELETE FROM "public"."Contracts" WHERE "contract_id" IN ('d3adbeef-0000-4000-8000-000000000402','d3adbeef-0000-4000-8000-000000000502');
-- DELETE FROM "public"."Projects" WHERE "project_id" IN ('d3adbeef-0000-4000-8000-000000000401','d3adbeef-0000-4000-8000-000000000501');
-- ============================================================================
