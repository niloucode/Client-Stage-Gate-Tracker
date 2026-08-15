# Gate Overview Integration Plan

> **STATUS: EXECUTED 2026-08-15** — implemented inline with the serial
> todo/complete_step workflow. Two forced reviews: the first found a BLOCKING
> bug (next-stage lookup compared gate numbers against stage numbers) + a
> concurrent-decision race + nits — all fixed; the final review: **ship as-is,
> no blockers**.
> Verification: `prisma validate` ✓ · `tsc --noEmit` ✓ · `vitest run` 37 files /
> 256 tests ✓ (9 new gate-rules tests) · `eslint` on all touched files ✓
> (0 problems) · `npm run build` ✓ (exit 0).
> **Migration 12 HAS BEEN APPLIED to Supabase** (user-approved in the plan;
> re-verified read-only: GateSignatures gone, `Gates.creation_date` gone,
> `Gates.comment_id` + `Gates_comment_id_key` present). Rollback = revert.

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock `src/features/gate-overview` with a real, stage-scoped
gate workflow: status-based approvals (the feedback becomes a per-gate comment,
`Gates.comment_id` points at it), client-only decisions gated on all phases
finished, rejected gates auto-spawning the next gate, a per-gate discussion
thread (new comments only on the latest gate), and viewable feedback attachments.

**Architecture:** Approval is status-based — `GateSignatures` is DROPPED (would
stay unused), `Gates.creation_date` is dropped (ordering by `number`), and
`Gates.comment_id` (unique FK) references the approve/decline feedback comment
(`Comments` row with `parent_type = GATE_COMMENT`, `parent_id = gate_id`).
`decideGate` (client-only via `assertProjectClient`, phases-finished gate,
compare-and-set on `status = 'PENDING'`) creates the comment + images, sets
status + comment_id, and either materializes stage dates (`gateApprovalDates`)
or spawns gate N+1. Discussion comments go through `createGateComment`
(member-or-client, latest-gate-only). The comment slice's two
`TICKET_COMMENT` image hardcodes are fixed via `imageParentTypeFor` so gate
images store/load as `GATE_COMMENT`.

**Tech Stack:** Next.js App Router, Prisma (hand-written migration — applied to
Supabase via `prisma db execute`), TanStack Query v5, zod v4, Supabase Storage
(`images` bucket, `gates/` path).

**Spec decisions (user-confirmed 2026-08-15):**
1. Multiple gates per stage (already supported by `Gates.stage_id`).
2. Rejecting a gate creates a NEW gate (PENDING, `number = max+1`).
3. `Gates.creation_date` is deleted; gates are ordered by `number` (descending
   on screen — later gates have larger numbers).
4. `Gates.comment_id` FK → the approve/decline feedback comment.
5. Feedback becomes a `GATE_COMMENT` on the gate; `comment_id` saved on it.
6. View Gate Feedback shows each gate with clickable attachments (lightbox).
7. Every gate has a Comment button → new discussion popup (further comments by
   clients AND project team/owners).
8. New comments only on the LATEST gate (highest number).
9. Gates listed newest-first.
10. Approval is status-based; the GateSignatures table is DROPPED.
11. Only the project's CLIENT can approve/decline, and only when ALL phases
    under the stage are finished (phases finish via the ticket rollup:
    `actual_end_at` set when all workflows finish).
12. `createStage` auto-creates gate #1 (PENDING, number 1).

**Assumptions (flagged at plan time):** "phases finished" = every phase has
`actual_end_at` (rollup-derived); the discussion modal shows the "further
comments" (feedback comment excluded — it stays in the history card); the
gate page's left column shows the real stage tree.

---

### Task 1: Schema & shared foundations

- [x] **Migration 12** (`20260815020000_12_gates_feedback_evolution`) — DROP
      TABLE GateSignatures; DROP Gates.creation_date; ADD Gates.comment_id uuid
      (FK → Comments, unique index for the 1:1 Prisma relation). Schema mirrored
      (Gates gains `comment_id` + `Comments` relation "GateFeedbackComment",
      GateSignatures model + Profiles back-relation deleted, Comments gains the
      back-relation). Verified: validate ✓, generate ✓, tsc ✓.
- [x] **`assertProjectClient`** — client profile + non-deleted contract;
      staff explicitly rejected with a client-facing message.
- [x] **Pure helpers + 9 tests (TDD)** — `deriveNextGateNumber` (max+1,
      null-safe), `imageParentTypeFor` (comment→image parent mapping),
      `allPhasesFinished` (vacuous truth for no phases — createStage always
      ships gate #1, an empty stage has nothing unfinished).
- [x] **`gateKeys`** — `list(stageId)` + `comments(gateId)`.

### Task 2: Entity data layer

- [x] **`entities/gate` slice** — `getStageGates` (number DESC, feedback comment
      + images + discussion counts, `canDecide` flag), `decideGate`
      (client-only, phases-finished, CAS on PENDING, deleted-stage rejection,
      APPROVED → dates via `gateApprovalDates`, REJECTED → gate N+1),
      `createGateComment` (member-or-client, latest-gate-only),
      `getGateComments` (discussion thread, feedback excluded); `useStageGates` /
      `useGateComments` / `useDecideGate` / `useCreateGateComment` with
      gateKeys + stageKeys invalidation. Entity isolation respected (no
      cross-entity imports — comment creation is inline in the gate actions).
- [x] **`createStage`** auto-creates gate #1; **`getProjectStages`** approved
      rule switched to `status === "APPROVED"` (forced by the dropped table).
- [x] **Comment-slice fix** — `selectComment` + `createCommentWithImages`
      derive the image parent type via `imageParentTypeFor` (gate feedback /
      discussion images now store and load as GATE_COMMENT).

### Task 3: UI

- [x] **Feature public API** (`index.ts`); **GateOverview** rewritten: real
      stage tree (keyboard-accessible accordions), real gates, Approve/Decline
      only for the project's client and disabled until all phases finished,
      status + latest-gate sections, error states; **GateFeedbackModal** real
      (number DESC, status badges, clickable attachments via ImageLightbox,
      per-gate Comment button + further-comments count); **GateDiscussionModal**
      new (thread + add-comment form, latest-gate-only, storage uploads);
      **GateFeedbackGiveModal** real decideGate submit (uploads, error.message
      toasts, close blocked while submitting, FormEvent → SyntheticEvent,
      alert() → toast); **gate page** params fixed (`projectId, stageId`),
      public-API import, dead import removed.
- [x] Review fixes: next-stage lookup compares STAGE numbers; CAS race guard;
      deleted-stage rejection; vacuous-truth phases; error banners; stale
      `stageSchedule.ts` docstring updated.

### Task 4: Verification & docs

- [x] **Verification** — prisma validate ✓ · tsc ✓ · 256/256 tests ✓ ·
      eslint ✓ 0 problems · build ✓ (exit 0) · forced reviews (final: ship
      as-is) · **migration 12 applied to Supabase** + read-only re-verification.
- [x] **Docs** — `docs/code-review-plan.md` checkboxes + follow-ups; this plan
      file.

---

## Environment warning (2026-08-15)

WebStorm is running on this workspace with a stale buffer for
`prisma/schema.prisma`: it periodically wrote its old buffer back over external
edits (reverting the migration-12 schema changes mid-session, twice). If the
schema ever looks reverted, reload the file in WebStorm (or close it) and re-run
`npx prisma validate && npx prisma generate`.

---

## Follow-ups (future session)

- [ ] DB-backed tests for `decideGate` / `createGateComment` transactional
      paths (CAS, deleted-stage rejection, latest-gate rule) — pure helpers are
      covered; integration tests need a test DB.
- [ ] `stageRow?.number ?? 0` dead optional chain in `decideGate` (harmless,
      left as-is per the final review).
- [x] **Post-execution fix (2026-08-15)** — `getGateComments` crashed with
      P2007 ("invalid input syntax for type uuid: ''") when the discussion
      modal opened on a PENDING gate: `comment_id: { not: gate.comment_id ?? "" }`
      sent an empty string as a uuid. Fixed by omitting the exclusion filter
      when `comment_id` is null. Verified: tsc ✓, 259/259 tests ✓, DB smoke on
      the exact failing gate (fixed shape OK, old shape reproduces P2007) ✓.
