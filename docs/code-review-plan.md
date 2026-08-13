# Code Review Plan — Stage-Gate Tracker

> Per-file code review checklist, ordered **bottom-up** by dependency hierarchy
> (feature-sliced-design v2.1): foundational/leaf modules first, higher
> composing layers last. One file per step. Checkbox flips to `[x]` only after
> the user replies and fixes are applied + verified (`tsc --noEmit` / `eslint`).
>
> Rules applied: FSD layers `shared → entities → features → app`; imports only
> downward; no cross-imports between slices on the same layer; public API via
> `index.ts`. Generated code (`src/lib/generated/**`), lockfiles, `node_modules`,
> `.next`, `coverage`, and third-party code are excluded.

## 1. Configuration & schema (foundational leaves)

- [x] next.config.ts
- [x] eslint.config.mjs
- [x] postcss.config.mjs
- [x] prisma.config.ts
- [x] vitest.config.ts
- [x] prisma/schema.prisma
- [x] src/env.ts

## 2. Server infrastructure (src/lib)

- [x] src/lib/prisma.ts
- [x] src/lib/safe-action.ts
- [x] src/lib/utils.ts
- [x] src/lib/supabase/client.ts
- [x] src/lib/supabase/server.ts
- [x] src/lib/supabase/adminClient.ts
- [x] src/lib/supabase/proxy.ts
- [x] src/lib/auth/projectAccess.ts
- [x] src/proxy.ts

## 3. Shared layer — types, utilities, schemas

- [x] src/shared/types/index.ts
- [x] src/shared/lib/colors.ts
- [x] src/shared/lib/colors.test.ts
- [x] src/shared/lib/strings.ts
- [x] src/shared/lib/strings.test.ts
- [x] src/shared/lib/devOnly.ts (deleted)
- [x] src/shared/lib/fractionalSort.ts
- [x] src/shared/lib/fractionalSort.test.ts
- [x] src/shared/lib/zod.ts
- [x] src/shared/lib/zod.test.ts
- [x] src/shared/lib/plannedViews.ts (deleted)
- [x] src/shared/lib/scheduling/index.ts
- [x] src/shared/lib/scheduling/chronology.ts
- [x] src/shared/lib/scheduling/dateInput.ts
- [x] src/shared/lib/scheduling/dateInput.test.ts
- [x] src/shared/lib/scheduling/rollup.ts
- [x] src/shared/lib/scheduling/scheduling.ts
- [x] src/shared/lib/scheduling/scheduling.test.ts
- [x] src/shared/schemas/index.ts
- [x] src/shared/schemas/auth.ts
- [x] src/shared/schemas/client.ts
- [x] src/shared/schemas/contract.ts
- [x] src/shared/schemas/profile.ts
- [x] src/shared/schemas/project.ts
- [x] src/shared/schemas/project.test.ts
- [x] src/shared/schemas/tag.ts
- [x] src/shared/schemas/ticket.ts

## 4. Shared layer — query infrastructure

- [x] src/shared/query/keys.ts
- [x] src/shared/query/cachePolicy.ts
- [x] src/shared/query/client.tsx
- [x] src/shared/query/register.ts

## 5. Shared layer — form kit

- [x] src/shared/form/index.ts
- [x] src/shared/form/contexts.ts
- [x] src/shared/form/errors.ts
- [x] src/shared/form/errors.test.ts
- [x] src/shared/form/useAppForm.ts
- [x] src/shared/form/SubmitButton.tsx
- [x] src/shared/form/SchedulingFields.tsx
- [x] src/shared/form/fields/TextField.tsx
- [x] src/shared/form/fields/TextField.test.tsx
- [x] src/shared/form/fields/DateTimeField.tsx
- [x] src/shared/form/fields/DateTimeField.test.tsx
- [ ] src/shared/form/fields/PasswordField.tsx
- [ ] src/shared/form/fields/PasswordField.test.tsx
- [x] src/shared/form/fields/PhoneField.tsx
- [x] src/shared/form/fields/SelectField.tsx
- [x] src/shared/form/fields/TextAreaField.tsx

## 6. Shared layer — UI kit (custom)

- [x] src/shared/ui/index.ts
- [x] src/shared/ui/ConfirmDeleteModal.tsx
- [x] src/components/ui/forminput.tsx (legacy FormInput; plan listed it under shared/ui — actual path)
- [x] src/shared/ui/ImageLightbox.tsx
- [x] src/shared/ui/PasswordInput.tsx
- [x] src/shared/ui/PlannedViewPlaceholder.tsx (deleted)
- [x] src/shared/ui/search-status.tsx
- [x] src/shared/ui/sidebar.tsx
- [x] src/shared/ui/tagPrimitives.tsx

## 7. Shared layer — shadcn UI primitives (src/components/ui)

- [x] src/components/ui/alert-dialog.tsx
- [x] src/components/ui/avatar.tsx
- [x] src/components/ui/badge.tsx
- [x] src/components/ui/back.tsx
- [x] src/components/ui/button.tsx
- [x] src/components/ui/calendar.tsx
- [x] src/components/ui/card.tsx
- [x] src/components/ui/command.tsx
- [x] src/components/ui/dialog.tsx
- [x] src/components/ui/datetime-picker.tsx
- [x] src/components/ui/dropdown-menu.tsx
- [x] src/components/ui/input.tsx
- [x] src/components/ui/input-group.tsx
- [x] src/components/ui/label.tsx
- [x] src/components/ui/phone-input.tsx
- [x] src/components/ui/combobox.tsx
- [x] src/components/ui/scroll-area.tsx
- [x] src/components/ui/popover.tsx
- [x] src/components/ui/select.tsx
- [x] src/components/ui/separator.tsx
- [x] src/components/ui/textarea.tsx
- [x] src/components/ui/toast.tsx
- [x] src/components/ui/tooltip.tsx
- [x] src/components/ui/checkbox.tsx
- [x] src/components/ui/context-menu.tsx
- [x] src/components/ui/tabs.tsx

## 7b. Vendored component library (src/components/reui — gantt chart)

> Vendored third-party code (reui gantt) — tracked for awareness; formatted,
> dead code removed, and lint-scoped (React Compiler rules relaxed in
> eslint.config.mjs for this folder only).

- [x] src/components/reui/gantt/gantt.tsx
- [x] src/components/reui/gantt/gantt-bar.tsx
- [x] src/components/reui/gantt/gantt-dnd.tsx
- [x] src/components/reui/gantt/gantt-i18n.tsx
- [x] src/components/reui/gantt/gantt-lib.tsx
- [x] src/components/reui/gantt/gantt-nav.tsx
- [x] src/components/reui/gantt/gantt-recurrence.tsx
- [x] src/components/reui/gantt/gantt-types.tsx
- [x] src/components/reui/gantt/gantt-view.tsx

## 8. Shared layer — hooks & test setup

- [x] src/shared/hooks/useResetOnOpen.ts
- [x] src/shared/testing/setup.ts
- [x] src/shared/testing/server-only-stub.ts

## 9. Entities layer

- [x] src/entities/types.ts
- [x] src/entities/profile/index.ts
- [x] src/entities/profile/profileActions.ts
- [x] src/entities/profile/queries.ts
- [x] src/entities/role/index.ts (deleted — slice had zero consumers)
- [x] src/entities/role/roleActions.ts (deleted — only export was dead getRoleNameById)
- [x] src/entities/roleAssignment/index.ts
- [x] src/entities/roleAssignment/roleAssignmentActions.ts
- [x] src/entities/roleAssignment/dashboardRole.ts
- [x] src/entities/roleAssignment/dashboardRole.test.ts
- [x] src/entities/department/index.ts
- [x] src/entities/department/departmentActions.ts
- [x] src/entities/department/queries.ts
- [x] src/entities/tag/index.ts
- [x] src/entities/tag/tagActions.ts
- [x] src/entities/tag/mutations.ts
- [x] src/entities/tag/queries.ts
- [x] src/entities/tag/ui/index.ts
- [x] src/entities/tag/ui/TagBadge.tsx
- [x] src/entities/client/index.ts
- [x] src/entities/client/clientActions.ts
- [ ] src/entities/client/clientActions.test.ts
- [ ] src/shared/lib/inviteCode.ts
- [ ] src/shared/lib/inviteCode.test.ts
- [x] src/entities/client/queries.ts
- [x] src/entities/comment/index.ts
- [x] src/entities/comment/types.ts
- [x] src/entities/comment/commentActions.ts
- [x] src/entities/comment/mutations.ts
- [x] src/entities/comment/queries.ts
- [x] src/entities/contract/index.ts
- [x] src/entities/contract/contractActions.ts
- [x] src/entities/contract/contractActions.test.ts
- [x] src/entities/contract/mutations.ts
- [x] src/entities/contract/queries.ts
- [x] src/entities/gate/gateActions.ts (deleted — slice had zero live consumers)
- [x] src/entities/module/index.ts
- [x] src/entities/module/types.ts (deleted — merged into slice files)
- [x] src/entities/module/moduleActions.ts
- [x] src/entities/module/mutations.ts
- [x] src/entities/module/queries.ts (deleted — merged into slice files)
- [x] src/entities/phase/index.ts
- [x] src/entities/phase/types.ts (deleted — merged into slice files)
- [x] src/entities/phase/phaseActions.ts
- [x] src/entities/phase/mutations.ts
- [x] src/entities/phase/queries.ts (deleted — merged into slice files)
- [x] src/entities/phase/safeActions.ts
- [x] src/entities/phase/safeActions.test.ts
- [x] src/entities/project/index.ts
- [x] src/entities/project/projectActions.ts
- [x] src/entities/project/mutations.ts
- [x] src/entities/project/queries.ts
- [x] src/entities/project/projectStatus.test.ts
- [x] src/entities/stage/index.ts
- [x] src/entities/stage/stageActions.ts
- [x] src/entities/stage/queries.ts
- [x] src/entities/stage/ordering.test.ts
- [x] src/entities/ticket/index.ts
- [x] src/entities/ticket/types.ts
- [x] src/entities/ticket/ticketActions.ts
- [x] src/entities/ticket/mutations.ts
- [x] src/entities/ticket/queries.ts
- [x] src/entities/ticket/lib/dateRollup.ts
- [x] src/entities/ticket/lib/dateRollup.test.ts
- [x] src/entities/ticket/lib/logHistoryEvent.ts
- [x] src/entities/ticket/lib/statusConfig.ts
- [x] src/entities/workflow/index.ts
- [x] src/entities/workflow/types.ts (deleted — merged into slice files)
- [x] src/entities/workflow/workflowActions.ts
- [x] src/entities/workflow/mutations.ts
- [x] src/entities/workflow/queries.ts (deleted — merged into slice files)

## 10. Features layer

- [x] src/features/auth/index.ts
- [x] src/features/auth/context/auth_provider.tsx
- [x] src/features/auth/ui/LoginForm.tsx
- [x] src/features/auth/ui/ClientSignupForm.tsx
- [x] src/features/auth/ui/StaffSignupForm.tsx
- [x] src/features/auth/auth-forms.interaction.test.tsx
- [x] src/features/navigation/ui/index.ts
- [x] src/features/navigation/ui/TopNav.tsx
- [x] src/features/navigation/ui/AccountMenu.tsx
- [x] src/features/navigation/ui/Breadcrumbs.tsx
- [x] src/features/navigation/account-menu.test.tsx
- [x] src/features/client-manager/ui/AddClientModal.tsx (deleted — superseded by ClientFormModal)
- [x] src/features/client-manager/index.ts
- [x] src/features/client-manager/model/types.ts
- [x] src/features/client-manager/ui/ClientsPage.tsx (extracted from the app page — FSD)
- [x] src/features/client-manager/ui/ClientsTable.tsx (split from ClientsPage)
- [x] src/features/client-manager/ui/ClientFormModal.tsx
- [x] src/features/client-manager/ui/EditClientModal.tsx (deleted — dead duplicate of ClientFormModal's edit mode)
- [x] src/features/client-manager/ui/ViewTeamMembersModal.tsx
- [x] src/features/client-manager/clients-page.role.test.tsx
- [ ] src/features/contracts/ui/index.tsx
- [ ] src/features/contracts/ui/ContractViewer.tsx
- [ ] src/features/contracts/ui/ClientsDropdown.tsx
- [ ] src/features/contracts/ui/SignatureUpload.tsx
- [ ] src/features/contracts/ui/SignatoriesCard.tsx
- [ ] src/features/contracts/ui/OTPVerification.tsx
- [ ] src/features/contracts/ui/AdoptSignatureModal.tsx
- [ ] src/features/contracts/ui/ConfirmTextModal.tsx
- [ ] src/features/contracts/ui/ExecuteAgreementCard.tsx
- [ ] src/features/contracts/ui/ExecutedBanner.tsx
- [ ] src/features/gate-overview/GateOverview.tsx
- [ ] src/features/gate-overview/GateFeedbackModal.tsx
- [ ] src/features/dashboard-analytics/index.ts
- [ ] src/features/dashboard-analytics/types.ts
- [ ] src/features/dashboard-analytics/queries.ts
- [ ] src/features/dashboard-analytics/lib/ganttMapping.ts
- [ ] src/features/dashboard-analytics/lib/mockData.ts
- [ ] src/features/dashboard-analytics/lib/schema.ts
- [ ] src/features/dashboard-analytics/ui/DashboardAnalyticsPage.tsx
- [ ] src/features/dashboard-analytics/ui/EmptyGanttState.tsx
- [ ] src/features/dashboard-analytics/ui/GanttBarContent.tsx
- [ ] src/features/dashboard-analytics/ui/GanttResourceLabel.tsx
- [ ] src/features/dashboard-analytics/ui/GanttTabs.tsx
- [ ] src/features/dashboard-analytics/ui/LevelFilterPills.tsx
- [ ] src/features/dashboard-analytics/ui/ProjectGanttChart.tsx
- [ ] src/features/issue-reporting/model/issues.ts
- [ ] src/features/issue-reporting/ui/IssueDashboard.tsx
- [ ] src/features/issue-reporting/ui/IssueReportingModal.tsx
- [ ] src/features/issue-reporting/ui/IssueTableModal.tsx
- [x] src/features/landing-dashboard/index.ts
- [x] src/features/landing-dashboard/model/types.ts
- [x] src/features/landing-dashboard/model/mappers.ts
- [x] src/features/landing-dashboard/model/mappers.test.ts
- [x] src/features/landing-dashboard/model/queries.ts
- [ ] src/features/landing-dashboard/ui/ActivitySparklines.tsx (on hold — integration deferred by decision; TODO in the dashboard page)
- [x] src/features/landing-dashboard/ui/PendingContracts.tsx
- [x] src/features/landing-dashboard/ui/PendingContracts.test.tsx
- [x] src/features/landing-dashboard/ui/TicketsBoard.tsx
- [x] src/features/landing-dashboard/ui/TicketsBoard.test.tsx
- [x] src/features/project-dashboard/index.ts
- [x] src/features/project-dashboard/ui/ProjectCard.tsx
- [x] src/features/project-dashboard/ui/ProjectCard.test.tsx
- [x] src/features/project-dashboard/ui/ProjectDashboard.tsx
- [x] src/features/project-dashboard/ui/ProjectSection.tsx
- [x] src/features/project-dashboard/ui/modals/index.ts (moved from features/project-manager — merged 2026-08-14)
- [x] src/features/project-dashboard/ui/modals/DeleteProjectModal.tsx (moved from features/project-manager — merged 2026-08-14)
- [x] src/features/project-dashboard/ui/modals/EditProjectModal.tsx (moved from features/project-manager — merged 2026-08-14)
- [x] src/features/project-dashboard/ui/modals/ManageMembersModal.tsx (moved from features/project-manager — merged 2026-08-14)
- [x] src/features/project-manager/ (deleted — merged into features/project-dashboard)
- [ ] src/features/project-structure/index.ts
- [ ] src/features/project-structure/ui/ProjectStructure.tsx
- [ ] src/features/project-structure/ui/StageModal.tsx
- [ ] src/features/project-structure/ui/StageSequence.tsx
- [ ] src/features/project-structure/ui/StageStep.tsx
- [ ] src/features/stage-editor/index.ts
- [ ] src/features/stage-editor/types.ts
- [ ] src/features/stage-editor/defaults.ts
- [ ] src/features/stage-editor/ui/ModuleCard.tsx
- [ ] src/features/stage-editor/ui/PhaseCard.tsx
- [ ] src/features/stage-editor/ui/WorkflowCard.tsx
- [x] src/features/stage-editor/ui/modals/AddModule.tsx (deleted — consolidated into ModuleModals.tsx)
- [x] src/features/stage-editor/ui/modals/AddPhase.tsx (deleted — consolidated into PhaseModals.tsx)
- [x] src/features/stage-editor/ui/modals/AddWorkflow.tsx (deleted — consolidated into WorkflowModals.tsx)
- [x] src/features/stage-editor/ui/modals/EditModule.tsx (deleted — consolidated into ModuleModals.tsx)
- [x] src/features/stage-editor/ui/modals/EditPhase.tsx (deleted — consolidated into PhaseModals.tsx)
- [x] src/features/stage-editor/ui/modals/EditWorkflow.tsx (deleted — consolidated into WorkflowModals.tsx)
- [x] src/features/stage-editor/ui/modals/PhaseModal.tsx (deleted — consolidated into PhaseModals.tsx)
- [ ] src/features/stage-editor/ui/modals/ModuleModals.tsx
- [ ] src/features/stage-editor/ui/modals/PhaseModals.tsx
- [ ] src/features/stage-editor/ui/modals/WorkflowModals.tsx
- [ ] src/features/tag-manager/index.ts
- [ ] src/features/tag-manager/ui/TagFormModal.tsx
- [ ] src/features/tag-manager/ui/TagListModal.tsx
- [ ] src/features/tag-manager/ui/TagModals.tsx
- [ ] src/features/ticket-board/model/columns.ts
- [ ] src/features/ticket-board/model/queries.ts
- [ ] src/features/ticket-board/model/schema.ts
- [ ] src/features/ticket-board/model/types.ts
- [ ] src/features/ticket-board/ui/index.ts
- [ ] src/features/ticket-board/ui/TicketBoard.tsx
- [ ] src/features/ticket-board/ui/TicketCard.tsx
- [ ] src/features/ticket-board/ui/TicketColumn.tsx
- [ ] src/features/ticket-board/ui/TicketHistoryLog.tsx
- [ ] src/features/ticket-board/ui/TicketModalCreate.tsx
- [ ] src/features/ticket-board/ui/TicketModalEdit.tsx
- [ ] src/features/ticket-board/ui/editor/TicketEditor.tsx
- [ ] src/features/ticket-board/ui/editor/TicketEditorSubcomponents.tsx
- [ ] src/features/ticket-board/ui/editor/TicketActivitySection.tsx
- [ ] src/features/ticket-board/ui/editor/useTicketEditor.ts
- [ ] src/features/ticket-board/ui/editor/helpers.tsx

## 11. App layer — layouts, pages, API routes

- [ ] src/app/layout.tsx
- [ ] src/app/page.tsx
- [ ] src/app/(auth)/layout.tsx
- [ ] src/app/(auth)/login/page.tsx
- [ ] src/app/(auth)/signup/client/page.tsx
- [ ] src/app/(auth)/signup/staff/page.tsx
- [ ] src/app/(auth)/signup-callback/route.ts
- [ ] src/app/(app)/layout.tsx
- [ ] src/app/(app)/dashboard/page.tsx
- [ ] src/app/(app)/clients/page.tsx
- [ ] src/app/(app)/(workspace)/layout.tsx
- [ ] src/app/(app)/(workspace)/analytics/page.tsx
- [ ] src/app/(app)/(workspace)/credentials/page.tsx
- [ ] src/app/(app)/(workspace)/projects/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/contract/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/contract/loading.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/dashboard-analytics/page.tsx
- [x] src/app/(app)/(workspace)/projects/[projectId]/gates/[gateId]/page.tsx (deleted — c0b0229 moved gate UI into the workspace)
- [ ] src/app/(app)/(workspace)/projects/[projectId]/issues/page.tsx
- [x] src/app/(app)/(workspace)/projects/[projectId]/phases/[phaseId]/page.tsx (deleted)
- [ ] src/app/(app)/(workspace)/projects/[projectId]/stages/[stageId]/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/workflows/[workflowId]/page.tsx
- [ ] src/app/api/notifications/route.ts
- [ ] src/app/api/webhooks/route.ts
- [x] src/app/dev/ui/page.tsx (deleted)
- [x] src/app/dev/views/page.tsx (deleted)

## 12. Tooling (independent scripts)

- [ ] scripts/add-pg-trgm.mjs
- [ ] scripts/prune-auth-models.mjs
- [ ] scripts/seed-sort-keys.mjs
- [ ] scripts/tokenize-colors.mjs
- [ ] scripts/verify-sort-keys.mjs

---

## Follow-up plan (TODO — future session): Date input rules

> Deferred by decision on 2026-08-14 (project-dashboard integration shipped
> without it). Do NOT let these rot — they are the canonical input rules.

**Rules:**
1. `plan_start_at` / `plan_end_at` are **REQUIRED (non-nullable)** for
   Projects, Stages, Phases, Modules, Workflow.
2. `plan_start_at` / `plan_end_at` are **OPTIONAL (nullable)** for Tickets.
3. Never instantiate `new Date()` to satisfy a Zod requirement (no
   `.default(() => new Date())`, no `?? new Date()` fallbacks).

**Work items:**
- [ ] `src/shared/schemas/project.ts` — Phases/Modules/Workflows: `planStart`/
      `planEnd` from `z.date().optional().nullable()` → required `z.date()`
      (keep `actualStart`/`actualEnd` optional nullable). Update
      `src/shared/schemas/project.test.ts` (the "accepts missing dates
      entirely" case must flip to a rejection case).
- [ ] Entity actions — remove EVERY `?? new Date()` plan-date fallback
      (rule 3) and make the date params required:
      `src/entities/stage/stageActions.ts:53-54` (`TODO(date-rules)` comment
      already present), `src/entities/module/moduleActions.ts:40,43`,
      `src/entities/phase/safeActions.ts:85,88`,
      `src/entities/workflow/workflowActions.ts:58,63`; the StageModal form
      (`src/features/project-structure/ui/StageModal.tsx`) requires them.
- [ ] `src/shared/schemas/ticket.ts` — `plan_end_at` (currently
      `z.date({ message: "Deadline is required" })`) → `z.date().optional()
      .nullable()`; `plan_start_at` already optional nullable.
- [ ] **DB migration** — `Tickets.plan_start_at` / `Tickets.plan_end_at` are
      currently NOT NULL; make them nullable so optional ticket dates can be
      stored. Rollback = revert the migration.
- [ ] Stage-editor modals (`src/features/stage-editor/ui/modals/PhaseModals.tsx`,
      `ModuleModals.tsx`, `WorkflowModals.tsx`; stage form at
      `src/features/project-structure/ui/StageModal.tsx`) — required date UI
      (labels, validation) for the now-required plan dates.
- [ ] Tickets form/editor (`src/features/ticket-board`) — dates must be
      omitable; remove any client-side "deadline required" enforcement.
- [ ] Tests: schema date-rule tests for stage/phase/module/workflow/ticket;
      keep the pure-helper pattern (`projectStatus.ts` style — pure helpers
      must NOT live in `"use server"` files).

---

## Other follow-ups (TODO — future session)

Accumulated during the 2026-08-14 project-dashboard / landing-dashboard work.
All pre-existing unless noted — none block the running app except the first.

- [ ] **Unblock `next build`** — `src/features/ticket-board/ui/TicketCard.tsx`
      lines 29-30 use `parentTicket.subTickets` but the ticket type has no
      `subTickets` field (TS2339; 3 errors). Fix the ticket include/type or
      remove the `getDummySubtasks` helper. This is the only thing stopping a
      green build.
- [ ] **`src/features/landing-dashboard/ui/ActivitySparklines.tsx`** — dead
      `import { Http2ServerRequest } from "http2"` (line 5, lint warning).
      Remove when the component comes off hold (integration TODO lives in
      `src/app/(app)/dashboard/page.tsx`).
- [ ] **Server-side client guard on `createProject`**
      (`src/entities/project/projectActions.ts`) — the UI hides "+ Add
      Project" for client profiles, but the action itself has no
      client-profile check (any authenticated user may create; the creator
      becomes Project Owner). Add a `Profiles.client_id` check returning a
      permission error.
- [ ] **`EditProjectModal` edit-mode `client_id` edge case**
      (`src/features/project-dashboard/ui/modals/EditProjectModal.tsx`) —
      edit submit validates via `projectCreateSchema`, which requires
      `client_id`; if a project's contract row were missing or deleted the
      edit could never save. Unreachable today (contracts are created
      atomically with `client_id` NOT NULL), but the edit path should
      validate with `projectUpdateSchema` instead.
- [ ] **A11y: nested interactive in `ProjectCard`** — the ellipsis
      `DropdownMenuTrigger` button sits inside the card's `<Link>`. It works
      via stopPropagation but is invalid interactive nesting; restructure
      (e.g. place the menu outside the link, or use the Link as the trigger's
      render target).
- [ ] **Project date-field naming consistency** — `src/shared/schemas/
      project.ts` uses `start_date`/`deadline_date` while Phase/Module/
      Workflow use the canonical `planStart`/`planEnd` (Task 1.5
      vocabulary). Align the project schema/UI/actions in a dedicated pass.
- [ ] **knip cleanup** — `npx knip` reports ~313 findings (unused default
      exports, dead exports across features), all pre-existing. Triage and
      remove; then gate `knip` in CI.
