# Dashboard Analytics (Gantt) Integration Plan

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mocked Gantt data layer with real, project-scoped, access-gated server actions, wire the feature into the Project Structure card, and close every review finding (dead code, tests, states) so `src/features/dashboard-analytics` ships.

**Architecture:** The feature UI (reui Gantt wrapper + tabs/pills) is complete and reviewed. Data flows follow the established FSD pattern: entity slices (`entities/phase|module|workflow`) own the Prisma selects + `"use server"` read actions gated by `assertProjectMemberOrClient` (spec: any project profile incl. clients may view read-only); the feature `queries.ts` normalizes payloads into `GanttRowData` and exposes `queryOptions`-based hooks; the route page becomes a thin async server page (issues-page pattern). `MOCK_TODAY` is replaced by the real clock; `lib/schema.ts` becomes the single source of truth for `GanttTab`/`GanttLevel`; `lib/mockData.ts` is deleted. A `Gantt Chart` button (lucide `ChartGantt`) is added to `ProjectAccessCard` in `ProjectStructure.tsx`.

**Tech Stack:** Next.js App Router (server actions), Prisma, TanStack Query v5 (`queryOptions` factory), Zod v4, reui Gantt (vendored), Tailwind v4, vitest.

**Decisions locked with the user (2026-08-15):**
1. Access: **all project profiles incl. clients** (read-only) → `assertProjectMemberOrClient`.
2. Default tab stays **Actual**.
3. Button: **"Gantt Chart" + `ChartGantt` icon** in `ProjectAccessCard`.

**Review findings this plan closes (built-in review, 2 runs):**
- Blocking: mock data through a production route; zero access gating; `MOCK_TODAY` hardcoded.
- Should-fix: dead `lib/schema.ts`; unchecked Tabs cast; FSD violation — entity payload types in a feature file; no tests.
- Nits: `isLoading`/`error` never surfaced; no `end <= start` guard in `getActualRange`; `resource as GanttRowResource` cast (accepted, typed in code).

**DB migration:** none — no schema change (read-only feature). Verified `Phases`/`Modules`/`Workflows` already carry `plan_start_at`/`plan_end_at` NOT NULL + `actual_start_at`/`actual_end_at` nullable, populated by `rollupTicketAncestors` (ticket transactions).

---

## File map

**Create:**
- `src/entities/phase/ganttTypes.ts` — `phaseGanttSelect` + `PhaseGanttPayload` (plain module, NO "use server" — the `use-server-exports` regression test forbids non-async exports there)
- `src/entities/module/ganttTypes.ts` — `moduleGanttSelect` + `ModuleGanttPayload`
- `src/entities/workflow/ganttTypes.ts` — `workflowGanttSelect` + `WorkflowGanttPayload`
- `src/features/dashboard-analytics/lib/ganttMapping.test.ts` — unit tests for the pure mapping layer

**Modify:**
- `src/entities/phase/phaseActions.ts` — append `getProjectPhasesGantt` (+ `z` import)
- `src/entities/module/moduleActions.ts` — append `getProjectModulesGantt` (+ `z` import)
- `src/entities/workflow/workflowActions.ts` — append `getProjectWorkflowsGantt` (`z` already imported)
- `src/entities/phase/index.ts`, `src/entities/module/index.ts`, `src/entities/workflow/index.ts` — re-export `./ganttTypes`
- `src/features/dashboard-analytics/types.ts` — payload types now imported from entities; `GanttTab`/`GanttLevel` re-exported from `./lib/schema`
- `src/features/dashboard-analytics/lib/schema.ts` — export `GanttTab`/`GanttLevel` types; drop `GanttTabInput`/`GanttLevelInput`
- `src/features/dashboard-analytics/queries.ts` — real fetch via entity actions; keep normalize fns; delete mock fetch fns
- `src/features/dashboard-analytics/ui/DashboardAnalyticsPage.tsx` — `today = useState(() => new Date())`; loading + error + retry states
- `src/features/dashboard-analytics/ui/GanttTabs.tsx` — `ganttTabSchema.safeParse` instead of `as GanttTab`
- `src/features/dashboard-analytics/lib/ganttMapping.ts` — `end <= start` guard in `getActualRange`
- `src/features/project-structure/ui/ProjectStructure.tsx` — `onGanttChart` prop + `Gantt Chart` button in `ProjectAccessCard`
- `src/app/(app)/(workspace)/projects/[projectId]/page.tsx` — pass `onGanttChart`
- `src/app/(app)/(workspace)/projects/[projectId]/dashboard-analytics/page.tsx` — convert to thin async server page (issues-page pattern)
- `docs/code-review-plan.md` — flip the new-file checkboxes + record findings (final task)

**Delete:**
- `src/features/dashboard-analytics/lib/mockData.ts` (only importers are `queries.ts` + `DashboardAnalyticsPage`)

---

### Task 0: Baseline verification

- [ ] **Step 1: Confirm a green baseline**

Run: `npx tsc --noEmit`
Expected: exits 0 (note: `projects/[projectId]/contract/page.tsx` has 3 pre-existing `react-hooks/immutability` eslint errors — eslint only; tsc is clean).

Run: `npx vitest run`
Expected: all existing tests pass (currently 37 files / 246 tests).

- [ ] **Step 2: Commit baseline note**

```bash
git add -A && git commit -m "chore: baseline before dashboard-analytics integration" || true
```

---

### Task 1: Entity gantt payload types (plain modules)

**Files:**
- Create: `src/entities/phase/ganttTypes.ts`
- Create: `src/entities/module/ganttTypes.ts`
- Create: `src/entities/workflow/ganttTypes.ts`

- [ ] **Step 1: Create `src/entities/phase/ganttTypes.ts`**

```ts
import type { Prisma } from "@/lib/generated/prisma";

/**
 * Scheduling columns only — the client-side Gantt never needs the full row.
 * Lives in a plain module (NOT "use server"): the use-server-exports
 * regression test forbids non-async exports from directive files.
 */
export const phaseGanttSelect = {
	phase_id: true,
	name: true,
	number: true,
	plan_start_at: true,
	plan_end_at: true,
	actual_start_at: true,
	actual_end_at: true,
} as const;

export type PhaseGanttPayload = Prisma.PhasesGetPayload<{
	select: typeof phaseGanttSelect;
}>;
```

- [ ] **Step 2: Create `src/entities/module/ganttTypes.ts`** (Modules have no `number` column)

```ts
import type { Prisma } from "@/lib/generated/prisma";

/** Scheduling columns only — the client-side Gantt never needs the full row. */
export const moduleGanttSelect = {
	module_id: true,
	name: true,
	plan_start_at: true,
	plan_end_at: true,
	actual_start_at: true,
	actual_end_at: true,
} as const;

export type ModuleGanttPayload = Prisma.ModulesGetPayload<{
	select: typeof moduleGanttSelect;
}>;
```

- [ ] **Step 3: Create `src/entities/workflow/ganttTypes.ts`**

```ts
import type { Prisma } from "@/lib/generated/prisma";

/** Scheduling columns only — the client-side Gantt never needs the full row. */
export const workflowGanttSelect = {
	workflow_id: true,
	name: true,
	number: true,
	plan_start_at: true,
	plan_end_at: true,
	actual_start_at: true,
	actual_end_at: true,
} as const;

export type WorkflowGanttPayload = Prisma.WorkflowsGetPayload<{
	select: typeof workflowGanttSelect;
}>;
```

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add src/entities/phase/ganttTypes.ts src/entities/module/ganttTypes.ts src/entities/workflow/ganttTypes.ts
git commit -m "feat: gantt payload selects for phase/module/workflow entities"
```

---

### Task 2: Entity server actions (project-scoped, member-or-client gated)

**Files:**
- Modify: `src/entities/phase/phaseActions.ts` (append; add `import { z } from "zod"` at top)
- Modify: `src/entities/module/moduleActions.ts` (append; add `import { z } from "zod"` at top)
- Modify: `src/entities/workflow/workflowActions.ts` (append; `z` already imported)
- Modify: `src/entities/phase/index.ts`, `src/entities/module/index.ts`, `src/entities/workflow/index.ts`

- [ ] **Step 1: Append to `src/entities/phase/phaseActions.ts`**

Add to the top imports:
```ts
import { z } from "zod";
```
(add `assertProjectMemberOrClient` to the existing `@/lib/auth/projectAccess` import — it currently imports `assertProjectMemberNotClient, resolvePhaseProject`)
Add at the end of the file:
```ts
/**
 * Project-scoped phase rows for the gantt chart (read-only). Any project
 * profile — team, owners AND clients — may view (2026-08-15 spec).
 */
export async function getProjectPhasesGantt(projectId: string) {
	z.uuid().parse(projectId);
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const phases = await prisma.phases.findMany({
			where: {
				is_deleted: false,
				Stages: { is_deleted: false, project_id: projectId },
			},
			orderBy: [
				{ sort_key: { sort: "asc", nulls: "last" } },
				{ plan_start_at: "asc" },
			],
			select: phaseGanttSelect,
		});
		return { success: true, data: phases };
	} catch (error) {
		console.error("Failed to fetch project phases for gantt:", error);
		return { success: false, error: "Failed to load phases." };
	}
}
```

- [ ] **Step 2: Append to `src/entities/module/moduleActions.ts`**

Add to the top imports:
```ts
import { z } from "zod";
```
(add `assertProjectMemberOrClient` to the existing `@/lib/auth/projectAccess` import)
Add at the end of the file:
```ts
/**
 * Project-scoped module rows for the gantt chart (read-only). Any project
 * profile — team, owners AND clients — may view (2026-08-15 spec).
 */
export async function getProjectModulesGantt(projectId: string) {
	z.uuid().parse(projectId);
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const modules = await prisma.modules.findMany({
			where: {
				is_deleted: false,
				Phases: {
					is_deleted: false,
					Stages: { is_deleted: false, project_id: projectId },
				},
			},
			orderBy: { plan_start_at: "asc" },
			select: moduleGanttSelect,
		});
		return { success: true, data: modules };
	} catch (error) {
		console.error("Failed to fetch project modules for gantt:", error);
		return { success: false, error: "Failed to load modules." };
	}
}
```

- [ ] **Step 3: Append to `src/entities/workflow/workflowActions.ts`**

(add `assertProjectMemberOrClient` to the existing `@/lib/auth/projectAccess` import — it currently imports `assertProjectMember, assertProjectMemberNotClient, resolveModuleProject, resolveWorkflowProject`)
Add at the end of the file:
```ts
/**
 * Project-scoped workflow rows for the gantt chart (read-only). Any project
 * profile — team, owners AND clients — may view (2026-08-15 spec).
 */
export async function getProjectWorkflowsGantt(projectId: string) {
	z.uuid().parse(projectId);
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const workflows = await prisma.workflows.findMany({
			where: {
				is_deleted: false,
				Modules: {
					is_deleted: false,
					Phases: {
						is_deleted: false,
						Stages: { is_deleted: false, project_id: projectId },
					},
				},
			},
			orderBy: [
				{ sort_key: { sort: "asc", nulls: "last" } },
				{ plan_start_at: "asc" },
			],
			select: workflowGanttSelect,
		});
		return { success: true, data: workflows };
	} catch (error) {
		console.error("Failed to fetch project workflows for gantt:", error);
		return { success: false, error: "Failed to load workflows." };
	}
}
```

- [ ] **Step 4: Re-export payload types from the slice public APIs**

`src/entities/phase/index.ts`:
```ts
export * from "./phaseActions";
export * from "./mutations";
export * from "./ganttTypes";
```
`src/entities/module/index.ts`:
```ts
export * from "./moduleActions";
export * from "./mutations";
export * from "./ganttTypes";
```
`src/entities/workflow/index.ts`:
```ts
export * from "./workflowActions";
export * from "./mutations";
export * from "./ganttTypes";
```

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add src/entities/phase src/entities/module src/entities/workflow
git commit -m "feat: gantt read actions gated by assertProjectMemberOrClient"
```

---

### Task 3: Feature types/schema rework (kill FSD violation + dead code)

**Files:**
- Modify: `src/features/dashboard-analytics/lib/schema.ts`
- Modify: `src/features/dashboard-analytics/types.ts`

- [ ] **Step 1: Rewrite `src/features/dashboard-analytics/lib/schema.ts`** (single source of truth for the tab/level unions)

```ts
import { z } from "zod";

/** Validates the Planned/Actual tab filter (Tabs onValueChange is a string). */
export const ganttTabSchema = z.enum(["planned", "actual"]);

/** Validates the Phases/Modules/Workflows sub-filter pill selection. */
export const ganttLevelSchema = z.enum(["phases", "modules", "workflows"]);

export type GanttTab = z.infer<typeof ganttTabSchema>;
export type GanttLevel = z.infer<typeof ganttLevelSchema>;
```

- [ ] **Step 2: Rewrite `src/features/dashboard-analytics/types.ts`** (payload types move to entities; tab/level types from schema)

```ts
export type { GanttLevel, GanttTab } from "./lib/schema";
export type { ModuleGanttPayload } from "@/entities/module";
export type { PhaseGanttPayload } from "@/entities/phase";
export type { WorkflowGanttPayload } from "@/entities/workflow";

export type GanttRowStatus = "completed" | "in_progress" | "upcoming";

/**
 * Normalized row shape the Gantt mapping layer consumes. Phases, Modules and
 * Workflows all carry the same four scheduling columns in Prisma; each level's
 * fetch function projects its own id/name field into this shape so the
 * mapping + rendering code stays level-agnostic.
 */
export interface GanttRowData {
	id: string;
	title: string;
	/** Phases/Workflows carry a display number; Modules don't. */
	number: number | null;
	plan_start_at: Date;
	plan_end_at: Date;
	actual_start_at: Date | null;
	actual_end_at: Date | null;
}

/** Consumer payload carried on each reui GanttEvent for this feature. */
export interface GanttBarEventData {
	tab: GanttTab;
	status: GanttRowStatus;
}
```

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0 (feature `index.ts` still exports `GanttLevel`/`GanttTab` — unchanged public API).

```bash
git add src/features/dashboard-analytics/lib/schema.ts src/features/dashboard-analytics/types.ts
git commit -m "refactor: payload types to entities, schema.ts owns GanttTab/GanttLevel"
```

---

### Task 4: Real data layer in feature queries + delete mocks

**Files:**
- Modify: `src/features/dashboard-analytics/queries.ts`
- Delete: `src/features/dashboard-analytics/lib/mockData.ts`

- [ ] **Step 1: Rewrite `src/features/dashboard-analytics/queries.ts`**

```ts
"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { getProjectModulesGantt } from "@/entities/module";
import { getProjectPhasesGantt } from "@/entities/phase";
import { getProjectWorkflowsGantt } from "@/entities/workflow";
import { dashboardAnalyticsKeys } from "@/shared/query/keys";
import type { GanttRowData, ModuleGanttPayload, PhaseGanttPayload, WorkflowGanttPayload } from "./types";

// ── Normalization: each level's id/name column flattens into GanttRowData ──
// Actual dates are rolled up server-side by rollupTicketAncestors
// (src/entities/ticket/lib/dateRollup.ts), so the client reads the columns
// directly — it never re-derives them from ticketHistory.

function normalizePhase(phase: PhaseGanttPayload): GanttRowData {
	return {
		id: phase.phase_id,
		title: phase.name,
		number: phase.number,
		plan_start_at: phase.plan_start_at,
		plan_end_at: phase.plan_end_at,
		actual_start_at: phase.actual_start_at,
		actual_end_at: phase.actual_end_at,
	};
}

function normalizeModule(module_: ModuleGanttPayload): GanttRowData {
	return {
		id: module_.module_id,
		title: module_.name,
		number: null,
		plan_start_at: module_.plan_start_at,
		plan_end_at: module_.plan_end_at,
		actual_start_at: module_.actual_start_at,
		actual_end_at: module_.actual_end_at,
	};
}

function normalizeWorkflow(workflow: WorkflowGanttPayload): GanttRowData {
	return {
		id: workflow.workflow_id,
		title: workflow.name,
		number: workflow.number,
		plan_start_at: workflow.plan_start_at,
		plan_end_at: workflow.plan_end_at,
		actual_start_at: workflow.actual_start_at,
		actual_end_at: workflow.actual_end_at,
	};
}

// ============ QUERY HOOKS ============

const dashboardAnalyticsQueryOptions = {
	phases: (projectId: string) =>
		queryOptions({
			queryKey: dashboardAnalyticsKeys.phases(projectId),
			queryFn: async () => {
				const result = await getProjectPhasesGantt(projectId);
				if (!result.success) return [];
				return result.data.map(normalizePhase);
			},
			enabled: !!projectId,
		}),
	modules: (projectId: string) =>
		queryOptions({
			queryKey: dashboardAnalyticsKeys.modules(projectId),
			queryFn: async () => {
				const result = await getProjectModulesGantt(projectId);
				if (!result.success) return [];
				return result.data.map(normalizeModule);
			},
			enabled: !!projectId,
		}),
	workflows: (projectId: string) =>
		queryOptions({
			queryKey: dashboardAnalyticsKeys.workflows(projectId),
			queryFn: async () => {
				const result = await getProjectWorkflowsGantt(projectId);
				if (!result.success) return [];
				return result.data.map(normalizeWorkflow);
			},
			enabled: !!projectId,
		}),
};

export function usePhasesGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.phases(projectId));
}

export function useModulesGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.modules(projectId));
}

export function useWorkflowsGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.workflows(projectId));
}
```

- [ ] **Step 2: Delete `src/features/dashboard-analytics/lib/mockData.ts`**

```bash
git rm src/features/dashboard-analytics/lib/mockData.ts
```

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0 (the only other `MOCK_TODAY` importer, `DashboardAnalyticsPage.tsx`, still references it — it is fixed in Task 5; if tsc fails ONLY on that import, that is expected until Task 5).

```bash
git add src/features/dashboard-analytics/queries.ts
git commit -m "feat: real gantt data via entity actions (mocks removed)"
```
(commit `git rm` deletion together with Task 5's page fix, or here with `git add -A src/features/dashboard-analytics` — see Task 5 Step 2.)

---

### Task 5: Real clock + loading/error states on the page

**Files:**
- Modify: `src/features/dashboard-analytics/ui/DashboardAnalyticsPage.tsx`

- [ ] **Step 1: Rewrite `src/features/dashboard-analytics/ui/DashboardAnalyticsPage.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useModulesGantt, usePhasesGantt, useWorkflowsGantt } from "../queries";
import type { GanttLevel, GanttRowData, GanttTab } from "../types";
import { GanttTabs } from "./GanttTabs";
import { LevelFilterPills } from "./LevelFilterPills";
import { ProjectGanttChart } from "./ProjectGanttChart";

const TAB_COPY: Record<GanttTab, { title: string; description: string }> = {
	planned: {
		title: "Planned Gantt Chart",
		description:
			"The Planned Gantt chart displays the scheduled timeline of a project, showing when each task is intended to start and finish before work begins. It helps teams visualize task durations and deadlines, making it easier to plan resources and track progress against the original schedule.",
	},
	actual: {
		title: "Actual Gantt Chart",
		description:
			"The actual Gantt chart shows the real progress of a project by displaying when tasks actually started, finished, or are currently in progress. It provides an accurate timeline of completed and ongoing work, allowing teams to monitor the current status of the project.",
	},
};

const LEVEL_LABEL: Record<GanttLevel, string> = {
	phases: "Phases",
	modules: "Modules",
	workflows: "Workflows",
};

export function DashboardAnalyticsPage({ projectId }: { projectId: string }) {
	const [tab, setTab] = useState<GanttTab>("actual");
	const [level, setLevel] = useState<GanttLevel>("phases");
	// Real clock: the nowIndicator and in-progress bar ends must track "now",
	// not a frozen mock date.
	const [today] = useState(() => new Date());

	const phasesQuery = usePhasesGantt(projectId);
	const modulesQuery = useModulesGantt(projectId);
	const workflowsQuery = useWorkflowsGantt(projectId);

	const queryByLevel = {
		phases: phasesQuery,
		modules: modulesQuery,
		workflows: workflowsQuery,
	} satisfies Record<GanttLevel, { data?: GanttRowData[]; isPending: boolean; isError: boolean; refetch: () => unknown }>;

	const activeQuery = queryByLevel[level];
	const rows = activeQuery.data ?? [];
	const copy = TAB_COPY[tab];

	return (
		<div className="flex flex-1 flex-col gap-6">
			<div className="mb-6">
				<h1>Dashboard Analytics</h1>
				<p className="subtitle">
					Track project timelines and progress across phases, modules, and workflows.
				</p>
			</div>

			<div className="rounded-md border border-border bg-card p-6">
				<GanttTabs value={tab} onValueChange={setTab} />

				<section className="mt-5 flex flex-col gap-5">
					<div>
						<h3>{copy.title}</h3>
						<p className="subtitle">{copy.description}</p>
					</div>

					<div className="flex justify-end">
						<LevelFilterPills value={level} onValueChange={setLevel} />
					</div>

					{activeQuery.isPending ? (
						<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
							Loading {LEVEL_LABEL[level].toLowerCase()} timeline…
						</div>
					) : activeQuery.isError ? (
						<div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
							<p>Failed to load {LEVEL_LABEL[level].toLowerCase()} for this project.</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void activeQuery.refetch()}
							>
								Retry
							</Button>
						</div>
					) : (
						<ProjectGanttChart rows={rows} tab={tab} level={level} today={today} />
					)}
				</section>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit (includes the `git rm` of mockData from Task 4)**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add -A src/features/dashboard-analytics
git commit -m "feat: gantt page uses real clock + loading/error states; mocks deleted"
```

---

### Task 6: Cast fix + range guard (TDD)

**Files:**
- Modify: `src/features/dashboard-analytics/ui/GanttTabs.tsx`
- Modify: `src/features/dashboard-analytics/lib/ganttMapping.ts`
- Create: `src/features/dashboard-analytics/lib/ganttMapping.test.ts`

- [ ] **Step 1: Fix the unchecked cast in `src/features/dashboard-analytics/ui/GanttTabs.tsx`**

Replace the `Tabs` onValueChange handler (currently `(next) => onValueChange(next as GanttTab)`):
```tsx
import { ganttTabSchema } from "../lib/schema";
```
```tsx
<Tabs
	value={value}
	onValueChange={(next) => {
		const parsed = ganttTabSchema.safeParse(next);
		if (parsed.success) onValueChange(parsed.data);
	}}
>
```

- [ ] **Step 2: Add the degenerate-range guard to `src/features/dashboard-analytics/lib/ganttMapping.ts`**

Replace `getActualRange`:
```ts
/**
 * Actual range is null until the row has actually started. An in-progress
 * row (actual_end_at not yet set) draws through `now` so the bar visibly
 * keeps growing until it's marked done. Degenerate ranges (end <= start —
 * e.g. an in-progress row whose start is in the future) are skipped: reui
 * requires end > start.
 */
export function getActualRange(
	row: GanttRowData,
	now: Date,
): { start: Date; end: Date } | null {
	if (!row.actual_start_at) return null;
	const start = row.actual_start_at;
	const end = row.actual_end_at ?? now;
	if (end <= start) return null;
	return { start, end };
}
```

- [ ] **Step 3: Write the failing test — `src/features/dashboard-analytics/lib/ganttMapping.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
	buildGanttEvents,
	buildGanttResources,
	deriveRowStatus,
	getActualRange,
	getPlannedRange,
	statusColorToken,
} from "./ganttMapping";
import type { GanttRowData } from "../types";

function makeRow(overrides: Partial<GanttRowData> = {}): GanttRowData {
	return {
		id: "11111111-1111-1111-1111-111111111111",
		title: "Discovery",
		number: 1,
		plan_start_at: new Date("2026-07-01T00:00:00.000Z"),
		plan_end_at: new Date("2026-07-18T00:00:00.000Z"),
		actual_start_at: null,
		actual_end_at: null,
		...overrides,
	};
}

const NOW = new Date("2026-08-11T12:00:00.000Z");

describe("deriveRowStatus", () => {
	it("returns completed when actual_end_at is set", () => {
		expect(
			deriveRowStatus(makeRow({ actual_start_at: NOW, actual_end_at: NOW })),
		).toBe("completed");
	});

	it("returns in_progress when only actual_start_at is set", () => {
		expect(deriveRowStatus(makeRow({ actual_start_at: NOW }))).toBe("in_progress");
	});

	it("returns upcoming when no actual dates exist", () => {
		expect(deriveRowStatus(makeRow())).toBe("upcoming");
	});
});

describe("statusColorToken", () => {
	it("maps completed to a green-derived token", () => {
		expect(statusColorToken("completed")).toContain("--color-green-500");
	});

	it("maps in_progress to a primary-derived token", () => {
		expect(statusColorToken("in_progress")).toContain("--color-primary");
	});

	it("maps upcoming to the muted-foreground token", () => {
		expect(statusColorToken("upcoming")).toBe("var(--muted-foreground)");
	});
});

describe("getPlannedRange", () => {
	it("returns the plan dates", () => {
		const row = makeRow();
		expect(getPlannedRange(row)).toEqual({
			start: row.plan_start_at,
			end: row.plan_end_at,
		});
	});
});

describe("getActualRange", () => {
	it("returns null when the row never started", () => {
		expect(getActualRange(makeRow(), NOW)).toBeNull();
	});

	it("extends an in-progress row through now", () => {
		const start = new Date("2026-08-04T00:00:00.000Z");
		expect(getActualRange(makeRow({ actual_start_at: start }), NOW)).toEqual({
			start,
			end: NOW,
		});
	});

	it("uses actual_end_at for finished rows", () => {
		const start = new Date("2026-07-01T00:00:00.000Z");
		const end = new Date("2026-07-20T00:00:00.000Z");
		expect(getActualRange(makeRow({ actual_start_at: start, actual_end_at: end }), NOW)).toEqual({
			start,
			end,
		});
	});

	it("skips degenerate ranges where end <= start (future in-progress start)", () => {
		const start = new Date("2026-09-01T00:00:00.000Z"); // after NOW
		expect(getActualRange(makeRow({ actual_start_at: start }), NOW)).toBeNull();
	});
});

describe("buildGanttResources", () => {
	it("maps rows to resources with status-colored badges", () => {
		const resources = buildGanttResources([
			makeRow({ id: "r1", number: 3, actual_start_at: NOW }),
		]);
		expect(resources[0]).toMatchObject({
			id: "r1",
			title: "Discovery",
			number: 3,
		});
		expect(resources[0].color).toContain("--color-primary");
	});
});

describe("buildGanttEvents", () => {
	it("builds planned events from plan dates for every row", () => {
		const events = buildGanttEvents([makeRow({ id: "r1" })], "planned", NOW);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			id: "r1-planned",
			resourceId: "r1",
			readOnly: true,
			draggable: false,
			resizable: false,
			data: { tab: "planned", status: "upcoming" },
		});
		expect(events[0].start).toEqual(new Date("2026-07-01T00:00:00.000Z"));
	});

	it("skips rows without actual dates on the actual tab", () => {
		const events = buildGanttEvents([makeRow({ id: "r1" })], "actual", NOW);
		expect(events).toHaveLength(0);
	});

	it("draws in-progress rows through now on the actual tab", () => {
		const start = new Date("2026-08-04T00:00:00.000Z");
		const events = buildGanttEvents(
			[makeRow({ id: "r1", actual_start_at: start })],
			"actual",
			NOW,
		);
		expect(events).toHaveLength(1);
		expect(events[0].id).toBe("r1-actual");
		expect(events[0].end).toEqual(NOW);
		expect(events[0].data).toEqual({ tab: "actual", status: "in_progress" });
	});

	it("skips degenerate actual ranges entirely", () => {
		const start = new Date("2026-09-01T00:00:00.000Z");
		const events = buildGanttEvents(
			[makeRow({ id: "r1", actual_start_at: start })],
			"actual",
			NOW,
		);
		expect(events).toHaveLength(0);
	});
});
```

- [ ] **Step 4: Run the test — verify the degenerate-range cases fail**

Run: `npx vitest run src/features/dashboard-analytics/lib/ganttMapping.test.ts`
Expected: 4 failures — `skips degenerate ranges where end <= start` + `skips degenerate actual ranges entirely` (the guard is not implemented yet) and any compile errors from the new `getActualRange` behavior; all other cases pass.

- [ ] **Step 5: Run again — verify all pass**

Run: `npx vitest run src/features/dashboard-analytics/lib/ganttMapping.test.ts`
Expected: all 14 tests pass (guard from Step 2 now in place).

- [ ] **Step 6: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add src/features/dashboard-analytics/ui/GanttTabs.tsx src/features/dashboard-analytics/lib/ganttMapping.ts src/features/dashboard-analytics/lib/ganttMapping.test.ts
git commit -m "fix: gantt tab cast validated via zod; degenerate ranges skipped (+14 tests)"
```

---

### Task 7: Gantt Chart button in ProjectAccessCard

**Files:**
- Modify: `src/features/project-structure/ui/ProjectStructure.tsx`
- Modify: `src/app/(app)/(workspace)/projects/[projectId]/page.tsx`

- [ ] **Step 1: Add the `ChartGantt` icon to the lucide import in `ProjectStructure.tsx`**

Add `ChartGantt` to the existing lucide-react import block (next to `Bug`, `BarChart2`, …).

- [ ] **Step 2: Add `onGanttChart` to `ProjectStructureProps`**

```ts
interface ProjectStructureProps {
	projectId?: string;
	onViewContract?: () => void;
	onCredentialsRepo?: () => void;
	onIssueReport?: () => void;
	onGanttChart?: () => void;
}
```

- [ ] **Step 3: Thread the prop through `ProjectAccessCard`**

Signature:
```ts
function ProjectAccessCard({
	projectId,
	onViewContract,
	onCredentialsRepo,
	onIssueReport,
	onGanttChart,
}: {
	projectId?: string;
	onViewContract?: () => void;
	onCredentialsRepo?: () => void;
	onIssueReport?: () => void;
	onGanttChart?: () => void;
}) {
```

Handler (next to the other three):
```ts
const handleGanttChart =
	onGanttChart ??
	(() => {
		if (projectId) router.push(`/projects/${projectId}/dashboard-analytics`);
	});
```

Button (after the Issue Reporting button, same styling):
```tsx
<Button
	size="sm"
	onClick={handleGanttChart}
	variant="outline"
	className="h-8 justify-start gap-2 text-xs"
>
	<ChartGantt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
	Gantt Chart
</Button>
```

- [ ] **Step 4: Thread the prop through the main component**

`ProjectStructure` signature gains `onGanttChart` and it is passed to `<ProjectAccessCard onGanttChart={onGanttChart} />`.

- [ ] **Step 5: Wire the route in `src/app/(app)/(workspace)/projects/[projectId]/page.tsx`**

Add to the `<ProjectStructure …>` props:
```tsx
onGanttChart={() => router.push(`/projects/${projectId}/dashboard-analytics`)}
```

- [ ] **Step 6: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add src/features/project-structure/ui/ProjectStructure.tsx "src/app/(app)/(workspace)/projects/[projectId]/page.tsx"
git commit -m "feat: Gantt Chart button in project access card"
```

---

### Task 8: Route page → thin async server page

**Files:**
- Modify: `src/app/(app)/(workspace)/projects/[projectId]/dashboard-analytics/page.tsx`

- [ ] **Step 1: Rewrite the route page**

```tsx
import { DashboardAnalyticsPage } from "@/features/dashboard-analytics";

interface PageParams {
	projectId: string;
}

export default async function DashboardAnalyticsRoute({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <DashboardAnalyticsPage projectId={projectId} />;
}
```

(Matches the issues-page pattern; access enforcement stays in the gated entity actions, which is the established convention for all project pages.)

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add "src/app/(app)/(workspace)/projects/[projectId]/dashboard-analytics/page.tsx"
git commit -m "refactor: gantt route page reads async params (issues-page pattern)"
```

---

### Task 9: Full verification

- [ ] **Step 1: Prisma schema + client**

Run: `npx prisma validate`
Expected: `Schema is valid` (no schema change — read-only feature).

Run: `npx prisma generate` (regenerates the client; required by `npm run build`)
Expected: exits 0.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Tests**

Run: `npx vitest run`
Expected: all pass — previous 37 files / 246 tests + the new `ganttMapping.test.ts` (14 tests) = 38 files / 260 tests.

- [ ] **Step 4: Lint**

Run: `npx eslint src/entities/phase src/entities/module src/entities/workflow src/features/dashboard-analytics src/features/project-structure "src/app/(app)/(workspace)/projects/[projectId]" src/shared/query`
Expected: 0 errors (known pre-existing eslint errors live only in `projects/[projectId]/contract/page.tsx`, which is NOT in this scope).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: `Compiled successfully` — the gantt route + feature bundle.

- [ ] **Step 6: Commit any verification fixes**

```bash
git add -A && git commit -m "chore: verification fixes" || true
```

---

### Task 10: Update docs/code-review-plan.md

**Files:**
- Modify: `docs/code-review-plan.md`

- [ ] **Step 1: Mark the reviewed feature files**

In section 10, flip these entries to `[x]` with the review summary (2026-08-15), matching the file's established annotation style:

- `src/features/dashboard-analytics/index.ts`
- `src/features/dashboard-analytics/types.ts`
- `src/features/dashboard-analytics/queries.ts`
- `src/features/dashboard-analytics/lib/ganttMapping.ts`
- `src/features/dashboard-analytics/lib/ganttMapping.test.ts` (new)
- `src/features/dashboard-analytics/lib/mockData.ts` (deleted)
- `src/features/dashboard-analytics/lib/schema.ts`
- `src/features/dashboard-analytics/ui/DashboardAnalyticsPage.tsx`
- `src/features/dashboard-analytics/ui/EmptyGanttState.tsx`
- `src/features/dashboard-analytics/ui/GanttBarContent.tsx`
- `src/features/dashboard-analytics/ui/GanttResourceLabel.tsx`
- `src/features/dashboard-analytics/ui/GanttTabs.tsx`
- `src/features/dashboard-analytics/ui/LevelFilterPills.tsx`
- `src/features/dashboard-analytics/ui/ProjectGanttChart.tsx`

In section 11, flip:
- `src/app/(app)/(workspace)/projects/[projectId]/dashboard-analytics/page.tsx`

- [ ] **Step 2: Record the integration in the follow-ups section**

Add a checked entry (style of the existing stage-editor/ticket-board entries):
```
- [x] **Dashboard-analytics integration (2026-08-15)** — ALL items below completed and
      verified in **`docs/reasonix/plans/2026-08-15-dashboard-analytics-integration.md`**:
  - [x] **Real data layer** — `getProjectPhasesGantt` / `getProjectModulesGantt` /
        `getProjectWorkflowsGantt` server actions in the entity slices (project-scoped
        relation filters, `sort_key`+`plan_start_at` ordering), gated by
        `assertProjectMemberOrClient` (spec: any project profile incl. clients, read-only);
        payload selects/types moved from the feature to `entities/*/ganttTypes.ts` (FSD —
        payloads must not live in a feature; also kept OUT of "use server" files per the
        use-server-exports regression test).
  - [x] **Mocks removed** — `lib/mockData.ts` deleted; `MOCK_TODAY` → real `new Date()`
        clock (`useState(() => new Date())`); `queries.ts` calls the entity actions and
        normalizes (`{success:false}` → `[]`).
  - [x] **Access gating** — every read is server-gated (`assertProjectMemberOrClient`);
        route page converted to the thin async-params server page (issues-page pattern).
  - [x] **Dead code / cast fixes** — `lib/schema.ts` now the single source of truth for
        `GanttTab`/`GanttLevel` (types re-exported from it); `GanttTabs` validates
        `onValueChange` with `ganttTabSchema.safeParse` (cast removed).
  - [x] **States** — loading skeleton + error banner with Retry on the page.
  - [x] **Range guard** — `getActualRange` skips degenerate `end <= start` ranges.
  - [x] **Button** — "Gantt Chart" (`ChartGantt` icon) added to `ProjectAccessCard`
        (View Contract / Project Variables / Issue Reporting card) →
        `/projects/[projectId]/dashboard-analytics`.
  - [x] **Tests** — `ganttMapping.test.ts`: 14 tests (deriveRowStatus, statusColorToken,
        ranges incl. degenerate, resources, planned/actual events).
  - [x] **Verification** — prisma validate ✓, tsc ✓, vitest 38 files / 260 tests ✓,
        eslint on touched dirs ✓, `npm run build` ✓. No schema change.
```

- [ ] **Step 3: Commit**

```bash
git add docs/code-review-plan.md
git commit -m "docs: dashboard-analytics review + integration signed off"
```

---

## Self-Review

**Spec coverage:**
1. "Any profile part of the project can access the project's gantt chart" → Task 2 (`assertProjectMemberOrClient` on all three reads) + Task 8 (route). ✓
2. "Gantt button in the card with View Contract / Project Variables / Issue Reporting" → Task 7 (`ProjectAccessCard`). ✓
3. "Analysis + review + integration plans" → this document; review findings each mapped to a task (mock data → Task 4; gating → Tasks 2+8; MOCK_TODAY → Task 5; schema.ts dead → Task 3; cast → Task 6; payload FSD violation → Tasks 1-3; tests → Task 6; states → Task 5; range guard → Task 6). ✓
4. "Update the markdown" → Task 10. ✓

**Placeholder scan:** no TBD/TODO stubs; every code step contains full code; every command has expected output. ✓

**Type consistency:** `getProjectPhasesGantt`/`getProjectModulesGantt`/`getProjectWorkflowsGantt` return `{ success: true, data: XPayload[] } | { success: false, error: string }` — matches `getProjectStages` convention; hook consumers map `result.data` (Task 4). `GanttTab`/`GanttLevel` now come from `schema.ts` and are re-exported from `types.ts` and the feature `index.ts` — public API unchanged (`GanttLevel, GanttTab, DashboardAnalyticsPage`). `today` prop threading consistent across Tasks 5-6. ✓

**Edge cases:** empty level (no rows) → `EmptyGanttState` unchanged; actual tab before any start → no events → empty chart body with resource labels (existing mapping behavior, now guarded); non-member → action returns `{success:false}` → `[]` → empty state (no data leak); anonymous → same. ✓

---

## Execution notes (2026-08-15, inline execution on `manual-fixes`)

All tasks executed and committed: `692da9d` → `63c0f00` (9 commits). Verification results:
- `npx prisma validate` ✓ — schema valid (no schema change).
- `npx prisma generate` ✓.
- `npx tsc --noEmit` ✓ (after adding `success: true/false as const` to the three gantt actions — required for discriminated-union narrowing of `result.data`; matches the `getProjectStages` convention).
- `npx vitest run` ✓ — 43 files / 285 tests (baseline 42/269 + 16 new ganttMapping tests).
- `npx eslint` on all touched dirs ✓ — 0 errors, 0 warnings (fixed one unused `GanttLevel` import in types.ts).
- `npm run build` — **blocked by a PRE-EXISTING failure**, verified identical at the pre-change baseline commit `ce76417` (throwaway worktree): the `/analytics` stub page fails static prerender because the `(app)` layout reads `cookies` (`getCurrentUserId`) and uses `useSearchParams` without a Suspense boundary. Files untouched by this integration; `src/app/(app)/(workspace)/analytics/page.tsx` remains unchecked in review-plan section 11. Suggested one-line fix (separate task, not applied here): `export const dynamic = "force-dynamic"` on the `/analytics` page.
- Plan deviations: Task 0 baseline commit skipped (working tree carried unrelated user changes); Task 4's mock deletion committed together with the queries rewrite (30083bf) instead of with Task 5; Task 6 guard landed before its tests (same commit d643071) — all 16 tests still verify the guard.
