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

| `client_id` | `department_id` | Meaning                                                   |
| ----------- | --------------- | --------------------------------------------------------- |
| NOT NULL    | NULL            | **Client** — external stakeholder tied to a `Clients` row |
| NULL        | NOT NULL        | **Internal user** — belongs to a `Department`             |
| NULL        | NULL            | Unclassified / edge case                                  |
| NOT NULL    | NOT NULL        | Invalid — should not occur per design                     |

### `Clients`

```
client_id       UUID PK
client_name     String
tin             String        (Tax ID Number)
billing_address String
email           String        @unique? (added during shadcn migration — non-nullable)
phone           String        @unique? (added during shadcn migration — non-nullable)
is_deleted      Boolean       @default(false)
deleted_at      DateTime?
```

One client organization can have **many** `Profiles` (e.g., multiple stakeholders from the same company), each with their own login. A client profile is identified by `Profiles.client_id IS NOT NULL`.

**Recent additions**: `email` and `phone` columns were added to store client contact information. These are used in the Client Manager modals and displayed in the client list table. The `PhoneInput` component provides international phone validation via `libphonenumber-js`.

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

| Feature                     | PO   | PT   | Finance      | Client |
| --------------------------- | ---- | ---- | ------------ | ------ |
| Projects                    | CRUD | R    | R            | R      |
| Modules                     | CRUD | CRUD | R            | R      |
| Workflows                   | CRUD | CRUD | R            | R      |
| Ticketing                   | CRUD | CRUD | R            | R      |
| Ticket Tagging              | CRUD | CRUD | R            | R      |
| Ticket Commenting           | CRUD | CRUD | R            | R      |
| Contracts                   | CRUD | R    | R            | R      |
| Contract Signatures         | CRUD | R    | R            | CRUD   |
| Phase Groupings             | CRUD | R    | R            | R      |
| Gate Signatures             | R    | R    | R            | CRUD   |
| Feedback Commenting         | R    | R    | R            | CRUD   |
| Actual Gantt Charts         | R    | R    | R            | R      |
| Ticket Burn Rate            | R    | R    | R            | R      |
| Planned Gantt Chart         | R    | R    | R            | —      |
| Ticket Burn Rate per Dev    | R    | R    | R            | R      |
| Assignee Tasks              | R    | R    | —            | —      |
| Watcher Tasks               | R    | R    | —            | —      |
| Contract Needs to Be Signed | R    | —    | —            | R      |
| Stage Can Be Billed         | R    | —    | R            | —      |
| Invoice Sending Button      | —    | —    | Interactable | —      |
| Profile Picture             | CRUD | CRUD | CRUD         | CRUD   |
| Phone Number                | CRUD | CRUD | CRUD         | CRUD   |
| Credentials                 | CRUD | CRUD | —            | R      |
| Links                       | CRUD | CRUD | —            | R      |
| Repositories                | CRUD | CRUD | —            | R      |

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
start_date    DateTime?
finish_date   DateTime?
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
start_date    DateTime?
finish_date   DateTime?
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
start_date    DateTime?
finish_date   DateTime?
deadline_date DateTime?
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

### `Modules`

```
module_id     UUID PK
name          String
phase_id      UUID → Phases
start_date    DateTime?
finish_date   DateTime?
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
start_date    DateTime?
finish_date   DateTime?
deadline_date DateTime?
is_deleted    Boolean   @default(false)
deleted_at    DateTime?
```

> **Note**: `Workflows.number` is used for drag-and-drop reordering within a module. It is auto-assigned on creation (`createWorkflow()`) and reordered via `reorderWorkflow()` (insertion-based null-shift-reassign algorithm). It is set to `null` on soft-delete to release the slot. The `getStageTree` query orders workflows by `number` (nulls last) with `start_date` as fallback.

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
start_date      DateTime?
finish_date     DateTime?                     (set to now() when status → FINISHED; null otherwise)
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
contract_name            String?   @unique          (display name; optional, set on upload)
file_path                String?   @unique          (the contract document in Supabase Storage)
client_signature         String?                    (full name of signing client)
client_initials          String?                    (client's initials, max 4 chars)
client_signed_at         DateTime?                  (when the client signed)
project_owner_signature  String?                    (full name of signing PO)
project_owner_initials   String?                    (PO's initials, max 4 chars)
project_owner_signed_at  DateTime?                  (when the PO signed)
is_deleted               Boolean   @default(false)
deleted_at               DateTime?
```

Contracts are created as a **blank record** when a project is made — only `project_id` and `client_id` are required upfront. `file_path`, `contract_name`, signatures, and signed-at timestamps are filled later.

- Each project has **exactly 1 contract** (`project_id @unique`).
- Signing is split into two independent actions: the **client** signs and the **project owner** signs. Each signature is tracked with a full name, initials (max 4 chars), and timestamp.
- Only PO can upload the contract (`file_path`). Both PO and Client can provide their respective signatures.
- Soft-delete via `is_deleted` + `deleted_at`; on re-upload, soft-delete is reset.

> **Server actions** (`src/entities/contract/contractActions.ts`): All six actions (`uploadContract`, `getContractUrl`, `deleteContract`, `getContractByProjectId`, `changeContractName`, `signContract`) are validated with Zod schemas (`contractUploadSchema`, `contractSignSchema`, `contractChangeNameSchema` in `src/shared/schemas/contract.ts`) and return the consistent `{ success: true, data? }` / `{ success: false, error }` shape — never throwing. `deleteContract` removes from Supabase Storage **before** soft-deleting the DB row to avoid orphaned files.

> **TanStack Query** (`src/entities/contract/queries.ts`, `mutations.ts`): `useContract(projectId)` fetches via `contractKeys.detail(projectId)`. `useUploadContract`, `useSignContract`, and `useDeleteContract` mutations each invalidate `contractKeys.detail(projectId)` on success. The contracts page (`src/app/(app)/contracts/page.tsx`) uses these hooks instead of raw `useEffect` + direct server-action calls.

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

- `project_id` and `client_id` are required; `file_path`, `contract_name`, signatures, initials, and signed-at timestamps are filled later. `project_id` is unique — one contract per project. Dual signatures: PO signs with `project_owner_signature`/`project_owner_initials`/`project_owner_signed_at`, client signs with `client_signature`/`client_initials`/`client_signed_at`.
- All server actions validated with Zod (`contractUploadSchema`, `contractSignSchema`, `contractChangeNameSchema`) and return `{ success, data/error }`. TanStack Query hooks (`useContract`, `useUploadContract`, `useSignContract`, `useDeleteContract`) manage caching and invalidation via `contractKeys`.

### ticketActions.ts — diff-ing + history writes
- `updateTicket()` uses a diff-ing approach: fetches existing `name`, `status`, `watcher_id`, `TicketAssigned`, and `TicketTags`, computes `toAdd` / `toRemove` for assignees, tags, and watcher, and applies only the needed creates and deletes. The original `assigned_date` is preserved for unchanged entries.
- After the update, `updateTicket()` writes `HistoryEvent` rows for every changed field: RENAMED, FINISHED / UPDATED_STATUS, ASSIGNED, UNASSIGNED, and WATCHER_CHANGED.
- `updateTicketStatus()` (drag-and-drop) is wrapped in `prisma.$transaction` so the ticket status change and HistoryEvent write are atomic — if either fails, both roll back. Sets `finish_date: new Date()` when status → FINISHED, and `null` otherwise.
- `createTicket()`, `cascadeSoftDeleteTicket()`, and `createCommentWithImages()` each write their respective HistoryEvent rows (CREATED, DELETE, COMMENT_ADDED) alongside their primary mutation.

### `deadline_date` column
All hierarchy models (Projects, Stages, Phases, Modules, Workflows, and Tickets) now include a `deadline_date DateTime?` column. This is an **editable user-set deadline** — distinct from:
- `start_date`: the proposed/planned start date for the entity, user-set on create/edit, displayed as "Start Date" in the UI.
- `finish_date`: **computed** by `getStageTree()`, not editable in the UI. Represents the date the last ticket under that entity was finished (see below).

The Zod schemas (`phaseCreateSchema`, `moduleCreateSchema`, `workflowCreateSchema`) all include `deadline_date: z.date().optional().nullable()`. All server actions (`createPhase`, `updatePhase`, `createModule`, `updateModule`, `createWorkflow`, `updateWorkflow`) accept and persist `deadlineDate`.

### `getStageTree()` — computed `finish_date` + ticket progress
`getStageTree()` in `stageActions.ts` is the single source of truth for the stage editor's nested data. It performs **4 batched queries** (stage → phases → modules → workflows) plus a **5th query** for tickets, then assembles everything in-memory:

1. Fetches all non-deleted tickets for the stage's workflows
2. Groups tickets by `workflow_id`
3. Per workflow: computes `ticketCount`, `progress` (finished/total × 100), and `finish_date`

**Finish date rule**: A workflow's computed `finish_date` is set **only when ALL its tickets are FINISHED** (`finished === total > 0`). If any ticket is not finished, `finish_date` is `null` → renders as "Unfinished" in the UI. When all are finished, `finish_date` = max `finish_date` of the finished tickets.

This rule **propagates upward**:
- **Module finish_date**: only set when ALL its workflows are finished (all have non-null finish_date); otherwise null.
- **Phase finish_date**: only set when ALL its modules are finished; otherwise null.

Adding a new unfinished workflow/module to an already-finished parent immediately resets the parent's finish_date to null.

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

`getStageTree()` orders both phases and workflows by `[{ number: { sort: 'asc', nulls: 'last' } }, { start_date: 'asc' }]` — numbered items sort first, unnumbered ones fall back to creation order.

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
| `Contracts` | `contract_name` | `@unique` |
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

All create/update inputs are validated via Zod schemas in `shared/schemas/`. Schemas use **snake_case** field names matching the database columns. UI types in `features/stage-editor/types.ts` also use snake_case for DB-originating fields (`phase_id`, `start_date`, `finish_date`), with only computed UI fields (`ticketCount`, `progress`) in camelCase.

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
| Date Created | `start_date` | Yes | The proposed/planned start date. User-set on create/edit. Nullable. |
| Deadline Date | `deadline_date` | Yes | User-set via `datetime-local` input in modals and ActivePhaseDetails. Nullable. |
| Finish Date | `finish_date` (computed) | No | Computed by `getStageTree()` — the date the last ticket was finished (only when ALL sub-tickets are finished). Renders as "Unfinished" if null. |

### `getStageTree()` data flow

1. Fetches stage → phases → modules → workflows (4 queries, ordered)
2. Fetches all non-deleted tickets for those workflows (5th query)
3. Groups tickets by workflow, computes per-workflow: `ticketCount`, `progress` (finished/total %), `finish_date` (only when all tickets finished)
4. Assembles nested tree, propagating `finish_date` upward (workflow → module → phase) using the "all finished" rule

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
- **Date badge**: `start_date – finish_date (or "Unfinished")` — compact interval view
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

---

## 17. Project Entity Layer

A new entity layer at `src/entities/project/` handles project CRUD and member management.

### `projectActions.ts` (Server Actions)

```typescript
"use server";

selectProjects()         → Project[]       // all non-deleted, ordered by name
getProjectById(id)       → Project | null  // single project
createProject(data)      → { success, data?, error? }  // creates + assigns creator as Project Owner
updateProject(data)      → { success, data?, error? }  // PATCH update, only provided fields
softDeleteProject(id, name) → { success, error? }      // requires confirmation name to match
getProjectMembers(id)    → RoleAssignment[]  // includes Users (profile) + Roles
searchProfilesForProject(query) → Profile[]  // searches first_name/last_name/email, limit 20
addProjectMember(projectId, profileId, roleName) → { success, error? }
removeProjectMember(projectId, profileId) → { success, error? }  // last-owner guard
```

**Key design decisions:**
- `createProject()` gets the current user from the server-side Supabase session (`createClient()` from `@/lib/supabase/server`) — the user ID is never accepted from the client.
- The creator is automatically assigned the `"Project Owner"` role via a `RoleAssignments` row in a Prisma `$transaction`.
- `softDeleteProject()` requires the user to type the exact project name to confirm — the `confirmation_name` is compared server-side to prevent CSRF/malicious deletions.
- `removeProjectMember()` prevents removing the last remaining Project Owner by counting `RoleAssignments` with the owner role before deletion.

### Zod Schemas (`src/shared/schemas/project.ts`)

```typescript
projectCreateSchema = {
  name:          String (min 1, required),
  description:   String (optional, default ""),
  start_date:    Date? (optional),
  deadline_date: Date? (optional),
}

projectUpdateSchema = projectCreateSchema.partial() + {
  project_id: String (UUID, required),
}

projectDeleteSchema = {
  project_id:       String (UUID, required),
  confirmation_name: String (min 1, required),
}
```

### TanStack Query hooks (`queries.ts`)

| Hook | Query Key | Description |
|---|---|---|
| `useProjects()` | `["projects","list"]` | Fetches all active projects |
| `useProject(id)` | `["projects","detail",id]` | Fetches single project by ID |
| `useProjectMembers(projectId)` | `["projects","detail",projectId,"members"]` | Fetches project members with role info |
| `useProfileSearch()` | manual trigger | Search profiles for member addition |

### TanStack Mutation hooks (`mutations.ts`)

| Hook | Invalidates | Optimistic |
|---|---|---|
| `useCreateProject()` | `["projects","list"]` | No |
| `useUpdateProject()` | `["projects","list"]` + `["projects","detail",id]` | No |
| `useDeleteProject()` | `["projects","list"]` | No |
| `useAddProjectMember()` | `["projects","detail",id,"members"]` | No |
| `useRemoveProjectMember()` | `["projects","detail",id,"members"]` | Yes — removes row from cache immediately, restores on error |

### Project Manager Feature (`features/project-manager/`)

Three modals in `ui/modals/`:

| Modal | Mode | Key Behavior |
|---|---|---|
| `EditProjectModal` | Edit / Add | Pre-populates fields when editing; empty fields for create. Validates `name` (required). |
| `ManageMembersModal` | View/Manage | Debounced search (300ms). Member list with avatar, name, email, role badge. Remove button disabled for last Project Owner. Optimistic removal. |
| `DeleteProjectModal` | Confirm | Type project name to confirm. Delete button disabled until name matches exactly. |

### Projects Page (`/projects`)

The workspace projects page at `src/app/(app)/(workspace)/projects/page.tsx` displays:
- A "New Project" button
- List of all active projects with Edit, Members, Delete action buttons
- Empty state with a call-to-action when no projects exist
- All three modals wired via `useState` state management
- Mutations through the entity layer hooks
- The `/projects/new` route redirects to `/projects?action=create`

### Files Added

```
src/entities/project/
├── index.ts                 # barrel export
├── projectActions.ts        # server actions (9 functions)
├── queries.ts               # TanStack Query hooks
└── mutations.ts             # TanStack Mutation hooks (5 hooks)

src/features/project-manager/
└── ui/modals/
    ├── index.ts             # barrel export
    ├── EditProjectModal.tsx
    ├── ManageMembersModal.tsx
    └── DeleteProjectModal.tsx
```

### Updated Files

```
src/shared/schemas/project.ts          # +projectCreateSchema, projectUpdateSchema, projectDeleteSchema
src/shared/schemas/index.ts            # +project schema exports
src/shared/query/keys.ts               # +projectKeys
src/app/(app)/(workspace)/projects/page.tsx    # full implementation
src/app/(app)/(workspace)/projects/new/page.tsx # redirect to /projects?action=create
```

---

## 18. Project Owner Dashboard

The dashboard at `/projects` provides a filtered view of projects owned by the current user, grouped by computed status.

### Database Status Column

The `Projects` table has a **`status` column** of type `ProjectStatus` (DB enum with values `PENDING`, `ACTIVE`, `COMPLETED`). This column is synchronized automatically by the dashboard server action.

### Computed Project Status

`selectProjectsByOwner()` computes the correct status from the relationship between `Contracts` and `Stages`, then **updates the DB if the stored value differs**:

| Status | Condition |
|---|---|
| **PENDING** | Project exists, but the associated `Contracts` record lacks one or both signatures (`client_signature` or `project_owner_signature`) |
| **ACTIVE** | Contract is fully signed (both signatures present), but not all associated `Stages` have a `finish_date` (or there are no stages yet) |
| **COMPLETED** | Contract fully signed AND every `Stage` under the project has `finish_date IS NOT NULL` |

### Server Action

```typescript
selectProjectsByOwner(): Promise<ProjectWithStatus[]>
```

- Gets the current user from the server-side Supabase session (`createClient()`)
- Queries `RoleAssignments` where `user_id` matches and the role is `"Project Owner"`
- For each owned project, fetches the related `Contracts` (signature status) and `Stages` (finish status)
- Computes the correct status, updates the DB if the stored `status` column differs, and returns the project with both `status` and `project_status` fields

### Types

```typescript
type ProjectStatus = "PENDING" | "ACTIVE" | "COMPLETED";

interface ProjectWithStatus {
  project_id: string;
  name: string;
  description: string | null;
  start_date: Date | null;
  finish_date: Date | null;
  deadline_date: Date | null;
  is_deleted: boolean;
  deleted_at: Date | null;
  status: ProjectStatus;        // synced DB column
  project_status: ProjectStatus; // computed (always matches status)
  client_name: string | null;
  client_id: string | null;
}
```

### Query Hook

```typescript
useOwnedProjects(): UseQueryResult<ProjectWithStatus[]>
```

Uses query key `["projects", "list", "owned"]`.

### UI Components

The dashboard feature lives at `src/features/project-dashboard/`:

| Component | Description |
|---|---|
| `ProjectDashboard` | Main dashboard with header, three collapsible sections (Active → Pending → Completed), modal wiring |
| `ProjectSection` | Collapsible section wrapper with status icon, title, count badge, expand/collapse toggle (darker arrow), empty state |
| `ProjectCard` | Individual bordered card (`flex flex-col h-full`) with project name (2-line clamp), ALL CAPS status badge (PENDING/ACTIVE/COMPLETED) with colored icon, "Client" label + name, "Description" label + italic text (2-line clamp, shows "(No description)" when null), date timeline with calendar icons (shows "starting — deadline" when both null), bottom-pinned timeline row (`mt-auto`), three-dot menu (fixed positioning, flips above if near screen bottom) |

**Menu ellipsis actions** (each card, accessible via three-dot button):
- **Edit project details** → opens `EditProjectModal` (from `features/project-manager`)
- **Manage project members** → opens `ManageMembersModal`
- **Delete Project** → opens `DeleteProjectModal`

**Status icons** (colored SVGs next to status badge):
- **PENDING**: Clock/hourglass outline (yellow `#CA8A04`)
- **ACTIVE**: Play triangle (indigo `#4F46E5`)
- **COMPLETED**: Checkmark circle (green `#16A34A`)

**Status filtering**: Uses the stored `Projects.status` column (DB enum `ProjectStatus`), read directly by `selectProjectsByOwner()`. The `grouped` useMemo filters by `project_status`. Sections ordered: Active → Pending → Completed.

### Files Added

```
src/features/project-dashboard/
├── index.ts
└── ui/
    ├── ProjectDashboard.tsx
    ├── ProjectSection.tsx
    └── ProjectCard.tsx
```

### Updated Files

```
src/entities/project/projectActions.ts   # +selectProjectsByOwner(), ProjectStatus, ProjectWithStatus
src/entities/project/queries.ts          # +useOwnedProjects()
src/entities/project/index.ts            # +exports for new types and hooks
src/app/(app)/(workspace)/projects/page.tsx   # replaced with ProjectDashboard
```

### UI Behaviors

- **Project cards**: Rendered as individual bordered cards (`flex flex-col h-full`) in a responsive CSS grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). Each card has:
  - Title (2-line clamp via `line-clamp-2`, consistent `min-h-[2.5rem]`)
  - Status badge (ALL CAPS: `PENDING`/`ACTIVE`/`COMPLETED`) on the top-right with colored SVG icon
  - "Client" label + name (always visible, `"—"` if null)
  - "Description" label + italic text (2-line clamp, shows `"(No description)"` in gray when null)
  - Date timeline with calendar icons (shows `"starting — deadline"` placeholder when both dates null)
  - Dark divider (`border-[#E2E8F0]`), bottom row pinned via `mt-auto`
  - Three-dot menu (fixed positioning, flips above if near screen bottom, consistent 4px gap)
- **Date inputs**: Use `<input type="datetime-local">` (with time picker) in Edit Project and Create Project modals
- **Character count**: Project Name input shows `{n}/50` counter in the lower-right, matching the pattern from stage-editor modals. Zod schema enforces `.max(50)`. Description has `.max(2000)`.
- **Multi-section expansion**: All three status sections (Active, Pending, Completed) can be expanded simultaneously via a `Set<ProjectStatus>` state. Default state: all three open. Order: Active → Pending → Completed.
- **Search empty state**: When the Manage Members search query is non-empty, search is not loading, and no results are found, a dashed-border "No users found" placeholder is displayed
- **Menu dropdown**: Uses `z-[100]` with fixed positioning (computed from `getBoundingClientRect()`). Checks available space below (`200px` threshold); if insufficient, flips above with same 4px gap. Each card's menu managed by `useState` — one at a time (auto-closes on outside click via `mousedown` listener).
- **Manage Members table**: Columns: NAME | DEPARTMENT | ROLE | ACTION. Non-client members only (client profiles filtered out via `!m.Users.client_id`). Count excludes clients. Widen modal (`max-w-2xl`). Search results styled consistently with member table rows.
- **Client dropdown**: Custom dropdown (not native `<select>`) matching ticket-manager pattern: button trigger with chevron, `max-h-48 overflow-y-auto` options list showing ~6 items with scrolling, selected item highlighted in indigo.
- **Client required**: In Create mode, client field is required with red border + inline error message. Hidden in Edit mode (immutable after creation).
- **Auto-open members**: After creating a project, the Manage Members modal auto-opens for the new project.

---

## 19. Client Assignment & Auto-Provisioning

### Client Dropdown in Create Project

The `EditProjectModal` (in Create mode) shows a **Client** dropdown populated from `clientSelectAll()`. Selecting a client is optional. In Edit mode, the client field is hidden (clients cannot be changed after creation).

### Project Creation with Client

When a project is created with a `client_id`, the `createProject()` server action performs these steps in a single `$transaction`:

1. Creates the `Projects` row
2. Assigns the creator as **Project Owner** via `RoleAssignments`
3. Creates a blank **`Contracts`** row with the `client_id` and `project_id` (all other fields default to `NULL`)
4. Finds all `Profiles` where `client_id` matches the selected client
5. Assigns each such profile the **Client Viewer** role via `RoleAssignments`

### Zod Schema

```typescript
projectCreateSchema = {
  name:          String (min 1, max 50, required),
  description:   String (max 2000, optional, default ""),
  client_id:     UUID String (optional, nullable) — links to Clients table,
  start_date:    Date? (optional),
  deadline_date: Date? (optional),
}
```

### Manage Members Modal (Table Layout)

The modal now uses a `<table>` matching the Figma design with columns:
- **NAME** — avatar initials + full name + email
- **DEPARTMENT** — department name or "—"
- **Assigned To** — role badge (e.g. "Project Owner", "Client Viewer", "Project Team Member")
- **ACTION** — remove button (disabled for last Project Owner)

Role names from Supabase: `Finance Member`, `Project Team Member`, `Client Viewer`, `Project Owner`

### Auto-Assignment Logic (profile → client → projects)

When a new `Profiles` row is created with a `client_id`, it should be auto-assigned to all existing projects that belong to that client. This logic lives in the profile creation flow (signup): query all `Projects` that have a `Contracts` record with the matching `client_id`, then create `RoleAssignments` rows with the **Client Viewer** role for each.

### Files Added/Modified

```
src/entities/client/clientActions.ts          # +clientSelectAll()
src/shared/schemas/project.ts                  # +client_id field
src/entities/project/projectActions.ts          # +client_id handling, Contract creation, client profile assignment
src/features/project-manager/ui/modals/EditProjectModal.tsx   # +Client dropdown (Create mode)
src/features/project-manager/ui/modals/ManageMembersModal.tsx  # table layout, "Project Team Member" default role
```

---

## 20. Security & Authorization

All server actions in `src/entities/project/projectActions.ts` enforce authentication and authorization:

### Auth Helpers

```typescript
getCurrentUserId(): Promise<string | null>         // returns user ID from server-side Supabase session, or null
requireProjectMember(projectId, userId): Promise<boolean> // checks RoleAssignments for any role
requireProjectOwner(projectId, userId): Promise<boolean>  // checks RoleAssignments for "Project Owner" role
```

### Function Auth Coverage

| Server Action | Auth Gate | Authorization |
|---|---|---|
| `createProject()` | Supabase session (`createClient().auth.getUser()`) | Creator auto-assigned as Project Owner |
| `selectProjectsByOwner()` | Supabase session | Only returns projects where caller holds Project Owner role |
| `selectProjects()` | `getCurrentUserId()` | All authenticated users (returns empty if unauthenticated) |
| `getProjectById()` | `getCurrentUserId()` | All authenticated users |
| `updateProject()` | `getCurrentUserId()` + `requireProjectMember()` | Must be a project member |
| `softDeleteProject()` | `getCurrentUserId()` + `requireProjectOwner()` | Must be the Project Owner + name confirmation |
| `getProjectMembers()` | `getCurrentUserId()` + `requireProjectMember()` | Must be a project member |
| `addProjectMember()` | `getCurrentUserId()` + `requireProjectOwner()` | Only Project Owner can add members (default role: Project Team Member) |
| `removeProjectMember()` | `getCurrentUserId()` + `requireProjectOwner()` | Only Project Owner can remove members (last-owner guard prevents removing sole owner) |
| `searchProfilesForProject()` | `getCurrentUserId()` | All authenticated users (returns empty if unauthenticated) |

### Client Profile Handling

- Client profiles (`Profiles.client_id IS NOT NULL`) are filtered out of search results and member lists
- When creating a project with a client, all profiles linked to that client are auto-assigned as "Client Viewer"
- Role names from Supabase: `Finance Member`, `Project Team Member`, `Client Viewer`, `Project Owner`

### Delete Project Confirmation

Requires typing the exact project name to confirm deletion. The server-side check compares `confirmationName` against the stored `project.name`. Combined with the `requireProjectOwner` auth gate, this prevents accidental or unauthorized deletion.

---

## 21. Client Manager Feature

The client manager feature at `src/features/client-manager/` provides CRUD operations for clients, team member viewing, and client search.

### `ClientFormModal` (merged Add/Edit)

A single modal handling both create and edit modes, determined by the `clientId` prop:

| Mode | `clientId` | Title | Server Action |
|---|---|---|---|
| Add | Not provided | "Add Client" | `clientCreate()` |
| Edit | Provided | "Edit Client Details" | `clientUpdate()` |

- **Fields**: Client Name (required, max 40), TIN (required), Email (required, validated), Contact Number (required, validated via PhoneInput), Billing Address (required)
- **Validation**: Zod `clientSchema` validates all fields before submit; inline errors with `text-xs text-destructive mt-1`
- **State reset**: `useEffect` on `[isOpen, clientId, initialData.*]` syncs form fields every time the modal opens

### `PhoneInput` component

`src/components/ui/phone-input.tsx` — a shadcn-styled phone input with:
- Country code selector (shadcn `<Select>` dropdown)
- `<Input type="tel">` for the number
- Live validation via `libphonenumber-js` (validates any country's mobile/landline)
- Displays formatted number when valid, red border when invalid
- Replaces all raw `type="tel"` inputs across the project (AddClientModal, EditClientModal, StaffSignupForm)

### `ViewTeamMembersModal`

Displays profiles linked to a client. Data fetched via `clientSelectAll()` which now includes `Profile` records via Prisma `include`. The modal receives real data mapped to a `TeamMember` interface.

### Client Search

The clients page (`/clients`) has client-side search filtering: typing in the search bar filters the client list by name (case-insensitive).

### Entity Layer Updates

| Function | Action |
|---|---|
| `clientCreate()` | Now persists `email` and `phone` fields |
| `clientUpdate()` | Now persists `email` and `phone` fields |
| `clientSelectAll()` | Now includes nested `Profiles` (id, name, email, phone) |
| `clientSelectProfiles(clientId)` | New — fetches profiles by `client_id` |

---

## 22. shadcn UI Migration

The project underwent a full migration from custom UI components to [shadcn/ui](https://ui.shadcn.com) with base-nova style.

### Replaced Components

| Old Custom Component | shadcn Replacement | Files Updated |
|---|---|---|
| `Button` (shared/ui/button) | `Button` (variant: default/destructive/ghost/link) | 15 files, 26 usages |
| `Modal` + `Backdrop` | `Dialog` / `AlertDialog` | 12 files |
| `Toast` (context-based) | `Toast` (shadcn/Toaster pattern) | 3 files |
| `Input` (shared/ui/input) | `Input` | 15+ files |
| `Label` (shared/ui/label) | `Label` (extended with required/error props) | 15+ files |

### Component Customizations

- **`Button`**: Extended with `icon="add"` (renders `<Plus />`) and `icon="delete"` (renders `<Trash2 />`) props for common actions
- **`Label`**: Extended with `required` and `error` props; added `mb-1` bottom margin; required asterisk always uses `text-destructive` (red)
- **DialogHeader/DialogFooter**: Both set to `p-6` padding

### Theme Alignment

- Font: **Hanken Grotesk** (body), JetBrains Mono (monospace — replaced Geist which was overriding)
- Border radius: `--radius: 0.625rem` → `--radius-md = 0.5rem` (matches project's `rounded-lg`)
- Button sizing: Default height `h-10` with `px-4` padding (matches original `py-2.5 px-4`)

### Standardized Patterns

| Pattern | Format | Coverage |
|---|---|---|
| Field validation errors | `<p className="text-xs text-destructive mt-1">` | ~54 error elements across 19 files |
| Character counters | `<span className="text-[10px] text-muted-foreground ml-auto">` in label row | 12 counters across 9 files |

### Files Deleted

```
src/shared/ui/button.tsx
src/shared/ui/input.tsx
src/shared/ui/label.tsx
src/shared/ui/modal.tsx
src/shared/ui/backdrop.tsx
src/shared/ui/toast.tsx
src/features/ticket-board/ui/TicketModalDelete.tsx
```

---

## 23. Code Quality Improvements

### Unused Code Removed
- `TruckElectricIcon` import from contracts page
- `NAV_LINKS` constant and associated lucide icons from clients page
- Various unused imports across 10+ files (`useEffect`, `Label`, `Button`, `Workflow`, `ProfileDisplay`, `DialogDescription`)
- Unused variables across 8+ files (handleStartDate, handleFinishDate, isUploading, isOverdue, etc.)

### Form State Reset
Modals now properly reset their form state when opened with new data via `useEffect` on `[isOpen, dataKey]`:

| Modal | Reset Trigger |
|---|---|
| `ClientFormModal` | `[isOpen, clientId, initialData.*]` |
| `TagFormModal` | `[isOpen, initial?.name, initial?.description, initial?.color]` |
| `EditProjectModal` | `[isOpen, project]` (existing) |

This prevents stale data from persisting when opening the modal for different records.
