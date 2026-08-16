# Contributing to Stage-Gate Tracker

Thanks for contributing! This guide documents the **target** workflows and
conventions for the project. Where the current codebase still diverges from
what is documented here, the divergence is tracked in [Known deviations &
refactor backlog](#9-known-deviations--refactor-backlog) so it can be closed
incrementally — do not treat those items as "the way we do things".

**Stack at a glance**

| Concern | Technology |
|---|---|
| Framework | Next.js (App Router) · React · TypeScript |
| Data access | Prisma ORM → PostgreSQL (Supabase) |
| Auth | Supabase Auth (`auth.users` ↔ `public.Profiles`, 1:1) |
| Client data flow | TanStack Query → server actions → Prisma |
| Forms | TanStack Form (`useAppForm` form kit) + zod v4 schemas |
| UI | shadcn/ui primitives + app form/UI kits |
| Layout | Feature-Sliced Design (FSD) v2.1 |
| Quality gates | ESLint · `tsc --noEmit` · Vitest · Knip · Prettier |

---

## Table of contents

1. [Development environment](#1-development-environment)
2. [Database & migrations](#2-database--migrations)
3. [Common commands](#3-common-commands)
4. [Project architecture](#4-project-architecture)
5. [Coding conventions](#5-coding-conventions)
6. [Testing](#6-testing)
7. [Git workflow](#7-git-workflow)
8. [Code review checklist](#8-code-review-checklist)
9. [Known deviations & refactor backlog](#9-known-deviations--refactor-backlog)
10. [Resources](#10-resources)

---

## 1. Development environment

### Prerequisites

- **Node.js 22** (LTS) and **npm ≥ 10** (the CI pipeline runs Node 22).
  A `.nvmrc` is tracked in the backlog — for now, pin Node 22 manually
  (`node -v` should print `v22.x`).
- Access to the project's Supabase instance (URL + anon key) and a `DIRECT_URL`
  for migrations.

### Getting started

```bash
git clone <repository-url> Client-Stage-Gate-Tracker
cd Client-Stage-Gate-Tracker
npm install          # postinstall runs `prisma generate` automatically
npm run dev          # http://localhost:3000
```

### Environment variables

Copy the keys below into a local `.env` (never commit real values). There is
no `.env.example` yet — see the backlog; the canonical key list lives in
`src/env.ts` and is validated by `@t3-oss/env-nextjs` at import time
(validation fails fast when a required var is missing).

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app | public anon key |
| `DATABASE_URL` | server | Prisma client connection |
| `DIRECT_URL` | migrations/scripts | direct (pooler-bypassing) connection |
| `SUPABASE_SERVICE_ROLE_KEY` | server | admin client (storage, admin ops) — never expose to the client |
| `CLIENT_INVITE_PEPPER` | server | HMAC pepper for invite codes; **must be set in production** (dev falls back with a warning) |
| `SKIP_ENV_VALIDATION` | build only | set in CI when secrets are absent |
| `NEXT_PUBLIC_SITE_URL` | optional | canonical site URL |
| `NEXT_PUBLIC_ALLOWED_CONNECT_ORIGINS` | optional | allowed origins |
| `PRISMA_LOG_LEVEL` | optional | Prisma query logging |

---

## 2. Database & migrations

- The schema is **Prisma** (`prisma/schema.prisma`) on **PostgreSQL via
  Supabase**. `public` tables are bridged 1:1 to `auth.users` through
  `public.Profiles`.
- **Every schema change ships as a migration** under
  `prisma/migrations/<timestamp>_<name>/migration.sql`. Do not edit the
  database directly and do not commit schema changes without the migration.

### Workflow

1. Edit `prisma/schema.prisma`.
2. `npx prisma validate` — must pass.
3. Generate the migration SQL. `prisma migrate dev` is currently blocked by
   pre-existing shadow-database drift in this repo, so migrations are
   **hand-written** by convention:
   - create `prisma/migrations/<timestamp>_<name>/migration.sql` with the
     exact SQL (index names, enum types, FKs must match Supabase's naming);
   - `npx prisma generate` to refresh the typed client.
4. Apply to Supabase **out-of-band, after review/approval**:
   ```bash
   npx prisma db execute --file prisma/migrations/<name>/migration.sql
   ```
   or, once `migrate deploy` is unblocked, `npm run deploy`.
5. **Rollback** = revert the schema + apply the inverse SQL by hand (there are
   no down-migrations in this repo).

### `prisma migrate dev` (shadow database)

`migrate dev` replays all migrations on a fresh **shadow database** before
applying. Supabase's managed Postgres cannot create databases, so point
Prisma at a LOCAL Postgres instead:

```bash
docker run -d --name pg-shadow -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=shadow -p 5433:5432 postgres:16-alpine
# .env: SHADOW_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/shadow
npx prisma migrate dev
```

(The official postgres image ships `pg_trgm`, required by migration 3.)

> 2026-08-16: the migration chain was repaired so fresh replays pass —
> migration 4 dropped unique-INDEX names as CONSTRAINTS (DO-blocks now drop
> either form) and was missing `Workflows.number`; migration 7 dropped a
> phantom `Stages.sort_key` (`IF EXISTS`); migration 10 altered a missing
> `Tickets.plan_start_at` (`ADD COLUMN IF NOT EXISTS`). All 15 migrations
> verified to replay cleanly on a fresh database.

### Refreshing the client from the database

> **Only use this to refresh COLUMNS** (e.g. after someone added a column
> directly in Supabase). For real schema changes, edit `schema.prisma` and
> ship a hand-written migration (see above). `db pull` **re-infers
> relations from DB constraints** and will silently rewrite relation
> declarations that the app deliberately models differently — always review
> the diff before generating.

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

**Known divergence to restore:** `db pull` flips `Issues.Tickets` from
`Tickets[]` to `Tickets?` (1:1) because `Tickets.issue_id` has a UNIQUE
constraint. The app deliberately models it as **1:n** (`Tickets[]`) — the
code relies on `_count.select.Tickets`, `include: { Tickets: { take: 1 } }`,
and `row.Tickets[0]`, which only work on a to-many relation. If the diff
shows `Tickets?`, change it back to `Tickets[]` **before** running
`prisma generate`, then run `npx prisma validate`. A stale client generated
from the 1:1 form fails at runtime with
`Unknown field 'Tickets' for select statement on model
'IssuesCountOutputType'`.

---

## 3. Common commands

| Command | Purpose |
|---|---|
| `npm run dev` | local dev server |
| `npm run build` | production build (`prisma generate` + `next build`) |
| `npm run start` | serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | run the Vitest suite |
| `npm run test:coverage` | Vitest with coverage report |
| `npm run lint` | ESLint (whole repo) |
| `npx knip --include files,dependencies,exports` | dead-code gate (CI) |
| `npm run format` | Prettier write (src, scripts, root configs) |
| `npm run deploy` | `prisma migrate deploy` |

**Gate before every push/PR:**

```bash
npm run format && npx prettier --check "src/**/*.{ts,tsx}" "scripts/**/*.mjs" \
  "next.config.ts" "eslint.config.mjs" "postcss.config.mjs" "prisma.config.ts" "vitest.config.ts"
npm run typecheck
npm test
npm run lint
npx knip --include files,dependencies,exports
npm run build
```

---

## 4. Project architecture

### Feature-Sliced Design (FSD) v2.1

```
src/
├── app/          # routes, layouts, pages (composes features)
├── features/     # business features (issue-reporting, ticket-board, …)
├── entities/     # business entities (project, ticket, contract, gate, …)
└── shared/       # everything reusable (schemas, form kit, UI kit, query infra)
```

Rules (enforced by `eslint-plugin-boundaries`):

1. **Imports only point downward**: `app → features → entities → shared`.
   A layer never imports from a layer above it.
2. **No cross-imports between slices on the same layer.** Shared types/actions
   live in `src/entities/types.ts` or `src/shared/`, never imported
   entity↔entity or feature↔feature.
3. **Public API via `index.ts`**: external consumers import only from the
   slice's barrel, never from its internals (`ui/…`, `model/…` deep imports
   are a violation).
4. `src/lib`, `src/components` (shadcn kit, vendored reui) are classified as
   `shared` and importable by every layer.

### Data flow

```
UI component → TanStack Query hook (features|entities/*/queries.ts)
             → server action ("use server", entities/*/*Actions.ts)
             → zod validation (src/shared/schemas)
             → authorization guard (src/lib/auth/projectAccess.ts)
             → Prisma transaction
```

New code goes in the lowest layer that can own it: pure rules → `shared/lib`
or `shared/schemas`; row mapping → the owning entity's `lib/`; mutations →
entity actions; page composition → `features/`; routes → `app/`.

---

## 5. Coding conventions

### General

- **TypeScript strict** — no `any` in new code (explicit `eslint-disable`
  with a reason is acceptable for vendored code); typecheck must pass.
- **Naming**: `camelCase` functions/variables, `PascalCase` types/components,
  `SCREAMING_SNAKE` constants. Files are `kebab-case.tsx`.
- **Formatting**: Prettier with the repo `.prettierrc` (tabs, double quotes,
  semicolons, trailing commas) — `npm run format` before pushing.
  Generated code (`src/lib/generated/**`), lockfiles, and `prisma/schema.prisma`
  (formatted by `prisma format`) are excluded.

### Data & persistence

- **UUIDs originate from the database** — never generate IDs client-side.
- **Soft deletes**: domain tables use `is_deleted` + `deleted_at`; join rows
  are hard-deleted only when the relationship is removed. Soft-deleting an
  entity does **not** cascade to join rows.
- **Server actions** (`"use server"` files) may export only `async` functions;
  every mutation validates input with a zod schema from `src/shared/schemas`
  and checks authorization **before** writing (`assertProjectMember` /
  `assertProjectMemberNotClient`). Fail closed: missing profile → reject.
- **Pure helpers never live in `"use server"` files** — extract them to
  `shared/lib` or the entity `lib/` so they stay unit-testable.
- No `console.log`/`debug` in app code (`error`/`warn` allowed; standalone
  CLI scripts in `scripts/` are exempt).
- **Never instantiate `new Date()` to satisfy a schema** — no
  `.default(() => new Date())` / `?? new Date()` fallbacks; plan dates are
  required for Projects/Stages/Phases/Modules/Workflows and optional for
  Tickets.

### UI

- Prefer the shared **form kit** (`useAppForm` + `TextField`, `SelectField`,
  `DateTimeField`, …) over hand-rolled `useState` forms; validation lives in
  zod schemas.
- Use shadcn primitives from `src/components/ui`; business UI lives in the
  owning feature. Literal-hex Tailwind arbitrary values should be replaced
  with palette tokens (`globals.css` `@theme`).
- Accessible by default: labels associated with controls (`htmlFor`),
  `aria-invalid` on error, visible focus rings, labeled icon buttons —
  flagged in review.

### Code documentation

The standard for comments and docs in `src/` (enforced by `eslint-plugin-jsdoc`, see `eslint.config.mjs`):

1. **JSDoc for every exported symbol** — functions, types, and constants that
   are exported from a module get a `/** ... */` block:
   - `@param` per parameter, **camelCase matching the signature** (no
     snake_case or DB-style names);
   - `@returns` for non-void functions (describe the VALUE, e.g. "the
     updated client row");
   - never annotate types in tags — TypeScript owns types
     (`@param {string}` is redundant).
2. **Module-level docs** — a top-of-file `/** ... */` block when the file's
   purpose or invariants aren't obvious. Server actions (`"use server"`)
   document their authorization guard; spec decisions are cited inline
   ("2026-08-15 spec: ...").
3. **Inline comments explain WHY, never WHAT** — no restating the code in
   prose, no commented-out code (delete it), no `//`-above-export one-liners
   that duplicate the function name.
4. **Section banners** — `// ── <TITLE> ──` is the ONLY divider style, and
   only in files longer than ~200 lines with clearly separable sections.
   No other banner styles (asterisk rows, `===`, etc.).
5. **TODO/FIXME** — always carries a reference (`TODO(#123): …` or a plan
   name). Bare TODOs are treated as review failures.
6. **Scope** — the standard applies to app code in `src/`. Vendored code
   (reui, shadcn kit), generated output, `scripts/` utilities, and test
   files stay light (tests document intent via names).

---

## 6. Testing

- **Test runner**: Vitest (node environment by default; `// @vitest-environment
  jsdom` for component tests). Setup lives in `src/shared/testing/setup.ts`
  (global `next/navigation` stub, jsdom cleanup).
- **Write the failing test first (TDD)** for new behavior and bug fixes.
  A bug fix without a regression test is not done.
- **Test levels** (repo convention):
  - *Unit*: pure helpers (`shared/lib`, `entities/*/lib`, mappers, schema
    rules) — no mocks needed.
  - *Component*: Testing Library + `user-event` for form/UI behavior
    (validation messages, submit payloads, discard flows).
  - *Integration*: server actions against a **mocked prisma** (no test
    database exists; `vi.mock("@/lib/prisma")` with a `$transaction` that
    executes the callback against the same mock object). Mirror the real
    response shapes fully — see `clientActions.test.ts` and
    `ticketIssueSync.test.ts` for the established patterns.
- **What must have tests**: every new pure helper, every schema, every new
  server-action branch that changes state or permissions, and every form
  behavior users can break.
- Run `npm test` (full suite) before pushing; `npm run test:coverage` to
  check coverage of entity/shared logic (coverage is not yet CI-gated — see
  the backlog).

---

## 7. Git workflow

### Branches

- `main` — the release line; `dev` — the integration branch.
- Work in **short-lived feature branches** off `dev`:

| Purpose | Branch name |
|---|---|
| new feature | `feat/<slug>` e.g. `feat/contract-approval` |
| bug fix | `fix/<slug>` e.g. `fix/pdf-gray-embed` |
| docs | `docs/<slug>` |
| refactor | `refactor/<slug>` |
| chore/deps/tooling | `chore/<slug>` |

- Open a **pull request into `dev`** (one logical change per PR). The PR
  title must be the squash-commit message.

### Commit messages — Conventional Commits

```
<type>(<optional scope>): <imperative subject, ≤ 72 chars>

[optional body — what & why, not how]

[optional footer: BREAKING CHANGE: … / Ref: #<issue>]
```

- Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`, `build`,
  `ci`, `style`.
- Subject: imperative mood ("add", "fix", "remove"), lowercase, no trailing
  period.

```text
fix(contract): render blob PDF without viewer fragment

Chrome's PDF viewer renders a gray embed when #toolbar=0 is appended to a
blob: URL; the embed now uses the blob URL as-is.
```

### PR checklist (before requesting review)

- [ ] `npm run format` + `prettier --check` clean
- [ ] `npm run typecheck` clean
- [ ] `npm test` green (new tests included)
- [ ] `npm run lint` clean (0 errors)
- [ ] `npx knip --include files,dependencies,exports` clean
- [ ] `npm run build` green
- [ ] Schema change? Migration file committed + apply/rollback documented
- [ ] No dead code, no debug leftovers, no unrelated changes

---

## 8. Code review checklist

Reviewers verify, beyond the PR checklist:

- **Correctness**: edge cases, transaction boundaries, rollback on partial
  failure (e.g. storage upload + DB write).
- **Authorization**: every server action guards the mutation path — clients
  are read-only everywhere; owner-only operations are enforced server-side,
  never just in the UI.
- **Validation**: inputs pass zod schemas before touching the DB; error
  messages are user-actionable.
- **Data integrity**: soft-delete rules respected; issue↔ticket 1:1 link
  sync paths preserved; `plan_start_at`/`plan_end_at` rules honored.
- **Type safety**: no `any`/unsafe casts without justification.
- **A11y**: labeled controls, keyboard operability, focus-visible styles.
- **Tests**: failing-first tests exist for new behavior; mocks mirror real
  shapes.
- **FSD**: no upward/cross-layer imports; consumers use the slice public API.

---

## 9. Known deviations & refactor backlog

Target state is documented above; these are the known gaps, tracked so they
can be closed without relying on tribal knowledge. Fix them opportunistically
or in dedicated refactor PRs — never silently change the target itself.

| # | Deviation (current → target) | Where |
|---|---|---|
| 1 | ✅ **DONE 2026-08-16** — zero `alert()` calls remain in `src/` (verified by grep); the ticket-board integration already migrated upload failures to toasts. | `src/` |
| 2 | Legacy `FormInput` still used in places → **form kit** (`TextField`/`TextAreaField`/`SelectField`/`DateTimeField`) | `src/components/ui/forminput.tsx` consumers |
| 3 | ✅ **DONE 2026-08-16** — the page already used `@/features/stage-editor`; the remaining entity deep imports (`@/entities/stage/queries`, `@/entities/profile/queries`) were switched to the slice public APIs in 5 files (page, ContractPage, TicketBoard, GateOverview, TopNav). | `src/app/.../stages/[stageId]/page.tsx` + 4 feature files |
| 4 | ✅ **DONE 2026-08-16** — shared `ScheduleNodeModal` extracted (`ui/modals/ScheduleNodeModal.tsx`); ModuleModals/WorkflowModals are thin wrappers (config = entityLabel + createdVerb + placeholder + mutations). 4 new component tests. | `src/features/stage-editor/ui/modals/` |
| 5 | ✅ **DONE 2026-08-16** — `tokenize-colors.mjs` mapping extended (Tailwind-native + project tokens), walk extended to `src/components` + `src/shared`, 2 new `@theme` tokens (`plum-300`, `lavender-300`); **0 literal-hex arbitrary values remain** in `src/`. | `scripts/tokenize-colors.mjs`, `src/app/globals.css` |
| 6 | ✅ **DONE 2026-08-16** — `.env.example` (all 10 keys + shadow DB doc) and `.nvmrc` (22) added; `.gitignore` un-ignores `.env.example`; §1 updated. | repo root |
| 7 | `docs/` is gitignored (plans, review docs are local-only) → decide: track in-repo or move to project wiki | repo root `.gitignore` |
| 8 | ✅ **DONE 2026-08-16** — CI lint step hard-gates on ESLint ERRORS (reui excluded from the gate only — WebStorm still inspects it via config; see item 10). Coverage/build-output noise fixed (`coverage/**` ignored, `_request` stub silenced). | `.github/workflows/ci.yml`, `eslint.config.mjs` |
| 9 | ✅ **DONE 2026-08-16** — coverage thresholds in `vitest.config.ts` (stmts 26 / branch 30 / funcs 25 / lines 26 — baseline from current suite) + `Coverage` step in CI. | `vitest.config.ts`, `.github/workflows/ci.yml` |
| 10 | Vendored reui gantt carries 21 React-Compiler lint errors (deliberate upstream patterns) → triage per file or vendor with explicit waiver | `src/components/reui/**` (see `docs/code-review-plan-2.md` §7) |
| 11 | ✅ **DONE 2026-08-16** — `shadowDatabaseUrl` added to `prisma.config.ts` (docker local Postgres, documented in §2); **migration chain repaired**: migration 4 drops unique-INDEX names via DO-blocks + adds missing `Workflows.number`; migration 7 `DROP COLUMN IF EXISTS sort_key`; migration 10 `ADD COLUMN IF NOT EXISTS plan_start_at`. All 15 migrations verified to replay cleanly on a fresh Postgres (pglite replay harness). | `prisma.config.ts`, migrations 4/7/10, §2 |
| 12 | ✅ **DONE 2026-08-16** — `scripts/verify-prisma-relations.mjs` guard (Issues.Tickets list + NOT-NULL invariants), wired into CI + the §2 refresh workflow; proven to fail on the 1:1 form. | `scripts/verify-prisma-relations.mjs`, `.github/workflows/ci.yml`, §2 |

---

## 10. Resources

- [Feature-Sliced Design docs](https://feature-sliced.design/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Next.js docs](https://nextjs.org/docs) · [Prisma docs](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query) · [TanStack Form](https://tanstack.com/form)
- Internal architecture notes: `REASONIX.md`, `docs/code-review-plan.md`
  (round-1 per-file review), `docs/code-review-plan-2.md` (round-2 checklist)
