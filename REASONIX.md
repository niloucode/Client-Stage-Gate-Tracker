# REASONIX.md — Stage-Gate Project

> Canonical project memory for Reasonix Code. Covers stack, design rules, and
> schema clarifications. Update as the codebase evolves.

---

## Stack

- **Framework**: Next.js (App Router)
- **ORM**: Prisma, client output at `src/lib/generated/prisma`
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (`auth.users` bridged 1:1 to `public.Profiles`)
- **Frontend data flow**: TanStack Query → server actions → Prisma → DB
- **FSD layers**: `app → features → entities → shared`

---

## Key Design Rules

1. **Soft deletes**: All domain tables use `is_deleted` + `deleted_at`. Join tables
   (`RoleAssignments`, `RolePermissions`, `TicketAssigned`, `TicketTags`) are
   hard-deleted only when the relationship is explicitly removed or the parent
   entity is hard-deleted. Soft-deleting an entity does NOT cascade to join rows.
2. **UUIDs originate from the DB** — never generate client-side.
3. **TicketAssigned diff-ing**: Updates compute add/remove diffs; never nuke-all.
   Original `assigned_date` must be preserved for unchanged entries.
4. **Contracts are 1:1 with Projects** (`project_id @unique`). Blank on creation;
   PO uploads the file; both PO and Client sign independently.
5. **Gates have no name/description** — identified by `number` only. A gate is
   approved by the presence of a `GateSignatures` row (exactly one client signature).
6. **Polymorphic integrity**: `Comments.(parent_type, parent_id)` and
   `Images.(parent_type, parent_id)` rely on app-level referential integrity
   (no DB-level FK to the polymorphic targets).

---

## Schema Clarifications (Canonical)

### Tickets always belong to a Workflow

`Tickets.workflow_id` is **NOT nullable** — every ticket must belong to a
workflow. The previous documentation described it as nullable ("can exist outside
a workflow"), which was incorrect.

### HistoryEvent DELETE action

The `DELETE` action in the `HistoryEvent.action` enum records who **soft-deleted
a ticket** — it does NOT mean a profile was deleted. `target_profile_id` tracks
who was `ASSIGNED` or `UNASSIGNED` only. For `DELETE` events, `target_profile_id`
is not meaningful (the ticket itself is the subject of the deletion).

---

## File Map

| Concern | Path |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| Schema analysis (full) | `SCHEMA_ANALYSIS.md` |
| Permissions matrix | `project_permissions.txt` |
| Stage tree query | `src/entities/stage/stageActions.ts` |
| Ticket mutations | `src/entities/ticket/ticketActions.ts` |
| Query key factory | `src/shared/query/keys.ts` |
| Zod schemas | `src/shared/schemas/` |
| Stage editor feature | `src/features/stage-editor/` |

---

## Definition of Done (Task 4.5)

Every task in `planned-codebase-changes.md` must record, at sign-off:

1. **Dependencies & prerequisites** — packages added/removed; prior tasks it
   builds on.
2. **DB migration & rollback impact** — migration files created (pending
   deploy), or explicitly "no schema change".
3. **Acceptance criteria** — the ACs from the plan task, restated as verified.
4. **Tests required** — unit/component tests added, with counts.
5. **Verification commands** — the actual commands run and their results
   (`prisma validate`, `tsc --noEmit`, `vitest run`, `eslint`, `next build`,
   `knip`).

## Library Policy (Task 4.5)

- **Conditional (add only on measured need):** `nuqs` (typed URL search
  params), `date-fns` (only if the shared native date adapter becomes too
  complex — define timezone/UTC policy first), Storybook (only if the team
  maintains component stories; should replace `/dev/ui` showcase),
  Sentry (before production launch, with ownership/privacy/alerting policy).
- **Avoid list:** Redux, Zustand, Axios, Lodash, Moment.js, generic Prisma
  repository frameworks, second form/query libraries, auto-import plugins —
  unless a measured need appears that the current stack cannot meet.

