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
- [x] src/shared/ui/sidebar.tsx (2026-08-14: client nav hides only /clients — the Project Team link stays visible, read-only)
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
- [x] src/entities/profile/profileActions.ts (2026-08-14: departmentInviteCode resolution; P2002 idempotent branch backfills missing department; selectTeamProfiles authenticated-read — clients may view the team list, anonymous denied)
- [x] src/entities/profile/queries.ts
- [x] src/entities/role/index.ts (deleted — slice had zero consumers)
- [x] src/entities/role/roleActions.ts (deleted — only export was dead getRoleNameById)
- [x] src/entities/roleAssignment/index.ts
- [x] src/entities/roleAssignment/roleAssignmentActions.ts
- [x] src/entities/roleAssignment/dashboardRole.ts
- [x] src/entities/roleAssignment/dashboardRole.test.ts
- [x] src/entities/department/index.ts
- [x] src/entities/department/departmentActions.ts (2026-08-14: generateStaffInviteCode owner-gated + persists HMAC hash to Department.invite_code_hash)
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
- [x] src/shared/lib/gateRules.ts (new 2026-08-15 — deriveNextGateNumber, imageParentTypeFor, allPhasesFinished; 9 tests)
- [x] src/shared/lib/gateRules.test.ts
- [x] src/shared/lib/contractRules.ts (new 2026-08-15 — deriveInitials for contract approvals; 6 tests)
- [x] src/shared/lib/contractRules.test.ts
- [x] src/shared/schemas/contract.test.ts (new 2026-08-15 — contractApproveSchema, 4 tests)
- [x] src/shared/lib/inviteCode.ts
- [ ] src/shared/lib/inviteCode.test.ts
- [x] src/entities/client/queries.ts
- [x] src/entities/comment/index.ts
- [x] src/entities/comment/types.ts
- [x] src/entities/comment/commentActions.ts (2026-08-15: image parent type derived via imageParentTypeFor — gate comments store/load GATE_COMMENT images instead of the TICKET_COMMENT hardcode)
- [x] src/entities/comment/mutations.ts
- [x] src/entities/comment/queries.ts
- [x] src/entities/contract/index.ts
- [x] src/entities/contract/contractActions.ts (2026-08-15: approveContract replaces signContract — owner/client dual button approval with FOR UPDATE serialization; upload/delete owner-only; upload no longer reassigns client_id; getContractByProjectId includes Clients.client_name)
- [x] src/entities/contract/contractActions.test.ts
- [x] src/entities/contract/mutations.ts
- [x] src/entities/contract/queries.ts
- [x] src/entities/gate/gateActions.ts (deleted — slice had zero live consumers)
- [x] src/entities/issue/index.ts (2026-08-15: public API — actions, types, lib/constants, lib/mappers, queries, ui)
- [x] src/entities/issue/issueActions.ts (2026-08-15: + createIssue/listIssues — project-scoped via assertProjectMemberOrClient (clients may report), reporter from session, "other"→type mapping, issueDetailInclude)
- [x] src/entities/issue/types.ts (2026-08-15: canonical issue types (moved from features/issue-reporting); IssueItem reworked — type: string, lowercase status, specificType removed)
- [x] src/entities/issue/lib/constants.ts (new — URGENCY_WEIGHT, BUG_TYPE_LABELS, bugTypeLabel)
- [x] src/entities/issue/lib/mappers.ts (new — mapIssueRow/formatIssueDateTime/IssueRow, 4 tests)
- [x] src/entities/issue/lib/mappers.test.ts
- [x] src/entities/issue/queries.ts (new — useProjectIssues/useCreateIssue, issueKeys.list invalidation)
- [x] src/entities/issue/ui/index.ts
- [x] src/entities/issue/ui/IssueCard.tsx (moved from features/issue-reporting 2026-08-15)
- [x] src/entities/issue/ui/IssueBox.tsx (moved 2026-08-15; create-button props dropped)
- [x] src/entities/issue/ui/IssueDetailsModal.tsx (moved 2026-08-15)
- [x] src/entities/issue/ui/IssueTableModal.tsx (moved 2026-08-15 + real: useProjectIssues, unlinked-only for the 1-to-1 rule)
- [x] src/entities/gate/index.ts (new 2026-08-15 — actions, types, queries)
- [x] src/entities/gate/types.ts (new 2026-08-15 — GateFeedbackEntry server shape)
- [x] src/entities/gate/gateActions.ts (new 2026-08-15 — getStageGates (+canDecide), decideGate (client-only, phases-finished, CAS, deleted-stage guard, APPROVED→dates / REJECTED→gate N+1), createGateComment (latest-gate-only), getGateComments; entity isolation — no cross-entity imports)
- [x] src/entities/gate/queries.ts (new 2026-08-15 — useStageGates/useGateComments/useDecideGate/useCreateGateComment, gateKeys+stageKeys invalidation)
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
- [x] src/entities/stage/stageActions.ts (2026-08-15: createStage auto-creates gate #1; getProjectStages approved rule → status === "APPROVED")
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
- [x] src/features/auth/ui/StaffSignupForm.tsx (2026-08-14: department picker → department invite code; code determines department server-side)
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
- [x] src/features/contracts/index.ts (new 2026-08-15 — feature public API: ContractPage, ContractViewer, SignatoriesCard, ContractApprovalCard, ExecutedBanner)
- [x] src/features/contracts/ui/index.tsx (deleted 2026-08-15 — superseded by the feature-root public API)
- [x] src/features/contracts/ui/ContractPage.tsx (new 2026-08-15 — FSD: ALL page logic; role derivation owner/client/team, approval card, ExecutedBanner, signatories from owner + client company)
- [x] src/features/contracts/ui/ContractViewer.tsx (2026-08-15: owner-gated upload/delete (canManage), dead rename/download/print + unused props removed, name prefill fixed, failures surfaced)
- [x] src/features/contracts/ui/ClientsDropdown.tsx (deleted 2026-08-15 — the client-assignment flow was replaced by contract client_id approval)
- [x] src/features/contracts/ui/SignatureUpload.tsx (deleted 2026-08-15 — OTP/signature-file flow replaced by button approval)
- [x] src/features/contracts/ui/SignatoriesCard.tsx (2026-08-15: list-only — owner + client rows, cursive signature; assignment dropdown flows removed)
- [x] src/features/contracts/ui/OTPVerification.tsx (deleted 2026-08-15 — replaced by button approval)
- [x] src/features/contracts/ui/AdoptSignatureModal.tsx (deleted 2026-08-15)
- [x] src/features/contracts/ui/ConfirmTextModal.tsx (2026-08-15: silent-failure bug fixed — result check + error toast, stays open on failure; simplified to noParamFunc flow)
- [x] src/features/contracts/ui/ContractApprovalCard.tsx (new 2026-08-15 — gate-style approval card: owner/client variant, own button + other-party status only)
- [x] src/features/contracts/ui/ExecuteAgreementCard.tsx (deleted 2026-08-15)
- [x] src/features/contracts/ui/ExecutedBanner.tsx (2026-08-15: now rendered on the page once both parties approve)
- [x] src/features/gate-overview/index.ts (new 2026-08-15 — public API: GateOverview, the three modals)
- [x] src/features/gate-overview/GateOverview.tsx (2026-08-15: rewritten — real stage tree + gates, client-only Approve/Decline gated on all phases finished, canDecide from the payload, error states, keyboard-accessible accordions)
- [x] src/features/gate-overview/GateFeedbackModal.tsx (2026-08-15: rewritten — real GateFeedbackEntry[], gates number DESC, status badges, clickable feedback images via ImageLightbox, per-gate Comment button + further-comments count)
- [x] src/features/gate-overview/GateFeedbackGiveModal.tsx (2026-08-15: rewritten — real decideGate submit with Supabase uploads (gates/ path, all-or-nothing + cleanup), error.message toasts, close blocked while submitting, FormEvent → SyntheticEvent, alert() → toast)
- [x] src/features/gate-overview/GateDiscussionModal.tsx (new 2026-08-15 — per-gate discussion popup, latest-gate-only posting (spec 8), storage uploads, lightbox, error state)
- [x] src/features/dashboard-analytics/index.ts (new — reviewed 2026-08-15: public API OK — DashboardAnalyticsPage + GanttLevel/GanttTab types; verified in the integration)
- [x] src/features/dashboard-analytics/types.ts (2026-08-15: FSD violation fixed — Prisma payload selects/types moved to entities/*/ganttTypes.ts (imported + re-exported here); GanttTab/GanttLevel now re-exported from lib/schema; verified in the integration)
- [x] src/features/dashboard-analytics/queries.ts (2026-08-15: BLOCKING fixed — mock fetch fns replaced by gated entity actions getProjectPhasesGantt/getProjectModulesGantt/getProjectWorkflowsGantt (assertProjectMemberOrClient); {success:false} → []; normalize fns kept)
- [x] src/features/dashboard-analytics/lib/ganttMapping.ts (2026-08-15: nit fixed — getActualRange now skips degenerate end <= start ranges)
- [x] src/features/dashboard-analytics/lib/ganttMapping.test.ts (new 2026-08-15 — 16 tests: deriveRowStatus/statusColorToken/getPlannedRange/getActualRange incl. degenerate guard/buildGanttResources/buildGanttEvents; created by the integration)
- [x] src/features/dashboard-analytics/lib/mockData.ts (deleted 2026-08-15 by the integration — mock timelines + MOCK_TODAY removed)
- [x] src/features/dashboard-analytics/lib/schema.ts (2026-08-15: dead code fixed — now the single source of truth for GanttTab/GanttLevel types; ganttTabSchema used by GanttTabs; GanttTabInput/GanttLevelInput dropped)
- [x] src/features/dashboard-analytics/ui/DashboardAnalyticsPage.tsx (2026-08-15: MOCK_TODAY → real clock (useState(() => new Date())); loading skeleton + error banner with Retry added; setTab/setLevel passed directly)
- [x] src/features/dashboard-analytics/ui/EmptyGanttState.tsx (new — reviewed 2026-08-15: fine)
- [x] src/features/dashboard-analytics/ui/GanttBarContent.tsx (new — reviewed 2026-08-15: fine — planned=dashed outline / actual=solid fill via event data)
- [x] src/features/dashboard-analytics/ui/GanttResourceLabel.tsx (new — reviewed 2026-08-15: fine — PHASE 01 badge status-colored from resource.color)
- [x] src/features/dashboard-analytics/ui/GanttTabs.tsx (2026-08-15: unchecked cast fixed — onValueChange validated via ganttTabSchema.safeParse)
- [x] src/features/dashboard-analytics/ui/LevelFilterPills.tsx (new — reviewed 2026-08-15: fine — aria-pressed toggle pills)
- [x] src/features/dashboard-analytics/ui/ProjectGanttChart.tsx (new — reviewed 2026-08-15: reui gantt props verified against the vendored API (scale/treePanel/metrics/renderEvent/renderResourceLabel/interactions/…); `resource as GanttRowResource` cast accepted as sound)
- [x] src/features/issue-reporting/index.ts (new — public API: IssueDashboard, IssueReportingModal, IssueFormState)
- [x] src/features/issue-reporting/model/issues.ts (deleted — dead in-memory mock store, zero importers; types moved to entities/issue)
- [x] src/features/issue-reporting/ui/IssueDashboard.tsx (2026-08-15: rewritten — real useProjectIssues(projectId), real counts/tabs, loading+error states, page-level New Issue button)
- [x] src/features/issue-reporting/ui/IssueReportingModal.tsx (2026-08-15: image-remove ✕ bug fixed (cleared description, never the image); object-URL revocation on remove/close/unmount; 5MB cap; Supabase storage upload (images bucket, issues/ path, all-or-nothing + orphan cleanup); owns useCreateIssue mutation, awaits before close; form-kit migration still a follow-up. Re-audit 2026-08-15: React.FormEvent → SyntheticEvent (TS6385), upload loop restructured — no locally-caught throws, close blocked while isSubmitting)
- [x] src/features/issue-reporting/ui/IssueTableModal.tsx (deleted — moved to entities/issue/ui and made real; ticket-board imports via @/entities/issue)
- [x] src/features/landing-dashboard/index.ts
- [x] src/features/landing-dashboard/model/types.ts
- [x] src/features/landing-dashboard/model/mappers.ts
- [x] src/features/landing-dashboard/model/mappers.test.ts
- [x] src/features/landing-dashboard/model/queries.ts
- [x] src/features/landing-dashboard/ui/ActivitySparklines.tsx — 2026-08-14: integrated on the landing dashboard (weekly velocity / risk / upcoming deadlines from getActivitySparklines, shadcn weekday bar chart); warnings fixed (http2 import, ReactNode UMD)
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
- [x] src/features/project-structure/index.ts
- [x] src/features/project-structure/ui/ProjectStructure.tsx
- [x] src/features/project-structure/ui/StageModal.tsx
- [x] src/features/project-structure/ui/StageSequence.tsx
- [x] src/features/project-structure/ui/StageStep.tsx (deleted — dead duplicate of the internal StageStep in StageSequence.tsx)
- [x] src/features/team-manager/index.ts (new — reviewed 2026-08-14; FSD imports fixed)
- [x] src/features/team-manager/model/types.ts (new — reviewed 2026-08-14)
- [x] src/features/team-manager/ui/TeamPage.tsx (new — 2026-08-14: owner-gated generate button; clients see the read-only member list, no redirect)
- [x] src/features/team-manager/ui/TeamTable.tsx (new — reviewed 2026-08-14)
- [x] src/features/team-manager/ui/GenerateStaffCodeModal.tsx (new — 2026-08-14: 'Generate Another' removed, code shown once)
- [x] src/features/stage-editor/index.ts (2026-08-15: reviewed — public API OK; page bypasses it via deep imports, see page entry)
- [x] src/features/stage-editor/types.ts (2026-08-15: reviewed — planStart typed Date while server tree maps Date|null; `description: string` vs Prisma string|null; alignment scheduled in integration plan)
- [x] src/features/stage-editor/defaults.ts (deleted — comment-only dead file, zero importers; removed 2026-08-15 in the integration plan)
- [x] src/features/stage-editor/ui/ModuleCard.tsx (2026-08-15: reviewed — inline date-status helpers duplicated with WorkflowCard (untested); ConfirmDeleteModal imported from @/components/ui/confirmation-modal (inconsistent path); delete mutation resolves {success:false} silently → success toast on failure)
- [x] src/features/stage-editor/ui/PhaseCard.tsx (2026-08-15: reviewed — DnD reorder no try/finally (stuck draggedIndex on error); phase delete throws uncaught (no try/catch); `new Date(actualEnd ?? planEnd)` → epoch when planEnd null (PhaseCard.tsx:349); a11y: delete icon button unlabeled, focus:outline-none)
- [x] src/features/stage-editor/ui/WorkflowCard.tsx (2026-08-15: reviewed — unused Pencil/X imports; redundant WorkflowWithActuals + casts (actualStart already in types.ts); workflow delete/mutations resolve {success:false} silently)
- [x] src/features/stage-editor/ui/modals/AddModule.tsx (deleted — consolidated into ModuleModals.tsx)
- [x] src/features/stage-editor/ui/modals/AddPhase.tsx (deleted — consolidated into PhaseModals.tsx)
- [x] src/features/stage-editor/ui/modals/AddWorkflow.tsx (deleted — consolidated into WorkflowModals.tsx)
- [x] src/features/stage-editor/ui/modals/EditModule.tsx (deleted — consolidated into ModuleModals.tsx)
- [x] src/features/stage-editor/ui/modals/EditPhase.tsx (deleted — consolidated into PhaseModals.tsx)
- [x] src/features/stage-editor/ui/modals/EditWorkflow.tsx (deleted — consolidated into WorkflowModals.tsx)
- [x] src/features/stage-editor/ui/modals/PhaseModal.tsx (deleted — consolidated into PhaseModals.tsx)
- [x] src/features/stage-editor/ui/modals/ModuleModals.tsx (2026-08-15: reviewed — manual useState form (not the form kit); handleSubmit closes + toasts success BEFORE async onSave resolves; delete-in-edit-modal OK; migration to useAppForm scheduled)
- [x] src/features/stage-editor/ui/modals/PhaseModals.tsx (2026-08-15: reviewed — form-kit pattern (useAppForm); awaits mutation before close; zod v4 refine type-guard predicates are a runtime-only no-op (types stay Date|null); useStore is a deprecated alias of useSelector; required plan-date UI confirmed present)
- [x] src/features/stage-editor/ui/modals/WorkflowModals.tsx (2026-08-15: reviewed — same findings as ModuleModals: manual form, closes before async onSave resolves)
- [ ] src/features/tag-manager/index.ts
- [ ] src/features/tag-manager/ui/TagFormModal.tsx
- [ ] src/features/tag-manager/ui/TagListModal.tsx
- [ ] src/features/tag-manager/ui/TagModals.tsx
- [x] src/features/ticket-board/model/columns.ts (2026-08-15: reviewed — COLUMNS PENDING/IN_PROGRESS/FINISHED matches the Prisma status enum)
- [x] src/features/ticket-board/model/queries.ts (2026-08-15: reviewed — useTicketHistory fetches selectTicketHistory, maps via ticketHistoryEntrySchema; fine)
- [x] src/features/ticket-board/model/schema.ts (2026-08-15: reviewed — ticketHistoryEntrySchema; ACTION_ENUM matches the Prisma action enum exactly (verified); z.coerce.date() valid v4 usage)
- [x] src/features/ticket-board/model/types.ts (2026-08-15: reviewed — TicketHistoryEntry mirrors the joined server row)
- [x] src/features/ticket-board/ui/index.ts (2026-08-15: reviewed — exports TicketBoard as the page imports)
- [x] src/features/ticket-board/ui/TicketBoard.tsx (2026-08-15: reviewed — success toast outside try/catch (failed creates toast success, duplicates modal toast); delete fire-and-forget + unconditional success toast; DnD fire-and-forget; no client read-only gating; TagManager same-layer import)
- [x] src/features/ticket-board/ui/TicketCard.tsx (2026-08-15: reviewed — getDummySubtasks fabricates 3 fake tickets (ids `${id}-sub-1`..3) that flow into onSelect (editor opens on a fake ticket) and onDelete (server z.uuid().parse throws); root cause ticketInclude omits subTickets; onEdit prop dead; delete button unlabeled; focus:outline-none)
- [x] src/features/ticket-board/ui/TicketColumn.tsx (2026-08-15: reviewed — simple droppable wrapper; optional no-op callbacks; fine)
- [x] src/features/ticket-board/ui/TicketHistoryLog.tsx (2026-08-15: reviewed — rendered inside TicketActivitySection; unused expanded/hasMore state)
- [x] src/features/ticket-board/ui/TicketModals.tsx (2026-08-15: reviewed — consolidated create+edit modals (plan listed TicketModalCreate/TicketModalEdit as separate files — actual path is TicketModals.tsx); manual useState forms (not the form kit); image upload direct to Supabase with orphaning on failure + alert(); edit slide-over renders TicketEditor; hardcoded codes)
- [x] src/features/ticket-board/ui/TicketModalCreate.tsx (deleted — consolidated into TicketModals.tsx)
- [x] src/features/ticket-board/ui/TicketModalEdit.tsx (deleted — consolidated into TicketModals.tsx)
- [x] src/features/ticket-board/ui/editor/TicketEditor.tsx (2026-08-15: reviewed — subtask list + selection modal wired to real parent_id; hardcoded 'ASC-1028'/'LRN-BNN' codes; fixed-position footer; nested edit slide-over for subtasks)
- [x] src/features/ticket-board/ui/editor/TicketEditorSubcomponents.tsx (2026-08-15: reviewed — TicketSchedule DEADLINE required; disabled actual dates; SubtaskSelectionModal OK; eslint-disable for same-layer issue-reporting import)
- [x] src/features/ticket-board/ui/editor/TicketActivitySection.tsx (2026-08-15: reviewed — comments + images; `comments: any[]` untyped; alert() for size; image upload orphaning; some unlabeled buttons)
- [x] src/features/ticket-board/ui/editor/useTicketEditor.ts (2026-08-15: reviewed — DUMMY_SUBTICKETS (4 fake tickets; ids 'du123mmy-subtask-2/-4' FAIL the startsWith('dummy-') guard → picking them calls updateTicketParent with a fake uuid); handleSave `plan_end_at ?? new Date()` fallback (rule 3); add/remove subtask errors console.error only; subtasks derived from combinedTickets parent_id)
- [x] src/features/ticket-board/ui/editor/helpers.tsx (2026-08-15: reviewed — STATUS_CONFIG/UserAvatar/getLinkedIssueStyle; eslint-disable boundaries/dependencies for IssueItem import from features/issue-reporting — same-layer FSD violation)

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
- [x] src/app/(app)/team/page.tsx (new — reviewed 2026-08-14; renders TeamPage)
- [ ] src/app/(app)/(workspace)/analytics/page.tsx
- [ ] src/app/(app)/(workspace)/credentials/page.tsx
- [ ] src/app/(app)/(workspace)/projects/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/page.tsx
- [x] src/app/(app)/(workspace)/projects/[projectId]/contract/page.tsx (2026-08-15: FSD — thin async server page reading params, renders ContractPage via the feature public API; the old inline page logic moved to features/contracts/ui/ContractPage.tsx)
- [ ] src/app/(app)/(workspace)/projects/[projectId]/contract/loading.tsx
- [x] src/app/(app)/(workspace)/projects/[projectId]/dashboard-analytics/page.tsx (2026-08-15: converted to a thin async-params server page (issues-page pattern); access enforced by the gated entity actions)
- [x] src/app/(app)/(workspace)/projects/[projectId]/gates/[gateId]/page.tsx (deleted — c0b0229 moved gate UI into the workspace)
- [x] src/app/(app)/(workspace)/projects/[projectId]/issues/page.tsx (2026-08-15: reads params.projectId (Next 15 async params), imports via the feature public API; renders the real IssueDashboard)
- [x] src/app/(app)/(workspace)/projects/[projectId]/phases/[phaseId]/page.tsx (deleted)
- [x] src/app/(app)/(workspace)/projects/[projectId]/stages/[stageId]/gate/page.tsx (2026-08-15: params fixed to {projectId, stageId}, public-API import, renders the real GateOverview)
- [x] src/app/(app)/(workspace)/projects/[projectId]/stages/[stageId]/page.tsx (2026-08-15: reviewed with the stage-editor slice — imports bypass the slice public API (deep imports of ui/ModuleCard, ui/PhaseCard, types); `as unknown as Phase[]` cast hides the planStart/description nullability mismatch; NO client permission gating (clients see all Add/Edit/Delete/DnD controls — server actions reject them, but UI must hide them per spec; scheduled in integration plan)
- [x] src/app/(app)/(workspace)/projects/[projectId]/workflows/[workflowId]/page.tsx (2026-08-15: reviewed with the ticket-board slice — server-rendered shell that fetches getWorkflowById + renders TicketBoard; no client gating (TicketBoard handles it); fine)
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
- [x] `src/shared/schemas/project.ts` — Phases/Modules/Workflows: `planStart`/
      `planEnd` from `z.date().optional().nullable()` → required `z.date()`
      (keep `actualStart`/`actualEnd` optional nullable). Update
      `src/shared/schemas/project.test.ts` (the "accepts missing dates
      entirely" case must flip to a rejection case). — 2026-08-15, commit
      18d5d7d (`z.date({ error })`, 14 tests green)
- [x] Entity actions — remove EVERY `?? new Date()` plan-date fallback
      (rule 3) and make the date params required:
      `src/entities/stage/stageActions.ts:53-54` (`TODO(date-rules)` comment
      already present), `src/entities/module/moduleActions.ts:40,43`,
      `src/entities/phase/safeActions.ts:85,88`,
      `src/entities/workflow/workflowActions.ts:58,63`; the StageModal form
      (`src/features/project-structure/ui/StageModal.tsx`) requires them. —
      2026-08-15, commit 18d5d7d (stageActions needed no change — createStage
      already required dates)
- [x] `src/shared/schemas/ticket.ts` — 2026-08-15 user spec REVISED: `plan_end_at`
      stays REQUIRED (modernize deprecated `message` → `error` param only);
      `plan_start_at` is already `z.date().optional().nullable()`.
- [x] **DB migration** — `Tickets.plan_start_at` → nullable (2026-08-15 spec:
      ONLY plan_start_at; `plan_end_at` stays NOT NULL). Rollback = revert the
      migration. — 2026-08-15, commit 9630efe
      (`prisma/migrations/20260815000000_10_tickets_plan_start_nullable/`;
      hand-written because `migrate dev` is blocked by pre-existing shadow-DB
      drift — apply to Supabase out-of-band)
- [x] Stage form at `src/features/project-structure/ui/StageModal.tsx` — required
      plan dates + planEnd>=planStart — 2026-08-14
- [x] Stage-editor modals (`src/features/stage-editor/ui/modals/PhaseModals.tsx`,
      `ModuleModals.tsx`, `WorkflowModals.tsx`) — required date UI (labels,
      validation) for the now-required plan dates — verified 2026-08-15
      (client-side required + range checks present in all three; zod v4
      refine type-guard predicates noted as runtime-only no-op)
- [x] Tickets form/editor (`src/features/ticket-board`) — 2026-08-15 spec
      REVISED: the deadline stays REQUIRED (client-side enforcement stays);
      planned start is omitable; the editor's `plan_end_at ?? new Date()`
      fallback replaced with required-deadline direct use; createTicket
      stores the user's `plan_start_at`. — 2026-08-15, commits 9630efe +
      105c02b
- [x] Tests: schema date-rule tests for stage/phase/module/workflow/ticket;
      keep the pure-helper pattern (`projectStatus.ts` style — pure helpers
      must NOT live in `"use server"` files). — 2026-08-15: phase/module/
      workflow rejection tests added (commit 18d5d7d, `project.test.ts`
      14 tests); ticket actual-date transitions covered by 7 new tests in
      `src/entities/ticket/lib/statusTransitions.test.ts` (commit 35f9aa9);
      stage date-rule tests still open.

---

## Other follow-ups (TODO — future session)

Accumulated during the 2026-08-14 project-dashboard / landing-dashboard work.
All pre-existing unless noted — none block the running app except the first.

- [x] **Unblock `next build`** — 2026-08-14: the actual blocker was a missing
      `mode="edit"` prop on `TicketModalEdit` in
      `src/features/ticket-board/ui/editor/TicketEditor.tsx:211` (TS2322).
      Fixed; `next build` is green again. (`getDummySubtasks` in TicketCard
      removal is scheduled in the 2026-08-15 ticket-board integration plan.)
- [x] **`src/features/landing-dashboard/ui/ActivitySparklines.tsx`** —
      2026-08-14: dead `http2` import removed and the component integrated
      (no longer on hold).
- [x] **Server-side client guard on `createProject`**
      (`src/entities/project/projectActions.ts`) — 2026-08-14: `Profiles.client_id`
      check added ("Clients cannot create projects."), matching the new
      `assertProjectMemberNotClient` helper in `src/lib/auth/projectAccess.ts`.
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
      remove; then gate `knip` in CI. (dashboard-analytics contributed its
      dead `lib/mockData.ts` + `GanttTabInput`/`GanttLevelInput` — removed by
      the 2026-08-15 integration.)
- [x] **Dashboard-analytics integration** — completed 2026-08-15.
      **`docs/reasonix/plans/2026-08-15-dashboard-analytics-integration.md`**
      (real gated data layer, mocks removed, schema.ts wired, cast fix,
      loading/error states, range guard, Gantt Chart button in
      ProjectAccessCard, route page → async params, 16 ganttMapping tests,
      code-review-plan flip). Spec decisions: any project profile incl.
      clients may view read-only (`assertProjectMemberOrClient`); default
      tab Actual; button label "Gantt Chart" + `ChartGantt` icon.
      Verified: prisma validate ✓, tsc ✓, vitest 43/285 ✓, eslint 0/0 ✓.
      `npm run build` blocked by a PRE-EXISTING /analytics prerender failure
      (reproduced at baseline ce76417; layout cookies + useSearchParams
      without Suspense) — suggested fix: `export const dynamic =
      "force-dynamic"` on `src/app/(app)/(workspace)/analytics/page.tsx`.
- [ ] **`ProjectSection` status-config cleanup**
      (`src/features/project-dashboard/ui/ProjectSection.tsx`) — `icolor`
      typo, the suspicious `ACTIVE.color: "text-brand-100"` badge value, and
      the `<h2>` heading nested inside the collapsible toggle `<button>`
      (flow content in a button) — verify colors against the design tokens
      and use a non-heading element for the section label.

- [x] **Gate-approval persistence** — RESOLVED 2026-08-15 by the
      **gate-overview integration** (`docs/reasonix/plans/2026-08-15-gate-overview-integration.md`):
      `decideGate` (entities/gate) is client-only, gated on all phases finished,
      creates the feedback comment + sets `Gates.status` + `comment_id`, and
      materializes stage dates via `gateApprovalDates` (stage `actual_end_at` =
      approval timestamp; next stage `actual_start_at` = same date). Rejection
      auto-creates gate N+1. **The GateSignatures model was DROPPED** (migration
      12 — status-based approval per user decision), `Gates.creation_date`
      dropped, `Gates.comment_id` (unique FK → Comments) added. `getProjectStages`
      approved rule is now `status === "APPROVED"`.
      
      **Gates model state (2026-08-15, migration 12):** gates have NO
      `is_deleted`/`deleted_at` (undeletable), `number` is nullable (`Int?`),
      `stage_id` is NOT NULL, plain `@@index([stage_id])`, `status` GateStatus,
      `comment_id` (unique FK to Comments). `getProjectStages` no longer filters
      `is_deleted` on gates.
- [ ] **`Stages.sort_key` column cleanup** — recorded 2026-08-14: stage
      create no longer writes `sort_key` (spec 4 — stages are ordered by
      `number`, they cannot be reordered). Confirm nothing else reads
      `Stages.sort_key`, then drop the column in a migration. Rollback =
      revert the migration.

- [x] **Extend the client read-only guard to all mutating entity actions** —
      2026-08-14 security review follow-up, closed the same day: swapped to
      `assertProjectMemberNotClient` in all 16 mutation call sites across
      phaseActions / phase safeActions / moduleActions / workflowActions /
      ticketActions (+ createProject fails closed on missing profile).
- [x] **Contract page signing-role UI** — RESOLVED 2026-08-15 by the
      **contracts integration** (`docs/reasonix/plans/2026-08-15-contracts-integration.md`):
      the OTP/typed-signature flow is replaced by button-based dual approval
      (`approveContract` — owner via roleAssignment, client via contract
      client_id). The page derives the viewer's role server-adjacent (no more
      bogus "Client Viewer" default — team members see no approval card, only
      both statuses), and the previously silent `signContract` role-error path
      is gone (approvals are authorized before the write; errors toast).

- [x] **Issue charts on the landing dashboard** — 2026-08-14: new
      `src/entities/issue/` slice (`getIssueStats` — severity counts +
      assigned/unassigned via `_count.Tickets`, client profiles rejected
      server-side) and `src/features/issue-reporting/ui/IssueCharts.tsx`
      (two donuts, c-chart-21 pattern, empty state). Rendered on the
      personal dashboard below the sparklines, staff/owner only. The legacy
      mock issue-reporting files (IssueDashboard etc.) remain unchecked.

- [ ] **Rotating department invite codes** — 2026-08-14: regenerating a code
      via the team page overwrites Department.invite_code_hash, so the old
      code stops working immediately (lookup is exact-hash). Confirmed
      behavior, no further action — listed so the one-time-display UX stays
      intentional.
- [ ] **TeamPage owner check is department-name-based** — `isOwner =
      department?.name === "Project Owner"` (same convention as
      clientActions.requireProjectOwner). If the org ever adds departments
      with other names, the owner gate must move to a role-based check.

- [x] **Clickable tickets → ticket slider (2026-08-14)** — `TicketBoard`
      deep-links `?ticket=<id>` (derived state, no effect; param stripped on
      close/in-board selection). `getProjectStats` expiring tickets +
      `ticketDashboardSelect` now carry `workflow_id`; landing-dashboard
      `TicketItem` gained `projectId`/`workflowId`. ProjectStructure
      TicketCard and TicketsBoard rows navigate to
      `/projects/[projectId]/workflows/[workflowId]?ticket=<id>`. Test setup
      now stubs `next/navigation` globally.

- [x] **Landing-dashboard re-audit (2026-08-14, commits ef11dfe…e18040f)** —
      found + fixed the issue-donut zero bug: the dashboard page mapped the
      `getIssueStats` payload with a speculative `IssueStatsShape` that never
      matched (`{byUrgency[]}` vs flat `high/medium/low`) — the donuts always
      rendered zeros. Added `mapIssueStats` (typed, 3 tests) in the
      landing-dashboard model; the page now maps the real `IssueStats`.
      Removed the orphaned `features/issue-reporting/ui/IssueCharts.tsx`
      (donuts merged into ActivitySparklines, whose props are now required);
      cleared the stale `.next` cache (phantom `variables/page.js` tsc error).

- [x] **Stage-editor integration (2026-08-15)** — ALL items below were completed and
      verified in **`docs/reasonix/plans/2026-08-15-stage-editor-integration.md`**
      (inline execution, commits 859f78a → f161f7e):
  - [x] **Client read-only UI** — `stages/[stageId]/page.tsx` + the three cards
        hide Add/Edit/Delete/DnD for clients via
        `useCurrentUser()` + `profile?.client_id` (ProjectStructure pattern) — 859f78a.
        **2026-08-15 re-audit (dcadeb9):** two gaps closed — (a) the branch
        rewrite (`6d769d4 fix: vscode errors`) had reverted
        `PhaseCard` `draggable={true}` → restored `draggable={!readOnly}`;
        (b) `ModuleCard` never forwarded `readOnly` to `WorkflowCard`, so
        clients still saw Add Workflow, the edit ellipsis, and workflow
        drag-and-drop → `readOnly={readOnly}` added. Verify nothing else was
        dropped in future rewrites.
  - [x] **Page imports bypass the slice public API** — page still deep-imports
        `ui/PhaseCard`, `ui/ModuleCard` (needed for `ref` typing on PhaseCard);
        `WorkflowCard`/`PhaseCard`/`ModuleCard` + `types` re-exported via index.ts.
        Revisit if a steiger `public-api` rule is ever enabled.
  - [x] **Unsafe cast** — `page.tsx:28` `as unknown as Phase[]` removed; server node
        types (`stageActions.ts`) now claim `planStart`/`planEnd: Date` (DB NOT
        NULL) and the slice types match — 8405c1a
  - [x] **Close-before-save** — `ModuleModals.tsx` / `WorkflowModals.tsx` migrated
        to `useAppForm`, modals own the mutations and await before close/toast — aed0a82
  - [x] **Silent mutation failures** — module/workflow mutation hooks throw on
        `{success:false}`; all 3 delete handlers try/catch + error toast; DnD
        reorder try/finally (no stuck `draggedIndex`) — 380ced3
  - [x] **Nits** — comment-only `defaults.ts` deleted; unused `Pencil`/`X` imports
        removed; redundant `WorkflowWithActuals` dropped; `new Date(actualEnd ??
        planEnd)` epoch risk gone (planEnd now non-null); ModuleCard
        `ConfirmDeleteModal` import unified via `@/shared/ui`; a11y aria-labels +
        focus ring restored; `useStore` → `useSelector` — 8405c1a + f161f7e
  - [x] **Date-rules work items (phase/module/workflow)** — schemas required
        `z.date({ error })`, `?? new Date()` fallbacks removed from
        createPhaseAction/createModule/createWorkflow, tests flipped + 3 new
        rejection tests (14 schema tests green) — 18d5d7d
  - [x] **Verification (Task 7)** — `prisma validate` ✓, `tsc --noEmit` ✓,
        `vitest run` 33 files / 219 tests ✓, `eslint` on all touched dirs ✓,
        `npm run build` ✓. NOTE: `eslint src/app` still fails on
        `projects/[projectId]/contract/page.tsx` (3× react-hooks/immutability,
        pre-existing — that file remains unchecked in section 11).

- [x] **Ticket-board integration (2026-08-15)** — ALL items below were completed and
      verified in **`docs/reasonix/plans/2026-08-15-ticket-board-integration.md`**
      (inline execution, commits 7460eb6 → c85efd2; spec: clients read-only /
      team+owners full access; subtasks = `parent_id` derivation; pick-from-existing
      creation; `plan_end_at` REQUIRED + `plan_start_at` nullable + actual-date
      transitions; 3-option delete modal; project-scoped dropdowns; comments +
      attachments without refresh):
  - [x] **Subtask integration (BLOCKING)** — `getDummySubtasks` + `DUMMY_SUBTICKETS`
        removed; board derives real subtasks from the flat workflow list via
        `parent_id` (subtasksByParent map) — 7460eb6
  - [x] **createTicket** — stores `data.plan_start_at ?? null` (was `new Date()`)
        — 9630efe
  - [x] **updateTicket** — writes `plan_start_at` (undefined=skip, null=clear)
        — 9630efe
  - [x] **Actual-date transitions** — `computeActualDates` pure helper + 7 tests
        (PENDING→IN_PROGRESS start; PENDING→FINISHED same ts; regressions revert),
        wired into `updateTicket` + `updateTicketStatus` — 35f9aa9
  - [x] **Delete options (spec)** — `cascadeSoftDeleteTicket(ticketId, performed_by,
        mode)` with cascade (subtree BFS) vs promote (children `parent_id = null`);
        TicketCard shows the 3-option dialog (Cascade / Promote / Cancel) when
        subtasks exist — 794f219
  - [x] **DB migration** — `Tickets.plan_start_at` → nullable via
        `prisma/migrations/20260815000000_10_tickets_plan_start_nullable/migration.sql`
        (hand-written: `migrate dev` is blocked by pre-existing shadow-DB drift;
        apply to Supabase out-of-band); rollback = revert — 9630efe
  - [x] **Client read-only gating** — board buttons (New Ticket/Tags), DnD
        (handlers + useDraggable disabled), delete, and editor (Save, add/remove
        subtask) hidden for clients — 7b386fb
  - [x] **Project-scoped assignee/watcher dropdowns (P1)** — new
        `selectProjectMembers(projectId)` (roleAssignments join, `client_id: null`)
        + `useProjectMembers`; projectId threaded board → modals → editor — 2905831
  - [x] **Comments not visible until refresh (P3)** — query-key fixed:
        `commentKeys.list(CommentParentType.TICKET_COMMENT, id)` now matches the
        invalidation key — 105c02b
  - [x] **Attachments don't load (P2)** — images keys invalidated on create/update;
        slide-over shows a Retry banner instead of silent []; uploads are
        all-or-nothing with storage cleanup + toast errors (alert() removed) —
        105c02b
  - [x] **Error handling** — create toast pass-through (modal owns toasts);
        delete + drag-move awaited with error toasts — 794f219 + 2d839f8
  - [x] **Nits** — `IssueItem`/`BugType`/`UrgencyLevel`/`StepItem` moved to
        `entities/issue` (IssueDashboard re-exports; same-layer eslint-disable
        imports gone); `ticketCode()` replaces `LRN-BNN`/`ASC-1028`;
        `KeyboardSensor` added; `comments: any[]` → `CommentWithImages[]`;
        dead `expanded`/`hasMore`/`ReactElement` removed — c85efd2
  - [x] **Verification (Task 10)** — `prisma validate` ✓, `tsc --noEmit` ✓,
        `vitest run` 34 files / 226 tests ✓ (incl. 7 new statusTransitions tests),
        `eslint` on all touched dirs ✓ (0 errors), `npm run build` ✓. NOTE:
        `prisma migrate dev` is blocked by pre-existing shadow-DB drift
        (P3018 on migration 4) — the plan's migration file must be applied to
        Supabase out-of-band.
  - [x] **WebStorm inspection pass (2026-08-15, commit 3f93451)** — re-audit
        cleared every listed diagnostic: TS71007 serializable-props renames
        (`onCloseAction`/`onUpdateAction`/`onImageClickAction`/`onOpenChangeAction`/
        `onSelectSubtaskAction`/`setTicketAction`/`setSelectedTagsAction`/
        `setApiMethodAction`/`setApiRouteAction` — WebStorm-only inspection, not
        emitted by tsc; renamed per the Next.js-documented contract);
        throw-in-try control flow replaced with boolean helpers/early returns in
        model/schema.ts + both upload loops; unused `TicketHistoryEntryInput`
        removed; `React.*` UMD globals → typed imports; stale JSDoc in
        TicketBoard rewritten; deprecated `React.FormEvent` → `React.SyntheticEvent`;
        ignored promises `void`-prefixed; `<img>` → `next/image` (unoptimized) for
        attachment URLs, blob: previews kept with scoped eslint-disable.
        **Bonus find:** tsc surfaced a LATENT bug (masked by the incremental
        cache, unmasked by the user's edits): `IssueFormState.urgency` is
        `UrgencyLevel | ""` and was assigned to `urgency: UrgencyLevel` in
        IssueDashboard:630 + IssueTableModal:47 — fixed with `|| "low"` (matches
        the existing `type || "other"` pattern). Re-verified: tsc ✓, eslint ✓
        (0 problems incl. legacy issue-reporting), vitest 34/226 ✓, build ✓.

- [x] **Issue-reporting integration (2026-08-15)** — ALL items below were completed and
      verified in **`docs/reasonix/plans/2026-08-15-issue-reporting-integration.md`**
      (inline execution with serial step sign-off; built-in review on the final diff,
      no blockers, 2 should-fix items applied; final verification: prisma validate ✓,
      tsc ✓, vitest 37 files / 246 tests ✓ (20 new), eslint ✓ 0 problems, build ✓):
  - [x] **Migration 11 (hand-written, apply to Supabase out-of-band; rollback = revert)** —
        `Issues.project_id` NOT NULL FK + `reported_by` FK + `reported_at` +
        `IssueStatus` enum + `status` column; `Tickets.issue_id` → unique (1-to-1).
  - [x] **Entity data layer** — `createIssue`/`listIssues` (project-scoped,
        `assertProjectMemberOrClient` — clients report too; reporter from session),
        `issueCreateSchema` (10 tests), `issueStatus` pure helpers (6 tests),
        `mapIssueRow` mapper (4 tests), `useProjectIssues`/`useCreateIssue` hooks.
  - [x] **Ticket link persistence (was pure theater)** — `issue_id` added to the ticket
        schemas + create/update actions (previously Zod silently stripped it);
        status auto-sync (link / FINISHED→RESOLVED / regression→LINKED /
        soft-delete: non-FINISHED releases, FINISHED keeps); cross-project link guard;
        P2002 checked against `Tickets_issue_id_key`; `ticketInclude` carries `issue`.
  - [x] **UI** — picker moved to `entities/issue/ui` (real data, unlinked-only),
        same-layer ticket-board import gone; `IssueDashboard` real data; modal fixes
        (image-remove ✕ bug, object-URL leaks, 5MB cap, Supabase upload all-or-nothing
        incl. orphan cleanup); feature public API; page passes projectId.
  - [ ] Follow-ups: `IssueReportingModal` → `useAppForm` migration; DB-backed tests for
        the transactional sync paths; `ticketInclude.issue` read weight.
  - [x] **Re-audit + runtime fixes (2026-08-15, same plan doc)** — user-reported
        `'use server" file can only export async functions, found object` + `Failed to
        load issues`: root cause was `export const issueDetailInclude` (plain object)
        in the "use server" file — made module-private; new repo-wide regression test
        `src/shared/testing/use-server-exports.test.ts` scans all directive files.
        WebStorm diagnostics fixed (FormEvent, throw-in-try, close-during-submit,
        pagination aria-labels); stale-UI fix: all 4 ticket mutation hooks now
        invalidate `issueKeys.all`; `updateTicket` syncs the linked issue on
        status-only changes; P2002 conflict check matches `meta.target` FIELD name
        (`issue_id`, per clientActions.ts convention) so the friendly "already linked"
        error actually fires; create+edit toasts surface `error.message`.
  - [x] **Migration 11 APPLIED to Supabase (2026-08-15)** — `prisma db execute --file`
        after user approval (0 rows affected); re-verified read-only: new columns +
        `IssueStatus` type + `Tickets_issue_id_key` unique present; generated-client
        smoke test against the DB clean.
