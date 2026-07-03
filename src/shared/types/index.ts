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

export interface ProfileType {
  profile_id: string,
  first_name: string,
  last_name: string,
  phone: string,
  image_id: string | null,
  client_id: string | null, 
  department_id: string | null,
  email: string
  job_title: string | null,
  is_deleted: boolean,
  deleted_at: Date | null
}

export interface ClientType{
  client_id: string,
  client_name: string,
  tin: string,
  billing_address: string,
  is_deleted: boolean,
  deleted_at: Date | null
}