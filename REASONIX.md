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
5. **A project always has a client** — the only Clients↔Projects link is
   `Contracts.client_id`, which is **NOT NULL** (enforced in the DB since
   `0_init`). `createProject` creates the contract unconditionally (validation
   requires `client_id`), and `updateProject` updates the contract's client
   atomically. Never relax `client_id` to nullable at any layer.
6. **Gates have no name/description** — identified by `number` only. A gate is
   approved by the presence of a `GateSignatures` row (exactly one client signature).
7. **Polymorphic integrity**: `Comments.(parent_type, parent_id)` and
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

## Schema maintenance (read this before `db pull` / `db push`)

`db pull` must include the `auth` schema (a cross-schema FK on `Profiles`
fails with P4002 otherwise), which reintroduces ~22 Supabase auth tables —
always run the prune script afterwards:

```bash
npx prisma db pull
node scripts/prune-auth-models.mjs   # strips auth models/enums, keeps users
git diff prisma/schema.prisma        # ← review EVERY semantic change
node scripts/verify-prisma-relations.mjs  # ← fail-fast guard (also in CI)
npx prisma generate
```

---

## Definition of Done (Task 4.5)

Every task in `docs/planned-codebase-changes.md` must record, at sign-off:

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

---

## JDocMunch (docs index) — how to use it

JDocMunch = the `jdocmunch-mcp` stdio server (uvx, v1.126.0). Indexes live at
`~/.doc-index/<owner>/<repo>/`; the run log lives in `docs/jdocmunch.md`.

**Rule 1 — never guess repo handles.** Models (e.g. DeepSeek) routinely guess
names from training data that no longer match reality (`prisma/docs` → renamed
to `prisma/web`, FSD org `feature-sliced-design` → `feature-sliced`). Bare
repo-name resolution is a case-sensitive glob on `~/.doc-index/*/<name>.json`,
so a wrong guess fails hard. **Call `doc_list_repos` first** (or
`get_index_overview`) to get the exact handle.

**Rule 2 — canonical handles** (renamed/moved repos are stored under the name
models actually guess, via the `name` override at index time):

| Topic | Handle | Source repo |
|---|---|---|
| Prisma | `prisma/prisma` | `prisma/web` (the docs repo; was `prisma/docs`) |
| FSD v2.1 skills | `feature-sliced/feature-sliced-design` | `feature-sliced/skills` |
| Playwright | `local/playwright` | local mirror `~/.cache/jdocmunch-mirrors/playwright` (docs/ sparse) |
| knip | `webpro-nl/knip` | org moved from `webpro` |
| Next.js | `vercel/next.js` | (bare `next.js` also resolves) |
| Base UI | `mui/base-ui` | (bare `base-ui` resolves) |

**Rule 3 — updating indexes.** `doc_index_repo(url=..., incremental=true,
use_ai_summaries=false)`; skip unchanged SHAs automatically. **Stop immediately
on a rate-limit error**: a mid-fetch 403 makes failed files look "deleted" and
prunes them from the index (this happened to `lucide-icons/lucide` once;
repair = full re-index with `incremental=false`). The GitHub token lives in
`~/.reasonix/config.toml` (`GITHUB_TOKEN`); its hourly core quota is shared
with the whole desktop app.

**Sandbox note:** the Reasonix sandbox mounts `/home` read-only — only the
workspace, `~/.cache`, and `~/.npm` are writable. Index updates must be staged
via `DOC_INDEX_PATH=~/.cache/doc-index` and applied with
`~/.cache/jcm-update/apply.sh` on the host (or by adding `~/.doc-index` to the
sandbox allow-write mounts).

