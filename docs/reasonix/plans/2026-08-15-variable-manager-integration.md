# Variable Manager Integration Plan

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the UI-only `src/features/variable-manager` mock into a real, persisted, role-aware Project Variables feature: new `Variables` table + migration, an `entities/variable` slice with gated server actions, real TanStack queries, client read-only gating, and a role-aware notes modal.

**Architecture:** Follows the established FSD + server-action pattern (issue slice as the template). The `Variables` Prisma model holds the page-shaped fields; `entities/variable/variableActions.ts` (`"use server"`) gates reads with `assertProjectMemberOrClient` and mutations with `assertProjectMemberNotClient`. Client viewers receive ONLY `client_visible` rows (user decision: hidden rows never leave the server) and NEVER `notes_team`. Mutations invalidate `variableKeys.list(projectId)`. The feature keeps its search/sort UI but drops all mock state; the route page becomes a thin async-params server page.

**Tech Stack:** Next.js App Router (server actions), Prisma + PostgreSQL (Supabase), TanStack Query v5 (`queryOptions`/`useMutation`), Zod v4, shadcn UI, Tailwind v4, vitest.

**Decisions locked with the user (2026-08-15):**
1. Hidden variables (`client_visible = false`) are hidden from clients ENTIRELY — the row is never sent.
2. No `created_by` column — the model is page-shaped only.
3. Clients may view the value/address only on visible rows; team notes (`notes_team`) are never sent to clients.
4. Project team + owners see and manage everything (read + write); clients are read-only.

**Review findings this plan closes (built-in review, 2 runs):**
- Blocking: mock secret material committed (`mockData.ts` Stripe `sk_live_…`, postgres URI with password); zero authz (any signed-in user can read/edit credentials; `clientVisibility` is decorative); `notesTeam` rendered to any viewer; no persistence (reload wipes everything).
- Should-fix: dead `columns` array in `VariablesTable`; toggle a11y (no `role="switch"`/`aria-checked`/focus ring); unhandled `navigator.clipboard` rejection; close-before-save in `VariableFormModal`; `React.FormEvent` UMD global.
- Nits: no tests; commented-out blocks in two modals; missing EOF newlines.

**DB migration:** YES — new `Variables` table + `VariableType` enum (migration 13). Hand-written SQL (`migrate dev` is blocked by pre-existing shadow-DB drift); applied to Supabase out-of-band after user approval. Rollback = revert the migration.

---

## File map

**Create:**
- `prisma/migrations/20260815030000_13_variables/migration.sql`
- `src/entities/variable/index.ts`
- `src/entities/variable/types.ts` (selects + payloads + `VariableItem`)
- `src/entities/variable/lib/mappers.ts` + `src/entities/variable/lib/mappers.test.ts`
- `src/entities/variable/variableActions.ts` (`"use server"`)
- `src/entities/variable/queries.ts` (hooks)
- `src/shared/schemas/variable.ts` + `src/shared/schemas/variable.test.ts`

**Modify:**
- `prisma/schema.prisma` — `enum VariableType` + `model Variables` + `Projects.Variables[]`
- `src/lib/auth/projectAccess.ts` — `resolveVariableProject`
- `src/shared/query/keys.ts` — `variableKeys`
- `src/shared/schemas/index.ts` — re-export variable schemas
- `src/features/variable-manager/index.ts` — re-export types from `@/entities/variable`
- `src/features/variable-manager/ui/VariablesPage.tsx` — real data, client gating, loading/error, async mutation handlers
- `src/features/variable-manager/ui/VariablesTable.tsx` — `readOnly`, a11y toggle, dead code removed, clipboard catch
- `src/features/variable-manager/ui/VariableFormModal.tsx` — async submit (close on success only), `FormEvent` import, `isSubmitting`
- `src/features/variable-manager/ui/VariableConfirmModal.tsx` — commented block removed
- `src/features/variable-manager/ui/VariableNotesModal.tsx` — `clientView` prop, commented blocks removed, formatting
- `src/app/(app)/(workspace)/projects/[projectId]/variables/page.tsx` — async params, passes `projectId`
- `docs/code-review-plan.md` — flip checkboxes + record the integration

**Delete:**
- `src/features/variable-manager/model/mockData.ts`
- `src/features/variable-manager/model/types.ts` (types move to `entities/variable`)

---

### Task 0: Baseline verification

- [ ] **Step 1: Confirm a green baseline**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npx vitest run`
Expected: 43 files / 285 tests pass.

- [ ] **Step 2: Note the baseline**

No commit (working tree may carry unrelated user changes — scope all commits to plan files only).

---

### Task 1: Prisma model + migration 13

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260815030000_13_variables/migration.sql`

- [ ] **Step 1: Add the model + enum to `prisma/schema.prisma`**

Insert immediately after the `model Workflows { … }` block (before `model Projects`):

```prisma
/// Project-scoped credentials/links/repos. The client portal sees ONLY
/// client_visible rows (value included); notes_team is team-only and never
/// leaves the server for client viewers. Soft delete (project rule 1).
model Variables {
  variable_id    String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  project_id     String       @db.Uuid
  name           String
  type           VariableType
  value          String
  client_visible Boolean      @default(false)
  notes_team     String       @default("")
  notes_client   String       @default("")
  created_at     DateTime     @default(now()) @db.Timestamptz(6)
  is_deleted     Boolean      @default(false)
  deleted_at     DateTime?    @db.Timestamptz(6)
  Projects       Projects     @relation(fields: [project_id], references: [project_id], onDelete: NoAction, onUpdate: NoAction)

  @@index([project_id, is_deleted])
  @@schema("public")
}

enum VariableType {
  LINK
  CREDENTIAL
  REPOSITORY
}
```

In `model Projects`, add the back-relation next to `Stages Stages[]`:

```prisma
  Variables       Variables[]
```

- [ ] **Step 2: Create `prisma/migrations/20260815030000_13_variables/migration.sql`**

```sql
-- 2026-08-15 variables integration spec:
--   - New Variables table: project-scoped credentials/links/repos.
--   - client_visible gates what the client portal sees (the value/address
--     column); hidden rows are never sent to client viewers (user decision).
--   - notes_team is team-only; notes_client is what clients see.
--   - Soft delete via is_deleted/deleted_at (project rule 1).
-- Hand-written: `migrate dev` is blocked by pre-existing shadow-DB drift
-- (P3018 on migration 4). Apply to Supabase out-of-band. Rollback = revert.

CREATE TYPE "VariableType" AS ENUM ('LINK', 'CREDENTIAL', 'REPOSITORY');

CREATE TABLE "Variables" (
  "variable_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "name" text NOT NULL,
  "type" "VariableType" NOT NULL,
  "value" text NOT NULL,
  "client_visible" boolean NOT NULL DEFAULT false,
  "notes_team" text NOT NULL DEFAULT '',
  "notes_client" text NOT NULL DEFAULT '',
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz(6),
  CONSTRAINT "Variables_pkey" PRIMARY KEY ("variable_id")
);

CREATE INDEX "Variables_project_id_is_deleted_idx" ON "public"."Variables"("project_id", "is_deleted");

ALTER TABLE "public"."Variables" ADD CONSTRAINT "Variables_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."Projects"("project_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
```

- [ ] **Step 3: Verify + regenerate + commit**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`.

Run: `npx prisma generate`
Expected: exit 0 (new `Variables` delegate + `VariableType` enum in the client).

```bash
git add prisma/schema.prisma prisma/migrations/20260815030000_13_variables/migration.sql
git commit -m "feat: Variables model + VariableType enum (migration 13)"
```

---

### Task 2: Shared schema + projectAccess helper (TDD)

**Files:**
- Create: `src/shared/schemas/variable.ts`
- Create: `src/shared/schemas/variable.test.ts`
- Modify: `src/shared/schemas/index.ts`
- Modify: `src/lib/auth/projectAccess.ts`

- [ ] **Step 1: Create `src/shared/schemas/variable.ts`**

```ts
import { z } from "zod";

// ── Project variables ──────────────────────────────────────────────────────
// Canonical type vocabulary (mirrors the UI radio pills). The DB stores the
// uppercase enum value; the UI speaks lowercase — mapping lives in
// entities/variable (mappers.ts).
export const VARIABLE_TYPES = ["link", "credential", "repository"] as const;

export const variableCreateSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Variable name is required")
		.max(20, "Name must be 20 characters or less"),
	type: z.enum(VARIABLE_TYPES, { error: "Variable type is required" }),
	value: z
		.string()
		.trim()
		.min(1, "Variable value/address is required")
		.max(4096, "Value must be 4096 characters or less"),
	notesTeam: z
		.string()
		.trim()
		.max(2000, "Team notes must be 2000 characters or less")
		.optional()
		.default(""),
	notesClient: z
		.string()
		.trim()
		.max(2000, "Client notes must be 2000 characters or less")
		.optional()
		.default(""),
});

export type VariableCreateInput = z.infer<typeof variableCreateSchema>;
```

- [ ] **Step 2: Write the failing tests — `src/shared/schemas/variable.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { variableCreateSchema } from "./variable";

const validPayload = {
	name: "Staging Preview URL",
	type: "link",
	value: "https://staging-preview.example.dev/v2",
	notesTeam: "Auto-deployed on merge to develop.",
	notesClient: "Use this live URL for gate review approvals.",
};

describe("variableCreateSchema", () => {
	it("accepts a valid full payload", () => {
		const result = variableCreateSchema.safeParse(validPayload);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Staging Preview URL");
			expect(result.data.type).toBe("link");
			expect(result.data.notesTeam).toBe("Auto-deployed on merge to develop.");
		}
	});

	it("accepts all three variable types", () => {
		for (const type of ["link", "credential", "repository"] as const) {
			expect(variableCreateSchema.safeParse({ ...validPayload, type }).success).toBe(true);
		}
	});

	it("defaults missing notes to empty strings", () => {
		const result = variableCreateSchema.safeParse({
			name: "DB URI",
			type: "credential",
			value: "postgresql://u:p@host:5432/db",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.notesTeam).toBe("");
			expect(result.data.notesClient).toBe("");
		}
	});

	it("trims whitespace from name and value", () => {
		const result = variableCreateSchema.safeParse({
			...validPayload,
			name: "  Staging URL  ",
			value: "  https://example.dev  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Staging URL");
			expect(result.data.value).toBe("https://example.dev");
		}
	});

	it("rejects an empty name", () => {
		const result = variableCreateSchema.safeParse({ ...validPayload, name: "   " });
		expect(result.success).toBe(false);
	});

	it("rejects a name longer than 20 characters", () => {
		const result = variableCreateSchema.safeParse({
			...validPayload,
			name: "This name is way too long for the limit",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an empty value", () => {
		const result = variableCreateSchema.safeParse({ ...validPayload, value: "" });
		expect(result.success).toBe(false);
	});

	it("rejects a value longer than 4096 characters", () => {
		const result = variableCreateSchema.safeParse({
			...validPayload,
			value: "x".repeat(4097),
		});
		expect(result.success).toBe(false);
	});

	it("rejects an unknown type", () => {
		const result = variableCreateSchema.safeParse({ ...validPayload, type: "api_key" });
		expect(result.success).toBe(false);
	});

	it("rejects notes longer than 2000 characters", () => {
		const result = variableCreateSchema.safeParse({
			...validPayload,
			notesTeam: "x".repeat(2001),
		});
		expect(result.success).toBe(false);
	});
});
```

- [ ] **Step 3: Run the tests — verify they fail on the missing module**

Run: `npx vitest run src/shared/schemas/variable.test.ts`
Expected: FAIL — module `./variable` not found.

- [ ] **Step 4: Wire the schema into `src/shared/schemas/index.ts`**

Append:
```ts
export { variableCreateSchema } from "./variable";
export type { VariableCreateInput } from "./variable";
```

- [ ] **Step 5: Run the tests — verify they pass**

Run: `npx vitest run src/shared/schemas/variable.test.ts`
Expected: 10 tests pass.

- [ ] **Step 6: Add `resolveVariableProject` to `src/lib/auth/projectAccess.ts`**

Append (next to the other `resolve*Project` helpers):

```ts
export async function resolveVariableProject(
	variableId: string,
): Promise<string | null> {
	const row = await prisma.variables.findUnique({
		where: { variable_id: variableId, is_deleted: false },
		select: { project_id: true },
	});
	return row?.project_id ?? null;
}
```

- [ ] **Step 7: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exit 0.

```bash
git add src/shared/schemas/variable.ts src/shared/schemas/variable.test.ts src/shared/schemas/index.ts src/lib/auth/projectAccess.ts
git commit -m "feat: variable schema + tests; resolveVariableProject helper"
```

---

### Task 3: Entity slice — types, mappers, actions, queries

**Files:**
- Create: `src/entities/variable/types.ts`
- Create: `src/entities/variable/lib/mappers.ts`
- Create: `src/entities/variable/lib/mappers.test.ts`
- Create: `src/entities/variable/variableActions.ts`
- Create: `src/entities/variable/queries.ts`
- Create: `src/entities/variable/index.ts`
- Modify: `src/shared/query/keys.ts`

- [ ] **Step 1: Create `src/entities/variable/types.ts`** (plain module — no "use server")

```ts
import type { Prisma } from "@/lib/generated/prisma";
import type { VariableCreateInput } from "@/shared/schemas/variable";

/** Full row — team/owner view. */
export const variableSelect = {
	variable_id: true,
	name: true,
	type: true,
	value: true,
	client_visible: true,
	notes_team: true,
	notes_client: true,
	created_at: true,
} as const;

export type VariablePayload = Prisma.VariablesGetPayload<{
	select: typeof variableSelect;
}>;

/** Client-visible subset — notes_team is NEVER sent to client viewers. */
export const variableClientSelect = {
	variable_id: true,
	name: true,
	type: true,
	value: true,
	client_visible: true,
	notes_client: true,
	created_at: true,
} as const;

export type VariableClientPayload = Prisma.VariablesGetPayload<{
	select: typeof variableClientSelect;
}>;

export type VariableType = VariableCreateInput["type"];

/** UI-facing row shape (camelCase; createdAt as ISO string). */
export interface VariableItem {
	id: string;
	name: string;
	type: VariableType;
	value: string;
	clientVisibility: boolean;
	notesTeam: string;
	notesClient: string;
	createdAt: string;
}
```

- [ ] **Step 2: Create `src/entities/variable/lib/mappers.ts`** (pure helpers)

```ts
import type {
	VariableClientPayload,
	VariableItem,
	VariablePayload,
	VariableType,
} from "../types";

const DB_TYPE_TO_UI: Record<VariablePayload["type"], VariableType> = {
	LINK: "link",
	CREDENTIAL: "credential",
	REPOSITORY: "repository",
};

export const uiTypeToDbType: Record<VariableType, VariablePayload["type"]> = {
	link: "LINK",
	credential: "CREDENTIAL",
	repository: "REPOSITORY",
};

/** Team/owner view: every column. */
export function mapVariableRow(row: VariablePayload): VariableItem {
	return {
		id: row.variable_id,
		name: row.name,
		type: DB_TYPE_TO_UI[row.type],
		value: row.value,
		clientVisibility: row.client_visible,
		notesTeam: row.notes_team,
		notesClient: row.notes_client,
		createdAt: row.created_at.toISOString(),
	};
}

/** Client view: team notes replaced with "" — the column is never sent. */
export function mapClientVariableRow(row: VariableClientPayload): VariableItem {
	return {
		id: row.variable_id,
		name: row.name,
		type: DB_TYPE_TO_UI[row.type],
		value: row.value,
		clientVisibility: row.client_visible,
		notesTeam: "",
		notesClient: row.notes_client,
		createdAt: row.created_at.toISOString(),
	};
}
```

- [ ] **Step 3: Write the tests — `src/entities/variable/lib/mappers.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { mapClientVariableRow, mapVariableRow, uiTypeToDbType } from "./mappers";
import type { VariableClientPayload, VariablePayload } from "../types";

const createdAt = new Date("2026-08-01T10:00:00.000Z");

const teamRow: VariablePayload = {
	variable_id: "11111111-1111-1111-1111-111111111111",
	name: "Production Database",
	type: "CREDENTIAL",
	value: "postgresql://u:secret@host:5432/main",
	client_visible: false,
	notes_team: "Internal only.",
	notes_client: "",
	created_at: createdAt,
};

const clientRow: VariableClientPayload = {
	variable_id: "11111111-1111-1111-1111-111111111111",
	name: "Production Database",
	type: "CREDENTIAL",
	value: "postgresql://u:secret@host:5432/main",
	client_visible: true,
	notes_client: "Read-only access.",
	created_at: createdAt,
};

describe("mapVariableRow", () => {
	it("maps every column to the camelCase UI shape", () => {
		expect(mapVariableRow(teamRow)).toEqual({
			id: teamRow.variable_id,
			name: "Production Database",
			type: "credential",
			value: teamRow.value,
			clientVisibility: false,
			notesTeam: "Internal only.",
			notesClient: "",
			createdAt: "2026-08-01T10:00:00.000Z",
		});
	});

	it("maps all three DB enum values to lowercase", () => {
		expect(mapVariableRow({ ...teamRow, type: "LINK" }).type).toBe("link");
		expect(mapVariableRow({ ...teamRow, type: "CREDENTIAL" }).type).toBe("credential");
		expect(mapVariableRow({ ...teamRow, type: "REPOSITORY" }).type).toBe("repository");
	});
});

describe("mapClientVariableRow", () => {
	it("never leaks team notes", () => {
		expect(mapClientVariableRow(clientRow).notesTeam).toBe("");
		expect(mapClientVariableRow(clientRow).notesClient).toBe("Read-only access.");
	});

	it("keeps the value for visible rows", () => {
		expect(mapClientVariableRow(clientRow).value).toBe(clientRow.value);
	});
});

describe("uiTypeToDbType", () => {
	it("round-trips the UI vocabulary to the DB enum", () => {
		expect(uiTypeToDbType.link).toBe("LINK");
		expect(uiTypeToDbType.credential).toBe("CREDENTIAL");
		expect(uiTypeToDbType.repository).toBe("REPOSITORY");
	});
});
```

- [ ] **Step 4: Run the tests — verify they fail on the missing modules**

Run: `npx vitest run src/entities/variable/lib/mappers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Create `src/entities/variable/variableActions.ts`** (`"use server"`)

```ts
"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
	assertProjectMemberNotClient,
	assertProjectMemberOrClient,
	resolveVariableProject,
} from "@/lib/auth/projectAccess";
import {
	variableCreateSchema,
	type VariableCreateInput,
} from "@/shared/schemas/variable";
import type { VariableItem } from "./types";
import { mapClientVariableRow, mapVariableRow, uiTypeToDbType } from "./lib/mappers";

/**
 * Project-scoped variable list. Team/owners see everything; client viewers
 * receive ONLY client_visible rows (value included) and never notes_team.
 * Hidden rows are not sent at all (2026-08-15 user decision).
 */
export async function getProjectVariables(projectId: string) {
	z.uuid().parse(projectId);
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const profile = await prisma.profiles.findUnique({
			where: { profile_id: auth.userId },
			select: { client_id: true },
		});
		const isClient = Boolean(profile?.client_id);

		if (isClient) {
			const rows = await prisma.variables.findMany({
				where: { project_id: projectId, is_deleted: false, client_visible: true },
				orderBy: { created_at: "asc" },
				select: {
					variable_id: true,
					name: true,
					type: true,
					value: true,
					client_visible: true,
					notes_client: true,
					created_at: true,
				},
			});
			return { success: true as const, data: rows.map(mapClientVariableRow) };
		}

		const rows = await prisma.variables.findMany({
			where: { project_id: projectId, is_deleted: false },
			orderBy: { created_at: "asc" },
			select: {
				variable_id: true,
				name: true,
				type: true,
				value: true,
				client_visible: true,
				notes_team: true,
				notes_client: true,
				created_at: true,
			},
		});
		return { success: true as const, data: rows.map(mapVariableRow) };
	} catch (error) {
		console.error("Failed to fetch project variables:", error);
		return { success: false as const, error: "Failed to load variables." };
	}
}

/** Team/owner only. Creates a variable with client visibility OFF. */
export async function createVariable(projectId: string, input: VariableCreateInput) {
	z.uuid().parse(projectId);
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const data = variableCreateSchema.parse(input);
		const created = await prisma.variables.create({
			data: {
				project_id: projectId,
				name: data.name,
				type: uiTypeToDbType[data.type],
				value: data.value,
				notes_team: data.notesTeam,
				notes_client: data.notesClient,
			},
			select: {
				variable_id: true,
				name: true,
				type: true,
				value: true,
				client_visible: true,
				notes_team: true,
				notes_client: true,
				created_at: true,
			},
		});
		return { success: true as const, data: mapVariableRow(created) };
	} catch (error) {
		console.error("Failed to create variable:", error);
		return { success: false as const, error: "Failed to create the variable." };
	}
}

/** Team/owner only. Updates name/type/value/notes (not visibility). */
export async function updateVariable(
	variableId: string,
	input: VariableCreateInput,
) {
	z.uuid().parse(variableId);
	const projectId = await resolveVariableProject(variableId);
	if (!projectId) return { success: false as const, error: "Variable not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const data = variableCreateSchema.parse(input);
		const updated = await prisma.variables.update({
			where: { variable_id: variableId },
			data: {
				name: data.name,
				type: uiTypeToDbType[data.type],
				value: data.value,
				notes_team: data.notesTeam,
				notes_client: data.notesClient,
			},
			select: {
				variable_id: true,
				name: true,
				type: true,
				value: true,
				client_visible: true,
				notes_team: true,
				notes_client: true,
				created_at: true,
			},
		});
		return { success: true as const, data: mapVariableRow(updated) };
	} catch (error) {
		console.error("Failed to update variable:", error);
		return { success: false as const, error: "Failed to update the variable." };
	}
}

/** Team/owner only. Flips client_visible (the confirm-gated toggle). */
export async function toggleVariableVisibility(variableId: string) {
	z.uuid().parse(variableId);
	const projectId = await resolveVariableProject(variableId);
	if (!projectId) return { success: false as const, error: "Variable not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const current = await prisma.variables.findUnique({
			where: { variable_id: variableId },
			select: { client_visible: true },
		});
		if (!current) return { success: false as const, error: "Variable not found." };
		const updated = await prisma.variables.update({
			where: { variable_id: variableId },
			data: { client_visible: !current.client_visible },
			select: { variable_id: true },
		});
		return { success: true as const, data: updated };
	} catch (error) {
		console.error("Failed to toggle variable visibility:", error);
		return { success: false as const, error: "Failed to change client visibility." };
	}
}

/** Team/owner only. Soft delete (project rule 1). */
export async function softDeleteVariable(variableId: string) {
	z.uuid().parse(variableId);
	const projectId = await resolveVariableProject(variableId);
	if (!projectId) return { success: false as const, error: "Variable not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		await prisma.variables.update({
			where: { variable_id: variableId },
			data: { is_deleted: true, deleted_at: new Date() },
		});
		return { success: true as const };
	} catch (error) {
		console.error("Failed to delete variable:", error);
		return { success: false as const, error: "Failed to delete the variable." };
	}
}
```

- [ ] **Step 6: Create `src/entities/variable/queries.ts`** (`"use client"`)

```ts
"use client";

import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { variableKeys } from "@/shared/query/keys";
import type { VariableCreateInput } from "@/shared/schemas/variable";
import {
	createVariable,
	getProjectVariables,
	softDeleteVariable,
	toggleVariableVisibility,
	updateVariable,
} from "./variableActions";

const variableQueryOptions = {
	list: (projectId: string | undefined) =>
		queryOptions({
			queryKey: variableKeys.list(projectId ?? ""),
			queryFn: async () => {
				const result = await getProjectVariables(projectId!);
				if (!result.success) throw new Error(result.error);
				return result.data;
			},
			enabled: !!projectId,
		}),
};

export function useProjectVariables(projectId: string | undefined) {
	return useQuery(variableQueryOptions.list(projectId));
}

function useInvalidateList(projectId: string) {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({ queryKey: variableKeys.list(projectId) });
}

export function useCreateVariable(projectId: string) {
	const invalidate = useInvalidateList(projectId);
	return useMutation({
		mutationFn: async (data: VariableCreateInput) => {
			const result = await createVariable(projectId, data);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: async () => {
			await invalidate();
		},
	});
}

export function useUpdateVariable(projectId: string) {
	const invalidate = useInvalidateList(projectId);
	return useMutation({
		mutationFn: async (args: { variableId: string; input: VariableCreateInput }) => {
			const result = await updateVariable(args.variableId, args.input);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: async () => {
			await invalidate();
		},
	});
}

export function useToggleVariableVisibility(projectId: string) {
	const invalidate = useInvalidateList(projectId);
	return useMutation({
		mutationFn: async (variableId: string) => {
			const result = await toggleVariableVisibility(variableId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: async () => {
			await invalidate();
		},
	});
}

export function useDeleteVariable(projectId: string) {
	const invalidate = useInvalidateList(projectId);
	return useMutation({
		mutationFn: async (variableId: string) => {
			const result = await softDeleteVariable(variableId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: async () => {
			await invalidate();
		},
	});
}
```

- [ ] **Step 7: Add `variableKeys` to `src/shared/query/keys.ts`**

```ts
export const variableKeys = {
	all: ["variables"] as const,
	lists: () => [...variableKeys.all, "list"] as const,
	list: (projectId: string) => [...variableKeys.lists(), projectId] as const,
};
```

- [ ] **Step 8: Create `src/entities/variable/index.ts`**

```ts
export * from "./variableActions";
export * from "./queries";
export * from "./types";
export * from "./lib/mappers";
```

- [ ] **Step 9: Run the tests + verify + commit**

Run: `npx vitest run src/shared/schemas/variable.test.ts src/entities/variable/lib/mappers.test.ts`
Expected: 16 tests pass (10 schema + 6 mappers).

Run: `npx tsc --noEmit`
Expected: exit 0.

```bash
git add src/entities/variable src/shared/query/keys.ts
git commit -m "feat: variables entity slice — gated actions, queries, mappers"
```

---

### Task 4: Feature rework — real data, client gating, async handlers

**Files:**
- Delete: `src/features/variable-manager/model/mockData.ts`
- Delete: `src/features/variable-manager/model/types.ts`
- Modify: `src/features/variable-manager/index.ts`
- Modify: `src/features/variable-manager/ui/VariablesPage.tsx`

- [ ] **Step 1: Delete the mock files**

```bash
git rm src/features/variable-manager/model/mockData.ts src/features/variable-manager/model/types.ts
```

- [ ] **Step 2: Rewrite `src/features/variable-manager/index.ts`**

```ts
export { VariablesPage } from "./ui/VariablesPage";
export { VariablesTable } from "./ui/VariablesTable";
export { VariableFormModal } from "./ui/VariableFormModal";
export { VariableConfirmModal } from "./ui/VariableConfirmModal";
export { VariableNotesModal } from "./ui/VariableNotesModal";
export type { VariableItem, VariableType } from "@/entities/variable";
```

- [ ] **Step 3: Rewrite `src/features/variable-manager/ui/VariablesPage.tsx`**

```tsx
"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Back } from "@/components/ui/back";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useCurrentUser } from "@/entities/profile";
import {
	useCreateVariable,
	useDeleteVariable,
	useProjectVariables,
	useToggleVariableVisibility,
	useUpdateVariable,
} from "@/entities/variable";
import type { VariableItem, VariableType } from "@/entities/variable";
import type { VariableCreateInput } from "@/shared/schemas/variable";
import { VariablesTable } from "./VariablesTable";
import { VariableFormModal } from "./VariableFormModal";
import { VariableConfirmModal } from "./VariableConfirmModal";
import { VariableNotesModal } from "./VariableNotesModal";

function VariablesHeader() {
	return (
		<div className="mb-6">
			<h1 className="text-4xl font-bold tracking-wide text-foreground">
				Project Variables
			</h1>
			<p className="subtitle">
				Manage and share project passwords, credentials, and keys.
			</p>
		</div>
	);
}

interface VariablesToolbarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	onAddVariable: () => void;
	readOnly: boolean;
}

function VariablesToolbar({
	searchQuery,
	onSearchChange,
	onAddVariable,
	readOnly,
}: VariablesToolbarProps) {
	return (
		<div className="mb-5 flex gap-6 justify-between items-center max-h-10">
			<div className="flex w-187.25 items-center gap-2 rounded-md border border-border bg-neutral-surface px-4 py-2">
				<Search className="h-4 w-4 shrink-0 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search variables by name or value..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0"
				/>
			</div>
			{!readOnly && (
				<Button className="flex items-center gap-2" onClick={onAddVariable}>
					<Plus className="w-3.5 h-3.5" />
					Add Variable
				</Button>
			)}
		</div>
	);
}

type VariableSortField = "name" | "type" | "clientVisibility";
type SortDirection = "asc" | "desc";

export function VariablesPage({ projectId }: { projectId: string }) {
	const {
		data: variables = [],
		isPending,
		isError,
		refetch,
	} = useProjectVariables(projectId);
	const { data: profile } = useCurrentUser();
	const isClientProfile = Boolean(profile?.client_id);

	const createMutation = useCreateVariable(projectId);
	const updateMutation = useUpdateVariable(projectId);
	const toggleMutation = useToggleVariableVisibility(projectId);
	const deleteMutation = useDeleteVariable(projectId);

	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState<VariableSortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// Modals state
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingVariable, setEditingVariable] = useState<VariableItem | null>(null);
	const [notesVariable, setNotesVariable] = useState<VariableItem | null>(null);
	const [visibilityTarget, setVisibilityTarget] = useState<VariableItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<VariableItem | null>(null);

	const filteredVariables = useMemo(() => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return variables;
		return variables.filter(
			(v) =>
				v.name.toLowerCase().includes(q) ||
				v.value.toLowerCase().includes(q) ||
				v.type.toLowerCase().includes(q)
		);
	}, [variables, searchQuery]);

	const sortedVariables = useMemo(() => {
		const sorted = [...filteredVariables];
		sorted.sort((a, b) => {
			let aVal: string | boolean = "";
			let bVal: string | boolean = "";

			switch (sortField) {
				case "name":
					aVal = a.name.toLowerCase();
					bVal = b.name.toLowerCase();
					break;
				case "type":
					aVal = a.type.toLowerCase();
					bVal = b.type.toLowerCase();
					break;
				case "clientVisibility":
					aVal = a.clientVisibility;
					bVal = b.clientVisibility;
					break;
			}
			if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});
		return sorted;
	}, [filteredVariables, sortField, sortDirection]);

	const handleSort = (field: VariableSortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	/** Returns true only after the mutation succeeded — the modal closes itself. */
	const handleSaveVariable = async (data: VariableCreateInput): Promise<boolean> => {
		try {
			if (editingVariable) {
				await updateMutation.mutateAsync({
					variableId: editingVariable.id,
					input: data,
				});
				toast.add({
					title: "Variable Updated",
					description: `"${data.name}" has been updated.`,
					type: "success",
				});
			} else {
				await createMutation.mutateAsync(data);
				toast.add({
					title: "Variable Added",
					description: `"${data.name}" has been added.`,
					type: "success",
				});
			}
			setEditingVariable(null);
			return true;
		} catch (error) {
			toast.add({
				title: "Save Failed",
				description:
					error instanceof Error ? error.message : "Failed to save the variable.",
				type: "error",
			});
			return false;
		}
	};

	const handleConfirmToggleVisibility = async () => {
		if (!visibilityTarget) return;
		const nextState = !visibilityTarget.clientVisibility;
		try {
			await toggleMutation.mutateAsync(visibilityTarget.id);
			toast.add({
				title: nextState ? "Visible to Client" : "Hidden from Client",
				description: `"${visibilityTarget.name}" client visibility changed.`,
				type: "info",
			});
			setVisibilityTarget(null);
		} catch (error) {
			toast.add({
				title: "Visibility Change Failed",
				description:
					error instanceof Error
						? error.message
						: "Failed to change client visibility.",
				type: "error",
			});
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteMutation.mutateAsync(deleteTarget.id);
			toast.add({
				title: "Variable Deleted",
				description: `"${deleteTarget.name}" has been deleted.`,
				type: "delete",
			});
			setDeleteTarget(null);
		} catch (error) {
			toast.add({
				title: "Delete Failed",
				description:
					error instanceof Error ? error.message : "Failed to delete the variable.",
				type: "error",
			});
		}
	};

	if (isPending) {
		return (
			<main className="flex flex-1 flex-col space-y-4">
				<Back link={`/projects/${projectId}`} />
				<VariablesHeader />
				<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
					Loading variables…
				</div>
			</main>
		);
	}

	if (isError) {
		return (
			<main className="flex flex-1 flex-col space-y-4">
				<Back link={`/projects/${projectId}`} />
				<VariablesHeader />
				<div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
					<p>Failed to load variables for this project.</p>
					<Button variant="outline" size="sm" onClick={() => void refetch()}>
						Retry
					</Button>
				</div>
			</main>
		);
	}

	return (
		<>
			<main className="flex flex-1 flex-col overflow-hidden space-y-4">
				<Back link={`/projects/${projectId}`} />

				<VariablesHeader />

				<VariablesToolbar
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onAddVariable={() => {
						setEditingVariable(null);
						setIsFormOpen(true);
					}}
					readOnly={isClientProfile}
				/>

				<VariablesTable
					variables={sortedVariables}
					sortField={sortField}
					sortDirection={sortDirection}
					onSort={handleSort}
					onToggleVisibilityRequest={setVisibilityTarget}
					onViewNotes={setNotesVariable}
					onEdit={(v) => {
						setEditingVariable(v);
						setIsFormOpen(true);
					}}
					onDeleteRequest={setDeleteTarget}
					readOnly={isClientProfile}
				/>
			</main>

			{/* 1. Add / Edit Modal */}
			<VariableFormModal
				isOpen={isFormOpen}
				variable={editingVariable}
				onClose={() => {
					setIsFormOpen(false);
					setEditingVariable(null);
				}}
				onSubmit={handleSaveVariable}
			/>

			{/* 2. Client Visibility Toggle Confirmation Modal */}
			{visibilityTarget && (
				<VariableConfirmModal
					isOpen={Boolean(visibilityTarget)}
					title="Confirm Client Visibility Change"
					description={`You are about to change client visibility for "${visibilityTarget.name}". ${
						visibilityTarget.clientVisibility
							? "This will hide the variable from the client portal."
							: "This will make the variable and its client notes visible to your client."
					}`}
					confirmName={visibilityTarget.name}
					actionLabel={
						visibilityTarget.clientVisibility ? "Hide from Client" : "Make Visible"
					}
					onClose={() => setVisibilityTarget(null)}
					onConfirm={() => void handleConfirmToggleVisibility()}
				/>
			)}

			{/* 3. Delete Confirmation Modal */}
			{deleteTarget && (
				<VariableConfirmModal
					isOpen={Boolean(deleteTarget)}
					title="Delete Variable"
					description="This action cannot be undone. This variable will be permanently removed from this project."
					confirmName={deleteTarget.name}
					actionLabel="Delete Variable"
					variant="destructive"
					onClose={() => setDeleteTarget(null)}
					onConfirm={() => void handleConfirmDelete()}
				/>
			)}

			{/* 4. Notes Modal */}
			<VariableNotesModal
				isOpen={Boolean(notesVariable)}
				variable={notesVariable}
				clientView={isClientProfile}
				onClose={() => setNotesVariable(null)}
			/>
		</>
	);
}
```

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit`
Expected: FAILS on the still-unmigrated siblings (`VariablesTable`, `VariableFormModal`, `VariableNotesModal` import `../model/types` and the old `onSubmit` signature) — expected until Task 5. If tsc fails ONLY on those files, continue.

```bash
git add src/features/variable-manager
git commit -m "feat: variables page — real data, client gating, async mutation handlers"
```
(commit includes the mock deletions; broken imports are repaired in Task 5 in the same branch — do NOT push between tasks.)

---

### Task 5: Table, notes modal, form modal, confirm modal fixes

**Files:**
- Modify: `src/features/variable-manager/ui/VariablesTable.tsx`
- Modify: `src/features/variable-manager/ui/VariableNotesModal.tsx`
- Modify: `src/features/variable-manager/ui/VariableFormModal.tsx`
- Modify: `src/features/variable-manager/ui/VariableConfirmModal.tsx`

- [ ] **Step 1: Rewrite `src/features/variable-manager/ui/VariablesTable.tsx`**

Replace the import of `../model/types` with:
```tsx
import type {
	VariableItem,
	VariableSortField,
	SortDirection,
	VariableType,
} from "@/entities/variable";
```

Changes inside the file:
1. **Dead code**: delete the unused `columns` array (the thead is hardcoded).
2. **`readOnly` prop**: add `readOnly?: boolean` to `VariablesTableProps` and destructure it.
3. **Toggle a11y** — replace the toggle button with:

```tsx
<button
	type="button"
	role="switch"
	aria-checked={v.clientVisibility}
	aria-label={`Client visibility for ${v.name}`}
	disabled={readOnly}
	onClick={() => onToggleVisibilityRequest(v)}
	className={cn(
		"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
		v.clientVisibility ? "bg-brand-600" : "bg-neutral-border/40",
		readOnly && "cursor-default opacity-70"
	)}
>
	<span
		className={cn(
			"pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
			v.clientVisibility ? "translate-x-4" : "translate-x-0"
		)}
	/>
</button>
```

4. **Action buttons** — wrap in `!readOnly && ( … )` so clients see no Edit/Delete; keep the Notes button for everyone:

```tsx
<td className="px-6 py-3.5 align-middle">
	<div className="flex items-center gap-1">
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={() => onViewNotes(v)}
			title="View Notes"
			className="rounded-full"
		>
			<FileText className="h-3.5 w-3.5" />
		</Button>
		{!readOnly && (
			<>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => onEdit(v)}
					title="Edit Variable"
					className="rounded-full"
				>
					<Pencil className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => onDeleteRequest(v)}
					title="Delete Variable"
					className="rounded-full text-destructive hover:text-destructive hover:bg-red-50"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
			</>
		)}
	</div>
</td>
```

5. **Clipboard catch** — replace `handleCopy` in `ValueCell`:

```tsx
const handleCopy = () => {
	if (!navigator.clipboard) return;
	navigator.clipboard
		.writeText(value)
		.then(() => {
			setCopied(true);
			toast.add({
				title: "Copied",
				description: "Value copied to clipboard.",
				type: "success",
			});
			setTimeout(() => setCopied(false), 2000);
		})
		.catch(() => {
			toast.add({
				title: "Copy Failed",
				description: "Clipboard access was denied.",
				type: "error",
			});
		});
};
```

- [ ] **Step 2: Rewrite `src/features/variable-manager/ui/VariableNotesModal.tsx`**

Full file (client view hides the team section; commented blocks removed; `"use client";` semicolon + EOF newline fixed):

```tsx
"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { VariableItem } from "@/entities/variable";

interface VariableNotesModalProps {
	isOpen: boolean;
	variable: VariableItem | null;
	/** Client viewers see ONLY their own (client) notes — team notes never render. */
	clientView?: boolean;
	onClose: () => void;
}

export function VariableNotesModal({
	isOpen,
	variable,
	clientView = false,
	onClose,
}: VariableNotesModalProps) {
	if (!variable) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Variable Notes</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{!clientView && (
						<div className="space-y-1.5">
							<Label>Notes to the Team</Label>
							<div className="p-3 rounded-md bg-neutral-surface border border-brand-100 min-h-16 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
								{variable.notesTeam || (
									<span className="text-muted-foreground italic">
										No team notes provided.
									</span>
								)}
							</div>
						</div>
					)}

					<div className="space-y-1.5">
						<Label>Notes to the Client</Label>
						<div className="p-3 rounded-md bg-neutral-surface border border-brand-100 min-h-16 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
							{variable.notesClient || (
								<span className="text-muted-foreground italic">
									No client notes provided.
								</span>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 3: Rewrite `src/features/variable-manager/ui/VariableFormModal.tsx`**

Changes:
1. Import `type FormEvent` from react; import `VariableCreateInput` from `@/shared/schemas/variable`; drop `../model/types` import (keep `VariableItem`, `VariableType` from `@/entities/variable`).
2. `onSubmit: (data: VariableCreateInput) => Promise<boolean>`.
3. `const [isSubmitting, setIsSubmitting] = useState(false);`
4. Replace the submit handler:

```tsx
const handleSubmit = async (e: FormEvent) => {
	e.preventDefault();
	if (!validate()) return;

	setIsSubmitting(true);
	const ok = await onSubmit({
		name: name.trim(),
		type,
		value: value.trim(),
		notesTeam: notesTeam.trim(),
		notesClient: notesClient.trim(),
	});
	setIsSubmitting(false);
	if (ok) handleClose();
};
```

5. Buttons: `disabled={isSubmitting}` on both Cancel and submit; submit label stays; add `isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Add Variable Details"`.

- [ ] **Step 4: Edit `src/features/variable-manager/ui/VariableConfirmModal.tsx`**

Remove the commented-out `<div className="rounded-md border border-brand-100 bg-neutral-subtle p-3 text-center">…</div>` block (lines ~66-70).

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npx vitest run`
Expected: 43 files / 285 tests + 16 new = 44 files / 301 tests pass.

```bash
git add src/features/variable-manager
git commit -m "fix: variables UI — role-aware notes, a11y toggle, async submit, dead code"
```

---

### Task 6: Route page → thin async server page

**Files:**
- Modify: `src/app/(app)/(workspace)/projects/[projectId]/variables/page.tsx`

- [ ] **Step 1: Rewrite the route page**

```tsx
import { VariablesPage } from "@/features/variable-manager";

interface PageParams {
	projectId: string;
}

export default async function VariablesRoute({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <VariablesPage projectId={projectId} />;
}
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exit 0.

```bash
git add "src/app/(app)/(workspace)/projects/[projectId]/variables/page.tsx"
git commit -m "refactor: variables route page reads async params (issues-page pattern)"
```

---

### Task 7: Full verification

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
Expected: 44 files / 301 tests pass (10 schema + 6 mapper tests new).

- [ ] **Step 4: Lint**

Run: `npx eslint src/entities/variable src/features/variable-manager src/shared/schemas src/shared/query src/lib/auth "src/app/(app)/(workspace)/projects/[projectId]/variables"`
Expected: 0 errors, 0 warnings.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully` + `Generating static pages … (10/10)` — green since the `(app)` layout `force-dynamic` fix (e506396).

- [ ] **Step 6: Commit any verification fixes**

```bash
git add -A && git commit -m "chore: verification fixes" || true
```

- [ ] **Step 7: Optional — apply migration 13 to Supabase**

With user approval (like migration 11):
```bash
npx prisma db execute --file prisma/migrations/20260815030000_13_variables/migration.sql
```
Expected: 0 rows affected (DDL); then re-verify read-only (`npx prisma validate` + a smoke query through the generated client). **Do NOT run without explicit user approval.**

---

### Task 8: Update docs/code-review-plan.md

**Files:**
- Modify: `docs/code-review-plan.md`

- [ ] **Step 1: Flip the feature entries**

In section 10, flip to `[x]` with 2026-08-15 annotations:
- `src/features/variable-manager/index.ts`
- `src/features/variable-manager/model/mockData.ts` (deleted)
- `src/features/variable-manager/model/types.ts` (deleted — types moved to `entities/variable`)
- `src/features/variable-manager/ui/VariablesPage.tsx`
- `src/features/variable-manager/ui/VariablesTable.tsx`
- `src/features/variable-manager/ui/VariableConfirmModal.tsx`
- `src/features/variable-manager/ui/VariableFormModal.tsx`
- `src/features/variable-manager/ui/VariableNotesModal.tsx`

In section 9 (entities), add:
- `src/entities/variable/index.ts` (new — actions, queries, types, lib/mappers)
- `src/entities/variable/types.ts` (new)
- `src/entities/variable/variableActions.ts` (new)
- `src/entities/variable/queries.ts` (new)
- `src/entities/variable/lib/mappers.ts` (new — 6 tests)
- `src/entities/variable/lib/mappers.test.ts` (new)

In section 3 (shared), add:
- `src/shared/schemas/variable.ts` (new — variableCreateSchema, 10 tests)
- `src/shared/schemas/variable.test.ts` (new)

In section 11, flip:
- `src/app/(app)/(workspace)/projects/[projectId]/variables/page.tsx`

- [ ] **Step 2: Add the follow-up entry**

In "Other follow-ups", add a checked entry (style of the dashboard-analytics entry) summarizing the integration: migration 13, entity slice, client gating semantics (hidden rows never sent; notes_team never sent; read-only clients), a11y/async fixes, tests (16 new), verification results, and the "migration applied to Supabase out-of-band" state.

- [ ] **Step 3: Commit**

```bash
git add docs/code-review-plan.md
git commit -m "docs: variable-manager review + integration signed off"
```

---

## Self-Review

**Spec coverage:**
1. "Route from the project variables button on project-structure" → route already exists; Task 6 converts it to the async-params pattern (button wiring unchanged, `/projects/[projectId]/variables`). ✓
2. "Toggle for client visibility — value/address column" → `client_visible` column + confirm-gated toggle action (Task 3); clients only ever receive visible rows (user decision, Task 3 action). ✓
3. "Clients see their own variable notes" → `notes_client` sent to clients; `notes_team` never sent (Task 3) + notes modal `clientView` hides the team section (Task 5). ✓
4. "Team + owners see everything" → team branch returns the full row; all mutations `assertProjectMemberNotClient` (Task 3); UI hides Add/Edit/Delete/toggle for clients (Tasks 4-5). ✓
5. "New files → update the markdown" → Task 8. ✓

**Placeholder scan:** no TBD/TODO stubs; every code step contains full code; every command has expected output. ✓

**Type consistency:** `VariableCreateInput` flows schemas → actions → form `onSubmit`; `VariableItem` flows mappers → queries → page/table/modals; `variableKeys.list(projectId)` used by both the query factory and every invalidation; `resolveVariableProject` matches the existing `resolve*Project` helpers; action unions use `success: true/false as const` (narrowing convention). ✓

**Review-finding coverage:** mock secrets → Task 4 deletes `mockData.ts`; zero authz → Tasks 3-5; `notesTeam` leak → Tasks 3+5; decorative `clientVisibility` → Task 3 (model + filtering); dead `columns` → Task 5; toggle a11y → Task 5; clipboard catch → Task 5; close-before-save + `React.FormEvent` → Task 5; commented blocks/EOF → Tasks 2/5 rewrites; no tests → Tasks 2-3 (16 tests). ✓

**Edge cases:** empty project (no variables) → "No variables found." row; client with zero visible variables → same empty state (correct — nothing leaks); anonymous → `assertProjectMemberOrClient` rejects → query throws → error state; deleted variable re-fetch → soft-deleted rows excluded; double-close on confirm modals → idempotent (existing behavior, verified by review). ✓
