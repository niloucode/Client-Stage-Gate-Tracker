"use client";

import { useState, type ReactElement } from "react";
import { action } from "@/lib/generated/prisma";
import { useTicketHistory } from "../model/queries";
import type { TicketHistoryEntry } from "../model/types";
import {
  PlusCircle,
  CheckCircle,
  RefreshCw, // standard Lucide equivalent for StatusChange
  Pencil,
  MessageSquare, // standard Lucide equivalent for Message
  UserPlus,
  UserMinus,
  Trash2, // standard Lucide clean trash icon (or use Trash)
  Eye,
  LucideIcon
} from "lucide-react";

// ── Icon + colour mapping per action ─────────────────────────────────────────

const ACTION_META: Record<
	action,
	{
		Icon: LucideIcon;
		bg: string;
		text: string;
	}
> = {
	[action.CREATED]: {
		Icon: PlusCircle,
		bg: "bg-green-100",
		text: "text-green-600",
	},
	[action.UPDATED_STATUS]: {
		Icon: RefreshCw,
		bg: "bg-blue-100",
		text: "text-blue-600",
	},
	[action.RENAMED]: {
		Icon: Pencil,
		bg: "bg-amber-100",
		text: "text-amber-600",
	},
	[action.COMMENT_ADDED]: {
		Icon: MessageSquare,
		bg: "bg-gray-100",
		text: "text-gray-500",
	},
	[action.WATCHER_CHANGED]: {
		Icon: Eye,
		bg: "bg-violet-100",
		text: "text-violet-600",
	},
	[action.FINISHED]: {
		Icon: CheckCircle,
		bg: "bg-indigo-100",
		text: "text-brand-600",
	},
	[action.ASSIGNED]: {
		Icon: UserPlus,
		bg: "bg-teal-100",
		text: "text-teal-600",
	},
	[action.UNASSIGNED]: {
		Icon: UserMinus,
		bg: "bg-gray-100",
		text: "text-gray-500",
	},
	[action.DELETE]: {
		Icon: Trash2,
		bg: "bg-red-100",
		text: "text-red-600",
	},
};

// ── Status colour helpers ────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
	PENDING: "text-gray-500",
	IN_PROGRESS: "text-blue-600",
	FINISHED: "text-green-600",
};

function statusLabel(s: string): string {
	const map: Record<string, string> = {
		PENDING: "pending",
		IN_PROGRESS: "in progress",
		FINISHED: "finished",
	};
	return map[s] ?? s.toLowerCase();
}

function StatusBadge({ status }: { status: string }) {
	return (
		<span className={`font-medium ${STATUS_COLORS[status] ?? "text-gray-500"}`}>
			{statusLabel(status)}
		</span>
	);
}

function TargetName({ name }: { name: string }) {
	return <span className="text-teal-600 font-medium">{name}</span>;
}

// ── Sentence builder ─────────────────────────────────────────────────────────

/**
 * Builds a human-readable JSX sentence from a HistoryEvent row.
 *
 * Formats:
 *   CREATED         → "created the ticket"
 *   FINISHED        → "marked the ticket as finished"
 *   UPDATED_STATUS  → "changed status from [pending] to [in progress]"
 *   RENAMED         → "renamed the ticket from X to Y"
 *   COMMENT_ADDED   → "added a comment"
 *   WATCHER_CHANGED → "changed the watcher to [Name]" / "set a watcher to [Name]" / "removed [Name] as watcher"
 *   ASSIGNED        → "assigned [Juan dela Cruz]"
 *   UNASSIGNED      → "unassigned [Juan dela Cruz]"
 *   DELETE          → "deleted the ticket"
 */
function formatHistoryMessage(entry: TicketHistoryEntry): React.ReactNode {
	const a = entry.action;
	const target = entry.targetName;

	switch (a) {
		case "CREATED": {
			if (entry.details) {
				try {
					const { ticket_name } = JSON.parse(entry.details);
					if (ticket_name)
						return <>created the ticket &ldquo;{ticket_name}&rdquo;</>;
				} catch {
					// fall through
				}
			}
			return "created the ticket";
		}
		case "FINISHED": {
			if (entry.details) {
				try {
					const { from } = JSON.parse(entry.details);
					if (from)
						return (
							<>
								marked the ticket as finished (from <StatusBadge status={from} />)
							</>
						);
				} catch {
					// fall through
				}
			}
			return "marked the ticket as finished";
		}
		case "UPDATED_STATUS": {
			if (entry.details) {
				try {
					const { from, to } = JSON.parse(entry.details);
					return (
						<>
							changed status from <StatusBadge status={from} /> to{" "}
							<StatusBadge status={to} />
						</>
					);
				} catch {
					// fall through
				}
			}
			return "updated the ticket status";
		}
		case "RENAMED": {
			if (entry.details) {
				try {
					const { from, to } = JSON.parse(entry.details);
					return (
						<>
							renamed the ticket from &ldquo;{from}&rdquo; to &ldquo;{to}
							&rdquo;
						</>
					);
				} catch {
					// fall through
				}
			}
			return "renamed the ticket";
		}
		case "COMMENT_ADDED":
			return "added a comment";
		case "WATCHER_CHANGED": {
			if (entry.details) {
				try {
					const { from, to } = JSON.parse(entry.details);
					if (from && to && target)
						return (
							<>
								changed the watcher to <TargetName name={target} />
							</>
						);
					if (!from && to && target)
						return (
							<>
								set <TargetName name={target} /> as watcher
							</>
						);
					if (from && !to && target)
						return (
							<>
								removed <TargetName name={target} /> as watcher
							</>
						);
					if (from && to) return "changed the watcher";
					if (!from && to) return "set a watcher";
					if (from && !to) return "removed the watcher";
				} catch {
					// fall through
				}
			}
			return "changed the watcher";
		}
		case "ASSIGNED":
			return target ? (
				<>
					assigned <TargetName name={target} />
				</>
			) : (
				"assigned a user"
			);
		case "UNASSIGNED":
			return target ? (
				<>
					unassigned <TargetName name={target} />
				</>
			) : (
				"unassigned a user"
			);
		case "DELETE": {
			if (entry.details) {
				try {
					const { ticket_name } = JSON.parse(entry.details);
					if (ticket_name)
						return <>deleted the ticket &ldquo;{ticket_name}&rdquo;</>;
				} catch {
					// fall through
				}
			}
			return "deleted the ticket";
		}
		default:
			return "performed an action";
	}
}

/**
 * Formats a Date as a short, human-readable datetime string.
 * Example output: "Jan 15, 2024, 2:30 PM"
 */
function formatDateTime(date: Date): string {
	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

// ── Row component ────────────────────────────────────────────────────────────

function HistoryEntryRow({ entry }: { entry: TicketHistoryEntry }) {
	const { Icon, bg, text } = ACTION_META[entry.action];

	return (
		<li className="flex gap-2.5">
			<span
				className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 mt-0.5 ${bg}`}
			>
				<Icon className={text} />
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm text-gray-700 leading-snug">
					<span className="font-semibold text-indigo-700">
						{entry.performerName}
					</span>{" "}
					{formatHistoryMessage(entry)}
				</p>
				<p
					className="text-xs text-gray-400 mt-0.5"
					title={entry.date_performed.toISOString()}
				>
					{formatDateTime(entry.date_performed)}
				</p>
			</div>
		</li>
	);
}

// ── Main component ───────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 4;

export default function TicketHistoryLog({
	ticketId,
}: {
	ticketId: string | undefined;
}) {
	const { data: history = [], isLoading, isError, error } = useTicketHistory(ticketId);
	const [expanded, setExpanded] = useState(false);

	const hasMore = history.length > INITIAL_VISIBLE;

	return (
		<div className="px-5 pb-4 max-h-[12rem] mb-6 overflow-y-scroll border-b border-gray-100">

			{isLoading ? (
				<p className="text-sm text-gray-400">Loading activity…</p>
			) : isError ? (
				<p className="text-sm text-red-500">
					Failed to load activity
					{error instanceof Error ? `: ${error.message}` : ""}
				</p>
			) : history.length === 0 ? (
				<p className="text-sm text-gray-400 italic">No activity yet</p>
			) : (
				<>
					<ol className="space-y-3">
						{history.map((entry) => (
							<HistoryEntryRow
								key={entry.history_event_id}
								entry={entry}
							/>
						))}
					</ol>
				</>
			)}
		</div>
	);
}
