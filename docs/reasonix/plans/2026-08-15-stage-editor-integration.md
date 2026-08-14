# Stage Editor Integration Plan

> **STATUS: EXECUTED 2026-08-15** — implemented inline (superpowers-executing-plans),
> commits `859f78a` (Task 1), `8405c1a` (Task 2), `18d5d7d` (Task 3), `aed0a82`
> (Task 4), `380ced3` (Task 5), `f161f7e` (Task 6), docs sign-off (Task 7).
> Verification: `prisma validate` ✓ · `tsc --noEmit` ✓ · `vitest run` 219/219 ✓ ·
> `eslint` on touched dirs ✓ · `npm run build` ✓.

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the newly committed `src/features/stage-editor` slice properly: clients get a read-only view, team/owners keep full edit access, the date-rules TODO is completed (required plan dates end-to-end), module/workflow modals migrate to the app form kit, and the review findings (error handling, casts, dead code) are fixed.

**Architecture:** UI permission gating follows the established `isClientProfile = !!profile?.client_id` pattern (ProjectStructure); server-side authz already rejects clients (`assertProjectMemberNotClient`), so this pass only fixes the UI surface. Date rules: shared schemas become required `z.date()`, server actions drop `?? new Date()` fallbacks (DB columns are already NOT NULL), and the modals keep a nullable-input / required-output local schema so `new Date()` is never instantiated to satisfy validation. Module/Workflow modals are rewritten on `useAppForm` mirroring `PhaseModals.tsx`.

**Tech Stack:** Next.js App Router, TanStack Form v1 (`createFormHook`), zod v4 (use the `error` param — `message` is deprecated), TanStack Query v5, Prisma, next-safe-action.

**Spec decisions (user-confirmed 2026-08-15):**
1. Clients: hide ALL edit controls (Add/Edit/Delete/DnD) — read-only view.
2. Project Team and Project Owners: identical full access (no owner-only gates on this page).
3. Full date-rules pass in scope (schemas + server actions + tests).
4. ModuleModals/WorkflowModals migrate to `useAppForm`.

---

### Task 1: Client read-only gating (hide all edit controls)

**Files:**
- Modify: `src/app/(app)/(workspace)/projects/[projectId]/stages/[stageId]/page.tsx`
- Modify: `src/features/stage-editor/ui/PhaseCard.tsx`
- Modify: `src/features/stage-editor/ui/ModuleCard.tsx`
- Modify: `src/features/stage-editor/ui/WorkflowCard.tsx`

- [ ] **Step 1: Gate the page (Add Phase button + pass `readOnly`)**

In `page.tsx`:
```tsx
import { useCurrentUser } from "@/entities/profile/queries";
// inside EditorContent, next to the other hooks:
const { data: profile } = useCurrentUser();
const isClientProfile = !!profile?.client_id;
```
Wrap the Add Phase button:
```tsx
{!isClientProfile && (
  <Button onClick={() => stepperRef.current?.openCreateModal()}>
    <Plus />
    Add Phase
  </Button>
)}
```
Pass the flag down:
```tsx
<PhaseCard
  ref={stepperRef}
  phases={phases}
  stageId={stageId}
  activePhase={activePhase}
  setActivePhase={setActivePhase}
  readOnly={isClientProfile}
/>
<ModuleCard
  activePhase={activePhase}
  phases={phases}
  projectId={projectId}
  stageId={stageId}
  readOnly={isClientProfile}
/>
```

- [ ] **Step 2: PhaseCard honors `readOnly`**

```tsx
interface PhaseCardProps {
	phases: Phase[];
	stageId: string;
	activePhase: number | null;
	setActivePhase: (phase: number | null) => void;
	readOnly?: boolean;
}
```
- Destructure `readOnly = false` in the component.
- Edit pencil button (currently line ~291): wrap in `{!readOnly && ( … )}`.
- Delete X button (line ~301): wrap in `{!readOnly && ( … )}` AND add the missing label:
  `aria-label={`Delete phase ${phase.number ?? ""}`}` (a11y fix).
- Phase node container: `draggable={!readOnly}`; guard the handlers:
```tsx
const handleDragStart = (e: React.DragEvent, index: number) => {
	if (readOnly) return;
	…
};
```
(same guard at the top of `handleDragOver` and `handleDrop`).
- The phase node circle button stays clickable for clients (selecting/reading is allowed).
- Remove `focus:outline-none` from the node button (line ~271) so the native focus ring remains (a11y).

- [ ] **Step 3: ModuleCard honors `readOnly`**

- Add `readOnly?: boolean` to `ModuleCardProps`, destructure with default `false`.
- Add Module button (line ~236): wrap in `{!readOnly && ( … )}`.
- Edit ellipsis button (line ~348): wrap in `{!readOnly && ( … )}` and add `aria-label="Edit module"`.
- Delete flow is only reachable through the edit modal → automatically hidden.

- [ ] **Step 4: WorkflowCard honors `readOnly`**

- Add `readOnly?: boolean` to `WorkflowCardProps`, destructure with default `false`.
- Row: `draggable={!readOnly}`; guard `handleDragStart`/`handleDragOver`/`handleDrop` with `if (readOnly) return;`.
- Edit ellipsis (line ~411): condition becomes `{!readOnly && getWorkflowStatus(workflow as WorkflowWithActuals) !== "ended" && ( … )}` and add `aria-label="Edit workflow"`.
- Add Workflow button (line ~429): wrap in `{!readOnly && ( … )}`.

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/app/"(app)"/"(workspace)"/projects/"[projectId]"/stages/"[stageId]"/page.tsx src/features/stage-editor`
Expected: no type errors, no lint errors.

```bash
git add src/app/"(app)"/"(workspace)"/projects/"[projectId]"/stages/"[stageId]"/page.tsx src/features/stage-editor
git commit -m "feat(stage-editor): clients get read-only view (hide all edit controls)"
```

### Task 2: Align types — kill the unsafe cast, match the DB

**Files:**
- Modify: `src/entities/stage/stageActions.ts` (node type overrides)
- Modify: `src/features/stage-editor/types.ts`
- Modify: `src/app/(app)/(workspace)/projects/[projectId]/stages/[stageId]/page.tsx`
- Modify: `src/features/stage-editor/ui/WorkflowCard.tsx`

**Why:** `getStageTree` maps `planStart: p.plan_start_at` — Prisma types those as `Date` (DB NOT NULL, verified in `prisma/schema.prisma`), but the node type overrides claim `Date | null`, and the page papers over the mismatch with `as unknown as Phase[]` (which also hides `description: string | null`).

- [ ] **Step 1: Server node types → `Date` for plan dates**

In `stageActions.ts`, all three node types (`WorkflowNode`, `ModuleNode`, `PhaseNode`) change:
```ts
planStart: Date | null;   →   planStart: Date;
planEnd: Date | null;     →   planEnd: Date;
```
(`actualStart`/`actualEnd` stay `Date | null`.)

- [ ] **Step 2: Slice types match the server + DB**

`src/features/stage-editor/types.ts`:
```ts
// Phase
description: string | null;   // was: string (Prisma payload is nullable)
planStart: Date;              // was: Date (DB NOT NULL; keep required per date rules)
planEnd: Date;                // was: Date | null
// Module
planStart: Date;              // was: Date
planEnd: Date;                // was: Date | null
// Workflow
planStart: Date;              // was: Date
planEnd: Date;                // was: Date | null
```
UI truthiness checks like `phase.planStart && phase.planEnd` (PhaseCard.tsx:325) become always-true — leave them (harmless) or simplify to render unconditionally.

- [ ] **Step 3: Page — remove the cast**

```tsx
// was: const phases = (stageTree?.phases ?? []) as unknown as Phase[];
const phases: Phase[] = stageTree?.phases ?? [];
```
`PhaseNode` is structurally assignable to `Phase` once the types above align (extra payload fields are fine).

- [ ] **Step 4: WorkflowCard — drop the redundant type + casts + unused imports**

- Delete `WorkflowWithActuals` (line ~35) — `actualStart` is already on `Workflow` in types.ts.
- Replace `workflow as WorkflowWithActuals` (lines ~281, ~411) with plain `workflow`.
- Remove unused `Pencil, X` from the lucide import (line 16) — they're used only in PhaseCard.

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit`
Expected: clean (the previous cast disappears; no `as unknown` left in the page).

```bash
git add src/entities/stage/stageActions.ts src/features/stage-editor src/app/"(app)"/"(workspace)"/projects/"[projectId]"/stages/"[stageId]"/page.tsx
git commit -m "refactor(stage-editor): align plan-date types with DB, remove unsafe cast"
```

### Task 3: Date-rules pass — required plan dates end-to-end

**Files:**
- Modify: `src/shared/schemas/project.ts`
- Modify: `src/entities/phase/safeActions.ts`
- Modify: `src/entities/module/moduleActions.ts`
- Modify: `src/entities/workflow/workflowActions.ts`
- Modify: `src/features/stage-editor/ui/modals/PhaseModals.tsx`
- Modify: `src/features/stage-editor/ui/ModuleCard.tsx`
- Modify: `src/features/stage-editor/ui/WorkflowCard.tsx`
- Test: `src/shared/schemas/project.test.ts`

**Rules applied (docs/code-review-plan.md date rules):** planStart/planEnd REQUIRED for phases/modules/workflows; actual dates stay optional; NEVER `new Date()` to satisfy a schema.

- [ ] **Step 1: Schemas — required plan dates (zod v4 `error` param)**

In `project.ts`, the three base schemas (`basePhase` line 76-77, `baseModule` line 113-114, `baseWorkflow` line 144-145):
```ts
planStart: z.date({ error: "Plan Start Date is required" }),
planEnd: z.date({ error: "Plan End Date is required" }),
```
Keep `actualStart`/`actualEnd` as `z.date().optional().nullable()`. The create schemas' range refines (`hasValidPlannedRange(toSchedulingDates(data))`) keep working unchanged; update schemas stay `.partial()` (update must not force resending dates).

- [ ] **Step 2: Server actions — drop `?? new Date()` fallbacks**

- `safeActions.ts:85,88` (createPhaseAction):
  `plan_start_at: parsedInput.planStart` and `plan_end_at: parsedInput.planEnd` (both now typed `Date`).
- `moduleActions.ts:41,44` (createModule):
  `plan_start_at: planStart` / `plan_end_at: planEnd` (params typed `ModuleCreateInput` — now required).
- `workflowActions.ts:59,64` (createWorkflow):
  `plan_start_at: planStart` / `plan_end_at: planEnd`.
- `stageActions.ts` needs no change: `createStage` already takes required `startDate`/`endDate` (the `TODO(date-rules)` doc comment is already satisfied).
- Update actions already map `?? undefined` and are fine.

- [ ] **Step 3: Fix the create call sites (non-null assertion, validated by the modal schema)**

- `PhaseModals.tsx` onSubmit (create + update): `planStart: value.planStart ?? undefined` → `planStart: value.planStart!` (same for `planEnd`); actuals keep `?? undefined`. Comment: `// non-null guaranteed by phaseModalSchema (required plan dates)`.
- `ModuleCard.tsx` `handleAddModule`: `planStart: data.planStart!`, `planEnd: data.planEnd!` (the modal schema already rejects null at submit).
- `WorkflowCard.tsx` `handleAddWorkflow`: same `!` for planStart/planEnd.
- (Task 4 removes the ModuleCard/WorkflowCard handlers entirely — the `!` here is the interim fix that keeps every task compiling.)

- [ ] **Step 4: Tests — flip the "missing dates" case, add rejection tests (TDD)**

`project.test.ts`:
- moduleCreateSchema "accepts missing dates entirely" (line ~99) → rename "rejects missing plan dates" and flip to:
```ts
const result = moduleCreateSchema.safeParse({
	name: "Auth",
	planStart: null,
	planEnd: null,
	actualStart: null,
	actualEnd: null,
});
expect(result.success).toBe(false);
if (!result.success) {
	expect(result.error.issues.some((i) => i.path.includes("planStart"))).toBe(true);
}
```
- phaseCreateSchema "rejects inverted actual range" (line ~139): provide valid plan dates so the failure is genuinely about the actual range:
```ts
planStart: d("2024-01-01T00:00:00Z"),
planEnd: d("2024-01-10T00:00:00Z"),
```
- Add to the phase describe block: "rejects missing plan dates" (name + planStart/planEnd null → `success === false`, issue path includes "planStart").
- Add to the workflow describe block: "rejects missing plan dates" (valid name, planStart/planEnd null, `isApproved: false` → `success === false`).

- [ ] **Step 5: Verify + commit**

Run: `npx vitest run src/shared/schemas/project.test.ts` then `npx tsc --noEmit`
Expected: all schema tests pass; typecheck clean.

```bash
git add src/shared/schemas/project.ts src/shared/schemas/project.test.ts src/entities/phase/safeActions.ts src/entities/module/moduleActions.ts src/entities/workflow/workflowActions.ts src/features/stage-editor
git commit -m "feat(date-rules): plan dates required for phases/modules/workflows; drop new Date() fallbacks"
```

### Task 4: Migrate ModuleModals + WorkflowModals to the app form kit

**Files:**
- Rewrite: `src/features/stage-editor/ui/modals/ModuleModals.tsx`
- Rewrite: `src/features/stage-editor/ui/modals/WorkflowModals.tsx`
- Modify: `src/features/stage-editor/ui/ModuleCard.tsx`
- Modify: `src/features/stage-editor/ui/WorkflowCard.tsx`

**Design:** mirror `PhaseModals.tsx` exactly — `useAppForm` with `validators.onSubmit`, async `onSubmit` owning the mutations, `useResetOnOpen`, `useSelector(form.store, …)` for isDirty, `form.SubmitButton` with `pendingLabel`, discard-confirm modal. The modals OWN create/update mutations (delete stays in the cards via `onDelete`). This kills the close-before-save bug by construction.

- [ ] **Step 1: Rewrite ModuleModals.tsx**

```tsx
"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useSelector } from "@tanstack/react-form";

import type { Module } from "../../types";
import { useAppForm, formErrorToMessage } from "@/shared/form";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import {
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
import { useCreateModule, useUpdateModule } from "@/entities/module/mutations";
import {
	Button,
	ConfirmationModal,
	DateTimePicker,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FormInput,
	toast,
} from "@/components/ui";

export interface ModuleModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** Pass a `module` for Edit mode, or `null`/`undefined` for Create mode. */
	module?: Module | null;
	activePhase?: number | null;
	stageId: string;
	/** Parent phase — required for Create mode. */
	phaseId?: string | null;
	onDelete?: () => void;
}

const moduleModalSchema = z
	.object({
		name: z
			.string()
			.min(1, "Module name is required")
			.max(35, "Module name must be 35 characters or less"),
		planStart: z
			.date()
			.nullable()
			.refine((val): val is Date => val !== null, {
				error: "Plan Start Date is required",
			}),
		planEnd: z
			.date()
			.nullable()
			.refine((val): val is Date => val !== null, {
				error: "Plan End Date is required",
			}),
		actualStart: z.date().optional().nullable(),
		actualEnd: z.date().optional().nullable(),
	})
	.superRefine((data, ctx) => {
		if (!hasValidPlannedRange(toSchedulingDates(data))) {
			ctx.addIssue({
				code: "custom",
				message: "Start must be before End",
				path: ["planStart"],
			});
			ctx.addIssue({
				code: "custom",
				message: "End must be after Start",
				path: ["planEnd"],
			});
		}
	});

type ModuleFormValues = z.input<typeof moduleModalSchema>;

export function ModuleModal({
	isOpen,
	onClose,
	module,
	activePhase,
	stageId,
	phaseId,
	onDelete,
}: ModuleModalProps) {
	const isEditMode = Boolean(module);
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const createModuleMutation = useCreateModule();
	const updateModuleMutation = useUpdateModule();

	const defaultValues: ModuleFormValues = useMemo(
		() => ({
			name: module?.name ?? "",
			planStart: module?.planStart ? new Date(module.planStart) : null,
			planEnd: module?.planEnd ? new Date(module.planEnd) : null,
			actualStart: module?.actualStart ? new Date(module.actualStart) : null,
			actualEnd: module?.actualEnd ? new Date(module.actualEnd) : null,
		}),
		[module],
	);

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: moduleModalSchema },
		onSubmit: async ({ value }) => {
			if (isEditMode && module) {
				await updateModuleMutation.mutateAsync({
					moduleId: module.module_id,
					stageId,
					name: value.name,
					// non-null guaranteed by moduleModalSchema (required plan dates)
					planStart: value.planStart!,
					planEnd: value.planEnd!,
					actualStart: value.actualStart ?? undefined,
					actualEnd: value.actualEnd ?? undefined,
				});
				toast.add({
					title: "Module Edited",
					description: `"${value.name}" has been edited successfully.`,
					type: "success",
				});
			} else {
				if (!phaseId) return;
				await createModuleMutation.mutateAsync({
					phaseId,
					stageId,
					name: value.name,
					planStart: value.planStart!,
					planEnd: value.planEnd!,
					actualStart: value.actualStart ?? undefined,
					actualEnd: value.actualEnd ?? undefined,
				});
				toast.add({
					title: "Module Added",
					description: `"${value.name}" has been added successfully.`,
					type: "success",
				});
			}
			handleClose();
		},
	});

	// Correct TanStack Form store subscription (useStore is a deprecated alias).
	const isDirty = useSelector(form.store, (state) => state.isDirty);

	useResetOnOpen(isOpen, () => {
		form.reset(defaultValues);
		setShowDiscardConfirm(false);
	});

	const handleClose = () => {
		form.reset();
		setShowDiscardConfirm(false);
		onClose();
	};

	const handleAttemptClose = () => {
		if (isDirty) {
			setShowDiscardConfirm(true);
			return;
		}
		handleClose();
	};

	const handleConfirmDiscard = () => {
		setShowDiscardConfirm(false);
		handleClose();
	};

	const isPending = createModuleMutation.isPending || updateModuleMutation.isPending;

	return (
		<>
			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) handleAttemptClose();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{isEditMode ? "Edit Module" : "Create New Module"}
						</DialogTitle>
						<DialogDescription>
							{isEditMode
								? "Update the module details below."
								: `Fill in the details to create a new module for Phase ${activePhase ?? ""}.`}
						</DialogDescription>
					</DialogHeader>

					<form.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								void form.handleSubmit();
							}}
						>
							<div className="flex flex-col gap-4">
								<form.AppField name="name">
									{(field) => (
										<FormInput
											label="Module Name"
											required
											maxLength={35}
											value={field.state.value}
											placeholder="e.g., Authentication & Identity"
											error={
												formErrorToMessage(field.state.meta.errors[0]) ??
												undefined
											}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									)}
								</form.AppField>

								<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
									<form.AppField name="planStart">
										{(field) => (
											<DateTimePicker
												label="Plan Start"
												required
												value={
													field.state.value
														? new Date(field.state.value)
														: undefined
												}
												onChange={(date) => field.handleChange(date ?? null)}
												placeholder="Pick Planned Start"
												error={
													formErrorToMessage(field.state.meta.errors[0]) ??
													undefined
												}
											/>
										)}
									</form.AppField>

									<form.AppField name="planEnd">
										{(field) => (
											<DateTimePicker
												label="Plan End"
												required
												value={
													field.state.value
														? new Date(field.state.value)
														: undefined
												}
												onChange={(date) => field.handleChange(date ?? null)}
												placeholder="Pick Planned End"
												error={
													formErrorToMessage(field.state.meta.errors[0]) ??
													undefined
												}
											/>
										)}
									</form.AppField>
								</div>
							</div>

							<DialogFooter className="mt-6" showCloseButton={false}>
								{isEditMode && onDelete && (
									<Button
										type="button"
										className="mr-auto"
										variant="destructive"
										onClick={onDelete}
									>
										<Trash2 className="mr-2 h-4 w-4" /> Delete Module
									</Button>
								)}
								<Button
									type="button"
									variant="ghost"
									onClick={handleAttemptClose}
									disabled={isPending}
								>
									Cancel
								</Button>
								<form.SubmitButton pendingLabel={isEditMode ? "Saving…" : "Adding…"}>
									{isEditMode ? (
										<>
											<Save className="mr-2 h-4 w-4" /> Save Changes
										</>
									) : (
										<>
											<Plus className="mr-2 h-4 w-4" /> Add Module
										</>
									)}
								</form.SubmitButton>
							</DialogFooter>
						</form>
					</form.AppForm>
				</DialogContent>
			</Dialog>

			{/* Discard Unsaved Changes Confirmation Modal */}
			<ConfirmationModal
				isOpen={showDiscardConfirm}
				title="Discard Unsaved Changes?"
				description="You have unsaved information in this module. Are you sure you want to discard your changes?"
				cancelLabel="Keep Editing"
				confirmLabel="Discard Changes"
				variant="destructive"
				onConfirm={handleConfirmDiscard}
				onCancel={() => setShowDiscardConfirm(false)}
			/>
		</>
	);
}

// ── Backward-compatible Aliases ──────────────────────────────────────────────

export function AddModule(props: Omit<ModuleModalProps, "module">) {
	return <ModuleModal {...props} module={null} />;
}

export function EditModule(props: ModuleModalProps) {
	return <ModuleModal {...props} />;
}
```
Note: `ModuleFormData` is no longer exported — grep for `ModuleFormData`/`WorkflowFormData` consumers first; the cards' handlers are removed in Step 3, and nothing else imports them.

- [ ] **Step 2: Rewrite WorkflowModals.tsx** — same shape as Step 1 with:
  - `WorkflowModalProps`: `{ isOpen; onClose; workflow?: Workflow | null; moduleId: string; stageId: string; onDelete?: () => void }`
  - `workflowModalSchema` (name ≤ 35, required plan dates, planned-range superRefine)
  - onSubmit: update → `updateWorkflowMutation` (workflowId), create → `createWorkflowMutation` (moduleId) with toasts "Workflow Edited"/"Workflow Created"
  - Dialog title/description strings for workflows; Delete Workflow button; aliases `AddWorkflow`/`EditWorkflow`.

- [ ] **Step 3: Slim ModuleCard + WorkflowCard (modals own the mutations)**

ModuleCard:
- Delete `handleAddModule`, `handleSaveModule`, and the three mutation hooks (`createModuleMutation`, `updateModuleMutation`, `deleteModuleMutation` — delete stays in the card! keep `useDeleteModule`).
- Replace the modal JSX:
```tsx
<AddModule
	isOpen={isAddOpen}
	activePhase={activePhase}
	stageId={stageId}
	phaseId={currentPhase?.phase_id ?? null}
	onClose={() => setIsAddOpen(false)}
/>
<EditModule
	isOpen={editingModule !== null}
	module={editingModule}
	stageId={stageId}
	onClose={() => setEditingModule(null)}
	onDelete={handleEditDeleteClick}
/>
```

WorkflowCard:
- Delete `handleAddWorkflow`, `handleSaveWorkflow`, and `useCreateWorkflow`/`useUpdateWorkflow` (keep `useDeleteWorkflow`, `useReorderWorkflow`).
- Replace the modal JSX:
```tsx
<AddWorkflow
	isOpen={isAddOpen}
	moduleId={moduleId}
	stageId={stageId}
	onClose={() => setIsAddOpen(false)}
/>
<EditWorkflow
	isOpen={editingWorkflow !== null}
	workflow={editingWorkflow}
	moduleId={moduleId}
	stageId={stageId}
	onClose={() => setEditingWorkflow(null)}
	onDelete={() => editingWorkflow && confirmDelete(editingWorkflow)}
/>
```

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/features/stage-editor`
Expected: clean. Manual smoke: create/edit a module and a workflow — the modal must stay open with the pending label until the mutation resolves.

```bash
git add src/features/stage-editor
git commit -m "refactor(stage-editor): migrate module/workflow modals to useAppForm (await mutations before close)"
```

### Task 5: Error handling — surface real failures

**Files:**
- Modify: `src/entities/module/mutations.ts`
- Modify: `src/entities/workflow/mutations.ts`
- Modify: `src/features/stage-editor/ui/PhaseCard.tsx`
- Modify: `src/features/stage-editor/ui/ModuleCard.tsx`
- Modify: `src/features/stage-editor/ui/WorkflowCard.tsx`

**Why:** module/workflow legacy actions resolve `{ success: false }` without throwing, so the delete handlers toast success and close even when the server refused; phase delete throws (throwIfActionFailed) but is uncaught; DnD reorder leaves `draggedIndex` stuck on error.

- [ ] **Step 1: Module/workflow mutation hooks — throw on `success: false`**

`module/mutations.ts` — every mutationFn becomes:
```ts
mutationFn: async (params: { phaseId: string; stageId: string } & ModuleCreateInput) => {
	const result = await createModule(params.phaseId, params);
	if (!result.success) throw new Error(result.error ?? "Failed to create module.");
	return result;
},
```
Same pattern for `useUpdateModule` ("Failed to update module.") and `useDeleteModule` ("Failed to delete module."). Mirror in `workflow/mutations.ts` ("Failed to create/update/delete workflow.").

- [ ] **Step 2: Delete handlers — try/catch + error toast**

PhaseCard `handleDeletePhase`, ModuleCard `handleDeleteModule`, WorkflowCard `handleDeleteWorkflow`:
```ts
try {
	await deleteXxxMutation.mutateAsync({ … });
	toast.add({ title: "… Deleted", description: …, type: "delete" });
} catch (error) {
	toast.add({
		title: "Delete Failed",
		description: error instanceof Error ? error.message : "Something went wrong.",
		type: "error",
	});
} finally {
	// close the confirm modal + clear state (phase number bookkeeping stays in the success branch)
}
```
(PhaseCard: only decrement/clear `activePhase` on success, inside the try after the toast.)

- [ ] **Step 3: DnD reorder — try/finally + error toast**

PhaseCard `handleDrop` and WorkflowCard `handleDrop`:
```ts
try {
	await reorderXxxMutation.mutateAsync({ … });
} catch (error) {
	toast.add({
		title: "Reorder Failed",
		description: error instanceof Error ? error.message : "Something went wrong.",
		type: "error",
	});
} finally {
	setDraggedIndex(null);
	document.querySelectorAll(".drag-over, .drag-over-workflow").forEach((el) =>
		el.classList.remove("drag-over", "drag-over-workflow"),
	);
}
```

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/features/stage-editor src/entities/module src/entities/workflow`

```bash
git add src/entities/module/mutations.ts src/entities/workflow/mutations.ts src/features/stage-editor
git commit -m "fix(stage-editor): surface mutation failures (delete/reorder) via error toasts"
```

### Task 6: Nits cleanup

**Files:**
- Delete: `src/features/stage-editor/defaults.ts` (comment-only, zero importers)
- Modify: `src/features/stage-editor/ui/ModuleCard.tsx`
- Modify: `src/features/stage-editor/ui/modals/PhaseModals.tsx`
- Modify: `docs/code-review-plan.md` (drop the `defaults.ts` entry)

- [ ] **Step 1: Delete the dead file + fix the inconsistent import**

- `git rm src/features/stage-editor/defaults.ts`
- ModuleCard.tsx line 12: `import { ConfirmDeleteModal } from "@/components/ui/confirmation-modal"` → `import { ConfirmDeleteModal } from "@/shared/ui"` (same component, re-exported — consistent with PhaseCard/WorkflowCard).

- [ ] **Step 2: PhaseModal — useSelector over deprecated useStore**

`PhaseModals.tsx`: `import { useSelector } from "@tanstack/react-form"` and `const isDirty = useSelector(form.store, (state) => state.isDirty);`

- [ ] **Step 3: Update the review plan doc**

In `docs/code-review-plan.md`, replace the `src/features/stage-editor/defaults.ts` entry with `(deleted — comment-only dead file, removed 2026-08-15 in the integration plan)`.

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit` then `npx eslint src/features/stage-editor`

```bash
git add -A src/features/stage-editor docs/code-review-plan.md
git commit -m "chore(stage-editor): remove dead defaults.ts, unify ConfirmDeleteModal import, modernize useStore"
```

### Task 7: Full verification + definition of done

- [ ] **Step 1: Full check suite**

Run each and record results:
1. `npx prisma validate`
2. `npx tsc --noEmit`
3. `npx vitest run` (or at minimum `src/shared/schemas/project.test.ts` + `src/entities/stage/ordering.test.ts`)
4. `npx eslint src/features/stage-editor src/entities/stage src/entities/module src/entities/workflow src/entities/phase src/shared/schemas src/app`
5. `npm run build` (next build must be green)

- [ ] **Step 2: Record the sign-off in `docs/code-review-plan.md`**

Under "Other follow-ups → Stage-editor integration (2026-08-15 review)": flip each sub-item to `[x]` with the commit hash, and note the date-rules work items now complete (schemas/actions/tests; stage-editor modal date UI was already done). Mark `docs/reasonix/plans/2026-08-15-stage-editor-integration.md` as executed.

- [ ] **Step 3: Final commit**

```bash
git add docs/code-review-plan.md
git commit -m "docs: sign off stage-editor integration (per-file review checkboxes)"
```

---

## Out of scope (tracked in docs/code-review-plan.md)

- `Tickets.plan_start_at` / `plan_end_at` nullable DB migration + ticket schema (`z.date().optional().nullable()`) + ticket-board date UI — separate TODO items, ticket-board feature untouched here.
- `useResetOnOpen`/form-kit behavior for `SchedulingFields` — unchanged.
- Owner-only gates (invite codes, team page) — this page deliberately gives Team and Owners identical access per spec.
- Keyboard-accessible DnD — native HTML5 drag-and-drop has no keyboard path; noted as a known limitation, not fixed here.
