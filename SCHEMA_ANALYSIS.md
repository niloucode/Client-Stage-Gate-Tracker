# Stage-Gate Project — Schema & Permissions Analysis

> Authoritative reference derived from `prisma/schema.prisma` and `project_permissions.txt`.
> Use for codebase error-checking, onboarding context, and architecture decisions.

---

## 1. Database Overview

- **Database**: PostgreSQL via Supabase
- **Schemas**: `auth` (Supabase Auth) + `public` (application domain)
- **ORM**: Prisma, client output at `src/lib/generated/prisma`
- **Soft-delete policy**: All domain tables use `is_deleted` (Boolean, default `false`) + `deleted_at` (DateTime?). Join tables (`RoleAssignments`, `RolePermissions`, `TicketAssigned`, `TicketTags`) use **hard deletes** when a relationship is explicitly removed — but they are **not** cascade hard-deleted when the associated entity is soft-deleted. Hard-deleting a join table row only happens when the parent entity itself is hard-deleted (the sole hard-delete example is a tag being fully removed from the system). `HistoryEvent` is immutable — no delete mechanism at all.

---

## 2. Identity & Departments

### `Profiles` (application user table)

```
profile_id    UUID PK  (=== auth.users.id, bridged via Users_user_id_fkey)
image_id      UUID?     → Images (profile picture)
client_id     UUID?     → Clients
department_id UUID?     → Department
email         String    @unique
phone         String    @unique
first_name    String
last_name     String
job_title     String?
```

### How to determine user type

| `client_id` | `department_id` | Meaning |
|---|---|---|
| NOT NULL | NULL | **Client** — external stakeholder tied to a `Clients` row |
| NULL | NOT NULL | **Internal user** — belongs to a `Department` |
| NULL | NULL | Unclassified / edge case |
| NOT NULL | NOT NULL | Invalid — should not occur per design |

### `Clients`

```
client_id       UUID PK
client_name     String
tin             String        (Tax ID Number)
billing_address String
```

One client organization can have **many** `Profiles` (e.g., multiple stakeholders from the same company), each with their own login. A client profile is identified by `Profiles.client_id IS NOT NULL`.

### `Department`

```
department_id UUID PK
name          String @unique
```

Internal users are assigned to a department. The three internal roles are derived from department name:
- **Project Owner (PO)** — department `name = "Project Owner"`
- **Project Team (PT)** — department `name = "Project Team"`
- **Finance Team** — department `name = "Finance"`

**Business rule**: Only profiles in the "Project Owner" department can create projects; the creator becomes the sole owner of that project via `RoleAssignment`.

---

## 3. Permissions & Roles

### Model structure

```
Roles ──M:N── Permissions       (via RolePermissions)
  │
  └── M:N ── Profiles           (via RoleAssignments, scoped to a Project)
```

### `Roles`

```
role_id UUID PK
name    String @unique
```

Expected roles: `"Project Owner"`, `"Project Team"`, `"Finance"`, `"Client"`.

> **Note**: The `SignupForm` Department field is a `<select>` restricted to the three internal department names (Project Owner, Project Team, Finance Team). See Section 15.

### `Permissions`

```
permission_id UUID PK
resource      String      (e.g. "Projects", "Tickets", "Contracts")
action        String      (e.g. "create", "read", "update", "delete")

@@unique([resource, action])
```

### `RolePermissions` (M:N join)

```
role_id       UUID  → Roles
permission_id UUID  → Permissions
PK: (role_id, permission_id)
```

### `RoleAssignments` (profile → role → project)

```
role_id    UUID  → Roles
user_id    UUID  → Profiles
project_id UUID  → Projects
PK: (role_id, user_id, project_id)
```

A profile's permissions within a project are determined by their `RoleAssignment` — which role they hold on that project. There should be **at most 1 owner per project**.

### Full permission matrix

| Feature | PO | PT | Finance | Client |
|---|---|---|---|---|
| Projects | CRUD | R | R | R |
| Modules | CRUD | CRUD | R | R |
| Workflows | CRUD | CRUD | R | R |
| Ticketing | CRUD | CRUD | R | R |
| Ticket Tagging | CRUD | CRUD | R | R |
| Ticket Commenting | CRUD | CRUD | R | R |
| Contracts | CRUD | R | R | R |
| Contract Signatures | CRUD | R | R | CRUD |
| Phase Groupings | CRUD | R | R | R |
| Gate Signatures | R | R | R | CRUD |
| Feedback Commenting | R | R | R | CRUD |
| Actual Gantt Charts | R | R | R | R |
| Ticket Burn Rate | R | R | R | R |
| Planned Gantt Chart | R | R | R | — |
| Ticket Burn Rate per Dev | R | R | R | R |
| Assignee Tasks | R | R | — | — |
| Watcher Tasks | R | R | — | — |
| Contract Needs to Be Signed | R | — | — | R |
| Stage Can Be Billed | R | — | R | — |
| Invoice Sending Button | — | — | Interactable | — |
| Profile Picture | CRUD | CRUD | CRUD | CRUD |
| Phone Number | CRUD | CRUD | CRUD | CRUD |
| Credentials | CRUD | CRUD | — | R |
| Links | CRUD | CRUD | — | R |
| Repositories | CRUD | CRUD | — | R |

> **Note**: Invoices, Credentials, Links, and Repositories appear in the permissions matrix but have **no corresponding database tables yet** — future work.

---

## 4. Project Hierarchy

### Chain

When a project is first created, it starts empty — gates and stages are created later. All levels below the project are 0+ at creation time:

```
Project
 └── Gate (0+, checkpoint for client approval)
 └── Stage (0+)
      └── Phase (0+)
           └── Module (0+)
                └── Workflow (0+)
                     └── Ticket (0+)
```

### `Projects`

```
project_id    UUID PK
name          String
description   String?
creation_date DateTime      @default(now() AT UTC)
end_date      DateTime?
deadline_date DateTime?
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

### `Stages`

```
stage_id      UUID PK
number        Int?                         @@unique([project_id, number]) — nullable; set to null on soft-delete; remaining stages renumbered to close gap
name          String
description   String?
project_id    UUID → Projects
creation_date DateTime
end_date      DateTime?
deadline_date DateTime?
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

### `Phases`

```
phase_id      UUID PK
number        Int?                         @@unique([stage_id, number]) — nullable; set to null on soft-delete; remaining phases renumbered to close gap
name          String
description   String?
stage_id      UUID → Stages
creation_date DateTime
end_date      DateTime?
deadline_date DateTime?
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

### `Modules`

```
module_id     UUID PK
name          String
phase_id      UUID → Phases
creation_date DateTime
end_date      DateTime?
deadline_date DateTime?
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

### `Workflows`

```
workflow_id   UUID PK
name          String
is_approved   Boolean   @default(false)
number        Int?                       @@unique([number, module_id]) — nullable; set to null on soft-delete; remaining workflows renumbered to close gap
module_id     UUID → Modules
creation_date DateTime
end_date      DateTime?
deadline_date DateTime?
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

> **Note**: `Workflows.number` is used for drag-and-drop reordering within a module. It is auto-assigned on creation (`createWorkflow()`) and reordered via `reorderWorkflow()` (insertion-based null-shift-reassign algorithm). It is set to `null` on soft-delete to release the slot. The `getStageTree` query orders workflows by `number` (nulls last) with `creation_date` as fallback.

### `Tickets`

```
ticket_id       UUID PK
name            String
description     String?
status          status    @default(PENDING)   (PENDING | IN_PROGRESS | FINISHED)
workflow_id     UUID  → Workflows             (required — tickets always belong to a workflow)
watcher_id      UUID? → Profiles              (single watcher, informational)
api_route       String?                       (optional API endpoint path)
api_method      ApiMethod?                    (GET | POST | PUT | DELETE)
assignment_date DateTime
creation_date   DateTime
end_date        DateTime?                     (set to now() when status → FINISHED; null otherwise)
deadline_date   DateTime?
```

---

## 5. Gates & Gate Signatures

### `Gates`

```
gate_id       UUID PK
number        Int                          @@unique([project_id, number])
project_id    UUID → Projects
creation_date DateTime
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

Gates are checkpoints within a project where **clients can approve and comment**. By design, gates have **no `name` or `description`** — they are identified by `number` only.

### `GateSignatures`

```
gate_id    UUID PK   → Gates      (one signature row per gate, keyed on gate_id)
profile_id UUID      → Profiles   (which client profile signed)
signature  String                  (signature value)
signed_at  DateTime                (when it was signed)
```

A gate requires exactly **one client signature** for approval. Any client profile (any profile with `client_id` pointing to the project's client) can provide that signature. The presence of a `GateSignatures` row for a gate means it is approved — there is no separate `is_approved` boolean.

Client feedback on gates is captured via `Comments` with `parent_type = "GATE_COMMENT"`.

---

## 6. Support Entities

### `Comments` — polymorphic

```
comment_id    UUID PK
profile_id    UUID → Profiles      (who wrote it)
description   String                (NON-NULLABLE — blank comments are rejected at the DB level)
parent_type   CommentParentType    (TICKET_COMMENT | GATE_COMMENT)
parent_id     UUID                 (ticket_id or gate_id based on parent_type)
creation_date DateTime
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

Comments attach to either a **Ticket** (work discussion) or a **Gate** (client feedback/approval). The polymorphic pair `(parent_type, parent_id)` determines the target. Referential integrity between `parent_id` and the target table is **not enforced at the DB level** — the application must ensure consistency.

> **Design decision**: `description` is required (`String`, not `String?`). This prevents users from submitting blank/empty comments. Image-only comments can use a minimal placeholder like `"[Image]"` in the description — this is handled at the frontend level, not the schema.

### `Images` — polymorphic + profile picture

```
image_id    UUID PK
image_src   String @unique       (URL or path to image)
parent_type ImageParentType      (TICKET | TICKET_COMMENT | GATE_COMMENT | PROFILE)
parent_id   UUID                 (ticket_id, comment_id, or profile_id)
is_deleted  Boolean   @default(false)
deleted_at  DateTime?
```

Images can attach to:
- A **Ticket** directly (`parent_type = "TICKET"`)
- A **Comment on a ticket** (`parent_type = "TICKET_COMMENT"`)
- A **Comment on a gate** (`parent_type = "GATE_COMMENT"`)
- A **Profile** as a profile picture (`parent_type = "PROFILE"`, or via `Profiles.image_id → Images`)

Same polymorphic caveat as Comments — app-level integrity enforcement.

### `HistoryEvent` — immutable audit log

```
history_event_id UUID PK
action           action        (CREATED | FINISHED | UPDATED_STATUS | RENAMED
                               | COMMENT_ADDED | WATCHER_CHANGED
                               | ASSIGNED | UNASSIGNED | DELETE)
performed_by     UUID → Profiles       (who did the action)
ticket_id        UUID → Tickets        (which ticket)
target_profile_id UUID? → Profiles     (who was assigned/unassigned/watcher-targeted; null for other actions)
details          String?               (optional JSON metadata — see convention table below)
date_performed   DateTime
```

An append-only audit trail for tickets. Every ticket-mutating server action writes a row.
History is fetched via `selectTicketHistory()` which joins both the performer (via `Profiles_HistoryEvent_performed_byToProfiles`) and the target (via `Profiles`) to populate `performerName` and `targetName` for the UI. The `TicketHistoryLog` component renders these as colored entries — status values as per-column badges, performer names in indigo, target names in teal — and collapses to the first 4 entries with a "Show all" toggle.

| Action | Written by | `details` JSON shape | `target_profile_id` |
|---|---|---|---|
| CREATED | `createTicket()` | `{ticket_name}` | null |
| FINISHED | `updateTicket()` / `updateTicketStatus()` when status → FINISHED | `{from}` (previous status) | null |
| UPDATED_STATUS | `updateTicket()` / `updateTicketStatus()` for non-FINISHED transitions | `{from, to}` (status strings) | null |
| RENAMED | `updateTicket()` | `{from, to}` (old/new names) | null |
| COMMENT_ADDED | `createCommentWithImages()` (TICKET_COMMENT only; inside a `$transaction`) | — | null |
| WATCHER_CHANGED | `updateTicket()` | `{from, to}` (UUIDs or null) | new watcher UUID (or old watcher if removing) |
| ASSIGNED | `updateTicket()` | — | assigned profile UUID |
| UNASSIGNED | `updateTicket()` | — | removed profile UUID |
| DELETE | `cascadeSoftDeleteTicket()` | `{ticket_name}` | null |

No `is_deleted` column — by design, history is immutable. `details` is an optional `String?` column storing structured JSON that the UI's `formatHistoryMessage()` parses to build human-readable activity sentences. `target_profile_id` is populated for ASSIGNED, UNASSIGNED, and WATCHER_CHANGED — the `selectTicketHistory` join on `Profiles` automatically fills `targetName` when `target_profile_id` is set.

**Transaction safety**: `updateTicketStatus()` wraps the ticket update + history write in a `prisma.$transaction` so both succeed or both roll back. Other writes (in `createTicket`, `cascadeSoftDeleteTicket`, `createCommentWithImages`) follow the same atomic pattern.

**TanStack integration**: All ticket mutations (`useCreateTicket`, `useUpdateTicket`, `useUpdateTicketStatus`, `useDeleteTicket`) invalidate `historyKeys.list(ticketId)` on success for targeted refetch. `useCreateComment` also invalidates `historyKeys.list(parent_id)` when `parent_type === "TICKET_COMMENT"`. The history query fetches via `fetchTicketHistory()` → `selectTicketHistory()` → Zod validation through `ticketHistoryEntrySchema`.

### `Tags` + `TicketTags`

```
Tags:
  tag_id      UUID PK
  name        String @unique
  description String?
  color       String?
  is_deleted  Boolean   @default(false)
  deleted_at  DateTime?

TicketTags:
  ticket_id UUID → Tickets
  tag_id    UUID → Tags
  PK: (ticket_id, tag_id)
```

Tickets ↔ Tags is M:N via `TicketTags`. Tags are global (not scoped to project). Removing a tag from a ticket hard-deletes the `TicketTags` row. **Hard-deleting a tag itself** (fully removing it from the system) cascade-hard-deletes its `TicketTags` entries.

### `TicketAssigned` — M:N ticket assignees

```
ticket_id     UUID → Tickets
profile_id    UUID → Profiles
assigned_date DateTime   @default(now() AT UTC)
PK: (ticket_id, profile_id)
```

A ticket can have **0+ assignees**. This is distinct from `Tickets.watcher_id` (a single watcher — informal visibility). Removing an assignee hard-deletes the `TicketAssigned` row.

> **Code note**: `updateTicket()` uses a **diff-ing approach** for `TicketAssigned` and `TicketTags` — it fetches existing assignments, computes which profiles/tags to add vs. remove, and only creates/deletes the differences. This preserves the original `assigned_date` on unchanged entries.

### `Contracts` — 1:1 with Projects

```
contract_id              UUID PK
project_id               UUID @unique → Projects    (1:1 — one contract per project)
client_id                UUID → Clients             (required)
file_path                String? @unique            (the contract document, unique)
client_signature         String?                    (signed by any client profile)
client_signed_at         DateTime?                  (when the client signed)
project_owner_signature  String?                    (signed by the PO)
project_owner_signed_at  DateTime?                  (when the PO signed)
is_deleted               Boolean   @default(false)
deleted_at               DateTime?
```

Contracts are created as a **blank record** when a project is made — only `project_id` and `client_id` are required upfront. `file_path`, signatures, and signed-at timestamps are filled later.

- Each project has **exactly 1 contract** (`project_id @unique`).
- Signing is split into two independent actions: the **client** signs and the **project owner** signs. Each signature is tracked with its own value and timestamp.
- Only PO can upload the contract (`file_path`). Both PO and Client can provide their respective signatures.

---

## 7. Auth ↔ Public Bridge

```
auth.users (id)  ←→  public.Profiles (profile_id)   [1:1]
```

`Profiles.profile_id` = `auth.users.id`. The FK map is `Users_user_id_fkey`. Every application user must exist in `auth.users` first, then have a corresponding `Profiles` row.

`onDelete: NoAction` on this relation means deleting an auth user requires first cleaning up the `Profiles` row and all related records in application code.

### Soft-deleting profiles (planned behavior — NOT yet implemented)

We do not currently plan to implement soft-delete for profiles, but if/when it is done, the following behavior is expected:

1. Set `is_deleted = true` and `deleted_at = now()` on the `Profiles` row
2. The user's historical data **remains visible** — `HistoryEvent` entries, `TicketAssigned` history, `Comments`, `Contracts`, etc. are preserved (not anonymized like Reddit's `[deleted]`)
3. The soft-deleted user **cannot be assigned** to new tickets, gates, contracts, or roles — any UI that offers user assignment must filter out `is_deleted = true` profiles
4. When soft-deleting, the corresponding `auth.users` row is **removed** (hard-deleted from the auth schema) to prevent login. The `Profiles` row is kept for data integrity.

---

## 8. Enums (public schema)

| Enum | Values | Used By |
|---|---|---|
| `status` | `PENDING`, `IN_PROGRESS`, `FINISHED` | `Tickets.status` |
| `action` | `CREATED`, `FINISHED`, `UPDATED_STATUS`, `RENAMED`, `COMMENT_ADDED`, `WATCHER_CHANGED`, `ASSIGNED`, `UNASSIGNED`, `DELETE` | `HistoryEvent.action` |
| `CommentParentType` | `TICKET_COMMENT`, `GATE_COMMENT` | `Comments.parent_type` |
| `ImageParentType` | `TICKET`, `TICKET_COMMENT`, `GATE_COMMENT`, `PROFILE` | `Images.parent_type` |
| `ApiMethod` | `GET`, `POST`, `PUT`, `DELETE` | `Tickets.api_method` |

---

## 9. Business Rules Summary

1. **Project creation**: Only profiles in the "Project Owner" department (`Department.name = "Project Owner"`) can create projects. Creator becomes the sole owner via `RoleAssignment` (1 owner per project max).

2. **Role determination**: A profile's permissions within a project come from their `RoleAssignment` row (profile → role → project). The role's permissions are defined via `RolePermissions` (role → permissions).

3. **Client identification**: A profile is a client iff `Profiles.client_id IS NOT NULL`. One client organization can have multiple profiles.

4. **Internal identification**: A profile is internal iff `Profiles.department_id IS NOT NULL`. The department name maps to PO / PT / Finance.

5. **Gates are client checkpoints**: Clients approve gates via `GateSignatures` (one signature from any client profile). Client feedback uses `Comments` with `parent_type = "GATE_COMMENT"`. Gates have no name/description — identified by `number`.

6. **Tickets have watchers + assignees**: `watcher_id` is a single informal watcher (visibility); `TicketAssigned` is formal assignment (0+ people). Soft-deleted profiles cannot be assigned.

7. **Soft deletes**: All domain entities use `is_deleted` + `deleted_at`. Join tables (`RoleAssignments`, `RolePermissions`, `TicketAssigned`, `TicketTags`) are hard-deleted only when the relationship is explicitly removed or when the parent entity is hard-deleted (e.g., fully removing a tag from the system). Soft-deleting an entity does **not** cascade-hard-delete its join table rows. `HistoryEvent` is immutable — no delete mechanism at all.

8. **Contracts**: Created as a blank record at project creation with `project_id` + `client_id`. 1:1 with projects (`project_id @unique`). Only PO uploads the contract file; both PO and Client provide their respective signatures tracked with timestamps. Finance handles invoicing.

9. **Gate signatures**: A gate is approved when **one client profile** signs it via `GateSignatures`. The signature row records which profile signed and when. There is no separate `is_approved` boolean — approval = presence of a signature row.

10. **Polymorphic integrity**: Comments (`parent_type`/`parent_id`) and Images (`parent_type`/`parent_id`) rely on application-level referential integrity — no DB-level FK to the polymorphic targets.

11. **TicketAssigned diff-ing**: Updating `TicketAssigned` or `TicketTags` must use a diff-ing approach (compute additions and removals) — never nuke-all (`deleteMany: {}` + `create`). The `assigned_date` must be preserved for unchanged entries.

---

## 10. Entity Relationship Quick Reference

```
auth.users ───1:1─── Profiles ───M:1─── Clients
                         │
                         ├── M:1 ─── Department
                         ├── 1:1 ─── Images (profile picture, via Profiles.image_id)
                         ├── M:N ─── Tickets (via TicketAssigned, as assignee)
                         ├── 1:N ─── Tickets (as watcher, via Tickets.watcher_id)
                         ├── 1:N ─── Comments (author, via Comments.profile_id)
                         ├── 1:N ─── HistoryEvent (as performer)
                         ├── 1:N ─── HistoryEvent (as target)
                         ├── 1:N ─── GateSignatures (client who signed a gate)
                         └── M:N ─── Roles per Project (via RoleAssignments)

Projects ───1:N─── Stages ───1:N─── Phases ───1:N─── Modules ───1:N─── Workflows ───1:N─── Tickets
   │
   ├── 1:N ─── Gates
   ├── 1:1 ─── Contracts
   └── M:N ─── Profiles (via RoleAssignments)

Gates ───1:1─── GateSignatures ───M:1─── Profiles
   │
   └── 1:N ─── Comments (parent_type = "GATE_COMMENT")

Tickets ───M:N─── Profiles (via TicketAssigned)
   │
   ├── M:N ─── Tags (via TicketTags)
   ├── 1:N ─── Comments (parent_type = "TICKET_COMMENT")
   ├── 1:N ─── Images (parent_type = "TICKET")
   └── 1:N ─── HistoryEvent

Comments ───1:N─── Images (parent_type = "TICKET_COMMENT" or "GATE_COMMENT")

Profiles ───1:1─── Images (parent_type = "PROFILE", via Profiles.image_id)
```

---

## 11. Design Notes & Observations

### Soft-delete exceptions (hard-delete tables)
- `RoleAssignments`, `RolePermissions`, `TicketAssigned`, `TicketTags` — join/association tables. When a relationship is explicitly removed, the row is hard-deleted. These tables have no `is_deleted`/`deleted_at` columns.
- **Crucial**: Hard-deleting a join table row only happens when the relationship is explicitly severed or the parent entity is **hard-deleted**. Soft-deleting an entity does NOT cascade to its join table rows.

### Immutable audit log
- `HistoryEvent` has no delete mechanism at all — it's an append-only audit trail by design. Includes a `DELETE` action to record who soft-deleted a ticket.

### Missing tables (future work)
The permissions matrix references features with no corresponding tables yet:
- **Invoices / Payments** — "Invoice Sending Button" (Finance-only)
- **Credentials** — "Credentials" (PO/PT CRUD, Client R)
- **Links** — "Links" (PO/PT CRUD, Client R)
- **Repositories** — "Repositories" (PO/PT CRUD, Client R)

### Polymorphic relationships require app-level integrity
- `Comments.(parent_type, parent_id)` and `Images.(parent_type, parent_id)` use Prisma enums for the type discriminator but have no DB-level FK to the target tables. Application code must validate that `parent_id` refers to a real row of the correct type.

### Gates: no name or description
- Intentional design decision. **Gates** are identified by `number` within a project only.
- **Stages** DO have both `name` and `description` (unlike Gates).

### Gate approval model
- A gate is approved when a `GateSignatures` row exists for it. The row records which client profile signed and when. Only one signature is needed (any client profile of the project's client).

### Contracts: blank-on-creation + 1:1
- `project_id` and `client_id` are required; `file_path`, signatures, and signed-at timestamps are filled later. `project_id` is unique — one contract per project. Dual signatures: PO signs with `project_owner_signature`/`project_owner_signed_at`, client signs with `client_signature`/`client_signed_at`.

### ticketActions.ts — diff-ing + history writes
- `updateTicket()` uses a diff-ing approach: fetches existing `name`, `status`, `watcher_id`, `TicketAssigned`, and `TicketTags`, computes `toAdd` / `toRemove` for assignees, tags, and watcher, and applies only the needed creates and deletes. The original `assigned_date` is preserved for unchanged entries.
- After the update, `updateTicket()` writes `HistoryEvent` rows for every changed field: RENAMED, FINISHED / UPDATED_STATUS, ASSIGNED, UNASSIGNED, and WATCHER_CHANGED.
- `updateTicketStatus()` (drag-and-drop) is wrapped in `prisma.$transaction` so the ticket status change and HistoryEvent write are atomic — if either fails, both roll back. Sets `end_date: new Date()` when status → FINISHED, and `null` otherwise.
- `createTicket()`, `cascadeSoftDeleteTicket()`, and `createCommentWithImages()` each write their respective HistoryEvent rows (CREATED, DELETE, COMMENT_ADDED) alongside their primary mutation.

### `deadline_date` column
All hierarchy models (Projects, Stages, Phases, Modules, Workflows, and Tickets) now include a `deadline_date DateTime?` column. This is an **editable user-set deadline** — distinct from:
- `creation_date`: auto-set on create, never edited (Date Created in the UI)
- `end_date`: **computed** by `getStageTree()`, not editable in the UI. Represents the date the last ticket under that entity was finished (see below).

The Zod schemas (`phaseCreateSchema`, `moduleCreateSchema`, `workflowCreateSchema`) all include `deadline_date: z.date().optional().nullable()`. All server actions (`createPhase`, `updatePhase`, `createModule`, `updateModule`, `createWorkflow`, `updateWorkflow`) accept and persist `deadlineDate`.

### `getStageTree()` — computed `end_date` + ticket progress
`getStageTree()` in `stageActions.ts` is the single source of truth for the stage editor's nested data. It performs **4 batched queries** (stage → phases → modules → workflows) plus a **5th query** for tickets, then assembles everything in-memory:

1. Fetches all non-deleted tickets for the stage's workflows
2. Groups tickets by `workflow_id`
3. Per workflow: computes `ticketCount`, `progress` (finished/total × 100), and `end_date`

**End date rule**: A workflow's computed `end_date` is set **only when ALL its tickets are FINISHED** (`finished === total > 0`). If any ticket is not finished, `end_date` is `null` → renders as "Unfinished" in the UI. When all are finished, `end_date` = max `end_date` of the finished tickets.

This rule **propagates upward**:
- **Module end_date**: only set when ALL its workflows are finished (all have non-null end_date); otherwise null.
- **Phase end_date**: only set when ALL its modules are finished; otherwise null.

Adding a new unfinished workflow/module to an already-finished parent immediately resets the parent's end_date to null.

**Progress bars** in the WorkflowsList UI show:
- Gray bar with "- %" when `ticketCount === 0`
- Indigo bar with `{progress}%` when tickets exist

### Phase / Workflow DnD ordering

Both `Phases` and `Workflows` have a `number Int?` column with a composite unique constraint (`@@unique([stage_id, number])` and `@@unique([number, module_id])` respectively). On creation, the number is auto-assigned as `MAX(number) + 1` (using `COALESCE(MAX(number), 0) + 1` to survive gaps). On soft-delete, the number is set to `null` and all remaining siblings with higher numbers are shifted down by 1 (null-all-then-reassign) to keep the sequence contiguous.

Drag-and-drop uses an **insertion-based reorder** (not a swap). Both `reorderPhase(phaseId, targetNumber)` and `reorderWorkflow(workflowId, targetNumber)` use a three-step algorithm inside a Prisma interactive transaction:

1. **Fetch** all affected entities in the range `[min(oldNumber, targetNumber), max(oldNumber, targetNumber)]`
2. **Null** all their numbers in one `updateMany` (multiple NULLs don't violate the unique constraint)
3. **Reassign** each entity one at a time: the dragged entity gets `targetNumber`, every other entity shifts by `±1`

This approach avoids the per-row unique-constraint checks that would fail with a naive `UPDATE … SET number = number - 1` or a two-statement swap.

The mutations (`useReorderPhase`, `useReorderWorkflow`) invalidate `stageKeys.tree(stageId)` on success. The UI guards against dragging an entity whose `number` is `null`.

`getStageTree()` orders both phases and workflows by `[{ number: { sort: 'asc', nulls: 'last' } }, { creation_date: 'asc' }]` — numbered items sort first, unnumbered ones fall back to creation order.

### Profiles soft-delete (not yet implemented)
- Behavior documented in Section 7. Currently `Profiles` has `is_deleted` and `deleted_at` columns but no soft-delete workflow is built. Because of this, profile queries (e.g. `getProfileByEmail` in `profileActions.ts`) do not filter on `is_deleted` — all profiles are assumed active. If soft-delete is implemented later, all profile lookups must add `where: { is_deleted: false }` and the duplicate-email check in `ClientSignupForm` + `StaffSignupForm` must account for soft-deleted users who should be able to re-register.

### Legacy naming artifacts
- `Profiles` PK constraint map name is `"Users_pkey"` — the table was renamed from `Users` to `Profiles` at some point.
- Several FK constraint maps reference `"Users_*"` — same rename artifact.
- **Rule for future changes**: Any reference to `public.users` in schemas, queries, or documentation should use `public.profiles` going forward.

---

## 12. Key Constraints Summary

| Table | Constraint | Type |
|---|---|---|
| `Profiles` | `email` | `@unique` |
| `Profiles` | `phone` | `@unique` |
| `Department` | `name` | `@unique` |
| `Roles` | `name` | `@unique` |
| `Permissions` | `(resource, action)` | `@@unique` |
| `Tags` | `name` | `@unique` |
| `Images` | `image_src` | `@unique` |
| `Contracts` | `project_id` | `@unique` (1:1 with Projects) |
| `Contracts` | `file_path` | `@unique` |
| `Gates` | `(project_id, number)` | `@@unique` |
| `Stages` | `(project_id, number)` | `@@unique` |
| `Phases` | `(stage_id, number)` | `@@unique` |
| `Workflows` | `(number, module_id)` | `@@unique` |
| `GateSignatures` | `gate_id` | `@@id` (single-column PK, one per gate) |
| `RoleAssignments` | `(role_id, user_id, project_id)` | `@@id` (composite PK) |
| `RolePermissions` | `(role_id, permission_id)` | `@@id` (composite PK) |
| `TicketAssigned` | `(ticket_id, profile_id)` | `@@id` (composite PK) |
| `TicketTags` | `(ticket_id, tag_id)` | `@@id` (composite PK) |

---

## 13. Frontend Architecture

> **Note**: The stage-editor feature is fully implemented and merged. Sections 13–16 describe the current production state.

### FSD Layer Structure

```
src/
├── app/              ← routes (Next.js App Router)
├── entities/         ← server actions + TanStack Query hooks per DB table
├── features/         ← UI components grouped by user-facing capability
└── shared/           ← reusable primitives (schemas, UI kit, query keys)
```

Layer dependency rule: `app → features → entities → shared`

### Data Flow (TanStack Query + Mutations)

Every CRUD operation follows this chain:

```
User action (form submit) → mutation.mutateAsync(...)
  → server action (Prisma create/update/delete)
    → DB generates UUID (gen_random_uuid())
      → onSuccess: queryClient.invalidateQueries(stageKeys.tree(stageId))
        → useQuery auto-refetches fresh data
          → UI re-renders with real UUIDs
```

**Key rules:**
- No client-side ID generation — all UUIDs originate from the DB
- No `setPhases()` callbacks — data flows one-way from TanStack Query cache
- Mutations invalidate `stageKeys.tree(stageId)` to trigger a single efficient refetch of the full nested hierarchy

### Query Keys

Query keys follow a hierarchical factory pattern in `shared/query/keys.ts`:

```typescript
stageKeys.tree(stageId)    // ["stages", "detail", stageId, "tree"] — full nested tree
phaseKeys.detail(id)       // ["phases", "detail", id]
moduleKeys.detail(id)      // ["modules", "detail", id]
workflowKeys.detail(id)    // ["workflows", "detail", id]
historyKeys.list(ticketId) // ["ticketHistory", "list", ticketId] — activity log for a ticket
```

### Ticket Board Feature

The ticket-board feature (`src/features/ticket-board/`) renders a Kanban board for a workflow's tickets. Each ticket opens a slide-over (`TicketModalEdit`) that includes the **Activity Log** (`TicketHistoryLog`).

**Activity log data flow**:
```
Server action (createTicket / updateTicket / updateTicketStatus / cascadeSoftDeleteTicket / createCommentWithImages)
  → writes HistoryEvent row to DB
    → TanStack mutation.onSuccess invalidates historyKeys.list(ticketId)
      → useTicketHistory refetches via fetchTicketHistory()
        → selectTicketHistory() joins performer + target Profiles
          → ticketHistoryEntrySchema.parse() validates each row
            → TicketHistoryLog renders with colored status badges, performer (indigo), target (teal)
```

The log collapses to the first 4 entries with a "Show all N entries" toggle. Status values (`PENDING` / `IN_PROGRESS` / `FINISHED`) render as lowercase colored badges matching the board columns (gray / blue / green). Performer names are rendered in `text-indigo-700 font-semibold` and target names (assignees, watcher targets) in `text-teal-600 font-medium`.

**Cross-invalidation with stage-editor**: `useUpdateTicketStatus` invalidates `stageKeys.all` on success, so navigating back to the stage editor after a ticket status change shows fresh progress bars and computed end dates.

### Zod Schemas

All create/update inputs are validated via Zod schemas in `shared/schemas/`. Schemas use **snake_case** field names matching the database columns. UI types in `features/stage-editor/types.ts` also use snake_case for DB-originating fields (`phase_id`, `start_date`, `creation_date`), with only computed UI fields (`ticketCount`, `progress`) in camelCase.

---

## 14. Stage Editor Feature

### Route

`/projects/[projectId]/stages/[stageId]?phase=N` — renders the stage structure editor. The `?phase=N` URL param persists the selected phase across navigation (supplemented by `sessionStorage` for round-trip persistence from ticket-board → back).

### Feature Slice

`features/stage-editor/` — Components manage Phases → Modules → Workflows within a single Stage. All state flows through `useStageTree()` → `getStageTree()`.

### Component Tree

```
Page (useStageTree → phases)
  ├── PhaseStepper    ← phase dots, drag-reorder, create/delete
  ├── ActivePhaseDetails ← edit name/description/deadline (buffered, explicit Save)
  └── ModulesCard     ← module list, create/edit/delete, expand to workflows
       └── WorkflowsList ← workflow list, create/edit/delete/drag, progress bars
```

### Server Action Wiring

| Component | Create | Update | Delete | Reorder |
|---|---|---|---|---|
| PhaseStepper | `useCreatePhase` | — | `useDeletePhase` | `useReorderPhase` |
| ActivePhaseDetails | — | `useUpdatePhase` | `useDeletePhase` | — |
| ModulesCard | `useCreateModule` | `useUpdateModule` | `useDeleteModule` | — |
| WorkflowsList | `useCreateWorkflow` | `useUpdateWorkflow` | `useDeleteWorkflow` | `useReorderWorkflow` |

All mutations invalidate `stageKeys.tree(stageId)` on success.

### Datetime fields

Every entity has three datetime concepts displayed in the UI:

| Field | DB column | Editable | Description |
|---|---|---|---|
| Date Created | `creation_date` | No | Auto-set on creation. Displayed as `"Jan 15, 2025, 2:30 PM"`. |
| Deadline Date | `deadline_date` | Yes | User-set via `datetime-local` input in modals and ActivePhaseDetails. Nullable. |
| End Date | `end_date` (computed) | No | Computed by `getStageTree()` — the date the last ticket was finished (only when ALL sub-tickets are finished). Renders as "Unfinished" if null. |

### `getStageTree()` data flow

1. Fetches stage → phases → modules → workflows (4 queries, ordered)
2. Fetches all non-deleted tickets for those workflows (5th query)
3. Groups tickets by workflow, computes per-workflow: `ticketCount`, `progress` (finished/total %), `end_date` (only when all tickets finished)
4. Assembles nested tree, propagating `end_date` upward (workflow → module → phase) using the "all finished" rule

### Modals — validation UI

All 7 modals (Add/Edit/Delete for Phase, Module, Workflow + standalone DeletePhase/DeleteWorkflow) use:
- **`<Label required error={...}>`** from `shared/ui/label.tsx` — red asterisk on error
- **Red border** (`border-red-400`) on invalid inputs
- **Character counter** (`{n}/20` for phases, `{n}/35` for modules/workflows) with `maxLength` on inputs
- **Zod validation** via `phaseCreateSchema` / `moduleCreateSchema` / `workflowCreateSchema` before save
- **Inline error messages** via `fieldErrors` state

### Phase visualization

- Phase dots in PhaseStepper: numbered circles with active/completed/pending states
- Phase names truncated at ~10 chars via `max-w-[80px] truncate` with `title` tooltip
- Drag-and-drop reorders phases via `reorderPhase()` (insertion-based, null-shift-reassign inside a Prisma transaction)
- Selected phase persisted in `sessionStorage` ("stageEditorPhase") and URL `?phase=N` param
- Delete X button on hover triggers `DeletePhase` confirmation modal

### Progress bars

WorkflowsList renders per-workflow:
- **Ticket count**: `{N} Tickets` with star icon
- **Progress bar**: indigo bar with `{progress}%` when tickets exist; gray bar with `- %` when `ticketCount === 0`
- **Date badge**: `creation_date – end_date (or "Unfinished")` — compact interval view
- **Deadline**: shown under workflow title as `Deadline: {datetime}` or `——` if null

---

## 15. Signup Department Dropdown

The `StaffSignupForm` component (`features/auth/ui/StaffSignupForm.tsx`) restricts the Department field to a `<select>` dropdown with three options:

- `Project Team`
- `Project Owner`
- `Finance Team`

Styling matches the shared `Input` component (`px-3.5 py-2.5 rounded-lg border border-gray-300`). Placeholder text is `"Select..."` in gray. This replaces the previous free-text input to prevent misspellings and enforce the three valid internal departments.

---

## 16. Server Action Signatures (Phase / Module / Workflow)

All create and update server actions now accept `deadlineDate?: Date | null`.

### `createPhase()`

```typescript
export async function createPhase(
    stageId: string,
    phaseName: string,
    startDate?: Date | null,
    endDate?: Date | null,
    deadlineDate?: Date | null
)
```

### `updatePhase()`

```typescript
export async function updatePhase(
    phaseId: string,
    phaseName?: string,
    description?: string | null,
    startDate?: Date | null,
    endDate?: Date | null,
    deadlineDate?: Date | null
)
```

### `createModule()`

```typescript
export async function createModule(
    phaseId: string,
    moduleName: string,
    startDate?: Date | null,
    endDate?: Date | null,
    deadlineDate?: Date | null
)
```

### `updateModule()`

```typescript
export async function updateModule(
    moduleId: string,
    moduleName?: string,
    startDate?: Date | null,
    endDate?: Date | null,
    deadlineDate?: Date | null
)
```

### `createWorkflow()`

```typescript
export async function createWorkflow(
    moduleId: string,
    workflowName: string,
    startDate?: Date | null,
    endDate?: Date | null,
    deadlineDate?: Date | null,
    isApproved?: boolean
)
```

### `updateWorkflow()`

```typescript
export async function updateWorkflow(
    workflowId: string,
    workflowName?: string,
    startDate?: Date | null,
    endDate?: Date | null,
    isApproved?: boolean,
    deadlineDate?: Date | null
)
```

All signatures pass through to their respective TanStack mutations, which forward `params.deadline_date` from the Zod-validated form data.
