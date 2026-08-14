import type { status as TicketStatus } from "@/lib/generated/prisma";

export interface WorkflowData {
	label: string;
}

export interface TagBadgeData {
	label: string;
	bg: string;
	text: string;
}

export interface AssigneeData {
	initials: string;
	avatarBg: string;
	name?: string;
}

export interface TicketItem {
	id: string;
	name: string;
	project: string;
	module: string;
	workflow: WorkflowData | string;
	status: TicketStatus;
	tag: TagBadgeData;
	assignees?: AssigneeData[];
	dueAt?: Date | string;
	dueDate?: string;
	dueDateUrgent?: boolean;
}

export type ContractStatus = "pending" | "executed";

export interface PendingContract {
	id: string;
	projectId: string;
	documentName: string;
	projectName: string;
	status: ContractStatus;
}
