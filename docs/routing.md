# LOL_CODEBASE.md — Findings & Current State

Status of the full codebase audit + remediation is tracked in
`Planned-Fixes.md` and the per-session summaries. This file records the
**current routing/redirect state** so future work doesn't reintroduce
recently fixed behavior.

## Post-login routing (current, temporary by design)

| Role | Destination | Why |
|---|---|---|
| Project Owner / Team | `/projects` (ProjectDashboard feature) | `DEFAULT_PROJECT_REDIRECT` in `../src/features/auth/context/auth_provider.tsx` — **TEMPORARY**: flip to `/dashboard` once the Landing Dashboard is built. |
| Client (`client_id` set) | `/contracts` | **TEMPORARY** until the Client Portal is built. |
| Unknown-role profile | `/projects` (fallback) | Signed-in users are never left stranded on an auth page. |
| Anonymous | `/login` | Middleware (`../src/lib/supabase/proxy.ts`) + root page. |

Redirect implementation notes:

- `../src/features/auth/context/auth_provider.tsx` — post-login redirect is a
  **state-driven effect** on `[user, pathname, isLoading]` (profile always
  resolved before the role decision). The auth listener is used for cache
  invalidation only. `router.replace` (no back-button loop). The old
  `userRef`-based listener redirect (which almost never fired due to a stale
  ref) is gone.
- `../src/app/page.tsx` — root `/` is a **role-aware server redirect**
  (`getUser()` + one profile lookup): clients → `/contracts`, everyone else
  → `/projects`. Matches the client effect exactly. Replaces the old static
  `/login` redirect that bounced signed-in users in a 3-hop chain.
- `src/app/(app)/(workspace)/page.tsx` was deleted: it resolved to `/` and
  conflicted with the root page (and would have crashed reading a
  nonexistent `[projectId]` param).

## Planned views (dev-only placeholder framework)

Views that are planned but not built live behind a dev-only placeholder:

- Registry: `src/shared/lib/plannedViews.ts` (`PLANNED_VIEWS` — add a view
  in two steps: one registry entry + one page).
- Guard: `src/shared/lib/devOnly.ts` `guardDevOnly()` — `notFound()` in
  production builds (same pattern as `/dev/ui`).
- Placeholder UI: `src/shared/ui/PlannedViewPlaceholder.tsx`.
- Hub: `/dev/views` (links every registered view; linked from `/dev/ui`).

| Route | Label | Status |
|---|---|---|
| `/dashboard` | Landing Dashboard | dev-only placeholder |
| `/client` | Client Portal | dev-only placeholder |

## Removed

- **Finance department**: `DEPARTMENT_IDS.FINANCE` and the
  `/insert-finance-page-here/` redirect branch deleted from
  `auth_provider.tsx`; `"FINANCE"` removed from the `Role` union in
  `../src/shared/types/index.ts`. Zero references remain in `../src`.

## Fixed: EditProjectModal client-select crash

`EditProjectModal.tsx` used to prepend a fake `{ label: "Select client...",
value: null }` option and render every option through `opt.value!.toString()` —
crashing the "New Project" form with `can't access property "toString",
opt.value is null`. It was only reachable after the login-redirect fix let
project owners actually land on the dashboard.

Fix (in `src/features/project-manager/ui/modals/EditProjectModal.tsx`):

- The null placeholder option is removed; the empty state is covered by the
  existing `<SelectValue placeholder="Select client..." />`.
- The option render loop skips `value === null` entries and uses
  `String(opt.value)` instead of the lying `!.toString()` assertion.
- Repo-wide: zero `value: null` option sites and zero `value!.toString()`
  sites remain in `../src/features` / `../src/entities`.
