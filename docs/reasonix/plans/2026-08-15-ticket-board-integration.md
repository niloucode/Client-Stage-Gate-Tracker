# Ticket Board Integration Plan

> **STATUS: EXECUTED 2026-08-15** — implemented inline (superpowers-executing-plans),
> commits `7460eb6` (Task 1), `7b386fb` (Task 2), `2905831` (Task 3), `9630efe`
> (Task 4), `35f9aa9` (Task 5), `794f219` (Task 6), `2d839f8` (Task 7), `105c02b`
> (Task 8), `c85efd2` (Task 9), docs sign-off (Task 10).
> Verification: `prisma validate` ✓ · `tsc --noEmit` ✓ · `vitest run` 34 files /
> 226 tests ✓ · `eslint` on touched dirs ✓ · `npm run build` ✓.
> NOTE: `prisma migrate dev` is blocked by pre-existing shadow-DB drift (P3018);
> the `20260815000000_10_tickets_plan_start_nullable` migration must be applied
> to Supabase out-of-band.

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the newly committed `src/features/ticket-board` slice: replace ALL fake subtask data with real `parent_id`-based subtasks (the most important part), give clients a read-only view (team/owners full access), scope assignee/watcher dropdowns to the project's members, fix comments + attachments visibility (query-key bug), complete the ticket date-rules (plan_start_at nullable, plan_end_at required, actual-date transitions), offer cascade-vs-promote on parent delete, and fix the review findings (error handling, FSD, a11y).

**Architecture:** Subtasks are Tickets with a `parent_id` self-relation (schema `SubTickets`). The board derives each parent's subtasks from the already-fetched flat workflow list (`tickets.filter(t => t.parent_id === parentId)`) — no schema change, no nested include, same data source the editor already uses. Server-side authz (`assertProjectMemberNotClient`) already guards all 5 mutating ticket actions; this pass only fixes the UI surface for clients. Actual-date transitions move into a pure tested helper (`computeActualDates`) shared by `updateTicket` and `updateTicketStatus`. Assignee/watcher dropdowns get a new project-scoped member query (`selectProjectMembers` via `roleAssignments`, clients excluded).

**Tech Stack:** Next.js App Router, TanStack Query v5, zod v4 (use `error` param), Prisma, dnd-kit (add `KeyboardSensor`), Supabase storage.

**Spec decisions (user-confirmed 2026-08-15):**
1. Clients: read-only — hide New Ticket/Tags, DnD, delete, and the editor's Save/subtask management.
2. Project Team and Project Owners: identical full access.
3. Subtasks: loaded by deriving from the flat workflow list; created by linking existing tickets only (no `parent_id` on createTicket).
4. Ticket dates: `plan_end_at` stays REQUIRED (not nullable); `plan_start_at` becomes optional/nullable (DB migration); `actual_start_at` set on PENDING→IN_PROGRESS; `actual_end_at` set on →FINISHED; PENDING→FINISHED sets both to the SAME timestamp; regressions (FINISHED→IN_PROGRESS/PENDING, IN_PROGRESS→PENDING) revert the applicable actual dates to NULL.
5. Deleting a ticket that HAS subtasks pops a modal: **Cascade delete / Promote subtasks to parent tickets / Cancel**. No subtasks → plain confirm.
6. Assignee/watcher dropdowns show ONLY project team members + project owners with a `RoleAssignments` row in the current project (clients and non-members never appear).
7. Ticket attachments and comment attachments must load when the slide-over opens, and comments must appear immediately after posting (no page refresh).

---

### Task 1: Real subtasks on the board (BLOCKING — remove all dummy data)

**Files:**
- Modify: `src/features/ticket-board/ui/TicketBoard.tsx`
- Modify: `src/features/ticket-board/ui/TicketColumn.tsx`
- Modify: `src/features/ticket-board/ui/TicketCard.tsx`
- Modify: `src/features/ticket-board/ui/editor/useTicketEditor.ts`

**Why:** `getDummySubtasks` (TicketCard.tsx:28-109) fabricates tickets with fake ids (`${id}-sub-1..3`) that flow into `onSelect` (the editor opens on a non-existent ticket) and `onDelete` (server `z.uuid().parse` throws). `DUMMY_SUBTICKETS` (useTicketEditor.ts:8-97) has ids `du123mmy-subtask-2/-4` that FAIL the `startsWith("dummy-")` guard, so picking them calls `updateTicketParent` with fake uuids.

- [ ] **Step 1: TicketBoard derives subtasks per parent**

In `TicketBoard.tsx`, next to `ticketsByStatus`:
```tsx
// Real subtasks: tickets whose parent_id points at a ticket in this workflow.
// Derived from the flat list (one fetch, no nested include) — same source
// the editor uses.
const subtasksByParent = useMemo(() => {
	const map = new Map<string, Ticket[]>();
	for (const t of tickets) {
		if (!t.parent_id) continue;
		const list = map.get(t.parent_id) ?? [];
		list.push(t);
		map.set(t.parent_id, list);
	}
	return map;
}, [tickets]);
```
Pass it to every `TicketColumn`:
```tsx
<TicketColumn
	key={column.id}
	column={column}
	tickets={ticketsByStatus.get(column.id) ?? []}
	subtasksByParent={subtasksByParent}
	onSelectTicket={handleSelectTicket}
	onDeleteTicket={handleDeleteTicket}
/>
```

- [ ] **Step 2: TicketColumn forwards subtasks + drops the dead `onEdit` prop**

```tsx
interface TicketColumnProps {
	column: Column;
	tickets: Ticket[];
	subtasksByParent: ReadonlyMap<string, Ticket[]>;
	onSelectTicket: (ticket: Ticket) => void;
	onDeleteTicket?: (ticketId: string, mode: "cascade" | "promote") => void;
}
...
{tickets.map((ticket) => (
	<TicketCard
		key={ticket.ticket_id}
		ticket={ticket}
		subtasks={subtasksByParent.get(ticket.ticket_id) ?? []}
		onSelect={onSelectTicket}
		onDelete={onDeleteTicket}
	/>
))
```
Delete the `onEditTicket` prop + its default no-op (it is dead: `TicketCardContent` never calls `onEdit`).

- [ ] **Step 3: TicketCard — delete `getDummySubtasks`, render real subtasks**

- Delete the whole `getDummySubtasks` function (lines 25-109).
- `TicketCardContent` signature becomes:
```tsx
export function TicketCardContent({
	ticket,
	subtasks,
	onSelect,
	onDelete,
	isSubtask = false,
	readOnly = false,
}: {
	ticket: Ticket;
	subtasks: Ticket[];
	onSelect: (ticket: Ticket) => void;
	onDelete: (ticketId: string, mode: "cascade" | "promote") => void;
	isSubtask?: boolean;
	readOnly?: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	// Real subtasks passed from the board — no dummy fallback.
```
- Only show the expand chevron and the accordion when there ARE subtasks:
```tsx
{!isSubtask && subtasks.length > 0 && (
	<Button
		variant="ghost"
		size="icon"
		...
		title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
		aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
	>
		<ChevronDown ... />
	</Button>
)}
```
and wrap the accordion container in `{!isSubtask && subtasks.length > 0 && ( ... )}` (same JSX as today, keyed by `subtask.ticket_id` — now real uuids).
- `TicketCard` (the draggable wrapper) gains `subtasks` + `readOnly` props and forwards them; remove `onEdit`.

- [ ] **Step 4: useTicketEditor — delete DUMMY_SUBTICKETS + the merge machinery**

- Delete `DUMMY_SUBTICKETS` (lines 8-97), `localDummyTickets` state, and `combinedTickets`.
- Derive directly from `allTickets`:
```tsx
const availableTickets = useMemo(() => {
	return allTickets.filter((t) => {
		if (t.ticket_id === ticket.ticket_id) return false;
		if (t.parent_id !== null) return false;
		if (t.status === StatusEnum.FINISHED) return false;
		return true;
	});
}, [allTickets, ticket.ticket_id]);

const subtasks = useMemo(() => {
	return allTickets.filter((t) => t.parent_id === ticket.ticket_id);
}, [allTickets, ticket.ticket_id]);
```
- `handleAddSubtask` / `handleRemoveSubtask` — drop the `startsWith("dummy-")` branches entirely:
```tsx
const handleAddSubtask = async (selectedTicket: Ticket) => {
	try {
		await updateTicketParentMutation.mutateAsync({
			ticketId: selectedTicket.ticket_id,
			parentId: ticket.ticket_id,
		});
		setIsSubtaskSelectionOpen(false);
	} catch (error) {
		console.error("Failed to add subtask:", error);
		toast.add({
			title: "Add Subtask Failed",
			description: error instanceof Error ? error.message : "Something went wrong.",
			type: "error",
		});
	}
};

const handleRemoveSubtask = async (subtaskId: string) => {
	try {
		await updateTicketParentMutation.mutateAsync({
			ticketId: subtaskId,
			parentId: null,
		});
	} catch (error) {
		console.error("Failed to remove subtask:", error);
		toast.add({
			title: "Remove Subtask Failed",
			description: error instanceof Error ? error.message : "Something went wrong.",
			type: "error",
		});
	}
};
```

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/features/ticket-board`
Expected: no errors (the fake-id paths are gone; `Ticket.subTickets` cast is gone).

```bash
git add src/features/ticket-board
git commit -m "fix(ticket-board): real parent_id-based subtasks — remove all dummy subtask data"
```

### Task 2: Client read-only gating

**Files:**
- Modify: `src/features/ticket-board/ui/TicketBoard.tsx`
- Modify: `src/features/ticket-board/ui/TicketColumn.tsx`
- Modify: `src/features/ticket-board/ui/TicketCard.tsx`
- Modify: `src/features/ticket-board/ui/TicketModals.tsx`
- Modify: `src/features/ticket-board/ui/editor/TicketEditor.tsx`

- [ ] **Step 1: Board gates buttons + DnD**

```tsx
import { useCurrentUser } from "@/entities/profile/queries";
...
const { data: profile } = useCurrentUser();
// Spec: client profiles (linked via the contract) are read-only here;
// project team and project owners have full edit access.
const isClientProfile = !!profile?.client_id;
```
- Hide the Tags + New Ticket buttons: wrap both in `{!isClientProfile && ( … )}`.
- Guard the DnD handlers at the top:
```tsx
function handleDragStart(event: DragStartEvent) {
	if (isClientProfile) return;
	...
}
function handleDragEnd(event: DragEndEvent) {
	if (isClientProfile) return;
	...
}
```
- Pass `readOnly={isClientProfile}` down: `TicketColumn` → `TicketCard` → `TicketCardContent` (delete button hidden), and `TicketModalEdit` gains `readOnly={isClientProfile}` which flows into `TicketEditor`.
- `handleCreateTicket` / `handleDeleteTicket` are unreachable for clients (buttons hidden) — no extra guard needed.

- [ ] **Step 2: Cards hide delete + disable dragging**

- `TicketCardContent`: wrap the delete `Button` (the `<X>` at the top-right) in `{!readOnly && ( … )}` and add `aria-label="Delete ticket"`.
- `TicketCard` (draggable wrapper): use dnd-kit's `disabled` option:
```tsx
const { attributes, listeners, setNodeRef, transform, isDragging } =
	useDraggable({
		id: ticket.ticket_id,
		disabled: readOnly,
	});
```
and replace the wrapper class `cursor-grab active:cursor-grabbing focus:outline-none` with `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:rounded-md` (a11y fix — the previous class removed the focus indicator).

- [ ] **Step 3: Editor read-only**

- `TicketEditor` props: add `readOnly = false`.
- Pass it through from `TicketModalEdit` (`rest` already flows; add `readOnly` to `TicketModalEditProps` and forward).
- In `TicketEditor`:
  - Subtask section: wrap the "Add subtask" button and each subtask row's remove button in `{!readOnly && ( … )}` (clicking a subtask row to VIEW it stays enabled).
  - Footer: hide the Save button for readOnly, keep Cancel/Close:
```tsx
{!readOnly && (
	<Button onClick={state.handleSave} disabled={state.isSaving}>
		{state.isSaving ? "Saving..." : "Save Changes"}
	</Button>
)}
```
  - `SubtaskSelectionModal` is unreachable without the Add button.

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/features/ticket-board`

```bash
git add src/features/ticket-board
git commit -m "feat(ticket-board): clients get read-only view (hide create/edit/delete/DnD)"
```

### Task 3: Project-scoped assignee/watcher dropdowns

**Files:**
- Modify: `src/entities/profile/profileActions.ts`
- Modify: `src/entities/profile/queries.ts`
- Modify: `src/features/ticket-board/ui/TicketBoard.tsx`
- Modify: `src/features/ticket-board/ui/TicketModals.tsx`
- Modify: `src/features/ticket-board/ui/editor/TicketEditor.tsx`
- Modify: `src/features/ticket-board/ui/editor/TicketEditorSubcomponents.tsx`

**Why (P1):** `useProfiles()` → `selectProfile()` returns ALL non-deleted profiles — clients and non-members appear in the assignee/watcher dropdowns. Only profiles with a `RoleAssignments` row in the current project (team members + project owners) may be offered.

- [ ] **Step 1: New server action — project members**

`src/entities/profile/profileActions.ts`:
```ts
/**
 * Profiles that can be ASSIGNED to tickets of a project: everyone with a
 * RoleAssignments row in the project (team + owners). Client profiles are
 * excluded (spec: clients are never assignable). Membership-guarded read.
 */
export async function selectProjectMembers(projectId: string) {
	z.uuid().parse(projectId);

	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return [];

	return prisma.roleAssignments.findMany({
		where: { project_id: projectId, Profile: { client_id: null, is_deleted: false } },
		select: {
			user_id: true,
			Profile: {
				select: {
					profile_id: true,
					first_name: true,
					last_name: true,
					email: true,
				},
			},
		},
		orderBy: { Profile: { first_name: "asc" } },
	}).then((rows) =>
		rows
			.map((r) => r.Profile)
			.filter((p): p is NonNullable<typeof p> => p !== null),
	);
}
```
(Check the import list — `assertProjectMember` must be imported from `@/lib/auth/projectAccess`; `z` is already imported in the file.)

- [ ] **Step 2: Query hook + key**

`src/entities/profile/queries.ts`:
```tsx
import { selectProfile, getCurrentUserProfile, selectTeamProfiles, selectProjectMembers } from "./profileActions";
...
projectMembers: (projectId: string | undefined) =>
	queryOptions({
		queryKey: profileKeys.projectMembers(projectId!),
		queryFn: () => selectProjectMembers(projectId!),
		enabled: !!projectId,
	}),
...
export function useProjectMembers(projectId: string | undefined) {
	return useQuery(profileQueryOptions.projectMembers(projectId));
}
```
`src/shared/query/keys.ts` — add to `profileKeys`:
```ts
projectMembers: (projectId: string) => [...profileKeys.all, "projectMembers", projectId] as const,
```

- [ ] **Step 3: Thread `projectId` through the board → modals → editor**

- `TicketBoard` already receives `projectId?: string`. Pass it to both modals:
```tsx
<TicketModalEdit ... projectId={projectId} />
<TicketModalCreate ... projectId={projectId} />
```
- `CreateTicketModalProps` and `TicketModalEditProps` gain `projectId?: string`.
- `TicketEditor` gains `projectId?: string`; `TicketModalEdit` forwards it via `rest`.

- [ ] **Step 4: Swap the dropdown data source**

- `TicketModalCreate`: replace `const { data: profiles = [] } = useProfiles();` with
  `const { data: profiles = [] } = useProjectMembers(projectId);`
  (assigned-to + watcher dropdowns now list only project members).
- `TicketEditor`: same replacement (it feeds `TicketAssignees`).
- Current assignees/watchers on the ticket keep displaying even if they left the project (they come from the ticket's own relations) — only the CHOICE lists are scoped. When `projectId` is absent, the dropdowns show an empty list (no fallback to all-profiles — that would reintroduce clients).

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/entities/profile src/features/ticket-board`

```bash
git add src/entities/profile src/shared/query/keys.ts src/features/ticket-board
git commit -m "feat(ticket-board): scope assignee/watcher dropdowns to project members (no clients)"
```

### Task 4: Ticket date rules — plan_start_at nullable, deadline stays required

**Files:**
- Modify: `prisma/schema.prisma` (Tickets.plan_start_at → `DateTime?`)
- Create: `prisma/migrations/<ts>_tickets_plan_start_nullable/migration.sql`
- Modify: `src/shared/schemas/ticket.ts`
- Modify: `src/entities/ticket/ticketActions.ts` (createTicket + updateTicket)
- Modify: `src/features/ticket-board/ui/editor/useTicketEditor.ts`

**Rules (2026-08-15 spec):** `plan_end_at` REQUIRED (unchanged); `plan_start_at` optional/nullable; NEVER `new Date()` to satisfy a schema.

- [ ] **Step 1: Schema — keep deadline required, modernize the error param**

`src/shared/schemas/ticket.ts`:
```ts
plan_end_at: z.date({ error: "Plan End Date is required" }),  // was { message: ... }
```
`plan_start_at` is already `z.date().optional().nullable()` — no change.

- [ ] **Step 2: DB migration — plan_start_at nullable**

`prisma/schema.prisma` Tickets:
```prisma
plan_start_at DateTime? @db.Timestamptz(6)
```
Create the migration:
```bash
npx prisma migrate dev --name tickets_plan_start_nullable --create-only
```
Verify the generated `migration.sql` contains exactly:
```sql
ALTER TABLE "Tickets" ALTER COLUMN "plan_start_at" DROP NOT NULL;
```
(If the diff shows anything else — e.g. drift — investigate before applying. Do NOT run `db push`; this repo syncs from Supabase via `db pull` + `scripts/prune-auth-models.mjs`.) **Rollback = revert the migration file.**

- [ ] **Step 3: createTicket stores the user's start date**

`ticketActions.ts` createTicket data:
```ts
// Spec: plan_start_at optional (nullable); plan_end_at required
plan_start_at: data.plan_start_at ?? null,
plan_end_at: data.plan_end_at,
```

- [ ] **Step 4: updateTicket writes plan_start_at (was silently dropped)**

Add to the `update` data object (before the TicketAssigned spread):
```ts
// undefined = don't touch; null = explicitly clear; Date = set
plan_start_at:
	data.plan_start_at === undefined ? undefined : data.plan_start_at,
```

- [ ] **Step 5: Editor — remove the `?? new Date()` fallback**

`useTicketEditor.ts` handleSave:
```ts
plan_start_at: ticket.plan_start_at ? new Date(ticket.plan_start_at) : null,
// Deadline is required (spec) and cannot be cleared in the UI — no fallback:
plan_end_at: new Date(ticket.plan_end_at),
```

- [ ] **Step 6: Verify + commit**

Run: `npx prisma validate` then `npx tsc --noEmit` then `npx vitest run`

```bash
git add prisma/schema.prisma prisma/migrations src/shared/schemas/ticket.ts src/entities/ticket/ticketActions.ts src/features/ticket-board/ui/editor/useTicketEditor.ts
git commit -m "feat(ticket-dates): plan_start_at nullable + stored on create/update; deadline stays required"
```

### Task 5: Actual-date transitions — pure helper + wiring

**Files:**
- Create: `src/entities/ticket/lib/statusTransitions.ts`
- Test: `src/entities/ticket/lib/statusTransitions.test.ts`
- Modify: `src/entities/ticket/ticketActions.ts` (updateTicket + updateTicketStatus)

**Spec:** PENDING→IN_PROGRESS sets `actual_start_at`; →FINISHED sets `actual_end_at`; PENDING→FINISHED sets BOTH to the SAME timestamp; regressions (FINISHED→IN_PROGRESS/PENDING, IN_PROGRESS→PENDING) revert the applicable dates to NULL; same-status = no change.

- [ ] **Step 1: Write the failing test (TDD)**

`src/entities/ticket/lib/statusTransitions.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeActualDates } from "./statusTransitions";

const NOW = new Date("2026-08-15T10:00:00.000Z");

describe("computeActualDates (2026-08-15 spec)", () => {
	it("PENDING -> IN_PROGRESS sets actual_start_at", () => {
		expect(computeActualDates("PENDING", "IN_PROGRESS", NOW)).toEqual({
			actual_start_at: NOW,
		});
	});

	it("IN_PROGRESS -> FINISHED sets actual_end_at only", () => {
		expect(computeActualDates("IN_PROGRESS", "FINISHED", NOW)).toEqual({
			actual_end_at: NOW,
		});
	});

	it("PENDING -> FINISHED sets actual_start_at and actual_end_at to the SAME timestamp", () => {
		const patch = computeActualDates("PENDING", "FINISHED", NOW);
		expect(patch.actual_start_at).toBe(NOW);
		expect(patch.actual_end_at).toBe(NOW);
		expect(patch.actual_start_at).toBe(patch.actual_end_at);
	});

	it("FINISHED -> IN_PROGRESS reverts actual_end_at only", () => {
		expect(computeActualDates("FINISHED", "IN_PROGRESS", NOW)).toEqual({
			actual_end_at: null,
		});
	});

	it("FINISHED -> PENDING reverts both actual dates", () => {
		expect(computeActualDates("FINISHED", "PENDING", NOW)).toEqual({
			actual_start_at: null,
			actual_end_at: null,
		});
	});

	it("IN_PROGRESS -> PENDING reverts actual_start_at only", () => {
		expect(computeActualDates("IN_PROGRESS", "PENDING", NOW)).toEqual({
			actual_start_at: null,
		});
	});

	it("same status produces no patch", () => {
		expect(computeActualDates("FINISHED", "FINISHED", NOW)).toEqual({});
		expect(computeActualDates("PENDING", "PENDING", NOW)).toEqual({});
		expect(computeActualDates("IN_PROGRESS", "IN_PROGRESS", NOW)).toEqual({});
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/entities/ticket/lib/statusTransitions.test.ts`
Expected: FAIL ("computeActualDates is not a function").

- [ ] **Step 3: Implement the helper**

`src/entities/ticket/lib/statusTransitions.ts` (pure — NOT in a "use server" file, per the pure-helper pattern):
```ts
import type { status } from "@/lib/generated/prisma";

export interface ActualDatesPatch {
	actual_start_at?: Date | null;
	actual_end_at?: Date | null;
}

/**
 * 2026-08-15 spec — actual dates are derived from status transitions:
 * - PENDING  -> IN_PROGRESS: actual_start_at = now
 * - PENDING  -> FINISHED:    actual_start_at = actual_end_at = now (same ts)
 * - IN_PROGRESS -> FINISHED: actual_end_at = now (start kept)
 * - FINISHED -> IN_PROGRESS: actual_end_at = null (start kept)
 * - FINISHED -> PENDING:     both reverted to null
 * - IN_PROGRESS -> PENDING:  actual_start_at = null
 * - same status: no patch (server values preserved)
 */
export function computeActualDates(
	oldStatus: status,
	newStatus: status,
	now: Date,
): ActualDatesPatch {
	if (oldStatus === newStatus) return {};
	switch (oldStatus) {
		case "PENDING":
			if (newStatus === "IN_PROGRESS") return { actual_start_at: now };
			if (newStatus === "FINISHED")
				return { actual_start_at: now, actual_end_at: now };
			return {};
		case "IN_PROGRESS":
			if (newStatus === "FINISHED") return { actual_end_at: now };
			if (newStatus === "PENDING") return { actual_start_at: null };
			return {};
		case "FINISHED":
			if (newStatus === "IN_PROGRESS") return { actual_end_at: null };
			if (newStatus === "PENDING")
				return { actual_start_at: null, actual_end_at: null };
			return {};
	}
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/entities/ticket/lib/statusTransitions.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Wire into updateTicket**

In `updateTicket`, replace the `finishDate` computation:
```ts
// before: const finishDate = newStatus === "FINISHED" && ... ? new Date() : ...
```
with:
```ts
// Spec: actual dates derive from the status transition (pure helper).
const now = new Date();
const actualPatch = computeActualDates(oldStatus!, newStatus, now);
```
and in the `update` data, replace `actual_end_at: finishDate,` with `...actualPatch,`. (Same-status saves now preserve the server's actual dates instead of clobbering them with the client's copy.)

- [ ] **Step 6: Wire into updateTicketStatus**

Replace the `data` block:
```ts
data: {
	status,
	...computeActualDates(existing?.status ?? "PENDING", status, new Date()),
},
```
(drop the old `actual_end_at: status === "FINISHED" ? new Date() : null`).

- [ ] **Step 7: Verify + commit**

Run: `npx vitest run src/entities/ticket/lib/statusTransitions.test.ts` then `npx tsc --noEmit`

```bash
git add src/entities/ticket/lib/statusTransitions.ts src/entities/ticket/lib/statusTransitions.test.ts src/entities/ticket/ticketActions.ts
git commit -m "feat(ticket-status): actual dates derive from transitions (PENDING->FINISHED same ts, regressions revert)"
```

### Task 6: Delete options — cascade vs promote (3-option modal)

**Files:**
- Modify: `src/entities/ticket/ticketActions.ts` (cascadeSoftDeleteTicket)
- Modify: `src/entities/ticket/mutations.ts` (useDeleteTicket)
- Modify: `src/features/ticket-board/ui/TicketCard.tsx` (delete dialog)
- Modify: `src/features/ticket-board/ui/TicketBoard.tsx` (handleDeleteTicket)

**Spec (P4):** deleting a ticket WITH subtasks asks the user: **Cascade delete** (soft-delete the whole subtree) / **Promote subtasks** (subtasks become top-level tickets: `parent_id = null`) / **Cancel**. Tickets without subtasks keep the plain confirm.

- [ ] **Step 1: Server action gains a mode**

`cascadeSoftDeleteTicket(ticketId, performed_by, mode: "cascade" | "promote" = "cascade")`:
- `"cascade"` — collect + soft-delete all descendants (the BFS from the previous version of this task):
```ts
const idsToDelete = [ticketId];
let frontier = [ticketId];
while (frontier.length > 0) {
	const children = await db.tickets.findMany({
		where: { parent_id: { in: frontier }, is_deleted: false },
		select: { ticket_id: true },
	});
	frontier = children.map((c) => c.ticket_id);
	idsToDelete.push(...frontier);
}
await db.tickets.updateMany({
	where: { ticket_id: { in: idsToDelete } },
	data: { is_deleted: true, deleted_at: new Date() },
});
```
- `"promote"` — detach the children first, then delete the single ticket (same transaction):
```ts
await db.tickets.updateMany({
	where: { parent_id: ticketId, is_deleted: false },
	data: { parent_id: null },
});
await db.tickets.update({
	where: { ticket_id: ticketId },
	data: { is_deleted: true, deleted_at: new Date() },
});
```
- History: only the deleted ticket gets a `DELETE` history row (descendants are not logged individually).
- Timeline rollup for the workflow stays as-is, after the delete (runs on `db`).

- [ ] **Step 2: Mutation forwards the mode**

`mutations.ts` `useDeleteTicket`:
```ts
mutationFn: (params: {
	ticketId: string;
	mode: "cascade" | "promote";
	performed_by?: string;
}) => cascadeSoftDeleteTicket(params.ticketId, params.performed_by, params.mode),
```

- [ ] **Step 3: Board handler forwards the mode**

`TicketBoard.tsx`:
```tsx
async function handleDeleteTicket(ticketId: string, mode: "cascade" | "promote") {
	try {
		await deleteTicketMutation.mutateAsync({
			ticketId,
			mode,
			performed_by: user?.profile_id,
		});
		toast.add({
			title: "Ticket Deleted",
			description: `Ticket has been deleted successfully.`,
			type: "delete",
		});
	} catch (error) {
		toast.add({
			title: "Delete Failed",
			description: error instanceof Error ? error.message : "Something went wrong.",
			type: "error",
		});
	}
}
```

- [ ] **Step 4: 3-option dialog in TicketCardContent**

Replace the plain `AlertDialog` in `TicketCardContent` with a branching dialog:
```tsx
const hasSubtasks = subtasks.length > 0;

// — when hasSubtasks: 3 options —
<AlertDialog open={isDeleteModalOpen} onOpenChange={(open) => { if (!open) setIsDeleteModalOpen(false); }}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
			<AlertDialogDescription>
				<span className="font-medium text-foreground">{ticket.name}</span> has{" "}
				<strong>{subtasks.length}</strong> subtask{subtasks.length === 1 ? "" : "s"}.
				What should happen to them?
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter className="flex-col sm:flex-col gap-2">
			<AlertDialogAction
				onClick={() => { setIsDeleteModalOpen(false); onDelete(ticket.ticket_id, "cascade"); }}
			>
				Cascade delete (subtasks too)
			</AlertDialogAction>
			<AlertDialogAction
				onClick={() => { setIsDeleteModalOpen(false); onDelete(ticket.ticket_id, "promote"); }}
			>
				Promote subtasks to tickets
			</AlertDialogAction>
			<AlertDialogCancel onClick={() => setIsDeleteModalOpen(false)}>
				Cancel
			</AlertDialogCancel>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
```
- When `!hasSubtasks`: keep today's single-confirm dialog (delete + cancel), calling `onDelete(ticket.ticket_id, "cascade")` (mode irrelevant for childless tickets).
- The delete trigger button must remain hidden for `readOnly` (Task 2) — untouched here.

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/features/ticket-board src/entities/ticket`

```bash
git add src/entities/ticket src/features/ticket-board
git commit -m "feat(ticket-delete): 3-option dialog — cascade / promote subtasks / cancel"
```

### Task 7: Error handling — board + editor

**Files:**
- Modify: `src/features/ticket-board/ui/TicketBoard.tsx`
- Modify: `src/features/ticket-board/ui/editor/TicketActivitySection.tsx`

- [ ] **Step 1: TicketBoard create — stop the false success toast**

`handleCreateTicket` becomes a pass-through (the modal owns all toasts — success at TicketModals.tsx:324, failure at :334):
```tsx
async function handleCreateTicket(data: CreateTicketFormData) {
	await createTicketMutation.mutateAsync({
		...data,
		workflow_id: workflow_id,
		status: TicketStatus.PENDING,
		TicketAssigned: data.TicketAssigned ?? [],
		tagIds: data.tagIds ?? [],
		performed_by: user?.profile_id,
	} as CreateTicketParams & { performed_by?: string });
	setModalOpen(false);
}
```
(delete the try/catch + the duplicate success toast).

- [ ] **Step 2: TicketBoard drag-end — awaited + error toast**

```tsx
async function handleDragEnd(event: DragEndEvent) {
	if (isClientProfile) return;
	const { active, over } = event;
	setActiveId(null);

	if (over && active.id !== over.id) {
		const newStatus = over.id as TicketStatus;
		try {
			await updateStatusMutation.mutateAsync({
				ticketId: active.id as string,
				status: newStatus,
				performed_by: user?.profile_id,
			});
		} catch (error) {
			toast.add({
				title: "Move Failed",
				description: error instanceof Error ? error.message : "Something went wrong.",
				type: "error",
			});
		}
	}

	setTimeout(() => {
		wasDraggingRef.current = false;
	}, 100);
}
```

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/features/ticket-board`

```bash
git add src/features/ticket-board
git commit -m "fix(ticket-board): real success/error toasts for create/move"
```

### Task 8: Comments + attachments load without refresh

**Files:**
- Modify: `src/entities/comment/queries.ts`
- Modify: `src/entities/ticket/mutations.ts` (image-key invalidation)
- Modify: `src/features/ticket-board/ui/editor/TicketEditor.tsx` (error surfacing)
- Modify: `src/features/ticket-board/ui/TicketModals.tsx` (all-or-nothing upload — moved from Task 9)

**Root causes (2026-08-15):**
- **Comments invisible until refresh (P3):** `useTicketComments` builds its key with the literal `"TICKET"` (`commentKeys.list("TICKET", id)`) but `useCreateComment` invalidates with the enum value `"TICKET_COMMENT"` — the invalidation never matches, so a posted comment only appears on a later refetch. Comment attachments ride the same bug (they are joined into the comment rows).
- **Attachments (P2):** (a) upload failures in the create modal are swallowed (`console.error` only) and the ticket is still created without images; (b) `commentKeys.images` is never invalidated after create/update; (c) the slide-over's comment/image queries have no `isError` UI — a failed read silently renders as an empty list.

- [ ] **Step 1: Fix the query-key mismatch (P3 — the main bug)**

`src/entities/comment/queries.ts`:
```ts
list: (ticketId: string | undefined) =>
	queryOptions({
		// MUST match the invalidation key in useCreateComment
		// (commentKeys.list(CommentParentType.TICKET_COMMENT, parentId)).
		queryKey: commentKeys.list(CommentParentType.TICKET_COMMENT, ticketId!),
		queryFn: () => selectComment(CommentParentType.TICKET_COMMENT, ticketId!),
		enabled: !!ticketId,
	}),
```

- [ ] **Step 2: Invalidate image keys on create/update**

`src/entities/ticket/mutations.ts` — in `useCreateTicket` and `useUpdateTicket` `onSuccess`:
```ts
await queryClient.invalidateQueries({
	queryKey: commentKeys.images(ImageParentType.TICKET, data.ticket_id),
});
```
(import `commentKeys` from `@/shared/query/keys` and `ImageParentType` from the generated prisma; for `useCreateTicket` use the returned `data.ticket_id`, for `useUpdateTicket` use `variables.ticket_id`.)

- [ ] **Step 3: Surface slide-over query errors (no more silent [])**

In `TicketEditor`, next to the existing hooks:
```tsx
const commentsQuery = useTicketComments(initialTicket.ticket_id);
const imagesQuery = useTicketImages(initialTicket.ticket_id);
const comments = commentsQuery.data ?? [];
const ticketImages = imagesQuery.data ?? [];

const loadFailed = commentsQuery.isError || imagesQuery.isError;
```
Render a small error banner instead of silently empty content (place above the Activity section):
```tsx
{loadFailed && (
	<div className="px-5 py-3 text-xs text-red-600 bg-red-50 border-y border-red-100">
		Couldn't load comments or attachments.{" "}
		<button
			type="button"
			className="underline font-semibold"
			onClick={() => {
				void commentsQuery.refetch();
				void imagesQuery.refetch();
			}}
		>
			Retry
		</button>
	</div>
)}
```

- [ ] **Step 4: All-or-nothing image upload (P2)**

`TicketModals.tsx` handleSubmit upload block — track uploaded paths and remove them on failure, aborting ticket creation:
```ts
const uploadedPaths: string[] = [];
if (imageFiles.length > 0) {
	try {
		const supabase = createClient();
		for (const file of imageFiles) {
			...existing upload code...
			uploadedPaths.push(filePath);
			imageUrls.push(publicUrl);
		}
	} catch (err) {
		console.error("Image upload failed:", err);
		if (uploadedPaths.length > 0) {
			await supabase.storage.from("images").remove(uploadedPaths);
		}
		toast.add({
			title: "Upload Failed",
			description: "Your images could not be uploaded. The ticket was not created.",
			type: "error",
		});
		setIsSubmitting(false);
		return; // abort — no ticket with missing attachments
	}
}
```
Replace the `alert()` at line ~181 with `toast.add({ title: "File Too Large", description: `"${file.name}" must be under 5MB.`, type: "error" })`. Apply the same all-or-nothing pattern to comment images in `TicketActivitySection` (uploaded comment-image files are removed from storage on failure).

- [ ] **Step 5: Verify — including a manual smoke test**

Run: `npx tsc --noEmit` then `npx eslint src/entities/comment src/entities/ticket src/features/ticket-board`
Manual smoke (dev server):
1. Create a ticket with an attachment → open its slide-over → attachment must render without refresh.
2. Post a comment WITH an image → comment + image must appear immediately (no refresh).
3. If the attachment `<img>` 404s despite the row existing, check the `images` storage bucket is public (`getPublicUrl` yields a public URL) — storage policy is an environment concern, not code.

```bash
git add src/entities/comment/queries.ts src/entities/ticket/mutations.ts src/features/ticket-board
git commit -m "fix(ticket-board): comments + attachments load without refresh (query-key + invalidation + error UI)"
```

### Task 9: Nits — FSD, codes, a11y, types, uploads

**Files:**
- Create: `src/entities/issue/types.ts`
- Modify: `src/features/issue-reporting/ui/IssueDashboard.tsx` (re-export only)
- Modify: `src/features/ticket-board/ui/editor/helpers.tsx`
- Modify: `src/features/ticket-board/ui/editor/TicketEditorSubcomponents.tsx`
- Modify: `src/features/ticket-board/ui/TicketModals.tsx`
- Modify: `src/features/ticket-board/ui/TicketBoard.tsx` (KeyboardSensor)
- Modify: `src/features/ticket-board/ui/editor/TicketActivitySection.tsx`
- Modify: `src/features/ticket-board/ui/editor/TicketEditor.tsx` (codes)
- Modify: `src/features/ticket-board/ui/TicketHistoryLog.tsx` (dead state)

- [ ] **Step 1: Move IssueItem to the entities layer (FSD same-layer violation)**

The three `eslint-disable-next-line boundaries/dependencies` imports of `@/features/issue-reporting/ui/IssueDashboard` are same-layer feature→feature imports. Create the canonical type:
`src/entities/issue/types.ts`:
```ts
export type UrgencyLevel = "low" | "medium" | "high";

export type BugType =
	| "feature_request"
	| "deadlinks"
	| "missing_fields"
	| "not_saving"
	| "slow_loading"
	| "other";

export interface StepItem {
	id: string;
	description: string;
	image?: string;
}

export interface IssueItem {
	id: string;
	name: string;
	type: BugType;
	specificType?: string;
	urgency: UrgencyLevel;
	status: "unlinked" | "linked" | "resolved";
	clientName: string;
	reportedAt: string;
	description: string;
	systemEnv: string;
	timeOfError: string;
	ticketName?: string;
	steps: StepItem[];
}
```
In `IssueDashboard.tsx` replace the local type definitions (lines 39-70) with:
```ts
export type {
	UrgencyLevel,
	BugType,
	StepItem,
	IssueItem,
} from "@/entities/issue";
```
(keep `UrgencyFilterOption` local). Update the three ticket-board imports to `import type { IssueItem } from "@/entities/issue";` and DELETE the `eslint-disable-next-line boundaries/dependencies` comments above them.

- [ ] **Step 2: Replace hardcoded ticket codes with a deterministic short code**

Add to `helpers.tsx`:
```ts
/** Stable short display code derived from the uuid (no fake 'LRN-BNN' strings). */
export function ticketCode(ticketId: string): string {
	return ticketId.slice(0, 8).toUpperCase();
}
```
Use it: `TicketEditor.tsx:58` (`{isSubtaskView ? "Subtask" : ticketCode(initialTicket.ticket_id)}`), `TicketEditor.tsx:178` (`{ticketCode(subtask.ticket_id)}`), `TicketCard.tsx:184` (`{isSubtask ? "SUB-TASK" : ticketCode(ticket.ticket_id)}`).

- [ ] **Step 3: a11y — dnd-kit KeyboardSensor + aria-labels**

- `TicketBoard.tsx`: add `KeyboardSensor` to the sensors:
```tsx
import { KeyboardSensor, MouseSensor, TouchSensor, ... } from "@dnd-kit/core";
...
const keyboardSensor = useSensor(KeyboardSensor);
const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);
```
- Add `aria-label`s: card delete (done in Task 2), subtask remove button (`aria-label="Remove subtask"`, TicketEditor.tsx:219), watcher clear button (TicketEditorSubcomponents.tsx:330, `aria-label="Clear watcher"`), attachment/comment remove buttons.

- [ ] **Step 4: Type the `any`s in TicketActivitySection**

- `comments: any[]` → `comments: CommentWithImages[]` with
  `import type { CommentWithImages } from "@/entities/comment/types";`
  (check `useTicketComments`'s actual return type first and align; adjust field names if the component reads `profile`/`images` differently).
- `img: any` in the comments map → type from the same `CommentWithImages` shape.

- [ ] **Step 5: Dead code**

- `TicketHistoryLog.tsx`: remove the unused `expanded`/`hasMore` state (lines ~308-311) — verify they're truly unused before deleting.

- [ ] **Step 6: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/features/ticket-board src/entities/issue src/features/issue-reporting/ui/IssueDashboard.tsx`

```bash
git add src/entities/issue src/features/issue-reporting/ui/IssueDashboard.tsx src/features/ticket-board
git commit -m "chore(ticket-board): FSD type move, deterministic ticket codes, a11y, dead code"
```

### Task 10: Full verification + sign-off

- [ ] **Step 1: Full check suite**

Run each and record results:
1. `npx prisma validate`
2. `npx tsc --noEmit`
3. `npx vitest run` (all — must include the new `statusTransitions.test.ts`)
4. `npx eslint src/features/ticket-board src/entities/ticket src/entities/comment src/entities/profile src/entities/issue src/shared/schemas`
5. `npm run build`

- [ ] **Step 2: Record the sign-off in `docs/code-review-plan.md`**

Under "Other follow-ups → Ticket-board integration (2026-08-15 review)": flip each sub-item to `[x]` with the commit hash; mark the date-rules TODO items (DB migration, form/editor) complete; mark the plan file executed. Note the spec revisions: `plan_end_at` stays required (only `plan_start_at` nullable); parent delete is a 3-option modal (cascade/promote/cancel); assignee/watcher dropdowns are project-scoped.

- [ ] **Step 3: Final commit**

```bash
git add docs/code-review-plan.md docs/reasonix/plans/2026-08-15-ticket-board-integration.md
git commit -m "docs: sign off ticket-board integration (per-file review checkboxes)"
```

---

## Out of scope (tracked in docs/code-review-plan.md)

- Migrating `TicketModalCreate`/`TicketEditor` to the `useAppForm` form kit — the modals use manual `useState` forms (inconsistent with stage-editor modals, which were migrated); deferred to a dedicated form-kit pass to keep this plan focused on subtasks/dates/permissions.
- `Stages.sort_key` cleanup, gate-approval persistence, contract-page role UI, knip cleanup — unrelated follow-ups.
- The legacy `features/issue-reporting` slice itself (mock IssueDashboard/IssueTableModal remain unchecked) — only the `IssueItem` type moved to `entities/issue`.
- Deleting a parent whose subtasks are in a DIFFERENT workflow — `parent_id` is workflow-agnostic today; the subtree cascade collects by `parent_id` regardless of workflow (documented behavior).
- Storage bucket visibility (public vs private) — environment config; the plan adds a diagnostic step but cannot change Supabase policy from code.
