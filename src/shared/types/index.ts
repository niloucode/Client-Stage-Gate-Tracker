export type Role = "PRODUCT_OWNER" | "PRODUCT_TEAM" | "FINANCE" | "CLIENT";

export type TicketStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "BLOCKED"
  | "FLAGGED";

export type TicketType = "FRONTEND" | "BACKEND" | "INTEGRATION";

export type PhaseStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "GATE_REVIEW"
  | "COMPLETED"
  | "REJECTED";

export type GateStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ContractStatus =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "SIGNED"
  | "REJECTED";

export type { ProfileType } from "@/shared/schemas";
export type { ClientType } from "@/shared/schemas";