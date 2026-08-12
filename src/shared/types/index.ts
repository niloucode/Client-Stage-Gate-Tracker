// Role names mirror the seeded `Roles` table values.
export type Role = "Project Team" | "Project Owner" | "Client Viewer";

// Status type kept in lockstep with the database enum via Prisma.
import type { status as TicketStatus } from "@/lib/generated/prisma";
export type { TicketStatus };

export type { ProfileType } from "@/shared/schemas";
export type { ClientType } from "@/shared/schemas";
