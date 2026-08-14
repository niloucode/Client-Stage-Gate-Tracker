# Master Codebase Refactoring & Feature Plan

This document merges all code review audit findings (LOL #1–67), roadmap requirements (Message.txt), and foundational architecture guardrails into a single execution plan. 

**Execution Order:** Tasks are arranged in strict top-to-bottom execution order. Section 1 builds the security, form, query, and testing foundations that Sections 2 through 5 depend on.

---

## Section 1: Critical Security, Infrastructure Foundations & Guardrails

> **Pragmatic dependency rule:** Add a library only when it removes a repeated infrastructure concern across multiple features. Prefer the libraries already installed, introduce one new convention at a time, and migrate one complete vertical slice before applying it codebase-wide. Do not add competing libraries for the same responsibility.
>
> **Execution priority:** Complete Tasks 1.1–1.10 before new four-date forms, rollup UI, or broad component migrations in Sections 3-5. This prevents the same forms, action contracts, and query definitions from being refactored twice.

### Task 1.1: Fix Supabase Client Privilege Escalation
* **Problem (LOL #1):** `src/lib/supabase/server.ts:11` - The "server" Supabase client is instantiated with `SUPABASE_SERVICE_ROLE_KEY` instead of the anon key used by `client.ts` and `proxy.ts`. Every server-side Supabase call runs with full admin privileges and bypasses Postgres RLS entirely.
* **Skills:** `superpowers-systematic-debugging`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `supabase/supabase` for `"createServerClient cookieHeader anon key"`
* **jCodeMunch Symbol Search:** `jcodemunch-mcp` search symbols `"SUPABASE_SERVICE_ROLE_KEY"` or `"createClient"` in `../src/lib/supabase`
* **Goal:** Swap the key to `SUPABASE_ANON_KEY`, matching `client.ts`. One-line change. If service-role access is genuinely needed somewhere (e.g. a background job), isolate that into its own explicitly named client (`adminClient.ts`) that is never imported from request-handling code.

### Task 1.2: Centralize Authorization Checks Across Entity Actions
* **Problem (LOL #2, #3):** `src/lib/auth/permissions.ts:11` - `hasPermission()` has zero callers anywhere in the codebase. Meanwhile `phaseActions.ts`, `workflowActions.ts`, `moduleActions.ts`, `stageActions.ts`, `tagActions.ts`, and `ticketActions.ts` have no authorization check at all, despite doc comments in those files stating authorization must be verified before execution. Two incompatible auth systems exist; one is unused, the other is not applied. Any caller who knows an entity ID can mutate it regardless of project membership. Furthermore, `projectActions.ts` gates project updates behind membership checks, but phase/workflow/module/stage/tag/ticket actions take no userId/session parameter.
* **Skills:** `superpowers-test-driven-development`, `feature-sliced-design`
* **jDocMunch Query:** `jdocmunch-mcp` search `supabase/supabase` for `"user session server actions authorization"`
* **jCodeMunch Symbol Search:** `jcodemunch-mcp` search symbol `"requireProjectMember"` across `../src/entities/project`
* **Goal:** Delete `hasPermission()` if it is not the intended direction, or adopt it as the single source of truth. Fastest path: extract the membership check already written in `projectActions.ts` (`requireProjectMember`/`requireProjectOwner`) into a shared helper in `src/shared/lib/auth.ts`, then call it at the top of every mutating action in phase/workflow/module/stage/tag/ticket. Treat #2 and #3 as one fix, applied in a single pass over the action files.

### Task 1.3: Clean Up Unused Database Query Files
* **Problem (LOL #4):** `src/lib/db/contracts.ts`, `phases.ts`, `projects.ts`, `tickets.ts`, `users.ts` - entirely dead files, zero imports anywhere in `src`. They duplicate queries already implemented in `entities/*/queries.ts` but without the `is_deleted` soft-delete filtering those apply. If wired up, they leak soft-deleted rows.
* **Skills:** `superpowers-verification-before-completion`
* **Goal:** Delete the files. Zero risk, since nothing imports them; confirmed via grep. Fastest possible fix in this document.

### Task 1.4: Standardize Forms on TanStack Form + Zod + Shadcn
* **Problem:** Forms currently repeat `useState`, field-error mapping, reset effects, date conversion, submission state, and native input markup. This has already produced field-binding drift and inconsistent modal behavior.
* **Decision:** Adopt `@tanstack/react-form` as the only form-state library. Do not add React Hook Form alongside it.
* **Existing Stack to Reuse:** Zod remains the source of validation schemas; Shadcn/Base UI remains the visual and accessibility layer; TanStack Query remains responsible for server state.
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `tanstack/form` or `shadcn-ui/ui` for `"useForm zValidator FormField custom inputs"`
* **jCodeMunch Symbol Search:** `jcodemunch-mcp` search symbol `"getFieldErrors"` or `"EditProjectModal"` in `../src/shared/lib`
* **Goal:**
  1. Install `@tanstack/react-form`.
  2. Create `../src/shared/form` with `useAppForm`, shared field/form contexts, and Shadcn-bound `TextField`, `TextAreaField`, `SelectField`, `DateTimeField`, `PhoneField`, and `SubmitButton` components.
  3. Create a reusable `SchedulingFields` component for `planStart`, `planEnd`, `actualStart`, and `actualEnd`.
  4. Pilot the convention on the Add/Edit Phase flow, including create, update, reset, validation errors, pending state, and server failure behavior.
  5. After the pilot passes tests and UI review, migrate Module, Workflow, Stage, Ticket, Project, Client, Auth, and Contract forms incrementally.
* **Acceptance Criteria:** No manual field-error mapper or per-field `useState` remains in migrated forms; form values and submit payloads are inferred from Zod; all controls use Shadcn primitives and accessible labels.

### Task 1.5: Establish One Canonical Scheduling Vocabulary
* **Problem:** The database uses `plan_start_at` / `plan_end_at` / `actual_start_at` / `actual_end_at`, current forms use `start_date` / `deadline_date` / `finish_date`, and roadmap language uses `plan_start` / `plan_end` / `actl_start` / `actl_end`. This guarantees mapping mistakes during the four-date refactor.
* **Decision:** Use `planStart`, `planEnd`, `actualStart`, and `actualEnd` in TypeScript domain types and UI forms. Translate to Prisma column names only inside explicit server-side Prisma adapters/mappers. Avoid the abbreviation `actl` in TypeScript.
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `colinhacks/zod` for `"date schema refine transform iso string"`
* **Goal:**
  1. Add shared scheduling types, schemas, chronology helpers, date-input serialization helpers, and rollup utilities under `../src/shared/lib/scheduling`.
  2. Replace positional date arguments in server actions with a single validated object payload.
  3. Derive form input/output types from Zod and query payload types from Prisma rather than maintaining parallel handwritten interfaces.
  4. Add database-level check constraints for planned and actual date chronology where supported by the migration strategy.
* **Acceptance Criteria:** Date meanings are unambiguous at every call site; no repeated `getTimezoneOffset()` + `toISOString().slice(...)` expressions remain outside the shared date adapter; invalid chronology is rejected by both Zod and the database.

### Task 1.6: Consolidate TanStack Query Definitions
* **Problem:** Query keys exist, but query and mutation configuration is still spread across hooks, making prefetching, invalidation, stale-time policy, and cache typing easier to drift.
* **Existing Dependency:** `@tanstack/react-query` is already installed and must remain the only server-state library.
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `tanstack/query` for `"queryOptions mutationOptions staleTime register"`
* **jCodeMunch Symbol Search:** `jcodemunch-mcp` search symbol `"useQuery"` or `"useTicketComments"` across `../src/entities`
* **Goal:**
  1. Define entity-owned `queryOptions()` factories that colocate the query key, query function, stale time, and result typing.
  2. Define reusable `mutationOptions()` factories while keeping feature-specific success behavior and invalidation explicit.
  3. Register application query-key and mutation-key types through TanStack Query's `Register` interface.
  4. Use the same option factories for hooks, server prefetching/hydration, optimistic updates, and direct cache access.
  5. Document cache policies: static reference data (5+ minutes), entity detail/list data, and actively edited ticket data.
* **Acceptance Criteria:** No duplicate query key literals; every mutation has an intentional invalidation or optimistic-update policy; no Redux/Zustand/Axios adoption for concerns already handled by TanStack Query and platform APIs.

### Task 1.7: Pilot a Typed Server-Action Pipeline (`next-safe-action`)
* **Problem:** Server actions repeatedly perform Zod parsing, session lookup, project resolution, authorization, try/catch conversion, logging, and `{ success, error }` construction.
* **Library Candidate:** `next-safe-action`.
* **Decision:** Pilot first; do not rewrite every action until the pilot demonstrates a clear reduction in code and integrates cleanly with TanStack Query/Form.
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `next-safe-action` or `supabase/supabase` for `"createSafeActionClient middleware authorization"`
* **Goal:**
  1. Create authenticated and project-member action clients with typed middleware context.
  2. Pilot one complete Phase create/update/delete vertical slice.
  3. Call safe actions through TanStack Query mutation functions; do not introduce a second client mutation-state convention.
  4. Compare boilerplate, error handling, authorization testability, and bundle/server-boundary behavior with the existing approach.
  5. Adopt codebase-wide only if the pilot is successful; otherwise keep a small in-house typed `ActionResult<T>` and action wrapper.
* **Acceptance Criteria:** Validation and authorization cannot be skipped accidentally; errors have stable codes/messages; Client Components never receive raw internal exceptions.

### Task 1.8: Validate Environment Variables at Build Time (`@t3-oss/env-nextjs`)
* **Problem:** Supabase, Prisma, email, and storage configuration is accessed through raw `process.env` values, allowing missing variables and server/client exposure mistakes to surface late.
* **Library:** `@t3-oss/env-nextjs` using the existing Zod dependency.
* **Skills:** `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `colinhacks/zod` for `"env validation server client schema"`
* **Goal:** Create `../src/env.ts` with explicit server-only and client-exposed schemas. Replace direct environment access outside that module. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and fail fast during build/startup when required configuration is missing.
* **Acceptance Criteria:** Application code imports validated `env`; CI supplies the documented required variables; secrets cannot be imported into client bundles.

### Task 1.9: Automate Dead-Code and FSD Boundary Enforcement (`knip` & `eslint-plugin-boundaries`)
* **Problem:** Dead-file verification and import-boundary review are manual, and existing slice barrel files are incomplete or overly broad.
* **Libraries:** `knip` and `eslint-plugin-boundaries` as development dependencies.
* **Skills:** `feature-sliced-design`, `superpowers-verification-before-completion`
* **jDocMunch Query:** `jdocmunch-mcp` search `eslint-plugin-boundaries` for `"element-types entrypoint barrel export rules"`
* **Goal:**
  1. Configure Knip for Next.js, Vitest, scripts, Prisma/config entry points, and generated-code exclusions.
  2. Run Knip non-blocking initially, clean the baseline, then make it a required CI check.
  3. Enforce `app -> features -> entities -> shared` dependency direction and prohibit cross-slice internal imports.
  4. Provide explicit client-safe `index.ts` and server-only `server.ts` public APIs per slice; avoid indiscriminate `export *` barrels that mix client and server modules.
* **Acceptance Criteria:** New unused files/exports/dependencies fail CI; invalid FSD imports fail lint; server-only modules cannot leak through client-facing barrels.

### Task 1.10: Add Refactor-Safe Testing Guardrails
* **Problem:** Current tests cover a small number of utilities and ordering behavior but do not protect the form, authorization, transaction, accessibility, and cross-page workflows affected by this plan.
* **Adopt Now:** `@testing-library/react`, `@testing-library/user-event`, and a Vitest DOM environment for shared fields, forms, dialogs, and feature components.
* **Adopt for Critical Flows:** `@playwright/test` plus `@axe-core/playwright` for authenticated project, stage, ticket, gate, client, and contract journeys.
* **Conditional:** Add `msw` only for Supabase Auth/storage, webhook, OTP, or other HTTP integrations; use an isolated real database for Prisma integration tests instead of mocking Prisma behavior.
* **Skills:** `superpowers-test-driven-development`, `superpowers-verification-before-completion`
* **jDocMunch Query:** `jdocmunch-mcp` search `testing-library/react-testing-library` or `microsoft/playwright` for `"render userEvent axe accessibility modal form"`
* **Goal:**
  1. Unit-test scheduling chronology, rollups, progress calculations, and exhaustive status transitions.
  2. Component-test the shared TanStack Form fields and the Phase pilot.
  3. Integration-test authorization and transaction rollback using a dedicated test database.
  4. Add Playwright smoke tests for the highest-value user journeys and Axe scans for key pages/dialogs.
* **Acceptance Criteria:** Refactoring internal component structure does not break behavior-oriented tests; critical authorization/data-integrity paths run in CI; known accessibility debt is baselined and cannot silently increase.

---

## Section 2: Database Performance, Indexing & Entity Operations

### Task 2.1: Fix Client Entity Validation & Soft Delete
* **Problem (LOL #26):** `../src/entities/client/clientActions.ts` breaks every convention the rest of `entities/` follows: no zod validation on create/update (raw object trusted as-is), no try/catch (every sibling action wraps DB calls and returns `{success, error}`), and a hard `prisma.clients.delete` where every other entity soft-deletes via `is_deleted`/`deleted_at`. It also exports dead query helpers never called anywhere: `clientSelect()`, `clientSelectByAddress`, `clientSelectByTin`.
* **Skills:** `superpowers-test-driven-development`, `feature-sliced-design`
* **jDocMunch Query:** `jdocmunch-mcp` search `colinhacks/zod` for `"safeParse error handling"`
* **Goal:** `../src/shared/schemas/client.ts` already exists, so validation is a matter of calling it, not writing it. Wrap existing DB calls in the same try/catch + `{success, error}` shape used by `projectActions.ts`. Change the hard delete to set `is_deleted`/`deleted_at`, matching every other entity. Delete the three unused query helpers. All mechanical, no new dependency.

### Task 2.2: Add Missing Composite Indexes to Schema
* **Problem (LOL #42):** `../prisma/schema.prisma` lines 502-842 - zero indexes across every application table (Tickets, Comments, Phases, Modules, Workflows, Stages, Projects, RoleAssignments, HistoryEvent, TicketAssigned, TicketTags, Images, GateSignatures, Contracts, Profiles), despite every query file filtering on `is_deleted` and joining on foreign keys (`project_id`, `phase_id`, `stage_id`, `module_id`, `workflow_id`, `ticket_id`, `profile_id`, `parent_id`/`parent_type`). The Supabase-managed `auth` schema is fully indexed by contrast; the app's own schema is not.
* **Skills:** `superpowers-executing-plans`, `superpowers-verification-before-completion`
* **jDocMunch Query:** `jdocmunch-mcp` search `prisma/docs` for `"composite index schema @@index"`
* **Goal:** Add composite indexes matching actual query shape in a single migration: `@@index([workflow_id, is_deleted])` on Tickets, `@@index([ticket_id])` on HistoryEvent, `@@index([parent_type, parent_id, is_deleted])` on Comments and Images, `@@index([stage_id, is_deleted])` on Phases, `@@index([phase_id, is_deleted])` on Modules, `@@index([module_id, is_deleted])` on Workflows, `@@index([project_id])` on RoleAssignments and Gates. This is the single highest-impact fix in this document and requires no application code changes, only a schema migration.

### Task 2.3: Fix Unscoped Comments Database Fetch
* **Problem (LOL #43, #44, #27):** `src/entities/comment/commentActions.ts:15` (`selectComment`) fetches every non-deleted comment in the entire database on every call, with no `where` scoping by ticket or gate. `src/entities/comment/queries.ts:12` (`useTicketComments`) then filters that full result set down to one ticket in JavaScript. Every time any user opens a ticket's comment panel, query cost is proportional to total comments across the whole app, not to that ticket. Furthermore, the same function performs a second unscoped `findMany` on Images and stitches the two result sets together in JavaScript (a `.filter()` per comment against the full Images table), instead of a single query with `include` (#27, #44).
* **Skills:** `superpowers-systematic-debugging`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `prisma/docs` for `"findMany where include relation"`
* **jCodeMunch Symbol Search:** `jcodemunch-mcp` search symbol `"selectComment"` in `../src/entities/comment`
* **Goal:** Push the `parent_id`/`parent_type` filter into the Prisma `where` clause and remove the client-side filter entirely. Replace both calls with one `prisma.comments.findMany({ where: { parent_type, parent_id, is_deleted: false }, include: { Images: true } })`. Turns an O(all rows) query into an O(rows for this ticket) query.

### Task 2.4: Optimize User Profile Search
* **Problem (LOL #45):** `src/entities/project/projectActions.ts:454` (`searchProfilesForProject`) uses `contains` with `mode: "insensitive"` (ILIKE) across three columns with no `take` limit. This pattern cannot use a normal btree index and becomes a full sequential scan per keystroke on any real user table.
* **Skills:** `superpowers-test-driven-development`
* **Goal:** Add a `pg_trgm` GIN index (`CREATE EXTENSION pg_trgm;` then `CREATE INDEX ON "Profiles" USING gin (first_name gin_trgm_ops)`, repeated for last_name/email) and add `take: 20` to bound the result set.

### Task 2.5: Eliminate N+1 Query Loops & Transaction Violations
* **Problem (LOL #47, #49, #53, #54, #55, #56):**
  - `updateTicket` issues up to 6 sequential, unbatched `prisma.historyEvent.create()` calls without transactions (#47).
  - `selectTicket`, `selectProjects`, `selectTag` list queries set no `take` limit (#49).
  - Cascade soft-delete chain, four levels deep (`stageActions.ts` -> `phaseActions.ts` -> `moduleActions.ts` -> `workflowActions.ts` -> `ticketActions.ts`), loops child arrays firing hundreds of sequential awaited queries instead of batched calls (#53).
  - `for (const profileId of assigneesToAdd)` loops fire individual `INSERT`s per assignee (#54).
  - `for (const cp of clientProfiles)` loops fire individual `INSERT`s per profile (#55).
  - `cascadeSoftDeleteTicket` accepts `_txClient` but ignores it, calling global `prisma` directly and breaking transaction rollback (#56).
* **Skills:** `superpowers-test-driven-development`, `superpowers-executing-plans`
* **jDocMunch Query:** `jdocmunch-mcp` search `prisma/docs` for `"createMany transaction updateMany"`
* **Goal:**
  1. Collect history rows into an array and write with `prisma.historyEvent.createMany({ data: [...] })`.
  2. Replace assignee and client profile loops with `createMany()` and `tx.roleAssignments.createMany({ skipDuplicates: true })`.
  3. Replace cascade soft-delete loops with `updateMany({ where: { <parent>_id: { in: [...] } }, data: { is_deleted: true, deleted_at } })`.
  4. Ensure `_txClient` is used inside `cascadeSoftDeleteTicket` so cascade deletes participate in parent transactions. Wrap multi-writes in `prisma.$transaction(...)`.
  5. Add pagination (`take`/`skip`, or cursor-based) to list queries.

### Task 2.6: Verify Database Connection Pooling
* **Problem (LOL #50):** `../src/lib/prisma.ts` - the Prisma singleton pattern is correctly implemented. Worth confirming: verify `DATABASE_URL` points at Supabase's pooled connection string (port 6543, pgbouncer) and not direct connection (port 5432) to avoid exhausting Postgres connection limits under serverless load.
* **Skills:** `superpowers-verification-before-completion`
* **Goal:** Verify `../.env` configuration points `DATABASE_URL` to Supabase port `6543` with PgBouncer enabled. No code change if already pointed at the pooler.

### Task 2.7: Secure Contract OTP Verification & Upload Limits
* **Problem (LOL #57, #58):**
  - `src/features/contracts/ui/OTPVerification.tsx:88-98` - `handleVerify` never calls a backend. It runs a hardcoded `setTimeout(800ms)` and then unconditionally sets state to "verified", while UI text claims this legally binds the signer (#57).
  - `src/features/contracts/ui/SignatureUpload.tsx:43` - file type is validated only via browser-reported MIME type `file.type` (client-side only). No file size limit exists anywhere in this component (#58).
* **Skills:** `superpowers-brainstorming`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `supabase/supabase` for `"mfa otp verification server endpoint"`
* **Goal:** Implement a real OTP endpoint (`POST /api/otp/verify`) with server-side code generation, expiry, and rate limiting. Block "verified" state on its actual response. Enforce file type (via magic-byte/content sniffing server-side) and file size limits at the action persisting the upload.

### Task 2.8: Add Webhook Signature Verification Stub Rules
* **Problem (LOL #65):** `../src/app/api/webhooks/route.ts` is a two-line stub: `POST()` returns `{ok: true}` unconditionally, with no body parsing and no signature verification. Not a live vulnerability today since nothing is implemented, but a red flag for whoever implements it next.
* **Skills:** `superpowers-writing-skills`
* **Goal:** Document signature verification expectations directly in `../src/app/api/webhooks/route.ts` as a comment block and add signature check logic in the same commit that adds payload handling whenever a real provider (Stripe, Supabase, etc.) is wired up.

---

## Section 3: Business Logic, 4-Date Model & Timeline Rollup Engine

### Task 3.1: Expand Schema to 4-Date Model & Add Chronological Validation
* **Problem (Message.txt - Phase 2):** Database schemas and TypeScript interfaces need support for 4 dates across Phases, Modules, Workflows, and Stages:
  - Baseline: `plan_start` (`planStart`), `plan_end` (`planEnd`)
  - Actuals: `actl_start` (`actualStart`), `actl_end` (`actualEnd`)
* **Skills:** `superpowers-writing-plans`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `colinhacks/zod` for `"refine date greater than validation"`
* **Goal:** Update Prisma schema and TypeScript models. Expose `planStart` in all creation and editing forms. Add Zod chronological validation blocking submit if `Start Date > End Date`. Use the canonical vocabulary (`planStart`, `planEnd`, `actualStart`, `actualEnd`) established in Task 1.5.

### Task 3.2: Build Ticket-Driven Timeline Rollup Engine
* **Problem (Message.txt - Section 2):**
  - Ticket-Driven Timeline Rollup: Modules and Workflows start/end dates must strictly reflect the earliest ticket start date and latest ticket end date.
  - Dynamic End-Date Adjustment: When a child item transitions to `Pending` or `In Progress`, recalculate and update the end-date boundary for its parent Workflow and Module.
* **Skills:** `superpowers-test-driven-development`, `feature-sliced-design`
* **Goal:** Create a centralized date-rollup helper in `../src/entities/ticket/lib/dateRollup.ts`. Execute this rollup inside ticket status/date mutation actions within a Prisma transaction.

### Task 3.3: Implement Gate Rejection State Reset
* **Problem (Message.txt - Section 2):** Gate Rejection Reset: If a Gate is rejected, strip all active execution dates (`actualStart`, `actualEnd`) from the associated Phases and Stages.
* **Skills:** `superpowers-test-driven-development`
* **Goal:** Add a trigger in gate rejection actions that clears `actualStart` and `actualEnd` on child phases and stages.

### Task 3.4: Refactor Reorder/Renumbering Algorithm
* **Problem (LOL #17, #21, #48, #62):**
  - Renumber-after-delete/reorder algorithm (null affected rows, then reassign one-by-one) is duplicated near-verbatim in `phaseActions.ts` and `workflowActions.ts` (~250-300 duplicated lines) (#17, #48).
  - Reorder operations fire a loop of sequential `update()` calls (#48).
  - Six `as any` casts on Prisma `update`/`data` payloads in `phaseActions.ts`, `workflowActions.ts`, `stageActions.ts` silence a real schema/type mismatch during the null-then-reassign step (#62).
  - `updateTicket` inlines 150 lines of assignee/tag diffing plus 5 separate hand-written `prisma.historyEvent.create` calls with repeated `JSON.stringify` boilerplate (#21).
* **Skills:** `superpowers-test-driven-development`, `feature-sliced-design`
* **Goal:**
  1. Extract a shared `renumberSiblings(tx, table, parentIdColumn, parentId)` helper or adopt fractional indexing (`fractional-indexing` npm package) so inserting/deleting a row becomes a single string-key update with no renumbering of siblings.
  2. Resolving the renumbering step eliminates the underlying type mismatch and removes the 6 `as any` casts (#62).
  3. Write `logHistoryEvent(tx, { ticketId, performedBy, action, details })` once in `../src/entities/ticket` and replace inline `create` boilerplate (#21).

---

## Section 4: Architecture, FSD Boundary Enforcement & Next.js Config

### Task 4.1: Fix FSD Layer Violations & Server Component Query Paths
* **Problem (LOL #9, #18, #28):**
  - `src/app/(app)/(workspace)/analytics/page.tsx` and `credentials/page.tsx` type `params` as a plain synchronous object, while sibling dynamic routes type it as `Promise<{...}>` per Next.js App Router async-params contract (#9).
  - `EntityFilterStatus` (`'active'|'deleted'|'all'`) is copy-pasted across 6 action files. `profileActions.ts` imports it cross-entity from `ticketActions.ts` (#18).
  - Dynamic gate/module/phase pages call `prisma.<table>.findUnique` directly inside Server Components instead of entity actions used everywhere else (#28).
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **Goal:**
  1. Change `params` type to `Promise<{ projectId: string }>` and `await params` in `analytics` and `credentials` pages (#9).
  2. Move `EntityFilterStatus` into `../src/entities/types.ts` and re-point all 7 imports (#18).
  3. Replace inline `prisma` calls in Server Components with existing entity action functions (`getPhaseById`, `getModuleById`), picking up soft-delete filtering and auth checks automatically (#28).

### Task 4.2: Extract Shared Lib Helpers & Custom Hooks
* **Problem (LOL #19, #20, #37, #41):**
  - Field-error mapping from zod `safeParse` result is copy-pasted verbatim in `EditProjectModal`, `AddModule`, `EditModule` (#19).
  - Modal-open/reset state handling (`useEffect` + `setTimeout(fn,0)` workaround) is reimplemented in 3 modals (#20).
  - `ManageMembersModal.tsx:56` - hand-rolled search debounce (~60 lines of async `clearTimeout` juggling) embedded in modal (#37).
  - `src/shared/lib/colors.ts:8` - `getPastelStyle` parses hex strings via `parseInt(hex.slice(...))` with no format validation; malformed hex produces `NaN` (#41).
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **Goal:**
  1. Extract `getFieldErrors(result: SafeParseReturnType)` into `src/shared/lib/form.ts` (#19).
  2. Extract `useResetOnOpen(isOpen, resetFn)` into `../src/shared/hooks` (#20).
  3. Add `use-debounce` package and replace manual `clearTimeout` juggling with `useDebouncedCallback` hook (#37).
  4. Normalize input in `getPastelStyle` (strip `#`, expand 3-digit shorthand) before parsing and fall back gracefully if invalid (#41).

### Task 4.3: Clean Up Type Casts & React Query Cache Typing
* **Problem (LOL #52, #63, #64):**
  - Relatively static reference data (`useProfiles`, department/role lookups) has no longer `staleTime` override despite changing rarely (#52).
  - `src/entities/comment/mutations.ts:28` - `(oldData: any)` in React Query `setQueryData` updater masks actual cache shape (#63).
  - `src/entities/ticket/mutations.ts:20` - `(variables as any).performed_by` masks incomplete mutation variables type (#64).
* **Skills:** `superpowers-test-driven-development`
* **Goal:**
  1. Bump `staleTime` to 5+ minutes for reference-style lists (departments, roles, tags, profiles) using query option factories from Task 1.6 (#52).
  2. Type React Query updater callbacks with explicit query return types (e.g. `InfiniteData<Comment[]>`) (#63).
  3. Add `performed_by` to the actual mutation variables interface and remove `as any` cast (#64).

### Task 4.4: Add Security Headers & Fix CI Pipeline
* **Problem (LOL #66, #67):**
  - `../next.config.ts` is untouched default scaffold: no CSP, no `X-Frame-Options`, no `HSTS`, no `X-Content-Type-Options` (#66).
  - `../package.json` test script is `"echo \"No tests yet\""`, and `../.github/workflows/ci.yml` runs only `npm ci` and `npm test` without `next build` or `tsc`. CI cannot fail on real regressions (#67).
* **Skills:** `superpowers-verification-before-completion`
* **Goal:**
  1. Add `headers()` function to `../next.config.ts` returning Next's built-in security headers (`Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`) (#66).
  2. Update `../package.json` test scripts and add `next build` or `tsc --noEmit` step to `../.github/workflows/ci.yml` so type errors fail the build (#67). Add Vitest coverage for `src/entities/*/*.ts`.

### Task 4.5: Demand-Driven Optional Libraries & Definition of Done
* **Conditional Libraries:**
  - `nuqs`: Add only when ticket/project/client filters, pagination, selected tabs, or shareable modal state are moved into typed URL search parameters.
  - `date-fns`: Add during the four-date work only if the shared native date adapter remains complex; define the timezone/UTC policy before adopting formatting helpers.
  - Storybook (`@storybook/nextjs-vite`): Add after shared Shadcn/TanStack Form primitives stabilize and only if the team will maintain component stories; it should replace public `/dev/ui` showcase routes (#8).
  - Production monitoring (Sentry): Add before production launch when error ownership, environment, privacy, and alerting policy are defined.
* **Avoid List:** Do NOT introduce Redux, Zustand, Axios, Lodash, Moment.js, a generic Prisma repository framework, a second form/query library, or auto-import plugins unless a measured need appears that the existing stack cannot meet.
* **Definition of Done for Every Task:** Every task must record:
  1. Dependencies and prerequisite tasks.
  2. Database migration and rollback impact.
  3. Explicit acceptance criteria.
  4. Unit, integration, component, or E2E tests required.
  5. Verification commands (`prisma validate`, `tsc --noEmit`, `vitest`, `eslint`, `next build`, `knip`).
* **Skills:** `superpowers-verification-before-completion`, `superpowers-finishing-a-development-branch`

---

## Section 5: UI & Frontend Component Refactoring (Shadcn UI & FSD)

> **Mandatory UI Rule:** Standardize all modals, buttons, toasts, and form inputs using `shadcn/ui` primitives placed in `../src/shared/ui` or `src/features/*/ui/`. Utilize the TanStack Form primitives built in Task 1.4.

### Task 5.1: Fix Root Layout, Dev Routes & Console Logs
* **Problem (LOL #5, #8, #10, #35):**
  - `src/app/layout.tsx:29` renders only `<>{children}</>`. `<html>`/`<body>` tags and font-variable classes are commented out (#5).
  - `src/app/dev/ui/page.tsx` dev-only component showcase ships as an unguarded public route in production (#8).
  - `EditProjectModal.tsx:82` - stray `console.log(data)` left inside form callback (#10).
  - `src/app/(app)/(workspace)/page.tsx` and stub pages return bare `<div>Label</div>` without loading/error boundaries (#35).
* **Skills:** `superpowers-test-driven-development`, `feature-sliced-design`
* **Goal:**
  1. Uncomment original `<html>`/`<body>` markup and font CSS variable classes in `../src/app/layout.tsx` (#5).
  2. Gate showcase route behind `if (process.env.NODE_ENV !== "production") notFound();` or move out of `../src/app` (#8).
  3. Delete `console.log` and add `no-console` error rule to `../eslint.config.mjs` (#10).
  4. Follow existing `notFound()` + loading/error boundary pattern on stub pages when implemented (#35).

### Task 5.2: Centralize Dialogs with Shadcn / Radix Modal Primitive
* **Problem (LOL #15, #16, #36, #60, Message.txt Phase 1):**
  - Modal chrome (overlay, card wrapper, close button, footer button row) is hand-rolled identically across 15+ files without focus trap or Esc-to-close (#15, #60).
  - `DeletePhase.tsx` and `DeleteWorkflow.tsx` are near-byte-identical (#16).
  - `EditProjectModal.tsx` is 336 lines mixing form state, custom searchable dropdown for client selection, and modal chrome (#36).
  - Modal Responsiveness: Remove fixed width classes (`w-[500px]`, etc.) from `DialogContent` to let modals adapt to screen size (Message.txt Phase 1).
  - Search input in `ManageMembersModal` has placeholder but no associated `<label>` (#60).
* **Skills:** `feature-sliced-design`, `superpowers-brainstorming`
* **jDocMunch Query:** `jdocmunch-mcp` search `shadcn-ui/ui` for `"dialog modal select"`
* **Goal:**
  1. Add `@radix-ui/react-dialog` / `shadcn/ui dialog` and build `src/shared/ui/modal.tsx` wrapping it with project Tailwind classes, handling focus trap/Esc/responsive sizing (`w-full max-w-lg`) out of the box (#15, #60).
  2. Build one generic `ConfirmDeleteModal({ label, onConfirm, onCancel })` and point delete flows at it (#16).
  3. Use Shadcn Select or Radix Combobox for client selection in `EditProjectModal` and split into `EditProjectModal.tsx` and `ClientSelect.tsx` (#36).
  4. Add visually-hidden `<label htmlFor>` for member search input (#60). Migrate call sites incrementally.

### Task 5.3: Refactor Toast System
* **Problem (LOL #7, #11, #12, #13, #24, #39, #40):**
  - `src/shared/ui/toasts.tsx:216` - hardcoded `<Toasts type="exclamation" title="Hamilton" description="Hamiltoe"/>` renders unconditionally on every render of `ProjectDashboard` (#7).
  - Background color built via runtime string concatenation `"bg-" + colorComponent`, which Tailwind scanner cannot detect (#11).
  - Invalid class `w-75` on toast container (#12).
  - Undefined type evaluates `colorComponent` to JSX fragment concatenated into className (`bg-[object Object]`) (#13).
  - `iconComponent` and `colorComponent` reimplement same type branching as two separate nested ternary chains (#24).
  - `WarningIcon` omits colored circle background (#39).
  - `TrashIcon` circle background reuses same green (`#016A43`) as success state (#40).
* **Skills:** `superpowers-test-driven-development`, `feature-sliced-design`
* **jDocMunch Query:** `jdocmunch-mcp` search `shadcn-ui/ui` for `"toast sonner"`
* **Goal:**
  1. Remove hardcoded toast call from `ProjectDashboard` (#7).
  2. Replace implementation with `shadcn/ui` Toast / Sonner OR rewrite `toasts.tsx` using a single `Record<ToastType, { Icon: ComponentType; className: string }>` map containing complete class strings (`w-[300px]`, `bg-red-500`, etc.) (#11, #12, #13, #24).
  3. Ensure WarningIcon has matching circular background (#39) and assign "delete" toast type its own distinct red/orange color (#40).

### Task 5.4: Centralize Form Inputs, Phone Number & Replace Custom Icons
* **Problem (LOL #23, #31, #32, #33, #61, Message.txt Phase 1):**
  - Codebase hand-rolls SVG icons in `icons.tsx` and `toasts.tsx` despite `lucide-react` being an installed dependency (#23).
  - `SearchIcon` defined inside `ManageMembersModal.tsx` instead of `icons.tsx` (#32).
  - `button.tsx:9` - only `primary`/`ghost` variants exist; danger buttons hand-roll styling inline (#31).
  - `TagModals.tsx` mixes router state machine with exported UI primitives (`CloseButton`, `TagBadge`, `ColorPicker`, `Backdrop`) (#33).
  - Form Input Centralization: Move `FormInput` into `@/components/ui/` (`src/shared/ui/input.tsx`) and replace inline inputs on `ActivePhaseDetails` and `Login` (Message.txt Phase 1).
  - Phone Number UI Refactor: Rebuild/fix Phone Number input component using `shadcn/ui` primitives (Message.txt Phase 1).
  - `ColorPicker` swatch buttons use raw hex strings in `aria-label` (#61).
* **Skills:** `feature-sliced-design`
* **jDocMunch Query:** `jdocmunch-mcp` search `shadcn-ui/ui` for `"button input form"`
* **Goal:**
  1. Replace custom SVG icon set with `lucide-react` imports (`Trash2`, `AlertTriangle`, `CheckCircle2`, `XCircle`, `Search`) (#23, #32).
  2. Add `danger` variant to `src/shared/ui/button.tsx` (#31).
  3. Move UI primitives (`CloseButton`, `TagBadge`, `ColorPicker`, `Backdrop`) out of `TagModals.tsx` into `../src/shared/ui` (#33).
  4. Bind inputs to TanStack Form + Shadcn primitives created in Task 1.4. Rebuild Phone Number input using Shadcn primitives.
  5. Add hex-to-human-name mapping (`#06B6D4` -> "Cyan") for ColorPicker `aria-label` (#61).

### Task 5.5: TopNav, Sidebar & Breadcrumbs Refactor
* **Problem (LOL #6, #14, #29, #30, #38, #51, #59):**
  - `TopNav.tsx:107` defaults user info to hardcoded "Alex Mercer" / "Product Owner" (#6).
  - `flex-6` added to `ProjectDashboard.tsx` root div, but parent `sidebar.jsx` is not flex container (#14).
  - `sidebar.jsx` and `sidebar-xtra.jsx` split one component across two files by JSX vs data. `Sidebar` manually re-imported in 4 page files instead of living once in workspace layout (#29).
  - Breadcrumb arrays are hand-typed literals per page (`["Acesoft", "Project Alpha"]`) (#30).
  - `TopNav.tsx` is 240 lines owning breadcrumbs, avatar (duplicated twice), dropdown state, profile menu (#38). Account dropdown has no focus management (focus not moved into menu on open, no arrow-key navigation) (#59).
  - `TicketBoard.tsx:307` - `tickets.filter()` runs once per column on every re-render (#51).
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **jDocMunch Query:** `jdocmunch-mcp` search `shadcn-ui/ui` for `"dropdown-menu avatar"`
* **Goal:**
  1. Source user name/role/initials from Auth Context (`auth_provider.tsx`) in `TopNav` (#6).
  2. Move `<Sidebar>` into `(workspace)/layout.tsx` once and remove from individual pages. Merge `sidebar-xtra.jsx` into `sidebar.jsx` (#29). Either make parent flex or remove `flex-6` (#14).
  3. Pass dynamic breadcrumbs constructed from route data (#30).
  4. Split `TopNav` into `Breadcrumbs.tsx`, `AccountMenu.tsx` (using `@radix-ui/react-dropdown-menu` / Shadcn Dropdown Menu for proper ARIA focus management), and `TopNav.tsx` shell (#38, #59).
  5. Compute single status grouping pass into `Map<status, Ticket[]>` with `useMemo` in `TicketBoard` (#51).

### Task 5.6: Projects Overview & Access Rules
* **Problem (Message.txt - Section 1):**
  - Progress Formula: `Total Stages Done / Total Stages`.
  - Subtext: Display the Project Name directly below the Overview header.
  - Contracts Link: Only the `View Contract` button routes to the Contracts page. Keep the other two buttons unlinked for now.
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **Goal:** Update `ProjectsOverview` component calculations and header layout according to specified business rules.

### Task 5.7: Stage Sequence, Details, Stepper & Modal Structure
* **Problem (Message.txt - Section 1 & Phase 3, LOL #34):**
  - **Stage Sequence:** Render title below each stage icon/node (excluding Approved status tag). Add an ellipsis (`...`) dropdown menu to each stage for quick Edit and Delete actions.
  - **Add/Edit Stage Modal:** Pattern match existing Phase/Module/Workflow modal structures. Use a single stateful modal component for Add/Edit (`isEditMode: boolean` or passing `stageData` object) to toggle labels, defaults, and API methods.
  - **Stage Details & Routing:** Show Stage Number, Name, Description, and `isApproved` badge (only if approved). If `actual_..._at` is missing, default fallback to `plan_start` / `start_date`. Aggregate progress based on child element status (`[Phases, Modules, Workflows, Tickets]`). Route `Preview Stage` -> `/projects/[projectid]/stage/[stageid]` and `Preview Gate` -> `/projects/[projectid]`.
  - **Phase Stepper:** Display all 4 dates (`planStart`, `planEnd`, `actualStart`, `actualEnd`) on stepper dividers. Add a hover pencil icon on phases to trigger pre-populated Edit Modal.
  - **Workflow Status:** Apply CSS variable state colors; disable/hide Edit button when status is `Completed`.
  - **TicketBoard JSDoc:** `handleDeleteTicket` carries JSDoc claiming optimistic removal with rollback that code does not implement (#34).
* **Skills:** `feature-sliced-design`, `superpowers-brainstorming`
* **Goal:** Build and refactor stage components in `../src/features/stage-editor/ui` using Shadcn dropdowns and modals according to FSD standards. Correct `handleDeleteTicket` JSDoc or implement optimistic updates via React Query's `onMutate`/`onError` rollback pattern (#34).

### Task 5.8: Client List Productionizing & Category Mapping
* **Problem (Message.txt - Phase 3, LOL #22, #25):**
  - Client List Productionizing: Drop hardcoded data; fetch live data on page load and implement dynamic state updates/refetches after editing.
  - Supabase Roles & Category: Rename `Department` to `UserCategory` and update role mappings for `Admin` / `Employee`.
  - Department/role badge-color logic (nested ternary, hardcoded hex) is duplicated inline twice in `ManageMembersModal.tsx` (#22).
  - Magic hex colors (`#4F46E5`, `#EF4444`, `#DC2626`, `#94A3B8`) repeated across modal files without shared constants or Tailwind theme tokens (#25).
* **Skills:** `feature-sliced-design`, `superpowers-test-driven-development`
* **Goal:**
  1. Replace static client arrays with `useClients` React Query hooks. Update category mappings.
  2. Extract `departmentBadgeStyle(name)` function in `shared/lib/colors.ts` and call from both rows in `ManageMembersModal` (#22).
  3. Register palette in `tailwind.config.ts` (`theme.extend.colors`) and replace literal hex classes with `bg-danger`, `text-danger`, etc. (#25).