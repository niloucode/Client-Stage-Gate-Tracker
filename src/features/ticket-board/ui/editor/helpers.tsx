import { status as StatusEnum } from "@/lib/generated/prisma";
import { getInitials } from "@/shared/lib/strings";
import type { LinkedIssueChip } from "@/entities/issue";

/**
 * Stable short display code derived from the uuid (no fake 'LRN-BNN' strings).
 * @param ticketId
 * @returns The result.
 */
export function ticketCode(ticketId: string): string {
	return ticketId.slice(0, 8).toUpperCase();
}

export const STATUS_CONFIG: Record<
	StatusEnum,
	{ label: string; dotClass: string; textClass: string }
> = {
	PENDING: {
		label: "Pending",
		dotClass: "bg-yellow-500",
		textClass: "text-yellow-600",
	},
	IN_PROGRESS: {
		label: "In Progress",
		dotClass: "bg-brand-500",
		textClass: "text-brand-600",
	},
	FINISHED: {
		label: "Finished",
		dotClass: "bg-green-500",
		textClass: "text-green-600",
	},
};

export const STATUSES = [
	StatusEnum.PENDING,
	StatusEnum.IN_PROGRESS,
	StatusEnum.FINISHED,
];

/**
 *
 * @returns The result.
 */
export function UserAvatar({
	name,
	color = "bg-brand-500",
	size = "w-7 h-7 text-[10px]",
}: {
	name: string;
	color?: string;
	size?: string;
}) {
	return (
		<div
			className={`${size} ${color} rounded-full text-neutral-surface font-bold flex items-center justify-center shrink-0 select-none`}
		>
			{getInitials(name)}
		</div>
	);
}

/**
 *
 * @param issue
 * @returns The result.
 */
export function getLinkedIssueStyle(issue: LinkedIssueChip | null) {
	if (!issue) {
		return {
			box: "border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/60 text-gray-400",
			icon: "text-gray-400",
			text: "font-normal italic text-gray-400",
			close: "",
		};
	}

	switch (issue.urgency) {
		case "high":
			return {
				box: "border-red-200 bg-red-50/70 hover:bg-red-100/80 text-gray-700",
				icon: "text-red-500",
				text: "font-semibold text-red-600",
				close: "text-red-400 hover:text-red-600",
			};

		case "medium":
			return {
				box: "border-orange-200 bg-orange-50/70 hover:bg-orange-100/80 text-gray-700",
				icon: "text-orange-500",
				text: "font-semibold text-orange-600",
				close: "text-orange-400 hover:text-orange-600",
			};

		case "low":
			return {
				box: "border-yellow-200 bg-yellow-50/70 hover:bg-yellow-100/80 text-gray-700",
				icon: "text-yellow-500",
				text: "font-semibold text-yellow-600",
				close: "text-yellow-500 hover:text-yellow-700",
			};

		default:
			return {
				box: "border-gray-200 bg-gray-50/70 hover:bg-gray-100/80 text-gray-700",
				icon: "text-gray-500",
				text: "font-semibold text-gray-700",
				close: "text-gray-400 hover:text-gray-600",
			};
	}
}
