import type { DashboardTicketRow } from "@/entities/ticket";
import type { ContractRow } from "@/entities/contract";
import type { IssueStats } from "@/entities/issue";
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
		projectId: project?.project_id ?? "",
		workflowId: workflow?.workflow_id ?? "",
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

/**
 * Map the entity `getIssueStats` payload (`byUrgency[]` array) into the
 * ActivitySparklines donut shapes. Fixes the 2026-08-14 re-audit finding:
 * the dashboard previously guessed a flat `{high, medium, low}` shape that
 * never matched the API, so the donuts always rendered zeros.
 */
export interface IssueSeverityCounts {
	high: number;
	medium: number;
	low: number;
}

export function mapIssueStats(stats: IssueStats): {
	issuesBySeverity: IssueSeverityCounts;
	assignedVsUnassigned: { assigned: number; unassigned: number };
} {
	const byUrgency = Object.fromEntries(
		stats.byUrgency.map((u) => [u.urgency, u.count]),
	) as Record<"LOW" | "MEDIUM" | "HIGH", number | undefined>;

	return {
		issuesBySeverity: {
			high: byUrgency.HIGH ?? 0,
			medium: byUrgency.MEDIUM ?? 0,
			low: byUrgency.LOW ?? 0,
		},
		assignedVsUnassigned: {
			assigned: stats.assigned,
			unassigned: stats.unassigned,
		},
	};
}
