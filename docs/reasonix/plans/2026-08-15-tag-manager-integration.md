# Tag Manager Integration Plan

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "not deletable" tags real — a `Tags.is_protected` DB flag enforced server-side (not hardcoded UI name checks) — and close every review finding on `src/features/tag-manager` (duplicated/case-inconsistent pinning, render-phase setState, dead code, missing tests).

**Architecture:** Protection becomes **data**: migration 14 adds `Tags.is_protected` (default false) and flags the four system tags (API, Bugs, Integration, Production — the two missing ones get seeded). `softDeleteTag` refuses protected rows server-side; `updateTag` keeps protected rows protected (flag follows the row, so rename is safe) and gains an `is_deleted: false` where-guard. The UI derives pinning AND delete-button visibility from `tag.is_protected` — the `PINNED_TAGS` name array and the "warcrime" inline check are deleted. The list ordering/search logic is extracted into a pure, tested helper. `TagFormModal`'s render-phase setState is replaced with the established `useResetOnOpen` pattern.

**Tech Stack:** Prisma + PostgreSQL (Supabase), Next.js server actions, Zod v4, vitest, TanStack Query (existing `tagKeys.all` invalidation).

**Decisions locked with the user (2026-08-15):**
1. Protected tags = **DB flag** (`is_protected` column), not hardcoded names and not a shared constant.
2. Protected tags are protected from **deletion**; editing (name/color/description) stays allowed — the flag follows the row.
3. Pinning = protected tags first in the list; ordering within groups is alphabetical (no name-order array at all).

**Review findings this plan closes (built-in review):**
- BLOCKING: `softDeleteTag` (tagActions.ts:76) has no protection — any authenticated user can delete API/Bugs/Integration/Production directly; `updateTag` can rename out of a name-based pinned list.
- Should-fix: `PINNED_TAGS` duplication + case inconsistency (pin check lowercases, delete guard is case-sensitive → "api" is pinned but deletable); TagFormModal render-phase setState keyed on object identity (a parent re-render while open wipes in-progress edits); `updateTag`'s where lacks `is_deleted: false`; `softDeleteTag` should reject already-deleted tags.
- Nits: "SIR SKY I AM SO SORRY FOR THIS WARCRIME" comment + dead `: ("")` else-branch; no trailing newline; `import{` spacing; no tests.

**DB migration:** YES — migration 14 (`Tags.is_protected`, hand-written SQL, apply to Supabase out-of-band after approval; rollback = revert).

---

## File map

**Create:**
- `prisma/migrations/20260815040000_14_tags_is_protected/migration.sql`
- `src/features/tag-manager/model/tagOrdering.ts` + `src/features/tag-manager/model/tagOrdering.test.ts`
- `src/shared/schemas/tag.test.ts`

**Modify:**
- `prisma/schema.prisma` — `Tags.is_protected Boolean @default(false)`
- `src/shared/schemas/tag.ts` — `tagSchema` gains `is_protected` (row type only; create/update inputs unchanged)
- `src/entities/tag/tagActions.ts` — `softDeleteTag` protected/soft-deleted guards; `updateTag` `is_deleted: false` where-guard; `selectTag` includes `is_protected`
- `src/features/tag-manager/ui/TagListModal.tsx` — `is_protected`-driven pinning + delete button; warcrime comment + dead else-branch removed; uses the extracted ordering helper
- `src/features/tag-manager/ui/TagFormModal.tsx` — `useResetOnOpen` replaces render-phase setState; trailing newline
- `src/features/tag-manager/ui/TagModals.tsx` — `import{` spacing; dead empty-name guard removed; formatting normalized (tabs + semicolons, file convention)
- `docs/code-review-plan.md` — flip the 4 entries + record the integration

---

### Task 0: Baseline verification

- [ ] **Step 1: Confirm a green baseline**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npx vitest run`
Expected: 45 files / 306 tests pass.

- [ ] **Step 2: Note the baseline**

No commit (working tree may carry unrelated user changes — scope all commits to plan files only).

---

### Task 1: Migration 14 + schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260815040000_14_tags_is_protected/migration.sql`

- [ ] **Step 1: Add the column to `model Tags`**

In `prisma/schema.prisma`, inside `model Tags { … }` (next to `is_deleted`):

```prisma
  is_protected    Boolean   @default(false)
```

- [ ] **Step 2: Create `prisma/migrations/20260815040000_14_tags_is_protected/migration.sql`**

```sql
-- 2026-08-15 tag-manager integration spec:
--   - Tags.is_protected: system tags (API, Bugs, Integration, Production)
--     cannot be deleted — enforced server-side (softDeleteTag), not by
--     hardcoded UI name checks.
--   - Existing rows matching the protected names are flagged; the two
--     missing system tags (Integration, Production) are seeded so the
--     pinned set is real.
-- Hand-written: `migrate dev` is blocked by pre-existing shadow-DB drift.
-- Apply to Supabase out-of-band. Rollback = revert.

ALTER TABLE "public"."Tags" ADD COLUMN "is_protected" boolean NOT NULL DEFAULT false;

UPDATE "public"."Tags" SET "is_protected" = true
WHERE "name" IN ('API', 'Bugs', 'Integration', 'Production') AND "is_deleted" = false;

INSERT INTO "public"."Tags" ("name", "description", "color", "is_deleted", "is_protected") VALUES
('Integration', 'Third-party system integrations', '#0EA5E9', false, true),
('Production', 'Production-environment concerns', '#F59E0B', false, true)
ON CONFLICT ("name") DO NOTHING;
```

Note: `Tags.name` — verify whether it has a UNIQUE constraint before relying on `ON CONFLICT ("name")`; if not, drop the `ON CONFLICT` clause (the INSERT is guarded by the `name IN (...)` check being idempotent enough for a one-shot seed).

- [ ] **Step 3: Verify + regenerate + commit**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`.

Run: `npx prisma generate`
Expected: exit 0.

```bash
git add prisma/schema.prisma prisma/migrations/20260815040000_14_tags_is_protected/migration.sql
git commit -m "feat: Tags.is_protected column (migration 14)"
```

---

### Task 2: Schema + entity guards

**Files:**
- Modify: `src/shared/schemas/tag.ts`
- Modify: `src/entities/tag/tagActions.ts`
- Create: `src/shared/schemas/tag.test.ts`

- [ ] **Step 1: Extend `tagSchema` in `src/shared/schemas/tag.ts`**

Add `is_protected` to the row type (create/update inputs stay unchanged — not user-editable):

```ts
const tagSchema = z.object({
	tag_id: z.uuid(),
	name: z.string().trim().min(1, "Tag name is required"),
	description: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	is_deleted: z.boolean().default(false),
	deleted_at: z.date().nullable().optional(),
	is_protected: z.boolean().default(false),
});
```

- [ ] **Step 2: Guard `softDeleteTag` in `src/entities/tag/tagActions.ts`**

Replace the action body's try block with a protection + already-deleted check:

```ts
export async function softDeleteTag(tagId: string) {
	z.uuid().parse(tagId);

	// Authorization: any authenticated user may manage global tags
	const userId = await getCurrentUserId();
	if (!userId) return { success: false, error: "Authentication required." };
	try {
		const tag = await prisma.tags.findUnique({
			where: { tag_id: tagId },
			select: { is_protected: true, is_deleted: true },
		});
		if (!tag || tag.is_deleted) {
			return { success: false, error: "Tag not found." };
		}
		// System tags cannot be deleted — enforced server-side, not by UI
		// button hiding (2026-08-15 spec).
		if (tag.is_protected) {
			return {
				success: false,
				error: "Protected tags cannot be deleted.",
			};
		}

		await prisma.tags.update({
			where: { tag_id: tagId },
			data: {
				is_deleted: true,
				deleted_at: new Date(),
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to soft delete tag:", error);
		return {
			success: false,
			error: "Failed to delete the tag due to a database error.",
		};
	}
}
```

- [ ] **Step 3: Guard `updateTag` in `src/entities/tag/tagActions.ts`**

Add `is_deleted: false` to the update's where clause (review finding — soft-deleted tags must not remain editable):

```ts
		await prisma.tags.update({
			where: {
				tag_id: tagId,
				is_deleted: false,
			},
			...
```

(Protected tags REMAIN editable — the flag follows the row, so renaming cannot unprotect.)

- [ ] **Step 4: Include `is_protected` in `selectTag`**

Add `is_protected: true` to the `select` of `selectTag` so the UI can drive pinning/deletability from data.

- [ ] **Step 5: Write `src/shared/schemas/tag.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { tagCreateSchema } from "./tag";

const validPayload = {
	name: "Frontend",
	description: "Portal UI work",
	color: "#6366F1",
};

describe("tagCreateSchema", () => {
	it("accepts a valid payload", () => {
		expect(tagCreateSchema.safeParse(validPayload).success).toBe(true);
	});

	it("rejects an empty name", () => {
		const result = tagCreateSchema.safeParse({ ...validPayload, name: "  " });
		expect(result.success).toBe(false);
	});

	it("rejects a name longer than 12 characters", () => {
		const result = tagCreateSchema.safeParse({
			...validPayload,
			name: "This name is way too long",
		});
		expect(result.success).toBe(false);
	});

	it("accepts an explicit tag_id (edit path)", () => {
		const result = tagCreateSchema.safeParse({
			...validPayload,
			tag_id: "11111111-1111-1111-1111-111111111111",
		});
		expect(result.success).toBe(true);
	});
});
```

(4 tests; extend with an `is_protected` row-type check if a `Tag`-level test is added.)

- [ ] **Step 6: Verify + commit**

Run: `npx vitest run src/shared/schemas/tag.test.ts`
Expected: 4 tests pass.

Run: `npx tsc --noEmit`
Expected: exit 0.

```bash
git add src/shared/schemas/tag.ts src/shared/schemas/tag.test.ts src/entities/tag/tagActions.ts
git commit -m "feat: server-enforced protected tags + tag schema tests"
```

---

### Task 3: Pure ordering helper (TDD)

**Files:**
- Create: `src/features/tag-manager/model/tagOrdering.ts`
- Create: `src/features/tag-manager/model/tagOrdering.test.ts`

- [ ] **Step 1: Write the failing tests — `src/features/tag-manager/model/tagOrdering.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { matchesTagSearch, sortTagsForDisplay } from "./tagOrdering";
import type { Tag } from "@/entities/types";

function makeTag(overrides: Partial<Tag> = {}): Tag {
	return {
		tag_id: "11111111-1111-1111-1111-111111111111",
		name: "API",
		description: null,
		color: null,
		is_deleted: false,
		deleted_at: null,
		is_protected: false,
		...overrides,
	};
}

describe("sortTagsForDisplay", () => {
	it("puts protected tags first, alphabetical within groups", () => {
		const tags = [
			makeTag({ tag_id: "a", name: "Zeta", is_protected: false }),
			makeTag({ tag_id: "b", name: "Bugs", is_protected: true }),
			makeTag({ tag_id: "c", name: "API", is_protected: true }),
			makeTag({ tag_id: "d", name: "Alpha", is_protected: false }),
		];
		const sorted = sortTagsForDisplay(tags);
		expect(sorted.map((t) => t.name)).toEqual(["API", "Bugs", "Alpha", "Zeta"]);
	});

	it("is case-insensitive within groups", () => {
		const tags = [
			makeTag({ tag_id: "a", name: "beta", is_protected: true }),
			makeTag({ tag_id: "b", name: "Alpha", is_protected: true }),
		];
		expect(sortTagsForDisplay(tags).map((t) => t.name)).toEqual(["Alpha", "beta"]);
	});

	it("does not mutate the input array", () => {
		const tags = [makeTag({ tag_id: "b", name: "B" }), makeTag({ tag_id: "a", name: "A" })];
		sortTagsForDisplay(tags);
		expect(tags[0].name).toBe("B");
	});
});

describe("matchesTagSearch", () => {
	it("matches name case-insensitively", () => {
		expect(matchesTagSearch(makeTag({ name: "Frontend" }), "front")).toBe(true);
	});

	it("matches description", () => {
		expect(
			matchesTagSearch(makeTag({ description: "Portal UI work" }), "portal"),
		).toBe(true);
	});

	it("matches everything on an empty query", () => {
		expect(matchesTagSearch(makeTag({ name: "Anything" }), "")).toBe(true);
	});

	it("returns false when nothing matches", () => {
		expect(matchesTagSearch(makeTag({ name: "API" }), "stripe")).toBe(false);
	});
});
```

- [ ] **Step 2: Run — verify they fail on the missing module**

Run: `npx vitest run src/features/tag-manager/model/tagOrdering.test.ts`
Expected: FAIL — module `./tagOrdering` not found.

- [ ] **Step 3: Implement `src/features/tag-manager/model/tagOrdering.ts`**

```ts
import type { Tag } from "@/entities/types";

/** Protected (system) tags first; alphabetical within each group. */
export function sortTagsForDisplay(tags: Tag[]): Tag[] {
	return [...tags].sort((a, b) => {
		if (a.is_protected !== b.is_protected) return a.is_protected ? -1 : 1;
		return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
	});
}

/** Case-insensitive name/description search. */
export function matchesTagSearch(tag: Tag, query: string): boolean {
	const q = query.toLowerCase().trim();
	if (!q) return true;
	return (
		tag.name.toLowerCase().includes(q) ||
		(tag.description ?? "").toLowerCase().includes(q)
	);
}
```

- [ ] **Step 4: Run — verify they pass**

Run: `npx vitest run src/features/tag-manager/model/tagOrdering.test.ts`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/tag-manager/model
git commit -m "feat: tag ordering/search pure helpers (+7 tests)"
```

---

### Task 4: UI — `is_protected`-driven list, form reset fix, cleanup

**Files:**
- Modify: `src/features/tag-manager/ui/TagListModal.tsx`
- Modify: `src/features/tag-manager/ui/TagFormModal.tsx`
- Modify: `src/features/tag-manager/ui/TagModals.tsx`

- [ ] **Step 1: Rewrite `src/features/tag-manager/ui/TagListModal.tsx`**

Key changes (keep the existing layout):
1. Delete `const PINNED_TAGS = [...]` and the inline `tag.name === "API" || …` guard.
2. Replace the `displayedTags` memo with:

```tsx
const displayedTags = useMemo(
	() => sortTagsForDisplay(tags.filter((tag) => matchesTagSearch(tag, searchQuery))),
	[tags, searchQuery],
);
```

3. Delete button — replace the warcrime block with:

```tsx
{tag.is_protected ? null : (
	<button
		type="button"
		onClick={() => onRequestDeleteTag(tag)}
		title={`Delete ${tag.name}`}
		aria-label={`Delete ${tag.name}`}
		className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
	>
		<Trash2 size={15} />
	</button>
)}
```

4. Imports: add `import { matchesTagSearch, sortTagsForDisplay } from "../model/tagOrdering";` (remove `Lacking` → keep from `@/shared/ui/search-status`).
5. Normalize formatting to the file convention (tabs, semicolons).

- [ ] **Step 2: Fix `src/features/tag-manager/ui/TagFormModal.tsx`**

Replace the render-phase setState block (the `prevIsOpen`/`prevInitial` sync, lines ~38-57) with the established reset pattern:

```tsx
import { useState } from "react";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
...
	useResetOnOpen(currentIsOpen, () => {
		setName(initial?.name ?? "");
		setDescription(initial?.description ?? "");
		setColor(initial?.color ?? "#3B82F6");
		setFieldError(null);
	});
```

Remove the `prevIsOpen`/`prevInitial` state and the render-phase `if` blocks. Add a trailing newline at EOF.

- [ ] **Step 3: Fix `src/features/tag-manager/ui/TagModals.tsx`**

1. `import{ Dialog` → `import { Dialog`.
2. Remove the dead empty-name guard in `handleSaveTag` (`if (!name.trim()) return {}` — the form already validates; an empty name must not look like a successful save):
   keep the trim on submit, drop the early `return {}` branch.
3. Normalize formatting (tabs + semicolons).

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npx vitest run`
Expected: 45 files / 313 tests (306 + 7 new) pass.

Run: `npx eslint src/features/tag-manager src/entities/tag src/shared/schemas/tag.ts`
Expected: 0 errors, 0 warnings.

```bash
git add src/features/tag-manager
git commit -m "fix: tag manager — is_protected-driven UI, useResetOnOpen form, cleanup"
```

---

### Task 5: Full verification

- [ ] **Step 1: Prisma**

Run: `npx prisma validate`
Expected: schema valid.

Run: `npx prisma generate`
Expected: exit 0.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Tests**

Run: `npx vitest run`
Expected: 45 files / 313 tests pass.

- [ ] **Step 4: Lint**

Run: `npx eslint src/features/tag-manager src/entities/tag src/shared/schemas`
Expected: 0 errors (only the pre-existing intentional webhooks warning repo-wide).

- [ ] **Step 5: Dead code**

Run: `npx knip --include files,dependencies,exports`
Expected: clean.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully` + 10/10 static pages.

- [ ] **Step 7: Optional — apply migration 14 to Supabase**

With user approval (same process as migrations 11-13):
```bash
npx prisma db execute --file prisma/migrations/20260815040000_14_tags_is_protected/migration.sql
```
Expected: DDL + 2-row seed; then re-verify read-only.

- [ ] **Step 8: Commit any verification fixes**

```bash
git add -A && git commit -m "chore: verification fixes" || true
```

---

### Task 6: Update docs/code-review-plan.md

**Files:**
- Modify: `docs/code-review-plan.md`

- [ ] **Step 1: Flip the feature entries**

In section 10, flip to `[x]` with 2026-08-15 annotations:
- `src/features/tag-manager/index.ts`
- `src/features/tag-manager/ui/TagFormModal.tsx`
- `src/features/tag-manager/ui/TagListModal.tsx`
- `src/features/tag-manager/ui/TagModals.tsx`

Add to section 10 (new):
- `src/features/tag-manager/model/tagOrdering.ts` (new — sortTagsForDisplay/matchesTagSearch, 7 tests)
- `src/features/tag-manager/model/tagOrdering.test.ts` (new)

Add to section 3 (new):
- `src/shared/schemas/tag.test.ts` (new — tagCreateSchema, 4 tests)

- [ ] **Step 2: Add the follow-up entry**

In "Other follow-ups", a checked entry (style of the previous integrations):
```
- [x] **Tag-manager integration** — completed 2026-08-15.
      **`docs/reasonix/plans/2026-08-15-tag-manager-integration.md`**
      (Tags.is_protected + migration 14; softDeleteTag refuses protected
      rows server-side; UI derives pinning/deletability from the flag —
      hardcoded PINNED_TAGS/warcrime block deleted; TagFormModal →
      useResetOnOpen; updateTag is_deleted guard; ordering/search pure
      helpers + 11 new tests; schema tests). Verified: prisma validate ✓,
      tsc ✓, vitest 45/313 ✓, eslint 0/0 ✓, knip ✓, build ✓. Migration 14
      applied to Supabase out-of-band after approval.
```

- [ ] **Step 3: Commit**

```bash
git add docs/code-review-plan.md
git commit -m "docs: tag-manager review + integration signed off"
```

---

## Self-Review

**Spec coverage:**
1. "Are 'not deletable' tags implemented the best way? Hardcoding feels wrong" → DB flag answer: migration 14 + server enforcement + flag-driven UI (Tasks 1-4); the code-level hardcoding is deleted entirely. ✓
2. "Analysis + review + integration plans" → this document; every review finding mapped (blocking server gap → Task 2; duplication/case bug → Tasks 3-4; render-phase setState → Task 4; updateTag where-guard → Task 2; warcrime comment/dead else → Task 4; no tests → Tasks 2-3). ✓
3. "Update the markdown" → Task 6. ✓
4. "Do the TODOs related to this feature" → no open review-plan TODO is tag-specific (knip/date-rules/etc. already closed); the plan notes this. ✓

**Placeholder scan:** no TBD/TODO stubs; every code step contains full code; every command has expected output. ✓

**Type consistency:** `Tag` gains `is_protected` via `tagSchema` (entities/types re-exports it) → flows to `selectTag`, the manager's `tags` prop, and `tagOrdering.ts` (tested). Create/update inputs unchanged (protection is not user-editable). `useResetOnOpen(currentIsOpen, resetFn)` matches the hook's contract (trigger + reset fn). ✓

**Edge cases:** protected tag renamed → stays protected (flag follows the row); tag named "api" → pinned AND undeletable (single `is_protected` predicate — case bug gone); already-deleted tag → "Tag not found."; anonymous → auth gate unchanged; empty tag list → `Lacking` empty state unchanged; `Integration`/`Production` missing from DB → seeded by migration 14. ✓
