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
start_date    DateTime?
end_date      DateTime?
```

### `Stages`

```
stage_id      UUID PK
number        Int                          @@unique([project_id, number])
name          String
description   String?
project_id    UUID → Projects
creation_date DateTime
start_date    DateTime?
end_date      DateTime?
```

### `Phases`

```
phase_id      UUID PK
number        Int                          @@unique([stage_id, number])
name          String
description   String?
stage_id      UUID → Stages
creation_date DateTime
start_date    DateTime?
end_date      DateTime?
```

### `Modules`

```
module_id     UUID PK
name          String
phase_id      UUID → Phases
creation_date DateTime
start_date    DateTime?
end_date      DateTime?
```

### `Workflows`

```
workflow_id   UUID PK
name          String
is_approved   Boolean   @default(false)
module_id     UUID → Modules
creation_date DateTime
start_date    DateTime?
end_date      DateTime?
```

### `Tickets`

```
ticket_id       UUID PK
name            String
description     String?
status          status    @default(PENDING)   (PENDING | IN_PROGRESS | FINISHED)
workflow_id     UUID? → Workflows             (nullable — can exist outside a workflow)
watcher_id      UUID? → Profiles              (single watcher, informational)
api_route       String?                       (optional, for API-tagged tickets)
assignment_date DateTime
creation_date   DateTime
start_date      DateTime?
end_date        DateTime?
deadline_date   DateTime
```

---

## 5. Gates & Gate Signatures

### `Gates`

```
gate_id       UUID PK
number        Int                          @@unique([project_id, number])
project_id    UUID → Projects
creation_date DateTime
start_date    DateTime?
end_date      DateTime?
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
```

Comments attach to either a **Ticket** (work discussion) or a **Gate** (client feedback/approval). The polymorphic pair `(parent_type, parent_id)` determines the target. Referential integrity between `parent_id` and the target table is **not enforced at the DB level** — the application must ensure consistency.

> **Design decision**: `description` is required (`String`, not `String?`). This prevents users from submitting blank/empty comments. Image-only comments can use a minimal placeholder like `"[Image]"` in the description — this is handled at the frontend level, not the schema.

### `Images` — polymorphic + profile picture

```
image_id    UUID PK
image_src   String @unique       (URL or path to image)
parent_type ImageParentType      (TICKET | TICKET_COMMENT | GATE_COMMENT | PROFILE)
parent_id   UUID                 (ticket_id, comment_id, or profile_id)
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
                               | COMMENT_ADDED | ASSIGNED | UNASSIGNED | DELETE)
performed_by     UUID → Profiles       (who did the action)
ticket_id        UUID → Tickets        (which ticket)
target_profile_id UUID? → Profiles     (who was assigned/unassigned/deleted)
date_performed   DateTime
```

An append-only audit trail for tickets. The `DELETE` action records **who soft-deleted a ticket**. No `is_deleted` column — by design, history is immutable.

### `Tags` + `TicketTags`

```
Tags:
  tag_id      UUID PK
  name        String @unique
  description String?
  color       String?

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

> **IMPORTANT — code note**: The current `updateTicket()` in `src/entities/ticket/ticketActions.ts` uses a **nuke-it-all** approach (`deleteMany: {}` then `create`) for `TicketAssigned` and `TicketTags`. This destroys the original `assigned_date` on every update. This needs to be replaced with a **diff-ing approach**: compute which profiles/tags to add vs. remove, then only `create` the additions and `deleteMany` the removals. This preserves the original dates on unchanged assignments.

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
| `action` | `CREATED`, `FINISHED`, `UPDATED_STATUS`, `RENAMED`, `COMMENT_ADDED`, `ASSIGNED`, `UNASSIGNED`, `DELETE` | `HistoryEvent.action` |
| `CommentParentType` | `TICKET_COMMENT`, `GATE_COMMENT` | `Comments.parent_type` |
| `ImageParentType` | `TICKET`, `TICKET_COMMENT`, `GATE_COMMENT`, `PROFILE` | `Images.parent_type` |

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
- Intentional design decision. Gates are identified by `number` within a project only.

### Gate approval model
- A gate is approved when a `GateSignatures` row exists for it. The row records which client profile signed and when. Only one signature is needed (any client profile of the project's client).

### Contracts: blank-on-creation + 1:1
- `project_id` and `client_id` are required; `file_path`, signatures, and signed-at timestamps are filled later. `project_id` is unique — one contract per project. Dual signatures: PO signs with `project_owner_signature`/`project_owner_signed_at`, client signs with `client_signature`/`client_signed_at`.

### ticketActions.ts needs refactoring
- `updateTicket()` currently nukes and recreates all `TicketAssigned` and `TicketTags` rows on every update (`deleteMany: {}` + `create`). This destroys the original `assigned_date` values. Must be replaced with a diff-ing approach: compute `toAdd` (in new list, not in existing) and `toRemove` (in existing, not in new list), then only `create` additions and `deleteMany` removals.

### Profiles soft-delete (not yet implemented)
- Behavior documented in Section 7. Currently `Profiles` has `is_deleted` and `deleted_at` columns but no soft-delete workflow is built.

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
| `GateSignatures` | `gate_id` | `@@id` (single-column PK, one per gate) |
| `RoleAssignments` | `(role_id, user_id, project_id)` | `@@id` (composite PK) |
| `RolePermissions` | `(role_id, permission_id)` | `@@id` (composite PK) |
| `TicketAssigned` | `(ticket_id, profile_id)` | `@@id` (composite PK) |
| `TicketTags` | `(ticket_id, tag_id)` | `@@id` (composite PK) |
