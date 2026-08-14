# Stage Structure Page — Implementation Record (2026-08-14)

> Executed from the approved layered plan (project-structure feature review +
> integration). Follows the code-review-plan.md workflow (one file per step).

## Scope delivered

- **Phase 1 — Cleanup/FSD:** deleted dead `ui/StageStep.tsx` (duplicate),
  unused interfaces/imports; feature imports stage actions via the
  `@/entities/stage` public API.
- **Phase 2 — Numbering (specs 4, 7):** `src/entities/stage/lib/stageNumbers.ts`
  (pure helpers + 11 tests). `createStage` assigns `number = max+1`, no
  `sort_key`; `cascadeSoftDeleteStage` nulls the deleted number and decrements
  higher siblings in the same transaction.
- **Phase 3 — Data layer:** `stageKeys.list(projectId)`, `getProjectStages`
  (number-ordered, `approved` = GateSignatures exists), `useProjectStages`;
  `getProjectStats` (done/total for phases/modules/workflows/tickets +
  top-5 expiring tickets with server-side `daysLeft`), `useProjectStats`.
- **Phase 4 — Actual dates (specs 1-3, materialize-on-write):**
  `src/shared/lib/scheduling/stageSchedule.ts` (pure helpers + 7 tests).
  `signContract` materializes stage-1 `actual_start_at` = later signature
  date. `gateApprovalDates` implemented + tested, wired `TODO(gate-approval)`
  (out of scope by user decision).
- **Phase 5 — Page:** ProjectStructure renders real data (project, stages,
  stats, current user), current stage = first unapproved, progress =
  approved/total, no mock defaults; clients lose edit UI + mutations reject
  client profiles (`assertProjectMemberNotClient`, also applied to
  `createProject` — resolves its follow-up); StageModal: required plan dates
  with end>=start refine, actual-date fields removed, keyed remount (kills
  `set-state-in-effect`), description now persisted (was dropped before);
  stage detail page header shows the real name.
- **Phase 6 — Docs:** code-review-plan.md checkboxes flipped; follow-ups
  updated (gate-approval action + `Stages.sort_key` column cleanup added;
  "Unblock next build" + createProject client guard marked done).

## Definitions of Done (Task 4.5)

1. **Dependencies & prerequisites:** none added. Builds on entities/stage,
   entities/project, entities/contract, entities/profile, shared/scheduling.
2. **DB migration & rollback:** NO schema change (number column + partial
   unique index and NOT NULL plan dates already in place).
3. **Acceptance criteria (user specs):**
   - Spec 1: contract signed → stage 1 actual_start (latest of the two dates) ✓
   - Spec 2: stage actual_end = gate approval date — implemented as tested
     helper; persistence deferred (gate feature is mock-only) ✓/TODO
   - Spec 3: next stage actual_start = previous actual_end — same ✓/TODO
   - Spec 4: no sort_key for stages ✓ (column remains, cleanup follow-up)
   - Spec 5: clients cannot edit (UI + server) ✓
   - Spec 6: team = owners ✓ (assertProjectMemberNotClient)
   - Spec 7: delete → number NULL + shift ✓
4. **Tests added:** 18 new unit tests (stageNumbers 11, stageSchedule 7);
   full suite 180/180.
5. **Verification commands:** `prisma validate` ✓, `tsc --noEmit` ✓ (0),
   `vitest run` ✓ (180), `eslint` ✓ (clean on touched files), `knip` ✓
   (feature files clean), `next build` ✓ (green — also fixed the pre-existing
   TicketEditor `mode="edit"` blocker).

## Follow-ups recorded

- Gate-approval persistence (`approveGate`) — see code-review-plan.md.
- `Stages.sort_key` column cleanup — see code-review-plan.md.
