# Code Review Findings

Full-codebase review. Findings are grouped by severity, not by file. Each entry lists file, line, the issue, the concrete consequence, and a recommended fix scoped for minimum dev time.

## Remediation Plan

> **Re-audited against current code on 2026-08-06** (per-finding verification with file:line evidence). Many findings were already resolved since this review was written — the status table below records them as **FIXED**. The phases only contain steps for findings still **OPEN/PARTIAL**, plus new issues found during the re-audit.
>
> **Recorded decisions:**
> 1. **UI primitives → shadcn** (already installed in `src/components/ui/*`; the saved shadcn migration plan is in progress — init, common components, CSS-var mapping done). Review suggestions to add raw `@radix-ui` wrappers (#15/#36/#38) are superseded.
> 2. **#17/#48/#62 → fractional indexing** (user choice): schema change, eliminates the renumber bug class.
> 3. **#57 → Supabase Auth email OTP** (user asked for an import, not a custom backend): `signInWithOtp`/`verifyOtp` are already wired; the plan hardens that path. No new backend, no new dependency.
> 4. **Scope**: all remaining OPEN/PARTIAL findings, phased by severity; each phase ends with a verification gate.

### Status table (67 findings)

> **COMPLETED 2026-08-06** — every finding is resolved (FIXED), except #50 which was checked and needed no action (OK). All six phases plus the re-audit's new issues (date-field schema drift, `createProject` validation placement, sidebar typo, Tags dialog copy, `getPastelStyle` NaN fallback — the latter caught by the new Vitest suite) are done. Verification: `npm run typecheck`, `npm test` (14 tests), and `npm run build` all green.

| # | Status | # | Status | # | Status | # | Status |
|---|---|---|---|---|---|---|---|
| 1 | FIXED | 2 | FIXED | 3 | FIXED | 4 | FIXED |
| 5 | FIXED | 6 | FIXED | 7 | FIXED | 8 | FIXED |
| 9 | FIXED | 10 | FIXED | 11 | FIXED | 12 | FIXED |
| 13 | FIXED | 14 | FIXED | 15 | FIXED | 16 | FIXED |
| 17 | FIXED | 18 | FIXED | 19 | FIXED | 20 | FIXED |
| 21 | FIXED | 22 | FIXED | 23 | FIXED | 24 | FIXED |
| 25 | FIXED | 26 | FIXED | 27 | FIXED | 28 | FIXED |
| 29 | FIXED | 30 | FIXED | 31 | FIXED | 32 | FIXED |
| 33 | FIXED | 34 | FIXED | 35 | FIXED | 36 | FIXED |
| 37 | FIXED | 38 | FIXED | 39 | FIXED | 40 | FIXED |
| 41 | FIXED | 42 | FIXED | 43 | FIXED | 44 | FIXED |
| 45 | FIXED | 46 | FIXED | 47 | FIXED | 48 | FIXED |
| 49 | FIXED | 50 | OK | 51 | FIXED | 52 | FIXED |
| 53 | FIXED | 54 | FIXED | 55 | FIXED | 56 | FIXED |
| 57 | FIXED | 58 | FIXED | 59 | FIXED | 60 | FIXED |
| 61 | FIXED | 62 | FIXED | 63 | FIXED | 64 | FIXED |
| 65 | FIXED | 66 | FIXED | 67 | FIXED | | |

Legend: **OPEN** = still applies; **PARTIAL** = partially fixed, remainder listed in its phase step; **FIXED** = resolved since the original review (verified file:line); **OK** = checked, no action needed.

### Phases

1. **Phase 1 — Security: keys, authorization, signing integrity**
   - #1 — Swap `src/lib/supabase/server.ts` to the anon key (matching `client.ts`/`proxy.ts`). Grep for genuine service-role needs; if any exist, isolate them in an explicitly named `src/lib/supabase/adminClient.ts` that request-handling code never imports.
   - #2+#3 — Extract the working `requireProjectMember`/`requireProjectOwner` from `projectActions.ts` into a shared `src/lib/auth/` helper; add userId/session params and guard calls to every mutating action in phase/workflow/module/stage/tag/ticket/comment actions; delete the dead `hasPermission()` once re-pointed.
   - #57 — OTP via the already-imported Supabase Auth email OTP (`signInWithOtp`/`verifyOtp`): remove the fake `setTimeout` wrapper and TODO comments; fix `CODE_LENGTH` 8 → 6 to match Supabase's email-template token; send the code to the signer's contact (currently sent to the session user's email); add resend with cooldown; keep "verified"/legal-binding copy gated on a real verify response.
   - #65 — `webhooks/route.ts`: in-file comment mandating signature verification + payload parsing before any provider is wired.
   - #66 — Add `headers()` to `next.config.ts` (CSP, X-Frame-Options, HSTS, X-Content-Type-Options).
   - Verify: `tsc --noEmit`/`next build` green; every mutating action has a guard; non-member mutation rejected (manual or test).

2. **Phase 2 — Production-breaking visible defects**
   - #8 — Gate `src/app/dev/ui` behind `NODE_ENV !== "production"` → `notFound()` (`TicketsShowcase.tsx` is already empty; delete both if not needed).
   - #9 — `analytics`/`credentials` pages: type `params: Promise<{ projectId: string }>` + `await`, matching sibling routes.
   - #10 — Add `no-console: error` to `eslint.config.mjs` (the stray log is already removed).
   - Verify: `next build` + `npm run lint` green; manual render of both pages.

3. **Phase 3 — Data layer: fractional ordering, transactions, indexes**
   - #17+#48+#62 (fractional indexing) — Add the `fractional-indexing` dependency; schema migration: add `sort_key String` to Stages/Phases/Modules/Workflows (drop the null-then-reassign `number` scheme; derive display numbering at read time if the UI shows it); seed keys via `generateNKeysBetween`; rewrite reorder + soft-delete logic in `phaseActions.ts`/`workflowActions.ts`/`moduleActions.ts`/`stageActions.ts` as single-key updates; update every `orderBy: { number }` query; remove the `as any` casts.
   - #42 — One migration adding composite indexes: Tickets[workflow_id,is_deleted], HistoryEvent[ticket_id], Comments/Images[parent_type,parent_id,is_deleted], Phases[stage_id,is_deleted], Modules[phase_id,is_deleted], Workflows[module_id,is_deleted], RoleAssignments[project_id], Gates[project_id].
   - #43+#44+#27 — `selectComment`: single query with `where { parent_type, parent_id, is_deleted: false }` + `include { Images: true }`; drop JS-side filtering.
   - #45 — `pg_trgm` GIN indexes on Profiles (first_name/last_name/email); `take: 20` already present.
   - #46 — Wrap `getCurrentUserId` in React `cache()`.
   - #47+#54+#21 — `updateTicket`: collect history rows → one `createMany`, whole body in `$transaction` (fold in a `logHistoryEvent` helper).
   - #53+#56 — Cascade soft-delete: one `updateMany` per level + `createMany` history; `cascadeSoftDeleteTicket` must use the passed tx client.
   - #55 — `createMany({ skipDuplicates: true })` for client role assignments in `createProject`.
   - #49 — Add `take` bounds to `selectTicket`/`selectProjects`/`selectTag`.
   - NEW — `createProject`: move `projectCreateSchema.parse` inside the try/catch so validation failures return `{success:false}` instead of throwing.
   - #50 — Verified OK (pooled connection); document, no code change.
   - Verify: `prisma migrate dev` on a local DB; build; exercise ticket edit, drag-reorder, profile search, and a 4-level cascade delete.

4. **Phase 4 — Shared UI & duplication elimination**
   - #16 — Generic `ConfirmDeleteModal` on shadcn `AlertDialog`; collapse DeletePhase/DeleteWorkflow (check Tag/Ticket delete modals too).
   - #18 — Move `EntityFilterStatus` to `src/entities/types.ts`; re-point all 7 imports.
   - #19 — Extract `getFieldErrors(result)` into `src/shared/lib/`; replace 12+ copy-pasted field-error loops.
   - #20 — Extract `useResetOnOpen(isOpen, resetFn)` hook; replace the 3 `setTimeout(fn, 0)` hacks.
   - #25 — Register the app palette as theme tokens in `globals.css` (align with the shadcn CSS-var mapping from the migration plan); replace inline hex classes.
   - #41 — Normalize/validate hex input in `getPastelStyle` (strip `#`, expand 3-digit shorthand, fall back on NaN).
   - #33+#61 — Move `CloseButton`/`ColorPicker`/`Backdrop` to `shared/ui`; ColorPicker `aria-label` from a hex→name map.
   - #60 — Add a visually-hidden `<label>` for the ManageMembersModal search input (Esc/focus trap already via shadcn Dialog).
   - Verify: build; visual QA of dialogs/buttons across project-manager, stage-editor, tag-manager, ticket-board.

5. **Phase 5 — Feature-level refactors & conventions**
   - #26 — `clientActions`: zod validation (schema already exists), try/catch `{success,error}` shape, soft delete, remove dead `clientSelect`/`clientSelectByTin`/`clientSelectByAddress`.
   - #28 — Gates/modules/phases pages (+ workflows page found in the re-audit) → entity actions instead of inline `prisma`; remove `as Record<string, unknown>` casts.
   - #36 — Replace the hand-rolled `FormInput variant="select"` with shadcn `Select`.
   - #37 — `use-debounce` for the ManageMembersModal profile search (removes the race-guard code).
   - #38 — Split TopNav into `Breadcrumbs` + `AccountMenu` (dropdown already shadcn).
   - #30 — Breadcrumbs from real route data instead of hardcoded literals in `(app)/layout.tsx`.
   - #34 — Correct the TicketBoard handler JSDoc (or implement real optimistic updates).
   - #51 — `useMemo` `Map<status, Ticket[]>` grouping in TicketBoard.
   - #52 — Confirm reference-data staleTime overrides (profiles done; no department/role hooks exist).
   - #58 — Server-side validation on signature upload (magic-byte sniffing + size limit) in the persisting action.
   - #35 — Low priority: note the stub-page pattern for future implementation.
   - NEW — Fix the sidebar brand typo ("Asceoft") and the Tags-dialog copy-paste description ("Fill in the details for this project.").
   - Verify: build; manual QA of projects/gates/modules/ticket-board/contracts flows.

6. **Phase 6 — Type safety, CI/tests, documentation**
   - #63 — Type the comment-mutations cache updater with the real query return type (drop `any`).
   - #64 — Add `performed_by` to the ticket-mutation variables type; drop the cast.
   - #67 — CI: add `next build` (or `tsc --noEmit`) to `.github/workflows/ci.yml`; introduce Vitest with entity-actions coverage (authorization guards, soft-delete/cascade, reorder, updateTicket history), starting with the highest-risk paths.
   - Docs — Update this status table as each phase lands; final full verification (build + lint + tests) and a `review` pass on the final diff.
   - Verify: green CI (build + tests); status table matches reality.

### New issues found during the re-audit (not in the original review)

- OTP flow: `CODE_LENGTH = 8` vs Supabase's 6-digit email token; code is sent to the session user's email, not the signer's; fake `maskedEmail` default. (Handled in Phase 1, #57.)
- `workflows/[workflowId]/page.tsx` also calls `prisma` inline and casts results `as Record<string, unknown>` — extends #28.
- `createProject` runs `projectCreateSchema.parse` outside its try/catch — validation errors throw instead of returning `{success:false}`. (Handled in Phase 3.)
- Monolith files: `TicketModalEdit.tsx` ~34.8 KB, `TicketModalCreate.tsx` ~18.5 KB, `PhaseStepper.tsx` ~20.8 KB, `WorkflowsList.tsx` ~14.7 KB — refactor candidates, out of scope for now.
- `TagModals.tsx` dialog description is copy-pasted from the project dialog ("Fill in the details for this project.").
- Sidebar brand typo: "Asceoft".

## Security

1. `src/lib/supabase/server.ts:11` - The "server" Supabase client is instantiated with `SUPABASE_SERVICE_ROLE_KEY` instead of the anon key used by `client.ts` and `proxy.ts`. Every server-side Supabase call runs with full admin privileges and bypasses Postgres RLS entirely.
   **Fix:** Swap the key to the anon key, matching `client.ts`. One-line change. If service-role access is genuinely needed somewhere (e.g. a background job), isolate that into its own explicitly named client (`adminClient.ts`) that is never imported from request-handling code.

2. `src/lib/auth/permissions.ts:11` - `hasPermission()` has zero callers anywhere in the codebase. Meanwhile `phaseActions.ts`, `workflowActions.ts`, `moduleActions.ts`, `stageActions.ts`, `tagActions.ts`, and `ticketActions.ts` have no authorization check at all, despite doc comments in those files stating authorization must be verified before execution. Two incompatible auth systems exist; one is unused, the other is not applied. Any caller who knows an entity ID can mutate it regardless of project membership.
   **Fix:** Delete `hasPermission()` if it is not the intended direction, or adopt it as the single source of truth and route every action through it. Fastest path: extract the membership check already written in `projectActions.ts` (`requireProjectMember`/`requireProjectOwner`) into a shared helper in `src/lib/auth/`, then call it at the top of every mutating action in phase/workflow/module/stage/tag/ticket. Mechanical, no new dependency, roughly one line added per action.

3. `src/entities/project/projectActions.ts` gates `updateProject`, `softDeleteProject`, `addProjectMember`, `removeProjectMember` behind membership/ownership checks, but `createPhase`, `updatePhase`, `softDeletePhase`, `createWorkflow`, `updateWorkflow`, `createModule`, `updateModule`, `createTag`, `updateTicket`, `updateTicketStatus` take no userId/session parameter. Authorization coverage is inconsistent by entity, not by design.
   **Fix:** Same helper as #2 covers this. Treat #2 and #3 as one fix, applied in a single pass over the action files.

4. `src/lib/db/contracts.ts`, `phases.ts`, `projects.ts`, `tickets.ts`, `users.ts` - entirely dead files, zero imports anywhere in `src`. They duplicate queries already implemented in `entities/*/queries.ts` but without the `is_deleted` soft-delete filtering those apply. If wired up, they leak soft-deleted rows.
   **Fix:** Delete the files. Zero risk, since nothing imports them; confirmed via grep. Fastest possible fix in this document.

## Production-breaking / shipped-as-is defects

5. `src/app/layout.tsx:29` - Root layout renders only `<>{children}</>`. The `<html>`/`<body>` tags and font-variable classes are commented out. Every page loses the `lang` attribute, font CSS variables, and antialiasing.
   **Fix:** Uncomment the original markup. Two-minute fix, no dependency.

6. `src/shared/ui/TopNav.tsx:107` - `userName`, `userRole`, `userEmail`, `userInitials` default to hardcoded values ("Alex Mercer", "Product Owner", a fake email). No current call site overrides them. Every real user sees this fake identity in the account menu.
   **Fix:** Source these from the existing auth context (`src/features/auth/context/auth_provider.tsx` already exposes the session) instead of prop defaults. Remove the hardcoded defaults so a missing value fails visibly instead of silently showing fake data.

7. `src/shared/ui/toasts.tsx:216` - A hardcoded `<Toasts type="exclamation" title="Hamilton" description="Hamiltoe"/>` renders unconditionally on every render of `ProjectDashboard`. No state, no dismiss mechanism. Every user sees a permanent, undismissable placeholder toast with typo text on the Projects page.
   **Fix:** Remove the hardcoded instance. Wire `Toasts` to real state (open/closed, message content) when there is an actual event to surface. Until then, delete the call entirely rather than leaving a placeholder live.

8. `src/app/dev/ui/page.tsx` and `TicketsShowcase.tsx` - a dev-only component showcase route lives under `src/app` with no route guard, no `noindex`, no build-time exclusion. It ships as a public route in production.
   **Fix:** Move the showcase out of `src/app` into a Storybook-style setup, or gate it behind `if (process.env.NODE_ENV !== "production") notFound();` at the top of the page. If no dev-tooling budget exists, simplest fix is deleting the route and keeping the components importable only from tests.

9. `src/app/(app)/(workspace)/analytics/page.tsx` and `credentials/page.tsx` - `params` typed as a plain synchronous object, while every sibling dynamic route in the same tree (gates, modules, phases, stages, workflows) correctly types it as `Promise<{...}>` per the Next.js App Router async-params contract. These two will break as soon as they are implemented.
   **Fix:** Change the type to `Promise<{ projectId: string }>` and `await params` at the top of the function body, matching the other five route files. Copy-paste from any sibling page, five-minute fix.

10. `src/features/project-manager/ui/modals/EditProjectModal.tsx:82` - stray `console.log(data)` left inside a form callback. Fires in production every time a real user opens this modal.
    **Fix:** Delete the line. Add `no-console` to the ESLint config (already using `eslint.config.mjs`) as an error-level rule to catch this class of leftover automatically going forward.

## Tailwind / styling defects

11. `src/shared/ui/toasts.tsx:95` - Toast background color class is built via runtime string concatenation (`"bg-" + colorComponent`). Tailwind's build-time scanner cannot detect a class name that never appears as a literal string in source, so the generated CSS rule does not exist. Toasts render with no background color.
    **Fix:** Replace the concatenation with a `Record<ToastType, string>` map of complete class strings (fixes this finding and #24 together). Tailwind's scanner only needs the full literal to appear somewhere in source, so a lookup object of full class names resolves it with no config change.

12. `src/shared/ui/toasts.tsx:94` - `w-75` is used on the toast container. Tailwind's default spacing scale has no `75` step and this is not arbitrary-value syntax (`w-[75px]`). The class compiles to nothing; the toast wrapper has no explicit width.
    **Fix:** Replace with `w-[300px]` (or whatever the intended width is) or a real scale value like `w-72`/`w-80`. One-word fix.

13. `src/shared/ui/toasts.tsx:91` - When `type` is undefined or unrecognized, `colorComponent` evaluates to a JSX fragment instead of a string but is still concatenated into a className. Any future caller passing an unrecognized type produces an invalid class like `bg-[object Object]`.
    **Fix:** Resolved automatically once the lookup-map fix from #11 is applied; add a default key to the map (e.g. neutral gray) so unrecognized types degrade gracefully instead of producing invalid output.

14. `src/features/project-dashboard/ui/ProjectDashboard.tsx:120` - `flex-6` was added to the root div, but its parent (`src/shared/ui/sidebar.jsx`) is not a flex container. The class has no effect. It is also only applied to the loaded-content return path, not the loading or error paths, so if it is ever made meaningful the three states will size inconsistently.
    **Fix:** Either make the parent `flex` (if the intent was to size this div relative to a sibling) or remove `flex-6` as dead code. Whichever way it's resolved, apply the same class to the isLoading and error return blocks so all three states share layout.

## Duplicated logic that should be centralized

15. Modal chrome (overlay div, white card wrapper, close button, footer button row) is hand-rolled identically across 15+ files in `project-manager/ui/modals`, `stage-editor/ui/modals`, `tag-manager`, and `ticket-board`. No shared `Modal` primitive exists. A global modal behavior change (Esc-to-close, focus trap) requires editing all 15 files.
    **Fix:** Add `@radix-ui/react-dialog` (unstyled, accessible, handles focus trap/Esc/scroll-lock out of the box) and build one `src/shared/ui/modal.tsx` wrapping it with the project's existing overlay/card Tailwind classes. Then migrate the 15 call sites to `<Modal>` incrementally. This is the single highest dev-time payoff item in this document given the file count affected.

16. `src/features/stage-editor/ui/modals/DeletePhase.tsx` and `DeleteWorkflow.tsx` are near-byte-identical, differing only by the word "Phase"/"Workflow". Should be a single generic `ConfirmDeleteModal`.
    **Fix:** Build `ConfirmDeleteModal({ label, onConfirm, onCancel })` once (on top of the Modal primitive from #15 if that lands first), then point both existing delete flows at it. Also collapses `TagModalDelete.tsx` and `TicketModalDelete.tsx` into the same component if their markup matches, worth checking during the same pass.

17. The renumber-after-delete/reorder algorithm (null affected rows, then reassign one-by-one to avoid a unique constraint violation) is duplicated near-verbatim in `phaseActions.ts` (`softDeletePhase`, `cascadeSoftDeletePhase`, `reorderPhase`) and mirrored again in `workflowActions.ts`, roughly 250-300 duplicated lines total.
    **Fix, minimal:** Extract one generic `renumberSiblings(tx, table, parentIdColumn, parentId)` helper and call it from both entities. No new dependency, removes the duplication directly.
    **Fix, industry standard:** Replace integer position columns with fractional indexing (`fractional-indexing` npm package, the technique Notion/Figma/Linear use for reorderable lists). Inserting or deleting a row becomes a single string-key update with no renumbering of siblings at all, eliminating this class of bug entirely rather than just deduplicating it. Larger change (touches schema and every order-by query) but removes the null-then-reassign workaround permanently.

18. `EntityFilterStatus` (`'active'|'deleted'|'all'`) is copy-pasted verbatim across `ticketActions.ts`, `commentActions.ts`, `phaseActions.ts`, `workflowActions.ts`, `moduleActions.ts`, `stageActions.ts`. `profileActions.ts` imports it cross-entity from `ticketActions.ts` rather than from a shared location.
    **Fix:** Move the type into `src/entities/types.ts` (already exists, already the shared location per convention) and re-point all seven imports. Pure find-and-replace, under 10 minutes.

19. Field-error mapping from a zod `safeParse` result (flatten `fieldErrors`, loop `Object.entries`, take first message) is copy-pasted verbatim in `EditProjectModal.tsx`, `AddModule.tsx`, `EditModule.tsx`.
    **Fix:** Extract `getFieldErrors(result: SafeParseReturnType)` into `src/shared/lib/` (sits naturally alongside `strings.ts`, `colors.ts`). No dependency, mechanical extraction.

20. Modal-open/reset state handling (`useEffect` + `setTimeout(fn, 0)` workaround) is independently reimplemented in `DeleteProjectModal.tsx`, `EditProjectModal.tsx`, `ManageMembersModal.tsx` instead of a shared hook.
    **Fix:** Extract `useResetOnOpen(isOpen, resetFn)` into `src/shared/lib/` or a new `src/shared/hooks/` folder. Removes the repeated `setTimeout(fn, 0)` hack from three files at once.

21. `src/entities/ticket/ticketActions.ts:77` - `updateTicket` inlines roughly 150 lines of ad-hoc assignee/tag diffing plus five separate hand-written `prisma.historyEvent.create` calls with repeated `JSON.stringify` boilerplate. A single `logHistoryEvent` helper would remove most of this.
    **Fix:** Write `logHistoryEvent(tx, { ticketId, performedBy, action, details })` once in `src/entities/ticket/` and replace all five inline `create` calls with it. No dependency; the diffing logic can stay as-is, only the logging boilerplate needs consolidating.

22. Department/role badge-color logic (nested ternary, three hardcoded hex colors) is duplicated inline twice within the same file, `ManageMembersModal.tsx` (search-results row and members-table row).
    **Fix:** Extract a `departmentBadgeStyle(name: string)` function at the top of the file (or into `shared/lib/colors.ts` alongside the existing `TAG_COLORS`/`getPastelStyle` pattern) and call it from both rows.

23. `TrashIcon` is defined independently in both `src/shared/ui/icons.tsx` and `src/shared/ui/toasts.tsx` with different markup. Icon sizes throughout `icons.tsx` are hardcoded per-icon instead of a shared size prop.
    **Fix:** `lucide-react` is already an installed dependency (`package.json`) but the codebase hand-rolls SVG icons instead of using it. Replacing the custom icon set with `lucide-react` imports (`Trash2`, `AlertTriangle`, `CheckCircle2`, `XCircle`, etc.) removes this entire class of duplication and inconsistent sizing in one pass, and it is a dependency that is already paid for and unused.

24. `iconComponent` and `colorComponent` in `toasts.tsx:83` each reimplement the same type-based branching as two separate nested ternary chains instead of one lookup table, despite an existing `Record`-based pattern already used elsewhere in the codebase (`STATUS_COLORS` in `TicketHistoryLog.tsx`).
    **Fix:** One `Record<ToastType, { Icon: ComponentType; className: string }>` map replaces both ternary chains. Combine with #11 and #23 as a single toasts.tsx rewrite; all three fixes land in the same diff.

25. Magic hex colors (`#4F46E5`, `#EF4444`, `#DC2626`, `#94A3B8`, etc.) are repeated across nearly every modal file with no shared constants or Tailwind theme extension, despite `src/shared/lib/colors.ts` already existing as a pattern for this that is simply not extended to the app's general UI palette.
    **Fix:** Register the palette as Tailwind theme tokens (`theme.extend.colors` in the Tailwind v4 CSS config, e.g. `--color-danger: #DC2626`) and replace literal hex classes with `bg-danger`/`text-danger` etc. No new dependency, uses Tailwind's own mechanism, and gives a single place to adjust brand colors going forward.

## Convention violations / inconsistency

26. `src/entities/client/clientActions.ts` breaks every convention the rest of `entities/` follows: no zod validation on create/update (raw object trusted as-is), no try/catch (every sibling action wraps DB calls and returns `{success, error}`), and a hard `prisma.clients.delete` where every other entity soft-deletes via `is_deleted`/`deleted_at`. It also exports dead query helpers never called anywhere: `clientSelect()`, `clientSelectByAddress`, `clientSelectByTin`.
    **Fix:** `src/shared/schemas/client.ts` already exists, so validation is a matter of calling it, not writing it. Wrap existing DB calls in the same try/catch + `{success, error}` shape used by `projectActions.ts`. Change the hard delete to set `is_deleted`/`deleted_at`, matching every other entity. Delete the three unused query helpers. All mechanical, no new dependency.

27. `src/entities/comment/commentActions.ts` (`selectComment`) manually joins Comments to Images via two separate `findMany` calls plus a per-comment `.filter()` in a map (O(n·m)), instead of a single Prisma `include`, unlike `phaseActions`, `workflowActions`, `stageActions`, which all use relational `include` for equivalent one-to-many fetches.
    **Fix:** Replace both `findMany` calls with one `prisma.comments.findMany({ where, include: { images: true } })`. Copy the pattern directly from `phaseActions.ts`. Also a performance fix, see the performance section below.

28. `src/app/(app)/(workspace)/projects/[projectId]/gates/[gateId]/page.tsx` and the equivalent module/phase pages call `prisma.<table>.findUnique` directly inside the Server Component instead of the existing `getPhaseById`/`getModuleById` entity actions used everywhere else via React Query. Two parallel, divergent data-fetching paths now exist for the same data.
    **Fix:** Replace the inline `prisma` calls with the existing entity action functions. Same result, one data path, and picks up soft-delete filtering and any future auth check added under finding #2 automatically.

29. `src/shared/ui/sidebar.jsx` and `sidebar-xtra.jsx` split one component across two files by content-type (JSX vs. data/icons) rather than by responsibility. Neither is wired into a shared layout; `Sidebar` is manually re-imported and re-wrapped in 4 separate page files instead of living once in `(app)/layout.tsx` or `(workspace)/layout.tsx`, both of which currently just pass through `{children}`.
    **Fix:** Move `<Sidebar>` into `(workspace)/layout.tsx` once, remove it from the 4 individual pages. Merge `sidebar-xtra.jsx` into `sidebar.jsx` (or split by actual sub-component instead of by content-type) while doing this pass, since the layout file is being touched anyway.

30. `src/shared/ui/TopNav.tsx:141` - breadcrumb arrays are hand-typed literals per page (e.g. `["Acesoft", "Project Alpha", "Project Structure"]`) rather than derived from route params or a shared builder. They are already stale relative to real project names.
    **Fix:** Build breadcrumbs from the route's actual entity data (project name, phase name, etc.) already being fetched by each page, passed down as a `breadcrumbs` prop computed from real data instead of typed literals. No dependency; requires touching each page that renders `TopNav`.

31. `src/shared/ui/button.tsx:9` - only `primary`/`ghost` variants exist. Every delete-confirmation modal and toast hand-rolls its own one-off danger button styling inline instead of a shared `danger` variant.
    **Fix:** Add a `danger` variant to the existing variant map in `button.tsx` (same pattern as `primary`/`ghost`, just another Tailwind class string). Fifteen-minute fix, then swap inline danger buttons over to `<Button variant="danger">` as those files are touched for other fixes in this document.

32. `src/features/project-manager/ui/modals/ManageMembersModal.tsx:14` - `SearchIcon` is defined and exported from a modal file instead of `src/shared/ui/icons.tsx`, where every other icon in the codebase lives.
    **Fix:** If the `lucide-react` migration from #23 happens, this disappears automatically (`Search` icon from lucide replaces it). If not, just move the definition to `icons.tsx`.

33. `src/features/tag-manager/ui/TagModals.tsx` mixes a router-like state machine (`view: "list"|"create"|"edit"|"delete"`) with unrelated exported UI primitives (`CloseButton`, `TagBadge`, `ColorPicker`, `Backdrop`) in the same file. These primitives belong in `shared/ui`.
    **Fix:** Move `CloseButton`, `TagBadge`, `ColorPicker`, `Backdrop` into `src/shared/ui/`. Pure file move, no logic change, unlocks reuse in the modal-consolidation work from #15.

34. `src/features/ticket-board/ui/TicketBoard.tsx:149` - handlers such as `handleDeleteTicket` carry JSDoc claiming behavior (optimistic removal with rollback) that the implementation does not have (a single `mutate()` call, no optimistic update, no rollback). The comments describe behavior the code does not implement.
    **Fix, minimal:** Delete or correct the inaccurate comments so they describe what the code actually does. Five minutes.
    **Fix, if the described behavior is actually wanted:** Implement optimistic updates via React Query's `onMutate`/`onError` rollback pattern (standard Tanstack Query usage, no new dependency since it's already installed) so the code matches the comment instead of the other way around.

35. `src/app/(app)/(workspace)/page.tsx` and the `dashboard`/`settings` stub pages return a bare `<div>Label</div>` with no loading/error boundary, while sibling detail routes implement `notFound()` handling. No consistent contract distinguishes an intentional stub from a data-backed route.
    **Fix:** Low priority since these are acknowledged stubs. When implemented, follow the existing pattern already used by the gate/module/phase pages (`notFound()` + loading/error states) rather than inventing a new one.

## Complexity / structure

36. `src/features/project-manager/ui/modals/EditProjectModal.tsx` is 336 lines mixing form state/validation, a fully custom searchable-dropdown implementation for client selection, and modal chrome, with no reuse of any shared `Select` component.
    **Fix:** Add `@radix-ui/react-select` (or reuse `@radix-ui/react-dialog`'s combobox pattern if #15 is already adding Radix) for the searchable dropdown instead of hand-rolled positioning/filtering logic, and split the file into `EditProjectModal.tsx` (chrome + submit) and `ClientSelect.tsx` (the dropdown). Since Radix would already be a new dependency from #15, this reuses it rather than adding a second one.

37. `src/features/project-manager/ui/modals/ManageMembersModal.tsx:56` - a hand-rolled debounce and race-guard search implementation (mount ref, latest-query ref, manual `clearTimeout` juggling), roughly 60 lines of async logic embedded directly in a modal component instead of a reusable hook.
    **Fix:** Add `use-debounce` (small, widely used, ~2kb) and replace the manual `clearTimeout` juggling with its `useDebouncedCallback`/`useDebounce` hook. Removes the race-guard code entirely rather than just moving it, since the library already handles staleness correctly.

38. `src/shared/ui/TopNav.tsx` is 240 lines owning breadcrumb rendering, avatar rendering (duplicated between collapsed and expanded states), dropdown open/close plus outside-click/escape handling, and the profile menu, with no sub-component extraction.
    **Fix:** Split into `Breadcrumbs.tsx`, `AccountMenu.tsx` (covers avatar + dropdown, deduplicating the two avatar render sites into one), and `TopNav.tsx` as the composing shell. If `@radix-ui/react-dropdown-menu` is added as part of #15/#36, use it here too instead of the hand-rolled outside-click/escape handling, removing that logic rather than just relocating it.

39. `src/shared/ui/toasts.tsx:59` - `WarningIcon` omits the colored circle background that `ErrorIcon`, `SuccessIcon`, and `TrashIcon` all draw, producing a visually inconsistent icon for the "exclamation" type.
    **Fix:** Add the missing `<circle>` to match the other three icons, or migrate to `lucide-react` per #23 and use `AlertTriangle` with a wrapping colored circle applied consistently to all four icon types via one shared wrapper component.

40. `src/shared/ui/toasts.tsx:48` - `TrashIcon`'s circle background and the "delete" entry in the color map both reuse the same green (`#016A43`) as the success state, giving destructive and success toasts identical coloring.
    **Fix:** Assign "delete" its own color (red/orange family, distinct from both success-green and the existing error-red) in the lookup map introduced by fix #11/#24. One-line change once that map exists.

41. `src/shared/lib/colors.ts:8` - `getPastelStyle` parses hex color strings via `parseInt(hex.slice(...))` with no format validation. A malformed hex (missing `#`, 3-digit shorthand) silently produces `NaN` in the resulting rgba string instead of failing or normalizing.
    **Fix:** Normalize input at the top of the function (strip `#`, expand 3-digit shorthand to 6-digit) before parsing, and throw or fall back to a default color if the result is `NaN`. No dependency; under 10 lines.

## Performance

Investigated in response to reported real-world slowness. No new infrastructure required for any of these; no caching layer (Redis) is needed yet.

### Database

42. `prisma/schema.prisma` lines 502-842 - zero indexes across every application table (Tickets, Comments, Phases, Modules, Workflows, Stages, Projects, RoleAssignments, HistoryEvent, TicketAssigned, TicketTags, Images, GateSignatures, Contracts, Profiles), despite every query file filtering on `is_deleted` and joining on foreign keys (`project_id`, `phase_id`, `stage_id`, `module_id`, `workflow_id`, `ticket_id`, `profile_id`, `parent_id`/`parent_type`). The Supabase-managed `auth` schema is fully indexed by contrast; the app's own schema is not.
    **Fix:** Add composite indexes matching actual query shape in a single migration: `@@index([workflow_id, is_deleted])` on Tickets, `@@index([ticket_id])` on HistoryEvent, `@@index([parent_type, parent_id, is_deleted])` on Comments and Images, `@@index([stage_id, is_deleted])` on Phases, `@@index([phase_id, is_deleted])` on Modules, `@@index([module_id, is_deleted])` on Workflows, `@@index([project_id])` on RoleAssignments and Gates. This is the single highest-impact fix in this document and requires no application code changes, only a schema migration.

43. `src/entities/comment/commentActions.ts:15` (`selectComment`) - fetches every non-deleted comment in the entire database on every call, with no `where` scoping by ticket or gate. `src/entities/comment/queries.ts:12` (`useTicketComments`) then filters that full result set down to one ticket in JavaScript. Every time any user opens a ticket's comment panel, query cost is proportional to total comments across the whole app, not to that ticket.
    **Fix:** Push the `parent_id`/`parent_type` filter into the Prisma `where` clause and remove the client-side filter entirely. Turns an O(all rows) query into an O(rows for this ticket) query. Second highest-impact fix in this document.

44. `src/entities/comment/commentActions.ts:33` - the same function performs a second unscoped `findMany` on Images and stitches the two result sets together in JavaScript (a `.filter()` per comment against the full Images table), instead of a single query with `include`. This duplicates finding #27 from a performance angle, not just a style one.
    **Fix:** Replace both calls with one `prisma.comments.findMany({ where: { parent_type, parent_id, is_deleted: false }, include: { Images: true } })` once the scoping fix from #43 is applied.

45. `src/entities/project/projectActions.ts:454` (`searchProfilesForProject`) - uses `contains` with `mode: "insensitive"` (ILIKE) across three columns with no `take` limit. This pattern cannot use a normal btree index and becomes a full sequential scan per keystroke on any real user table.
    **Fix:** Add a `pg_trgm` GIN index (`CREATE EXTENSION pg_trgm;` then `CREATE INDEX ON "Profiles" USING gin (first_name gin_trgm_ops)`, repeated for last_name/email) and add `take: 20` to bound the result set.

46. `src/entities/project/projectActions.ts:33` (`getCurrentUserId`) - calls `supabase.auth.getUser()`, a network round trip to Supabase's auth server, and is called at the top of nearly every project/phase/workflow/module action. Every mutation and several reads pay an extra external HTTP round trip before the DB query even starts.
    **Fix:** Use `getSession()` instead where re-verification of the JWT against Supabase isn't strictly required, or wrap `getCurrentUserId` in React's `cache()` so it resolves once per request instead of once per action call within that request.

### Query patterns

47. `src/entities/ticket/ticketActions.ts:77` (`updateTicket`) - issues up to 6 sequential, unbatched `prisma.historyEvent.create()` calls (rename, status change, one per assignee added, one per assignee removed, watcher change) plus the ticket `update()` itself, none wrapped in a transaction. Each is a separate DB round trip, and a crash mid-function leaves the ticket updated but history events missing.
    **Fix:** Collect all history rows into an array and write them with one `prisma.historyEvent.createMany({ data: [...] })`, and wrap the whole function body in `prisma.$transaction(...)`. Fixes both the round-trip count and the partial-write consistency gap in one change.

48. `src/entities/phase/phaseActions.ts` (reorder/renumber logic) and its mirror in `workflowActions.ts` - reorder operations null out all affected rows then reassign numbers one row at a time in a loop of sequential `update()` calls.
    **Fix, minimal:** Replace the loop with a single `updateMany`/`CASE WHEN` raw query, or batch the updates inside one `$transaction` via `Promise.all`, replacing N round trips with 1-2.
    **Fix, industry standard:** Same fractional-indexing approach recommended in finding #17 removes the renumbering step entirely rather than just batching it.

49. `src/entities/ticket/ticketActions.ts:12` (`selectTicket`), `src/entities/project/projectActions.ts:66` (`selectProjects`), `src/entities/tag/tagActions.ts` (`selectTag`) - none of these list queries set a `take` limit.
    **Fix:** Add pagination (`take`/`skip`, or cursor-based for large lists) now, while these call sites are still simple. Retrofitting pagination after a list view is visibly slow requires touching both the query and every UI call site at once; doing it now is cheaper.

### Connection handling

50. `src/lib/prisma.ts` - the Prisma singleton pattern (global caching in dev, `PrismaPg` adapter) is correctly implemented, not a defect. Worth confirming as part of this pass: verify `DATABASE_URL` points at Supabase's pooled connection string (port 6543, pgbouncer) and not the direct connection (port 5432). Using the direct connection from a serverless deployment is a common way to silently exhaust Postgres's connection limit under concurrent load.
    **Fix:** No code change if already pointed at the pooler. If not, switch the env var to the pooled connection string.

### Client-side

51. `src/features/ticket-board/ui/TicketBoard.tsx:307` - `tickets.filter((t) => t.status === column.id)` runs once per column (5+ passes over the full tickets array) on every re-render of the board, including re-renders triggered by drag-and-drop state changes (`activeId`) that do not change the ticket list itself.
    **Fix:** Compute a single grouping pass into a `Map<status, Ticket[]>` with `useMemo` keyed on `tickets`, and read from it per column instead of re-filtering the whole array per column on every render.

52. `src/shared/query/client.tsx` - global React Query defaults (`staleTime: 30s`, `refetchOnWindowFocus: false`) are reasonable, not a defect. Relatively static reference data (`useProfiles`, department/role lookups) has no longer override despite changing rarely, unlike `useTags` which is already correctly overridden to 30s.
    **Fix:** Bump `staleTime` to 5+ minutes specifically for reference-style lists (departments, roles, tags, profiles) to cut redundant refetches. Leave the 30s default for genuinely live data such as tickets.

### N+1 queries (dedicated pass)

53. Cascade soft-delete chain, four levels deep. `src/entities/stage/stageActions.ts:241` (`cascadeSoftDeleteStage`) loops `childPhases` and calls `cascadeSoftDeletePhase` per phase, which (`phaseActions.ts:293`) loops `childModules` and calls `cascadeSoftDeleteModule` per module, which (`moduleActions.ts:236`) loops `childWorkflows` and calls `cascadeSoftDeleteWorkflow` per workflow, which (`workflowActions.ts:295`) loops `childTickets` and calls `cascadeSoftDeleteTicket` per ticket (`ticketActions.ts:282`, a `findUnique` + `update` + optional `historyEvent.create`). Deleting one stage with 5 phases, 4 modules each, 3 workflows each, 10 tickets each fires on the order of hundreds of sequential awaited queries instead of a handful of batched calls. `getStageTree` already demonstrates the correct batching technique elsewhere in the codebase.
    **Fix:** Replace each level's loop with one `updateMany({ where: { <parent>_id: { in: [...] } }, data: { is_deleted: true, deleted_at } })`, and batch the history-event writes with `createMany`.

54. `src/entities/ticket/ticketActions.ts:186` and `:198` - `for (const profileId of assigneesToAdd) { await prisma.historyEvent.create(...) }`, and the mirrored loop for `assigneesToRemove`. One INSERT per assignee touched by a single ticket edit, unbounded. This refines finding #47: two of the "up to 6" history calls described there are actually unbounded loops, not a fixed count.
    **Fix:** `prisma.historyEvent.createMany({ data: assigneesToAdd.map(profileId => ({...})) })`, and the same for removals.

55. `src/entities/project/projectActions.ts:307` - `for (const cp of clientProfiles) { await tx.roleAssignments.create(...).catch(...) }` when creating a project with a client, one INSERT per profile linked to that client, with a per-row try/catch swallowing duplicate-key errors.
    **Fix:** `tx.roleAssignments.createMany({ data: clientProfiles.map(...), skipDuplicates: true })`. Removes the loop and the per-row catch in one line.

56. `src/entities/ticket/ticketActions.ts:282` (`cascadeSoftDeleteTicket`) accepts a `_txClient` parameter but never uses it, calling the module-level `prisma` directly instead of the transaction client passed down from `cascadeSoftDeleteWorkflow`. Found while tracing #53; not an N+1 itself but a correctness bug in the same code path.
    **Fix:** Use the passed `_txClient` instead of the module-level `prisma` inside `cascadeSoftDeleteTicket`, so ticket-level cascade deletes actually participate in the parent transaction. Otherwise a failure partway through a cascade delete leaves tickets deleted while their parent workflow/module/phase/stage rolls back, an inconsistent state. Fix alongside #53 since the same lines are being touched regardless.

## Legal / compliance risk

57. `src/features/contracts/ui/OTPVerification.tsx:88-98` - `handleVerify` never calls a backend. It runs a hardcoded `setTimeout(800ms)` and then unconditionally sets state to "verified", regardless of what digits were entered. A comment in the file reads `// TODO: connect to backend - POST /api/otp/verify`. The UI text at lines 202-208 tells the signer this action "legally binds yourself to this agreement," while zero identity verification actually occurs; any 6 digits, or none, succeed. This is the single most severe finding in this document: a contract-signing flow that presents itself as verified and legally binding while performing no verification at all.
    **Fix:** Do not treat this flow as production-ready. Implement a real OTP endpoint (`POST /api/otp/verify`) with server-side code generation, expiry, and rate limiting, and block "verified" state on its actual response before this feature is used for any real agreement.

## Additional gaps: accessibility, uploads, type-safety, config

58. `src/features/contracts/ui/SignatureUpload.tsx:43` - file type is validated only via `file.type`, the browser-reported MIME type, which is trivially spoofable by renaming a file, and only client-side. No file size limit exists anywhere in this component.
    **Fix:** Enforce both file type (via magic-byte/content sniffing, not just the reported MIME type) and a size limit server-side, at whatever action actually persists the upload. The client-side check is a UX convenience only, never a real control.

59. `src/shared/ui/TopNav.tsx:180` - the account dropdown has correct `role="menu"`/`role="menuitem"` and Escape/click-outside handling, but no focus management: opening it does not move focus into the menu, and there is no arrow-key navigation between items. It looks like a real ARIA menu to sighted users but does not behave like one for keyboard/screen-reader users.
    **Fix:** Move focus to the first menu item on open, add arrow-key navigation, and return focus to the trigger button on close.

60. `src/features/project-manager/ui/modals/ManageMembersModal.tsx:155` - has correct `role="dialog" aria-modal="true"`, but no focus trap, no initial focus, and no Esc-to-close, unlike `TopNav`'s dropdown which already handles Esc. The search input at line 187 has only a `placeholder`, no associated `<label>`.
    **Fix:** Add Esc-to-close and initial-focus-on-open (reuse whatever pattern is adopted for the Radix dialog migration in finding #15, which solves this class of gap for all 15+ modals at once rather than patching each individually). Add a visually-hidden `<label htmlFor>` for the search input.

61. `src/features/tag-manager/ui/TagModals.tsx:68` - `ColorPicker` swatch buttons use `aria-label={color}`, a raw hex string like `#06B6D4`, instead of a human-readable name. Low severity but a real screen-reader gap.
    **Fix:** Maintain a small hex-to-name map (e.g. `{ "#06B6D4": "Cyan" }`) alongside `TAG_COLORS` in `shared/lib/colors.ts` and use the name in `aria-label`.

62. Six `as any` casts on Prisma `update`/`data` payloads in `phaseActions.ts:214,285`, `workflowActions.ts:216,287`, `stageActions.ts:201,233,357`, all in the renumber/reorder/soft-delete cascade code already flagged in findings #48 and #53. These are silencing a real schema/type mismatch (most likely a nullable-vs-non-nullable column conflict during the null-then-reassign renumbering step), not a stylistic shortcut.
    **Fix:** Resolve the underlying type mismatch (adjust schema nullability or restructure the update) rather than casting past it. This is likely to resolve on its own once the fractional-indexing fix from finding #17/#48 removes the null-then-reassign step entirely.

63. `src/entities/comment/mutations.ts:28` - `(oldData: any)` in a React Query `setQueryData` updater masks the actual cache shape, so a future schema change to comments will not be type-checked at this call site.
    **Fix:** Type it as the real query return type (e.g. `InfiniteData<Comment[]>` or whatever `useTicketComments` actually returns).

64. `src/entities/ticket/mutations.ts:20` - `(variables as any).performed_by` indicates the mutation's declared variables type is incomplete; the cast works around that gap instead of fixing it.
    **Fix:** Add `performed_by` to the actual mutation variables type and remove the cast.

65. `src/app/api/webhooks/route.ts` is a two-line stub: `POST()` returns `{ok: true}` unconditionally, with no body parsing and no signature verification. Not a live vulnerability today since nothing is implemented, but a red flag for whoever implements it next.
    **Fix:** Whoever wires up a real provider (Stripe, Supabase, etc.) must add signature verification in the same commit that adds payload handling, not as a follow-up. Document this expectation directly in the file as a comment so it isn't missed.

66. `next.config.ts` is the untouched default scaffold: no Content-Security-Policy, no `X-Frame-Options`, no `Strict-Transport-Security`, no `X-Content-Type-Options`.
    **Fix:** Add a `headers()` function to `next.config.ts` returning these via Next's built-in config-level security headers. No new dependency; a documented Next.js pattern.

67. `package.json`'s `test` script is `"echo \"No tests yet\""`, and `.github/workflows/ci.yml` runs only `npm ci` and `npm test` (no `next build` step). Since `npm test` always exits 0 regardless of code correctness, CI currently cannot fail on a real regression; a green check mark carries no signal.
    **Fix, minimum viable:** Add `next build` (or `tsc --noEmit`) as a CI step so type errors and build failures at least fail the pipeline. **Fix, industry standard:** Introduce a real test runner (Vitest, given this is already a Next/TS/Vite-adjacent stack) with at least coverage on the entity actions layer (`src/entities/*/*.ts`), since that is where the soft-delete, cascade-delete, and authorization logic in this document lives and where regressions are least visible from the UI.
