# Issue Reporting Integration Plan

> **STATUS: EXECUTED 2026-08-15** — implemented inline (superpowers-executing-plans)
> with the serial todo/complete_step workflow; docs sign-off done; commit pending.
> **RE-AUDIT 2026-08-15** (user-reported runtime errors): fixed + re-verified — see
> the "Re-audit" section at the bottom. Built-in `review` ran on the final diff three
> times (last verdict: "ship as-is", no blockers).
> Verification: `prisma validate` ✓ · `tsc --noEmit` ✓ · `vitest run` 37 files /
> 247 tests ✓ (21 new incl. the use-server-exports regression test) · `eslint` on all
> touched files ✓ (0 problems) · `npm run build` ✓ (exit 0).
> **Migration 11 HAS BEEN APPLIED to Supabase** (2026-08-15, `prisma db execute --file`
> with user approval; 0 rows affected; re-verified read-only + client smoke test).
> Rollback = revert the migration.

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy mock `src/features/issue-reporting` (fake in-memory store, fabricated issues, cosmetic ticket links that Zod silently dropped) with a fully real, project-scoped issue-reporting feature: DB-backed issues, a working create flow (clients AND team/owners may report), a persisted 1-to-1 issue↔ticket link driven from the ticket-board, and auto-managed issue status.

**Architecture:** `Issues` gains `project_id` (NOT NULL), `reported_by`, `reported_at`, and an `IssueStatus` enum column; `Tickets.issue_id` becomes UNIQUE (1-to-1). Status is auto-synced by the ticket mutations through a pure, tested helper (`deriveIssueStatus`/`shouldKeepLinkOnDelete`): RESOLVED when the linked ticket is FINISHED, LINKED while pending/in-progress, UNLINKED when no ticket is linked; a soft-deleted ticket keeps its link ONLY when FINISHED. Server actions live in `entities/issue` (create/list) and `entities/ticket` (link sync); the picker UI moved to `entities/issue/ui` so the ticket-board consumes it through the entity public API (the old features→features import is gone).

**Tech Stack:** Next.js App Router, Prisma (hand-written migration — out-of-band apply), TanStack Query v5 (queryOptions + invalidate), zod v4 (`z.enum(…, { error })`, `superRefine`), Supabase Storage (`images` bucket, `issues/` path).

**Spec decisions (user-confirmed 2026-08-15):**
1. Full real integration — server actions + TanStack Query + real data everywhere; mocks deleted.
2. Issue status is a DB column (`IssueStatus` migration); RESOLVED iff its linked ticket is FINISHED; the issue↔ticket relationship is 1-to-1 (an issue links to at most one ticket, enforced by a unique index).
3. Soft-delete rule: a PENDING/IN_PROGRESS ticket that is soft-deleted unlinks its issue (issue → UNLINKED); a FINISHED ticket keeps the link (issue stays RESOLVED).
4. Permissions: clients AND project team/owners may report issues (new `assertProjectMemberOrClient` — clients link via their contract, not roleAssignments); manual linking happens only in the ticket-board, which stays team/owner-gated via the existing `assertProjectMemberNotClient` on `updateTicket`/`createTicket`.
5. Scoping: `Issues.project_id` FK — the page at `/projects/[projectId]/issues` shows only that project's issues.

**Assumptions (reversible, flagged at plan time):** `reported_by`/`reported_at` columns added because the UI displays "Reported By X on <date>" (impossible without them); "other" type stores its free text in the DB `type` column (UI renders raw strings via `bugTypeLabel`); the picker offers only UNLINKED issues; no manual resolve button (auto-transitions only).

---

### Task 1: Schema & shared foundations

**Files:**
- Create: `prisma/migrations/20260815010000_11_issues_project_scope/migration.sql`
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/auth/projectAccess.ts`
- Create: `src/shared/schemas/issue.ts` + `src/shared/schemas/issue.test.ts`
- Create: `src/shared/lib/issueStatus.ts` + `src/shared/lib/issueStatus.test.ts`
- Modify: `src/shared/query/keys.ts`
- Modify: `src/entities/issue/types.ts`; Create: `src/entities/issue/lib/constants.ts`, `src/entities/issue/lib/mappers.ts` + `mappers.test.ts`

- [x] **Step 1: Migration 11** — `CREATE TYPE IssueStatus (UNLINKED/LINKED/RESOLVED)`; `Issues.project_id uuid NOT NULL` + FK to Projects (orphan rows deleted first — no create path existed), `reported_by uuid` FK to Profiles, `reported_at timestamptz NOT NULL DEFAULT now()`, `status IssueStatus NOT NULL DEFAULT 'UNLINKED'`; `CREATE UNIQUE INDEX Tickets_issue_id_key` (replaces `Tickets_issue_id_idx`) for the 1-to-1 link. Schema mirrored (`@unique` on `Tickets.issue_id`, `IssueStatus` enum, back-relations). Verified: `prisma validate` ✓, `prisma generate` ✓, `tsc --noEmit` ✓.
- [x] **Step 2: `assertProjectMemberOrClient`** in `src/lib/auth/projectAccess.ts` — session check, roleAssignment membership, else non-deleted contract client. Verified: tsc ✓.
- [x] **Step 3: `issueCreateSchema`** (zod v4; name ≤60 required, type/urgency enums, `superRefine` other→specificType, description ≤300, steps ≤20 with empty-filter-at-action, `timeOfError` normalized `Date|null`) — TDD: 10 tests, RED→GREEN ✓.
- [x] **Step 4: `issueStatus` pure helpers** — `deriveIssueStatus(ticketStatus)` (null→UNLINKED, PENDING/IN_PROGRESS→LINKED, FINISHED→RESOLVED) and `shouldKeepLinkOnDelete` (FINISHED keeps) — 6 tests, RED→GREEN ✓.
- [x] **Step 5: keys + types + mapper** — `issueKeys.list(projectId)`; `IssueItem` reworked (type: string, lowercase status, no specificType); `mapIssueRow`/`formatIssueDateTime` + `IssueRow` server-row types; `bugTypeLabel`/`URGENCY_WEIGHT`/`BUG_TYPE_LABELS` in `entities/issue/lib/constants.ts` — 4 mapper tests, RED→GREEN ✓. Legacy UI adjusted to compile (interim, replaced in Task 4).

### Task 2: Entity data layer

**Files:**
- Modify: `src/entities/issue/issueActions.ts`
- Create: `src/entities/issue/queries.ts`
- Modify: `src/shared/schemas/ticket.ts`
- Modify: `src/entities/ticket/types.ts`, `src/entities/ticket/ticketActions.ts`

- [x] **Step 1: `createIssue` + `listIssues`** — `assertProjectMemberOrClient` gate; zod parse; "other"→type mapping; `IssueSteps` createMany (number 1..n); reporter from session; returns mapped `IssueItem`. `listIssues`: project-scoped, newest first, `issueDetailInclude` (IssueSteps asc, Tickets take:1, Profile). `useProjectIssues`/`useCreateIssue` query hooks with list+stats invalidation. Verified: tsc ✓, 105 shared/entity tests ✓.
- [x] **Step 2: ticket schemas** — `issue_id: z.uuid().optional().nullable()` on `ticketCreateSchema` (update inherits via `.partial()`), so the link is no longer stripped by Zod.
- [x] **Step 3: ticketActions wiring** — `ticketInclude` gains the full `issue` include (shape duplicated locally — entity isolation); `syncLinkedIssueStatus` (active-ticket rule, tx-aware) recomputes the issue status; `createTicket`/`updateTicket` write `issue_id` (undefined=skip, null=clear, uuid=set) and sync old+new issue; `updateTicketStatus` syncs on FINISHED/regression; `cascadeSoftDeleteTicket` (cascade subtree + promote) clears `issue_id` for non-FINISHED tickets then re-syncs. Verified: tsc ✓, full suite 246 ✓.

### Task 3: UI moves & feature rewrite

**Files:**
- Create: `src/entities/issue/ui/IssueCard.tsx`, `IssueBox.tsx`, `IssueDetailsModal.tsx`, `IssueTableModal.tsx`, `ui/index.ts`
- Delete: `src/features/issue-reporting/model/issues.ts`, `src/features/issue-reporting/ui/IssueTableModal.tsx`
- Rewrite: `src/features/issue-reporting/ui/IssueDashboard.tsx`, `IssueReportingModal.tsx`
- Create: `src/features/issue-reporting/index.ts`; Modify: `src/app/(app)/(workspace)/projects/[projectId]/issues/page.tsx`
- Modify: `src/features/ticket-board/ui/TicketModals.tsx`, `editor/TicketEditor.tsx`, `editor/TicketEditorSubcomponents.tsx`, `editor/useTicketEditor.ts`

- [x] **Step 1: picker move** — `IssueCard`/`IssueBox`/`IssueDetailsModal`/`IssueTableModal` → `entities/issue/ui` (public API via `ui/index.ts` + entity `index.ts`); `IssueBox` drops the create-button props; the picker is now REAL: `useProjectIssues`, UNLINKED-only (1-to-1), no create modal (entities cannot import features). Verified: tsc ✓.
- [x] **Step 2: mock deletion** — `model/issues.ts` (dead store, zero importers) and the legacy picker deleted; `MOCK_ISSUES`, local component copies and the type re-export removed from `IssueDashboard`; ticket-board consumers switched to `{ IssueTableModal } from "@/entities/issue"` with `projectId` threaded (TicketSchedule prop added); create payload now carries `issue_id`. Verified: tsc ✓, 246 tests ✓.
- [x] **Step 3: real dashboard** — `useProjectIssues(projectId)`, real metric counts + status tabs, loading state, create flow via `useCreateIssue` (mapped `IssueCreateInput`, error toast, no fabrication); page passes `params.projectId` (Next 15 async params). Verified: tsc ✓.
- [x] **Step 4: modal fixes + real submit** — image-remove ✕ now clears the IMAGE (bug: it re-set the description); object URLs tracked + revoked on remove/close/unmount (leak fixed); step images upload to Supabase Storage `images` bucket (`issues/` path) all-or-nothing with cleanup on upload AND create failure; modal owns the `useCreateIssue` mutation (awaits before close, success/error toasts, isSubmitting state); 5MB file cap. Verified: tsc ✓, 246 tests ✓.
- [x] **Step 5: public API + page** — `src/features/issue-reporting/index.ts` (IssueDashboard, IssueReportingModal, IssueFormState); page imports via it; grep confirms no deep imports remain.

### Task 4: Ticket-board persistence wiring

- [x] **Step 1: create + save carry `issue_id`** — `TicketModalCreate` passes `validation.data.issue_id ?? null`; editor `handleSave` passes `ticket.issue_id ?? null` (server round-trip / pick / explicit null unlink). Verified: tsc ✓, 246 tests ✓.
- [x] **Step 2: server-derived linked issue** — `TicketSchedule` initializes its displayed issue from the ticket's included `issue` row via `mapIssueRow` (survives refresh; picker picks and unlink still override). Verified: tsc ✓ (no cast needed — payload structurally assignable).

### Task 5: Verification & docs

- [x] **Step 1: full verification** — `prisma validate` ✓ · `tsc --noEmit` ✓ · `vitest run` 37 files / 246 tests ✓ · `eslint` on all touched files ✓ (0 problems) · `npm run build` ✓ (exit 0; cookie prerender warnings pre-existing on untouched routes).
- [x] **Step 2: built-in review** — no blockers. Should-fix applied: (1) `assertIssueInProject` guard in `createTicket`/`updateTicket` — a project member cannot link an issue from another project (would otherwise mutate foreign `Issues.status`); (2) `rethrowIssueLinkConflict` now checks `meta.target === Tickets_issue_id_key` instead of swallowing every P2002. Nits applied: 5MB upload cap, dashboard `isError` state. Accepted: destructive DELETE in migration 11 (documented; table had no create path), `ticketInclude.issue` read weight, transactional sync paths have pure-helper tests only (no DB in vitest).
- [x] **Step 3: docs** — `docs/code-review-plan.md` checkboxes + follow-ups updated; this plan file saved.

---

## Re-audit (2026-08-15) — runtime-error fixes

User-reported after the first sign-off:

1. **`'use server" file can only export async functions, found object`** (toast on
   "Report Bug") + **`Failed to load issues`** — root cause: `export const
   issueDetailInclude` (a plain object) in the "use server" file poisoned the whole
   module, so both `createIssue` and `listIssues` failed. Fix: module-private const.
   New repo-wide regression test (`src/shared/testing/use-server-exports.test.ts`)
   scans every directive file for object/array/non-async exports (comment-stripping;
   next-safe-action consts allowed) — RED→GREEN.
2. **`P2022 ColumnNotFound` / `Unknown argument project_id`** — migration 11 was NOT
   applied to Supabase (out-of-band step). Diagnosed read-only (column introspection,
   0 rows in Issues), then **applied with user approval** via
   `prisma db execute --file prisma/migrations/20260815010000_11_issues_project_scope/migration.sql`.
   Re-verified: new columns + `IssueStatus` type + `Tickets_issue_id_key` unique
   (old `Tickets_issue_id_idx` dropped); generated-client smoke query clean.
   **The running dev server must be restarted to pick up the fresh client.**
3. **WebStorm diagnostics** (IssueReportingModal): `React.FormEvent` deprecated →
   `React.SyntheticEvent`; upload loop restructured (flag+break, no locally-caught
   throws); close blocked while `isSubmitting` (in-flight submit cannot be cancelled).
4. **Stale-UI in the tickets portion**: the 4 ticket mutation hooks
   (`useCreateTicket`/`useUpdateTicket`/`useUpdateTicketStatus`/`useDeleteTicket`)
   now invalidate `issueKeys.all` — the issues page, the picker, and the landing
   stats refresh immediately after link/unlink/FINISHED/regression/soft-delete.
5. **`updateTicket` status-only sync** — direct callers that change status without
   sending `issue_id` now re-sync the linked issue.
6. **P2002 conflict message never fired** — Prisma reports `meta.target` as FIELD
   names (repo convention: `clientActions.ts` checks `invite_code_hash`); the check
   now matches `issue_id` (index name kept as fallback). Create + edit toasts surface
   `error.message` so the friendly message reaches the user.
7. A11y: pagination aria-labels in `IssueBox`.
8. **`Unknown field 'issue' for include statement on model 'Tickets'`** (createTicket
   500) — the `ticketInclude` relation key used `issue`, but the Prisma relation field
   on `Tickets` is named `Issues` (model name, not lowercased). tsc missed it because
   plain-object includes bypass excess-property checks. Fixed: `Issues:` key +
   `satisfies Prisma.TicketsInclude` so tsc now validates every include field name at
   compile time; editor reads `ticket.Issues`; runtime smoke of the include shape
   against Supabase passed.

Re-verified: `tsc` ✓ · 247/247 tests ✓ · eslint ✓ 0 problems · `npm run build` ✓ ·
final forced review: **ship as-is, no blockers**.

---

## Follow-ups (future session)

- [ ] Migrate `IssueReportingModal` to the form kit (`useAppForm`) — manual `useState` form remains (custom steps/urgency/image UI made it the pragmatic scope).
- [ ] DB-backed tests for the transactional sync paths (`syncLinkedIssueStatus` etc.) — pure helpers are covered; integration tests need a test DB.
- [ ] `ticketInclude.issue` adds weight to every board read — revisit with a slimmer select if the workflow lists grow.
- [x] ~~Apply migration `20260815010000_11_issues_project_scope` to Supabase out-of-band~~ — **DONE 2026-08-15** via `prisma db execute --file` (user-approved), re-verified.
