# Contracts Integration Plan

> **STATUS: EXECUTED 2026-08-15** — implemented inline with the serial
> todo/complete_step workflow. Two forced reviews: the first found an
> idempotency race in `approveContract` (stage-start could be permanently
> skipped) + nits — all fixed (SELECT … FOR UPDATE transaction restructure);
> the final review: **ship as-is, no blockers**.
> Verification: `prisma validate` ✓ · `tsc --noEmit` ✓ · `vitest run` 38 files /
> 269 tests ✓ (10 new: deriveInitials ×6, contractApproveSchema ×4) ·
> `eslint` on all touched files ✓ (0 problems — INCLUDING the previously
> failing contract page) · `npm run build` ✓ (exit 0).
> No DB migration required (no schema change — the dual-approval reuses the
> existing Contracts columns).

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the OTP/signature-file contract flow with a gate-style
button-based dual approval: the Project Owner and the project's client each
approve via a button; both approvals unlock the first stage's actual start.
Only clients and project owners can approve; owners alone manage the contract
document; the page follows FSD (thin route + feature-owned page).

**Architecture:** `approveContract(projectId, role)` — owner identity via
`requireProjectOwner` (roleAssignment), client identity via
`profile.client_id === contract.client_id` (fail-closed); the signer's PROFILE
name + derived initials are recorded server-side. Everything runs in ONE
transaction that locks the contract row (`SELECT … FOR UPDATE`), so concurrent
cross-party approvals serialize and the second approver's stage write lands
with the LATER of the two timestamps (`contractSignedStart`). Upload/delete/
rename are owner-only; the upload no longer carries (or reassigns) the
contract's client. The OTP stack (OTPVerification / SignatureUpload /
AdoptSignatureModal / ExecuteAgreementCard / ClientsDropdown) is deleted.

**Tech Stack:** Next.js App Router (FSD: thin server route + feature page),
Prisma, TanStack Query v5, zod v4, Supabase Storage (`contracts` bucket).

**Spec decisions (user-confirmed 2026-08-15):**
1. Only the project's CLIENT and the PROJECT OWNER can approve the contract.
2. Approval is BUTTON-based (like gates) — no OTP, no signature file. Both
   approvals are required for the project / first stage to start (existing
   `contractSignedStart` → stage 1 `actual_start_at`).
3. Visibility matrix: owner sees their own button + the client's status;
   client sees their own button + the owner's status; project team members see
   neither (only both statuses via the signatories list).
4. The client signer = any profile whose `client_id` matches the contract's
   `client_id` (no role assignment needed).
5. Only the Project Owner can upload / delete / rename the contract document.
6. `ExecutedBanner` renders once both parties have approved.
7. The contract page follows FSD: all logic moved into
   `features/contracts/ui/ContractPage.tsx`, the route is a thin server page.

**Assumptions (flagged at plan time):** approve-only (no decline); the
signature stored is the signer's profile full name + auto-derived initials;
the Approve button uses the type-phrase `ConfirmTextModal` (with its
silent-failure bug fixed) to prevent accidental signing; the client row in the
signatories list shows the client company name until the client approves.

---

### Task 1: Server

- [x] **`approveContract`** (`contractActions.ts`) — replaces `signContract`
      (the typed-signature/OTP-era action). Owner = `requireProjectOwner`;
      client = `profile.client_id === contract.client_id`; idempotent by
      preserving the ORIGINAL timestamp on re-approval; `deriveInitials` from
      the profile name. `contractApproveSchema` (zod v4) + 10 tests
      (deriveInitials ×6, schema ×4, TDD RED→GREEN). `useApproveContract`
      invalidates contractKeys.detail + stageKeys.all. `signContract` /
      `contractSignSchema` / `useSignContract` retired.
- [x] **Owner-only document gates** — `uploadContract` / `deleteContract` /
      `changeContractName` now `requireProjectOwner` (fail-closed; previously
      ANY member). `uploadContract` no longer accepts `clientId` (the old
      vector for reassigning the contract's client) — the contract row is
      update-only with an explicit missing-contract guard. `contractUploadSchema`
      drops `clientId`.
- [x] **Race-free dual approval** — after review: contract read + authz +
      update + stage write all inside ONE transaction that first
      `SELECT … FOR UPDATE`-locks the contract row; concurrent approvals
      serialize; the stage start is materialized with the LATER timestamp and
      self-heals on re-approval. Schema errors surfaced as strings.

### Task 2: UI

- [x] **`ContractApprovalCard`** (new) — variant owner/client, own Approve
      button (type-phrase modal) + the OTHER party's status only;
      already-approved state; success/error toasts.
- [x] **`ConfirmTextModal`** — silent-failure bug fixed (try/catch +
      `{success:false}` result check + error toast, modal stays open);
      simplified to the `noParamFunc` flow (role-assignment machinery removed).
- [x] **`ContractPage`** (feature, FSD) — role derivation
      (owner/client/team via `useCurrentUser` + owner assignment + contract
      client_id — NO bogus "Client Viewer" default), signatories from the
      owner assignment + client company (`getContractByProjectId` now includes
      `Clients.client_name`), ExecutedBanner when all signed (via
      `contractSignedStart`), approval card for signers only, real refresh via
      contractKeys invalidation, Great Vibes font restored. The route
      `contract/page.tsx` is a thin async server component importing via the
      feature public API (`features/contracts/index.ts`).
- [x] **`SignatoriesCard`** — list-only (owner + client rows, cursive
      signature canvas); the client-assignment dropdown flows removed.
- [x] **`ContractViewer`** — owner-gated upload/delete (`canManage`), dead
      rename/download/print code + unused props removed, name prefill fixed,
      failures surfaced.
- [x] **Deletions** — `OTPVerification`, `SignatureUpload`,
      `AdoptSignatureModal`, `ExecuteAgreementCard`, `ClientsDropdown`,
      `ui/index.tsx` (zero remaining references); `changeContractName` /
      `useChangeContractName` / `contractChangeNameSchema` (dead).

### Task 3: Verification & docs

- [x] **Verification** — prisma validate ✓ · tsc ✓ · 269/269 tests ✓ ·
      eslint ✓ 0 problems (incl. the previously failing page) · build ✓ ·
      forced reviews (final: ship as-is).
- [x] **Docs** — `docs/code-review-plan.md` checkboxes + follow-up
      resolution; this plan file.

---

## Follow-ups (future session)

- [ ] `useContract` returns `null` on action failure instead of surfacing
      `error` — the page's error branch is unreachable (pre-existing,
      `entities/contract/queries.ts` not in this diff). Align with the other
      query hooks.
- [ ] Re-approval refreshes the stored signature NAME to the re-approver's
      current profile name (timestamp preserved) — intentional, but the
      displayed signature can change if a profile is renamed.
- [ ] `createClientRoleAssignment` / `deleteClientRoleAssignment`
      (roleAssignment slice) are now unused by the contracts feature — remove
      or repurpose in a dedicated pass.
