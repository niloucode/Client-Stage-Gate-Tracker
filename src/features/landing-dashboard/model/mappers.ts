import type { DashboardTicketRow } from "@/entities/ticket";
import type { ContractRow } from "@/entities/contract";
import type {
	TicketItem,
	TagBadgeData,
	AssigneeData,
	PendingContract,
} from "./types";

const AVATAR_PALETTE = ["#ffddb8", "#e2dfff", "#bbf7d0", "#fed7aa", "#c7d2fe"];

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function toInitials(first: string, last: string): string {
	const initials =
		`${first.charAt(0) ?? ""}${last.charAt(0) ?? ""}`.toUpperCase();
	return initials || "?";
}

/** Tag badge colors derived from the Tag row's single color hex. */
export function tagToBadge(
	tagName: string | null,
	color: string | null,
): TagBadgeData {
	const label = tagName ?? "Untagged";
	if (!color) return { label, bg: "#eef2f6", text: "#5b6472" };
	return { label, bg: `${color}1A`, text: color };
}

export function mapDashboardTicketRow(row: DashboardTicketRow): TicketItem {
	const workflow = row.Workflows;
	const moduleRow = workflow?.Modules;
	const phase = moduleRow?.Phases;
	const stage = phase?.Stages;
	const project = stage?.Projects;
	const firstTag = row.TicketTags[0]?.Tags ?? null;

	const assignees: AssigneeData[] = row.TicketAssigned.map((a) => ({
		initials: toInitials(a.Profile.first_name, a.Profile.last_name),
		avatarBg:
			AVATAR_PALETTE[hashString(a.Profile.profile_id) % AVATAR_PALETTE.length],
		name: `${a.Profile.first_name} ${a.Profile.last_name}`,
	}));

	return {
		id: row.ticket_id,
		name: row.name,
		project: project?.name ?? "—",
		module: moduleRow?.name ?? "—",
		workflow: workflow ? { label: workflow.name } : "—",
		status: row.status,
		tag: tagToBadge(firstTag?.name ?? null, firstTag?.color ?? null),
		assignees,
		dueAt: row.plan_end_at,
	};
}

export function mapContractRow(row: ContractRow): PendingContract {
	const executed = Boolean(row.client_signature && row.project_owner_signature);
	return {
		id: row.contract_id,
		projectId: row.project_id,
		documentName: row.contract_name ?? "Untitled Contract",
		projectName: row.Projects.name,
		status: executed ? "executed" : "pending",
	};
}
