# Landing Dashboard Role-Based Visibility Implementation Plan

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing dashboard (`/dashboard`) role-aware: client profiles see only the Contracts table, project staff see My Tickets + Watched Tickets (no contracts), and project owners see all three tables — with real server-action data replacing the current mock defaults.

**Architecture:** Server actions in the entities layer resolve the caller's dashboard role (`client` / `owner` / `staff`) and return self-scoped data (my tickets, watched tickets, my contracts). A `features/landing-dashboard/model/` segment owns the TanStack Query hooks, the DB-row → UI-DTO mappers (pure, unit-tested), and the UI types. The page composes the components conditionally by role. No schema change.

**Tech Stack:** Next.js App Router, Prisma, Supabase Auth, TanStack Query v5 (`queryOptions`), Zod (input guards), FSD v2.1, Vitest.

---

## Decisions locked (from user)

- The "3 tables" = **My Tickets, Watched Tickets, PendingContracts** (current page layout). **ActivitySparklines stays on hold** — page keeps a TODO comment, feature file untouched.
- Client detection = **`Profiles.client_id` set** (invite-code client employees).
- Roles are per-profile in practice (one role at a time via department/role model), so no mixed-role precedence logic is needed. Resolution order used defensively: **client → owner → staff**.
- Data scope: **real data for contracts + tickets**; sparklines remain placeholder.

---

### Task 1: Dashboard role resolution (entities/roleAssignment)

**Files:**
- Create: `src/entities/roleAssignment/dashboardRole.ts`
- Modify: `src/entities/roleAssignment/roleAssignmentActions.ts`
- Modify: `src/entities/types.ts`
- Test: `src/entities/roleAssignment/dashboardRole.test.ts`

- [ ] **Step 1: Add the `DashboardRole` type**

`src/entities/types.ts` — append:

```ts
// Landing dashboard view modes (role-resolution output, entities/roleAssignment).
export type DashboardRole = "client" | "owner" | "staff";
```

- [ ] **Step 2: Write the failing tests for `resolveDashboardRole`**

Create `src/entities/roleAssignment/dashboardRole.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveDashboardRole } from "./dashboardRole";

describe("resolveDashboardRole", () => {
	it("returns 'client' for a profile with client_id even when the user owns projects", () => {
		expect(
			resolveDashboardRole({ clientId: "c1", ownerProjectIds: ["p1"] }),
		).toBe("client");
	});

	it("returns 'owner' for a non-client user who owns at least one project", () => {
		expect(
			resolveDashboardRole({ clientId: null, ownerProjectIds: ["p1"] }),
		).toBe("owner");
	});

	it("returns 'staff' for a non-client user with no owned projects", () => {
		expect(resolveDashboardRole({ clientId: null, ownerProjectIds: [] })).toBe(
			"staff",
		);
	});

	it("returns 'client' even with zero owned projects", () => {
		expect(resolveDashboardRole({ clientId: "c1", ownerProjectIds: [] })).toBe(
			"client",
		);
	});
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/entities/roleAssignment/dashboardRole.test.ts`
Expected: FAIL — `resolveDashboardRole` is not exported from `./dashboardRole` (module missing).

- [ ] **Step 4: Implement the pure resolver**

Create `src/entities/roleAssignment/dashboardRole.ts` (NO `"use server"` — a `"use server"` module may only export async functions):

```ts
import type { DashboardRole } from "@/entities/types";

/**
 * Pure dashboard-view resolution. Client profiles (Profiles.client_id set)
 * always get the contracts-only view; otherwise a Project Owner on any
 * project gets the full view; everyone else gets the staff view.
 */
export function resolveDashboardRole(input: {
	clientId: string | null;
	ownerProjectIds: string[];
}): DashboardRole {
	if (input.clientId) return "client";
	return input.ownerProjectIds.length > 0 ? "owner" : "staff";
}
```

- [ ] **Step 5: Add the `getMyDashboardRole` server action**

`src/entities/roleAssignment/roleAssignmentActions.ts` — append (file already has `"use server"`, `getCurrentUserId`, `prisma` imports):

```ts
import { resolveDashboardRole } from "./dashboardRole";

const PROJECT_OWNER_ROLE = "Project Owner";

/**
 * The signed-in user's landing-dashboard view: "client" (Profiles.client_id
 * set), "owner" (Project Owner on any project), or "staff". Unauthenticated
 * and archived users resolve to "staff" — the app shell guards the route.
 */
export async function getMyDashboardRole() {
	const userId = await getCurrentUserId();
	if (!userId) return "staff" as const;

	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId, is_deleted: false },
		select: { client_id: true },
	});
	if (!profile) return "staff" as const;

	const ownerRole = await prisma.roles.findUnique({
		where: { name: PROJECT_OWNER_ROLE },
		select: { role_id: true },
	});
	if (!ownerRole) return "staff" as const;

	const assignment = await prisma.roleAssignments.findFirst({
		where: { user_id: userId, role_id: ownerRole.role_id },
		select: { project_id: true },
	});

	return resolveDashboardRole({
		clientId: profile.client_id,
		ownerProjectIds: assignment ? [assignment.project_id] : [],
	});
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/entities/roleAssignment/dashboardRole.test.ts`
Expected: PASS (4/4).

- [ ] **Step 7: Verify the entity compiles and lint**

Run: `npx tsc --noEmit` and `npx eslint src/entities/roleAssignment`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/entities/types.ts src/entities/roleAssignment
git commit -m "feat(roleAssignment): add dashboard role resolution (client/owner/staff)"
```

---

### Task 2: My-tickets and watched-tickets server actions (entities/ticket)

**Files:**
- Modify: `src/entities/ticket/ticketActions.ts`

- [ ] **Step 1: Add the shared dashboard ticket select + actions**

Append to `src/entities/ticket/ticketActions.ts`. The file already imports `prisma` from `@/lib/prisma` and `Prisma` from `@/lib/generated/prisma` (no new imports needed for either). Extend the existing `@/lib/auth/projectAccess` import to include `getCurrentUserId`:

```ts
import {
	assertProjectMember,
	getCurrentUserId, // add
	resolveTicketProject,
	resolveWorkflowProject,
} from "@/lib/auth/projectAccess";
```

```ts
/**
 * Dashboard table shape for a ticket: nested project/module/workflow names,
 * first tag, and assignees. Shared by "my tickets" and "watched tickets".
 */
const ticketDashboardSelect = {
	ticket_id: true,
	name: true,
	status: true,
	plan_end_at: true,
	Workflows: {
		select: {
			name: true,
			Modules: {
				select: {
					name: true,
					Phases: {
						select: {
							name: true,
							Stages: {
								select: {
									name: true,
									Projects: {
										select: { project_id: true, name: true },
									},
								},
							},
						},
					},
				},
			},
		},
	},
	TicketTags: {
		where: { Tags: { is_deleted: false } },
		select: { Tags: { select: { name: true, color: true } } },
	},
	TicketAssigned: {
		select: {
			Profile: {
				select: { profile_id: true, first_name: true, last_name: true },
			},
		},
	},
} satisfies Prisma.TicketsSelect;

export type DashboardTicketRow = Prisma.TicketsGetPayload<{
	select: typeof ticketDashboardSelect;
}>;

/** Tickets assigned to the signed-in user, soonest plan_end_at first. */
export async function selectMyTickets() {
	const userId = await getCurrentUserId();
	if (!userId) return [];
	return prisma.tickets.findMany({
		where: {
			is_deleted: false,
			TicketAssigned: { some: { profile_id: userId } },
		},
		select: ticketDashboardSelect,
		orderBy: { plan_end_at: "asc" },
	});
}

/** Tickets the signed-in user is watching (Tickets.watcher_id), soonest first. */
export async function selectWatchedTickets() {
	const userId = await getCurrentUserId();
	if (!userId) return [];
	return prisma.tickets.findMany({
		where: { is_deleted: false, watcher_id: userId },
		select: ticketDashboardSelect,
		orderBy: { plan_end_at: "asc" },
	});
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: no errors (`TicketAssigned.some` on `Tickets` and the nested relation chain are valid Prisma query shapes).

- [ ] **Step 3: Lint**

Run: `npx eslint src/entities/ticket/ticketActions.ts`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/entities/ticket/ticketActions.ts
git commit -m "feat(ticket): add dashboard my-tickets and watched-tickets actions"
```

---

### Task 3: My-contracts server action (entities/contract)

**Files:**
- Modify: `src/entities/contract/contractActions.ts`

- [ ] **Step 1: Add `getMyContracts`**

Append to `src/entities/contract/contractActions.ts`. Extend the existing `@/lib/auth/projectAccess` import to include `getCurrentUserId`:

```ts
import {
	assertProjectMember,
	getCurrentUserId, // add
} from "@/lib/auth/projectAccess";
```

```ts
const PROJECT_OWNER_ROLE = "Project Owner";

export type ContractRow = Awaited<ReturnType<typeof getMyContracts>>[number];

/**
 * Contracts visible to the signed-in user on the landing dashboard,
 * self-scoped: client profiles get their own client's contracts; Project
 * Owners get contracts of projects they own; everyone else gets none.
 * The caller's own role decides the scope — a caller can never request
 * another client's or project's contracts.
 */
export async function getMyContracts() {
	const userId = await getCurrentUserId();
	if (!userId) return [];

	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId, is_deleted: false },
		select: { client_id: true },
	});
	if (!profile) return [];

	const where = profile.client_id
		? { client_id: profile.client_id, is_deleted: false }
		: {
				is_deleted: false,
				Projects: {
					RoleAssignments: {
						some: { user_id: userId, Roles: { name: PROJECT_OWNER_ROLE } },
					},
				},
			};

	return prisma.contracts.findMany({
		where,
		select: {
			contract_id: true,
			contract_name: true,
			project_id: true,
			client_signature: true,
			project_owner_signature: true,
			client_signed_at: true,
			project_owner_signed_at: true,
			Projects: { select: { name: true } },
		},
		orderBy: { Projects: { name: "asc" } },
	});
}
```

- [ ] **Step 2: Verify types and lint**

Run: `npx tsc --noEmit` and `npx eslint src/entities/contract/contractActions.ts`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/contract/contractActions.ts
git commit -m "feat(contract): add self-scoped getMyContracts dashboard action"
```

---

### Task 4: Query keys and feature model (features/landing-dashboard/model)

**Files:**
- Modify: `src/shared/query/keys.ts`
- Create: `src/features/landing-dashboard/model/types.ts`
- Create: `src/features/landing-dashboard/model/mappers.ts`
- Test: `src/features/landing-dashboard/model/mappers.test.ts`
- Create: `src/features/landing-dashboard/model/queries.ts`
- Modify: `src/features/landing-dashboard/index.ts`

- [ ] **Step 1: Add `dashboardKeys`**

`src/shared/query/keys.ts` — append:

```ts
export const dashboardKeys = {
	all: ["dashboard"] as const,
	role: () => [...dashboardKeys.all, "role"] as const,
	myTickets: () => [...dashboardKeys.all, "my-tickets"] as const,
	watchedTickets: () => [...dashboardKeys.all, "watched-tickets"] as const,
	myContracts: () => [...dashboardKeys.all, "my-contracts"] as const,
};
```

- [ ] **Step 2: Create `model/types.ts`** (moved from the ui components; `uploadedAt` dropped — the DB has no contract upload timestamp and the UI never rendered it):

```ts
import type { status as TicketStatus } from "@/lib/generated/prisma";

export interface WorkflowData {
	label: string;
}

export interface TagBadgeData {
	label: string;
	bg: string;
	text: string;
}

export interface AssigneeData {
	initials: string;
	avatarBg: string;
	name?: string;
}

export interface TicketItem {
	id: string;
	name: string;
	project: string;
	module: string;
	workflow: WorkflowData | string;
	status: TicketStatus;
	tag: TagBadgeData;
	assignees?: AssigneeData[];
	dueAt?: Date | string;
	dueDate?: string;
	dueDateUrgent?: boolean;
}

export type ContractStatus = "pending" | "executed";

export interface PendingContract {
	id: string;
	projectId: string;
	documentName: string;
	projectName: string;
	status: ContractStatus;
}
```

- [ ] **Step 3: Write failing tests for the mappers**

Create `src/features/landing-dashboard/model/mappers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
	mapDashboardTicketRow,
	mapContractRow,
	tagToBadge,
} from "./mappers";
import type { DashboardTicketRow } from "@/entities/ticket";

const baseRow = {
	ticket_id: "t1",
	name: "Fix auth",
	status: "IN_PROGRESS",
	plan_end_at: new Date("2026-09-01T10:00:00Z"),
	Workflows: {
		name: "Auth Flow",
		Modules: {
			name: "Auth",
			Phases: { name: "Build", Stages: { name: "S1", Projects: { project_id: "p1", name: "Portal 2.0" } } },
		},
	},
	TicketTags: [{ Tags: { name: "Critical", color: "#93000a" } }],
	TicketAssigned: [
		{
			Profile: { profile_id: "u1", first_name: "John", last_name: "Doe" },
		},
	],
} as unknown as DashboardTicketRow;

describe("mapDashboardTicketRow", () => {
	it("flattens the nested project/module/workflow chain", () => {
		const item = mapDashboardTicketRow(baseRow);
		expect(item.project).toBe("Portal 2.0");
		expect(item.module).toBe("Auth");
		expect(item.workflow).toEqual({ label: "Auth Flow" });
		expect(item.status).toBe("IN_PROGRESS");
		expect(item.dueAt).toBe(baseRow.plan_end_at);
	});

	it("derives assignee initials from the profile", () => {
		const item = mapDashboardTicketRow(baseRow);
		expect(item.assignees?.[0]).toMatchObject({
			initials: "JD",
			name: "John Doe",
		});
	});

	it("uses the first tag's label and color-derived badge", () => {
		const item = mapDashboardTicketRow(baseRow);
		expect(item.tag.label).toBe("Critical");
		expect(item.tag.text).toBe("#93000a");
	});

	it("tolerates a tagless ticket", () => {
		const row = { ...baseRow, TicketTags: [] };
		expect(mapDashboardTicketRow(row).tag.label).toBe("Untagged");
	});
});

describe("tagToBadge", () => {
	it("derives a translucent bg from the color", () => {
		expect(tagToBadge("X", "#123456")).toEqual({
			label: "X",
			bg: "#1234561A",
			text: "#123456",
		});
	});

	it("falls back to neutral colors without a tag color", () => {
		expect(tagToBadge("X", null).bg).toBeTruthy();
		expect(tagToBadge(null, null).label).toBe("Untagged");
	});
});

describe("mapContractRow", () => {
	it("maps a pending contract (no owner signature yet)", () => {
		const row = {
			contract_id: "c1",
			contract_name: "MSA",
			project_id: "p1",
			client_signature: "sig",
			project_owner_signature: null,
			client_signed_at: null,
			project_owner_signed_at: null,
			Projects: { name: "Portal 2.0" },
		};
		expect(mapContractRow(row as never)).toEqual({
			id: "c1",
			projectId: "p1",
			documentName: "MSA",
			projectName: "Portal 2.0",
			status: "pending",
		});
	});

	it("maps an executed contract when both signatures exist", () => {
		const row = {
			contract_id: "c2",
			contract_name: "MSA",
			project_id: "p2",
			client_signature: "a",
			project_owner_signature: "b",
			client_signed_at: null,
			project_owner_signed_at: null,
			Projects: { name: "Nexus" },
		};
		expect(mapContractRow(row as never).status).toBe("executed");
	});
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run src/features/landing-dashboard/model/mappers.test.ts`
Expected: FAIL — `./mappers` module does not exist.

- [ ] **Step 5: Implement `model/mappers.ts`**

```ts
import type { DashboardTicketRow } from "@/entities/ticket";
import type { ContractRow } from "@/entities/contract";
import type {
	TicketItem,
	TagBadgeData,
	AssigneeData,
	PendingContract,
} from "./types";

const AVATAR_PALETTE = ["#ffddb8", "#e2dfff", "#bbf7d0", "#fed7aa", "#c7d2fe"];

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function toInitials(first: string, last: string): string {
	const initials = `${first.charAt(0) ?? ""}${last.charAt(0) ?? ""}`.toUpperCase();
	return initials || "?";
}

/** Tag badge colors derived from the Tag row's single color hex. */
export function tagToBadge(
	tagName: string | null,
	color: string | null,
): TagBadgeData {
	const label = tagName ?? "Untagged";
	if (!color) return { label, bg: "#eef2f6", text: "#5b6472" };
	return { label, bg: `${color}1A`, text: color };
}

export function mapDashboardTicketRow(row: DashboardTicketRow): TicketItem {
	const workflow = row.Workflows;
	const module = workflow?.Modules;
	const phase = module?.Phases;
	const stage = phase?.Stages;
	const project = stage?.Projects;
	const firstTag = row.TicketTags[0]?.Tags ?? null;

	const assignees: AssigneeData[] = row.TicketAssigned.map((a) => ({
		initials: toInitials(a.Profile.first_name, a.Profile.last_name),
		avatarBg:
			AVATAR_PALETTE[
				hashString(a.Profile.profile_id) % AVATAR_PALETTE.length
			],
		name: `${a.Profile.first_name} ${a.Profile.last_name}`,
	}));

	return {
		id: row.ticket_id,
		name: row.name,
		project: project?.name ?? "—",
		module: module?.name ?? "—",
		workflow: workflow ? { label: workflow.name } : "—",
		status: row.status,
		tag: tagToBadge(firstTag?.name ?? null, firstTag?.color ?? null),
		assignees,
		dueAt: row.plan_end_at,
	};
}

export function mapContractRow(row: ContractRow): PendingContract {
	const executed = Boolean(
		row.client_signature && row.project_owner_signature,
	);
	return {
		id: row.contract_id,
		projectId: row.project_id,
		documentName: row.contract_name ?? "Untitled Contract",
		projectName: row.Projects.name,
		status: executed ? "executed" : "pending",
	};
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/features/landing-dashboard/model/mappers.test.ts`
Expected: PASS (8/8).

- [ ] **Step 7: Create `model/queries.ts`**

```ts
"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "@/shared/query/keys";
import { getMyDashboardRole } from "@/entities/roleAssignment";
import {
	selectMyTickets,
	selectWatchedTickets,
} from "@/entities/ticket";
import { getMyContracts } from "@/entities/contract";
import { mapDashboardTicketRow, mapContractRow } from "./mappers";

const dashboardQueryOptions = {
	role: () =>
		queryOptions({
			queryKey: dashboardKeys.role(),
			queryFn: getMyDashboardRole,
		}),
	myTickets: (enabled: boolean) =>
		queryOptions({
			queryKey: dashboardKeys.myTickets(),
			queryFn: async () => (await selectMyTickets()).map(mapDashboardTicketRow),
			enabled,
		}),
	watchedTickets: (enabled: boolean) =>
		queryOptions({
			queryKey: dashboardKeys.watchedTickets(),
			queryFn: async () =>
				(await selectWatchedTickets()).map(mapDashboardTicketRow),
			enabled,
		}),
	myContracts: (enabled: boolean) =>
		queryOptions({
			queryKey: dashboardKeys.myContracts(),
			queryFn: async () => (await getMyContracts()).map(mapContractRow),
			enabled,
		}),
};

export function useDashboardRole() {
	return useQuery(dashboardQueryOptions.role());
}

export function useMyTickets(enabled: boolean) {
	return useQuery(dashboardQueryOptions.myTickets(enabled));
}

export function useWatchedTickets(enabled: boolean) {
	return useQuery(dashboardQueryOptions.watchedTickets(enabled));
}

export function useMyContracts(enabled: boolean) {
	return useQuery(dashboardQueryOptions.myContracts(enabled));
}
```

- [ ] **Step 8: Extend the feature public API**

`src/features/landing-dashboard/index.ts` — replace the whole file:

```ts
export { ActivitySparklines } from "./ui/ActivitySparklines";
export { TicketsBoard } from "./ui/TicketsBoard";
export { PendingContracts } from "./ui/PendingContracts";
export * from "./model/types";
export {
	useDashboardRole,
	useMyTickets,
	useWatchedTickets,
	useMyContracts,
} from "./model/queries";
```

- [ ] **Step 9: Verify and commit**

Run: `npx tsc --noEmit` and `npx vitest run src/features/landing-dashboard/model/mappers.test.ts`
Expected: no TS errors; tests pass.

```bash
git add src/shared/query/keys.ts src/features/landing-dashboard
git commit -m "feat(landing-dashboard): add model segment (queries, mappers, types)"
```

---

### Task 5: Refactor the UI components (no mock data, empty states, shared status config)

**Files:**
- Create: `src/entities/ticket/lib/statusConfig.ts`
- Modify: `src/entities/ticket/index.ts`
- Modify: `src/features/landing-dashboard/ui/TicketsBoard.tsx`
- Modify: `src/features/landing-dashboard/ui/PendingContracts.tsx`

- [ ] **Step 1: Create the shared ticket status config and export it from the slice**

`src/entities/ticket/lib/statusConfig.ts`:

```ts
import type { status as TicketStatus } from "@/lib/generated/prisma";

/**
 * Single source of truth for ticket-status presentation. Currently consumed
 * by the landing dashboard; ticket-board's COLUMNS can adopt it later.
 */
export const TICKET_STATUS_CONFIG: Record<
	TicketStatus,
	{ label: string; dot: string; text: string }
> = {
	PENDING: { label: "Pending", dot: "bg-yellow-500", text: "text-yellow-600" },
	IN_PROGRESS: {
		label: "In Progress",
		dot: "bg-brand-600",
		text: "text-brand-600",
	},
	FINISHED: { label: "Finished", dot: "bg-green-500", text: "text-green-600" },
};
```

`src/entities/ticket/index.ts` — replace the whole file so `TICKET_STATUS_CONFIG` is reachable through the slice public API (the landing-dashboard imports it from `@/entities/ticket`):

```ts
export * from "./ticketActions";
export * from "./mutations";
export * from "./lib/statusConfig";
```

- [ ] **Step 2: Update `TicketsBoard.tsx`**

- Delete `MOCK_EXTENDED_TICKETS`, `MOCK_OFFSET_MS`, `NOW_MS`, `HOUR_MS`, `DAY_MS` (mock block, lines ~69–115).
- Delete the local `STATUS_CONFIG` and replace `StatusCell` with the shared config:

```tsx
import { TICKET_STATUS_CONFIG } from "@/entities/ticket";
import type { TicketItem } from "../model/types";

function StatusCell({ status }: { status: TicketItem["status"] }) {
	const config = TICKET_STATUS_CONFIG[status] ?? TICKET_STATUS_CONFIG.PENDING;
	return (
		<div className="flex items-center gap-1.5">
			<span className={`h-2 w-2 rounded-full ${config.dot}`} />
			<span className={`text-[13px] font-normal ${config.text}`}>
				{config.label}
			</span>
		</div>
	);
}
```

- Delete the dead `COLUMN_FIELD_MAP` entries `"due at"` and `"Time Left"` (only `"Due Date"` maps to `dueAt`).
- Change the props default: `tickets = []` (keep `count`/`title`/`variant` props). `totalCount = count ?? tickets.length` stays.
- Add empty states: in the preview area and the modal body, when the sliced list is empty render:

```tsx
<div className="px-6 py-10 text-center text-sm text-muted-foreground">
	No tickets to show.
</div>
```

- Guard pagination: `const totalPages = Math.max(1, Math.ceil(sortedTickets.length / pageSize));` so the modal never shows "Page 1 of 0".
- Remove the local `TagBadge`/`AssigneeData`/`WorkflowData`/`TagBadgeData`/`TicketItem` interface definitions (now imported from `../model/types`). Keep `AssigneeCell`, `TagBadge`, `DueDateCell`, `formatTimeLeft` implementations.
- Keep the default export.

- [ ] **Step 3: Rewrite `PendingContracts.tsx`** (no mock data, status-aware badge, router navigation, empty states)

Replace the whole file with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	ScrollText,
	FileText,
	ArrowRight,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { ContractStatus, PendingContract } from "../model/types";

export interface PendingContractsProps {
	contracts?: PendingContract[];
}

const CONTRACT_STATUS_STYLE: Record<
	ContractStatus,
	{ dot: string; text: string; label: string }
> = {
	pending: {
		dot: "bg-amber-500",
		text: "text-amber-800 dark:text-amber-400",
		label: "Pending Signature",
	},
	executed: {
		dot: "bg-emerald-500",
		text: "text-emerald-700 dark:text-emerald-400",
		label: "Executed",
	},
};

function StatusBadge({ status }: { status: ContractStatus }) {
	const style = CONTRACT_STATUS_STYLE[status];
	return (
		<div className="flex items-center gap-1.5">
			<span className={`h-2 w-2 shrink-0 rounded-sm ${style.dot}`} />
			<span className={`truncate text-xs font-normal ${style.text}`}>
				{style.label}
			</span>
		</div>
	);
}

export function PendingContracts({ contracts = [] }: PendingContractsProps) {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	const totalPages = Math.max(1, Math.ceil(contracts.length / pageSize));
	const paginatedContracts = contracts.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);
	const shownFrom = contracts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
	const shownTo = contracts.length === 0 ? 0 : Math.min(currentPage * pageSize, contracts.length);

	const renderContractRows = (items: PendingContract[]) =>
		items.map((contract) => (
			<div
				key={contract.id}
				className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border border-brand-100 bg-muted/30 p-4 transition-colors"
			>
				{/* Left: Document Icon */}
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
					<FileText className="h-5 w-5 text-muted-foreground" />
				</div>

				{/* Center: Fixed 3-Column Grid for consistent alignment */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.75fr_1fr_1fr] sm:items-center">
					{/* Document Name Column */}
					<div className="flex flex-col min-w-0">
						<span className="text-[11px] font-normal uppercase text-muted-foreground">
							Document
						</span>
						<h4
							className="truncate text-sm font-normal text-foreground"
							title={contract.documentName}
						>
							{contract.documentName}
						</h4>
					</div>

					{/* Project Name Column */}
					<div className="flex flex-col min-w-0">
						<span className="text-[11px] font-normal uppercase text-muted-foreground">
							Project
						</span>
						<h4
							className="truncate text-xs font-normal text-foreground sm:text-sm"
							title={contract.projectName}
						>
							{contract.projectName}
						</h4>
					</div>

					{/* Status Column */}
					<div className="flex flex-col min-w-0">
						<span className="text-[11px] font-normal uppercase text-muted-foreground">
							Status
						</span>
						<StatusBadge status={contract.status} />
					</div>
				</div>

				{/* Right: Review & Sign Button */}
				<div className="flex items-center justify-end shrink-0 pl-2">
					<Button
						size="sm"
						onClick={() =>
							router.push(`/projects/${contract.projectId}/contract`)
						}
					>
						<span>Review and Sign</span>
						<ArrowRight className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>
		));

	return (
		<Card className="m-0 flex w-full flex-col gap-0 overflow-hidden rounded-md border border-brand-100 p-0 shadow-none">
			<Dialog>
				{/* Card Header */}
				<div className="flex items-center justify-between gap-3 border-b border-brand-100 bg-muted/30 px-6 py-4">
					<div className="flex items-center gap-3">
						<ScrollText className="h-5 w-5 text-muted-foreground" />
						<h3 className="text-base font-normal text-foreground">Contracts</h3>
						<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-normal text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
							{contracts.filter((c) => c.status === "pending").length}{" "}
							PENDING
						</span>
					</div>

					<DialogTrigger>
						<button
							type="button"
							className="text-xs font-normal underline-offset-2 hover:underline"
						>
							<h4 className="hover:text-brand-600! font-normal underline decoration-inherit">
								View All
							</h4>
						</button>
					</DialogTrigger>
				</div>

				{/* Dashboard Preview List (First 5 items) */}
				{contracts.length === 0 ? (
					<div className="px-6 py-10 text-center text-sm text-muted-foreground">
						No contracts to show.
					</div>
				) : (
					<div className="flex flex-col gap-3 p-4">
						{renderContractRows(contracts.slice(0, 5))}
					</div>
				)}

				{/* POPUP MODAL DIALOG WITH 10 ROWS & PAGINATION */}
				<DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0">
					<DialogHeader className="m-0 border-b border-brand-100 bg-muted/30 px-8 pt-6 pb-5">
						<DialogTitle className="flex items-center gap-2 text-base font-normal">
							<ScrollText className="h-5 w-5 text-muted-foreground" />
							Pending Contracts
							<span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-normal text-amber-800">
								{contracts.length} TOTAL
							</span>
						</DialogTitle>
					</DialogHeader>

					{/* Modal Scrollable List (10 Items Per Page) */}
					<div className="flex flex-1 flex-col gap-3 overflow-y-auto p-8">
						{paginatedContracts.length === 0 ? (
							<div className="py-10 text-center text-sm text-muted-foreground">
								No contracts to show.
							</div>
						) : (
							renderContractRows(paginatedContracts)
						)}
					</div>

					{/* Pagination Controls Footer (hidden when there are no contracts) */}
					{contracts.length > 0 && (
					<div className="flex items-center justify-between border-t border-brand-100 bg-muted/30 px-8 py-4">
						<span className="text-xs text-muted-foreground">
							Showing{" "}
							<span className="text-foreground">{shownFrom}</span> to{" "}
							<span className="text-foreground">{shownTo}</span> of{" "}
							<span className="text-foreground">{contracts.length}</span>{" "}
							contracts
						</span>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
								disabled={currentPage === 1}
								className="h-8 w-8 p-0"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-xs font-normal text-foreground">
								Page {currentPage} of {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage((p) => Math.min(p + 1, totalPages))
								}
								disabled={currentPage === totalPages}
								className="h-8 w-8 p-0"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
					)}
				</DialogContent>
			</Dialog>
		</Card>
	);
}

export default PendingContracts;
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` and `npx eslint src/features/landing-dashboard src/entities/ticket/lib/statusConfig.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/entities/ticket/lib/statusConfig.ts src/entities/ticket/index.ts src/features/landing-dashboard/ui
git commit -m "refactor(landing-dashboard): drop mock data, add empty states and shared status config"
```

---

### Task 6: Page integration (app layer)

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite `DashboardPage`**

Replace the file body with role-driven composition (keep the file as a `"use client"` component):

```tsx
"use client";

import {
	TicketsBoard,
	PendingContracts,
	useDashboardRole,
	useMyTickets,
	useWatchedTickets,
	useMyContracts,
} from "@/features/landing-dashboard";
import { useAuth } from "@/features/auth";

// TODO(landing-dashboard): ActivitySparklines integration is on hold by
// decision — wire weekly velocity / risk / upcoming deadlines after the
// role-based views ship (component already exists in the feature).
export default function DashboardPage() {
	const { user } = useAuth();
	const roleQuery = useDashboardRole();

	const showTickets = roleQuery.data === "staff" || roleQuery.data === "owner";
	const showContracts =
		roleQuery.data === "client" || roleQuery.data === "owner";

	const myTickets = useMyTickets(showTickets);
	const watchedTickets = useWatchedTickets(showTickets);
	const myContracts = useMyContracts(showContracts);

	const loading =
		roleQuery.isLoading ||
		(showTickets && (myTickets.isLoading || watchedTickets.isLoading)) ||
		(showContracts && myContracts.isLoading);

	if (loading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div>Loading...</div>
			</div>
		);
	}

	if (roleQuery.isError) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-sm text-destructive">
					Failed to load your dashboard. Please try again.
				</div>
			</div>
		);
	}

	const isClient = roleQuery.data === "client";

	return (
		<div className="mx-auto flex h-fit w-full flex-col items-center justify-center">
			<div className="mb-6 flex h-fit w-full flex-col gap-4 pb-4">
				<h1 className="h-fit w-full text-3xl">
					{isClient
						? `Welcome Back, ${user?.first_name ?? ""}`
						: "Personal Dashboard"}
				</h1>
				<div className="subtitle">
					{isClient
						? "Review your active contracts."
						: "Review your active workload and watched developments."}
				</div>
			</div>

			<div className="flex w-full flex-col items-center justify-center gap-10">
				{showTickets && (
					<>
						<TicketsBoard tickets={myTickets.data ?? []} />
						<TicketsBoard
							variant="watched"
							tickets={watchedTickets.data ?? []}
						/>
					</>
				)}
				{showContracts && (
					<PendingContracts contracts={myContracts.data ?? []} />
				)}
			</div>
		</div>
	);
}
```

Notes for the implementer:
- `myTickets.data` is `TicketItem[] | undefined`; the explicit `?? []` keeps the components' `= []` default honest.
- `ActivitySparklines` import is intentionally removed — see the TODO comment.
- The old `USER_ROLE_TYPES` type, `userRole`/`loading` local state, and the hardcoded `true ?` ternaries are deleted.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npx eslint "src/app/(app)/dashboard/page.tsx"`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "feat(dashboard): render landing dashboard tables by role with real data"
```

---

### Task 7: Full verification (DoD — Task 4.5)

- [ ] **Step 1: Run the full gate**

Run each and record results:

```bash
npx prisma validate
npx tsc --noEmit
npx vitest run
npx eslint src/features/landing-dashboard src/entities/ticket src/entities/contract src/entities/roleAssignment "src/app/(app)/dashboard/page.tsx" src/shared/query/keys.ts
npm run build
npx knip
```

Expected: all pass. (`npm run build` requires the Supabase env vars used by the existing build — if unavailable, record `next build` result and fall back to `tsc --noEmit` + `eslint` + `vitest`.)

- [ ] **Step 2: Update this plan's status and record the DoD block**

Fill in the DoD section below with actual results.

- [ ] **Step 3: Commit any residual changes and finish**

```bash
git add -A
git commit -m "chore: landing dashboard role visibility verification"
```

---

## Acceptance criteria (from the request)

| # | Criterion | Implemented by |
|---|---|---|
| c1 | Client profiles (Profiles.client_id set) see ONLY the Contracts table, with their client's real contracts | Task 1 (role), Task 3 (data), Task 6 (page) |
| c2 | Project team members do NOT see the Contracts table (My + Watched tickets only) | Task 6 (`showContracts` gated on client/owner) |
| c3 | Project owners see all 3 tables (My Tickets, Watched Tickets, Contracts) | Task 6 |
| c4 | No mock data rendered on the dashboard | Task 5 (mock defaults removed) |
| c5 | Components show an empty state instead of broken pagination when a list is empty | Task 5 |
| c6 | `prisma validate`, `tsc --noEmit`, `vitest run`, `eslint`, `next build` pass | Task 7 |

## Definition of Done record (Task 4.5)

1. **Dependencies & prerequisites:** no new packages. Builds on Tasks 1–3 (entity server actions) and the existing TanStack Query / FSD structure.
2. **DB migration & rollback impact:** **no schema change** — no migration files. Rollback = revert the commits; no data implications.
3. **Acceptance criteria:** c1–c6 above, verified in Task 7.
4. **Tests required:** `dashboardRole.test.ts` (4 cases), `mappers.test.ts` (8 cases) — 12 unit tests total, all via Vitest.
5. **Verification commands:** Task 7, Step 1 (recorded outputs).

### Actual results (2026-08-14, executed)

| Command | Result |
|---|---|
| `npx prisma validate` | ✅ schema valid |
| `npx tsc --noEmit --incremental false` | ⚠️ 3 errors, ALL pre-existing TS2339 (`subTickets`) in `src/features/ticket-board/ui/TicketCard.tsx` — present on HEAD, file untouched by this plan; zero new errors (baseline-compared) |
| `npx vitest run` | ✅ 22 files / 142 tests passed |
| `npx eslint` (changed paths) | ✅ 0 errors (1 pre-existing warning: dead `Http2ServerRequest` import in `ui/ActivitySparklines.tsx`, committed in c89855a; file untouched) |
| `npm run build` | ⚠️ Compiled successfully (Turbopack); TypeScript gate stops on the SAME pre-existing `TicketCard.tsx` error — build blocked by pre-existing issue, not by this plan |
| `npx knip` | ⚠️ 313 findings, all pre-existing patterns (default exports etc.); none of the new symbols flagged; the `ActivitySparklines` export flags are the expected consequence of the on-hold decision |

**Commits (branch `manual-fixes`):** `7c0af78` role resolution · `1ba0dc6` ticket actions · `93bad88` contract action · `6d5d5f1` model segment · `cfead2d` UI refactor · `efd0566` page integration.

**Follow-ups (pre-existing, out of scope):** fix `TicketCard.tsx` `subTickets` type error to unblock `next build`; remove dead `Http2ServerRequest` import in `ActivitySparklines.tsx`.

## Self-review notes

- Spec coverage: client-only view (c1), team without contracts (c2), owner full view (c3), real data (c4 via Tasks 2–3 + page wiring), sparklines deferred per user decision (TODO in page), 3-tables = current layout per user decision.
- No placeholders: every task has concrete code and commands.
- Type consistency: `DashboardRole` (entities/types.ts) is the single role type; `TicketItem`/`PendingContract` live in `model/types.ts` and are re-exported through the slice `index.ts`; `DashboardTicketRow`/`ContractRow` derive from the server-action return types.
- FSD: features/landing-dashboard imports only entities/shared; entities/roleAssignment + entities/ticket + entities/contract export through their slice `index.ts` (all three already exist); page (app) composes features. `dashboardRole.ts` is deliberately NOT a `"use server"` module (Next.js forbids non-async exports there).
