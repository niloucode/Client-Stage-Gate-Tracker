-- Task 2.2: Composite indexes matching actual query shape.
-- Every application table filters on is_deleted and joins on foreign keys;
-- these indexes turn full scans into index lookups. Generated from the
-- Prisma schema via `prisma migrate diff --from-empty --to-schema`.

CREATE INDEX "Comments_parent_type_parent_id_is_deleted_idx" ON "Comments"("parent_type", "parent_id", "is_deleted");
CREATE INDEX "Images_parent_type_parent_id_is_deleted_idx" ON "Images"("parent_type", "parent_id", "is_deleted");
CREATE INDEX "HistoryEvent_ticket_id_idx" ON "HistoryEvent"("ticket_id");
CREATE INDEX "Tickets_workflow_id_is_deleted_idx" ON "Tickets"("workflow_id", "is_deleted");
CREATE INDEX "Phases_stage_id_is_deleted_idx" ON "Phases"("stage_id", "is_deleted");
CREATE INDEX "Modules_phase_id_is_deleted_idx" ON "Modules"("phase_id", "is_deleted");
CREATE INDEX "Workflows_module_id_is_deleted_idx" ON "Workflows"("module_id", "is_deleted");
CREATE INDEX "Gates_project_id_idx" ON "Gates"("project_id");
CREATE INDEX "RoleAssignments_project_id_idx" ON "RoleAssignments"("project_id");
CREATE INDEX "Stages_project_id_is_deleted_idx" ON "Stages"("project_id", "is_deleted");
