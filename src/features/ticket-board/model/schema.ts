import { z } from "zod";

const ACTION_ENUM = z.enum([
	"CREATED",
	"FINISHED",
	"UPDATED_STATUS",
	"RENAMED",
	"COMMENT_ADDED",
	"WATCHER_CHANGED",
	"ASSIGNED",
	"UNASSIGNED",
	"DELETE",
]);

/**
 * Validates a history entry crossing the network boundary from the server action.
 * Matches the Prisma `HistoryEvent` model joined with profile names.
 */
export const ticketHistoryEntrySchema = z
	.object({
		history_event_id: z.uuid(),
		action: ACTION_ENUM,
		date_performed: z.coerce.date(),
		ticket_id: z.uuid(),
		target_profile_id: z.uuid().nullable().optional(),
		performed_by: z.uuid(),
		details: z.string().nullable().optional(),
		performerName: z.string().min(1),
		targetName: z.string().nullable(),
	})
	.superRefine((entry, ctx) => {
		// ── target consistency ──────────────────────────────────────────
		// ASSIGNED and UNASSIGNED must have a target name.
		if (
			(entry.action === "ASSIGNED" || entry.action === "UNASSIGNED") &&
			!entry.targetName
		) {
			ctx.addIssue({
				code: "custom",
				message: `action "${entry.action}" requires targetName to be set`,
				path: ["targetName"],
			});
		}

		// Actions that don't target a profile should not carry a target name.
		// Exceptions: ASSIGNED, UNASSIGNED, and WATCHER_CHANGED may have targetName.
		if (
			entry.action !== "ASSIGNED" &&
			entry.action !== "UNASSIGNED" &&
			entry.action !== "WATCHER_CHANGED" &&
			entry.targetName
		) {
			ctx.addIssue({
				code: "custom",
				message: `action "${entry.action}" should not have a targetName`,
				path: ["targetName"],
			});
		}

		// ── details structure (validated without throw-in-try control flow) ──
		const details = entry.details;

		// RENAMED and UPDATED_STATUS carry JSON {from, to} where both are strings.
		if (
			(entry.action === "RENAMED" || entry.action === "UPDATED_STATUS") &&
			details &&
			!hasStringFields(details, ["from", "to"])
		) {
			ctx.addIssue({
				code: "custom",
				message: `details for "${entry.action}" must be JSON with {from, to} strings`,
				path: ["details"],
			});
		}

		// WATCHER_CHANGED carries JSON {from, to} where values are UUID strings or null.
		if (
			entry.action === "WATCHER_CHANGED" &&
			details &&
			!isWatcherChangedDetails(details)
		) {
			ctx.addIssue({
				code: "custom",
				message: `details for WATCHER_CHANGED must be JSON with {from, to} as UUID strings or null`,
				path: ["details"],
			});
		}

		// FINISHED carries JSON {from} with the previous status.
		if (
			entry.action === "FINISHED" &&
			details &&
			!hasStringFields(details, ["from"])
		) {
			ctx.addIssue({
				code: "custom",
				message: `details for FINISHED must be JSON with {from} string`,
				path: ["details"],
			});
		}

		// CREATED and DELETE carry JSON {ticket_name} string.
		if (
			(entry.action === "CREATED" || entry.action === "DELETE") &&
			details &&
			!hasStringFields(details, ["ticket_name"])
		) {
			ctx.addIssue({
				code: "custom",
				message: `details for "${entry.action}" must be JSON with {ticket_name} string`,
				path: ["details"],
			});
		}
	});

/** True when `value` parses as a JSON object whose listed fields are all strings. */
function hasStringFields(value: string, fields: string[]): boolean {
	try {
		const parsed: unknown = JSON.parse(value);
		if (typeof parsed !== "object" || parsed === null) return false;
		return fields.every(
			(f) => typeof (parsed as Record<string, unknown>)[f] === "string",
		);
	} catch {
		return false;
	}
}

/** True when `value` parses as a JSON object with {from, to} as UUID strings or null. */
function isWatcherChangedDetails(value: string): boolean {
	try {
		const parsed: unknown = JSON.parse(value);
		if (typeof parsed !== "object" || parsed === null) return false;
		const { from, to } = parsed as Record<string, unknown>;
		const isUuidOrNull = (v: unknown) => v === null || typeof v === "string";
		return isUuidOrNull(from) && isUuidOrNull(to);
	} catch {
		return false;
	}
}
