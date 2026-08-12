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
- [x] src/shared/form/useAppForm.ts
- [ ] src/shared/form/SubmitButton.tsx
- [x] src/shared/form/SchedulingFields.tsx
- [x] src/shared/form/fields/TextField.tsx
- [x] src/shared/form/fields/TextField.test.tsx
- [ ] src/shared/form/fields/DateTimeField.tsx
- [ ] src/shared/form/fields/DateTimeField.test.tsx
- [ ] src/shared/form/fields/PhoneField.tsx
- [ ] src/shared/form/fields/SelectField.tsx
- [ ] src/shared/form/fields/TextAreaField.tsx

## 6. Shared layer — UI kit (custom)

- [ ] src/shared/ui/index.ts
- [ ] src/shared/ui/ConfirmDeleteModal.tsx
- [ ] src/shared/ui/forminput.tsx
- [ ] src/shared/ui/ImageLightbox.tsx
- [ ] src/shared/ui/PasswordInput.tsx
- [x] src/shared/ui/PlannedViewPlaceholder.tsx (deleted)
- [ ] src/shared/ui/search-status.tsx
- [ ] src/shared/ui/sidebar.tsx
- [ ] src/shared/ui/tagPrimitives.tsx

## 7. Shared layer — shadcn UI primitives (src/components/ui)

- [ ] src/components/ui/alert-dialog.tsx
- [ ] src/components/ui/avatar.tsx
- [ ] src/components/ui/badge.tsx
- [ ] src/components/ui/button.tsx
- [ ] src/components/ui/card.tsx
- [ ] src/components/ui/command.tsx
- [ ] src/components/ui/dialog.tsx
- [ ] src/components/ui/dropdown-menu.tsx
- [ ] src/components/ui/input.tsx
- [ ] src/components/ui/input-group.tsx
- [ ] src/components/ui/label.tsx
- [ ] src/components/ui/phone-input.tsx
- [ ] src/components/ui/popover.tsx
- [ ] src/components/ui/select.tsx
- [ ] src/components/ui/separator.tsx
- [ ] src/components/ui/textarea.tsx
- [ ] src/components/ui/toast.tsx
- [ ] src/components/ui/tooltip.tsx

## 8. Shared layer — hooks & test setup

- [ ] src/shared/hooks/useResetOnOpen.ts
- [ ] src/shared/testing/setup.ts
- [ ] src/shared/testing/server-only-stub.ts

## 9. Entities layer

- [ ] src/entities/types.ts
- [ ] src/entities/profile/index.ts
- [ ] src/entities/profile/profileActions.ts
- [ ] src/entities/profile/queries.ts
- [ ] src/entities/role/index.ts
- [ ] src/entities/role/roleActions.ts
- [ ] src/entities/roleAssignment/index.ts
- [ ] src/entities/roleAssignment/roleAssignmentActions.ts
- [ ] src/entities/department/index.ts
- [ ] src/entities/department/departmentActions.ts
- [ ] src/entities/tag/index.ts
- [ ] src/entities/tag/tagActions.ts
- [ ] src/entities/tag/mutations.ts
- [ ] src/entities/tag/queries.ts
- [ ] src/entities/tag/ui/index.ts
- [ ] src/entities/tag/ui/TagBadge.tsx
- [ ] src/entities/client/index.ts
- [ ] src/entities/client/clientActions.ts
- [ ] src/entities/client/queries.ts
- [ ] src/entities/comment/index.ts
- [ ] src/entities/comment/types.ts
- [ ] src/entities/comment/commentActions.ts
- [ ] src/entities/comment/mutations.ts
- [ ] src/entities/comment/queries.ts
- [ ] src/entities/contract/index.ts
- [ ] src/entities/contract/contractActions.ts
- [ ] src/entities/contract/contractActions.test.ts
- [ ] src/entities/contract/mutations.ts
- [ ] src/entities/contract/queries.ts
- [ ] src/entities/gate/gateActions.ts
- [ ] src/entities/module/index.ts
- [ ] src/entities/module/types.ts
- [ ] src/entities/module/moduleActions.ts
- [ ] src/entities/module/mutations.ts
- [ ] src/entities/module/queries.ts
- [ ] src/entities/phase/index.ts
- [ ] src/entities/phase/types.ts
- [ ] src/entities/phase/phaseActions.ts
- [ ] src/entities/phase/mutations.ts
- [ ] src/entities/phase/queries.ts
- [ ] src/entities/phase/safeActions.ts
- [ ] src/entities/phase/safeActions.test.ts
- [ ] src/entities/project/index.ts
- [ ] src/entities/project/projectActions.ts
- [ ] src/entities/project/mutations.ts
- [ ] src/entities/project/queries.ts
- [ ] src/entities/stage/index.ts
- [ ] src/entities/stage/stageActions.ts
- [ ] src/entities/stage/queries.ts
- [ ] src/entities/stage/ordering.test.ts
- [ ] src/entities/ticket/index.ts
- [ ] src/entities/ticket/types.ts
- [ ] src/entities/ticket/ticketActions.ts
- [ ] src/entities/ticket/mutations.ts
- [ ] src/entities/ticket/queries.ts
- [ ] src/entities/ticket/lib/dateRollup.ts
- [ ] src/entities/ticket/lib/dateRollup.test.ts
- [ ] src/entities/ticket/lib/logHistoryEvent.ts
- [ ] src/entities/workflow/index.ts
- [ ] src/entities/workflow/types.ts
- [ ] src/entities/workflow/workflowActions.ts
- [ ] src/entities/workflow/mutations.ts
- [ ] src/entities/workflow/queries.ts

## 10. Features layer

- [ ] src/features/auth/index.ts
- [ ] src/features/auth/context/auth_provider.tsx
- [ ] src/features/auth/ui/LoginForm.tsx
- [ ] src/features/auth/ui/ClientSignupForm.tsx
- [ ] src/features/auth/ui/StaffSignupForm.tsx
- [ ] src/features/navigation/ui/index.ts
- [ ] src/features/navigation/ui/TopNav.tsx
- [ ] src/features/navigation/ui/AccountMenu.tsx
- [ ] src/features/navigation/ui/Breadcrumbs.tsx
- [ ] src/features/client-manager/ui/AddClientModal.tsx
- [ ] src/features/client-manager/ui/ClientFormModal.tsx
- [ ] src/features/client-manager/ui/EditClientModal.tsx
- [ ] src/features/client-manager/ui/ViewTeamMembersModal.tsx
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
- [ ] src/features/issue-reporting/ui/IssueDashboard.tsx
- [ ] src/features/issue-reporting/ui/IssueReportingModal.tsx
- [ ] src/features/project-dashboard/index.ts
- [ ] src/features/project-dashboard/ui/ProjectCard.tsx
- [ ] src/features/project-dashboard/ui/ProjectDashboard.tsx
- [ ] src/features/project-dashboard/ui/ProjectSection.tsx
- [ ] src/features/project-manager/ui/modals/index.ts
- [ ] src/features/project-manager/ui/modals/DeleteProjectModal.tsx
- [ ] src/features/project-manager/ui/modals/EditProjectModal.tsx
- [ ] src/features/project-manager/ui/modals/ManageMembersModal.tsx
- [ ] src/features/project-structure/index.ts
- [ ] src/features/project-structure/ui/ProjectStructure.tsx
- [ ] src/features/project-structure/ui/StageModal.tsx
- [ ] src/features/project-structure/ui/StageSequence.tsx
- [ ] src/features/project-structure/ui/StageStep.tsx
- [ ] src/features/stage-editor/index.ts
- [ ] src/features/stage-editor/types.ts
- [ ] src/features/stage-editor/defaults.ts
- [ ] src/features/stage-editor/ui/ModulesCard.tsx
- [ ] src/features/stage-editor/ui/PhaseStepper.tsx
- [ ] src/features/stage-editor/ui/WorkflowsList.tsx
- [ ] src/features/stage-editor/ui/modals/AddModule.tsx
- [ ] src/features/stage-editor/ui/modals/AddPhase.tsx
- [ ] src/features/stage-editor/ui/modals/AddWorkflow.tsx
- [ ] src/features/stage-editor/ui/modals/EditModule.tsx
- [ ] src/features/stage-editor/ui/modals/EditPhase.tsx
- [ ] src/features/stage-editor/ui/modals/EditWorkflow.tsx
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
- [ ] src/app/(app)/(workspace)/projects/[projectId]/gates/[gateId]/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/issues/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/phases/[phaseId]/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/stages/[stageId]/page.tsx
- [ ] src/app/(app)/(workspace)/projects/[projectId]/workflows/[workflowId]/page.tsx
- [ ] src/app/api/notifications/route.ts
- [ ] src/app/api/webhooks/route.ts
- [ ] src/app/dev/ui/page.tsx
- [x] src/app/dev/views/page.tsx (deleted)

## 12. Tooling (independent scripts)

- [ ] scripts/add-pg-trgm.mjs
- [ ] scripts/seed-sort-keys.mjs
- [ ] scripts/tokenize-colors.mjs
- [ ] scripts/verify-sort-keys.mjs
