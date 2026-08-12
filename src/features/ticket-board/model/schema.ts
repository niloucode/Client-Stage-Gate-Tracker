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
				code: z.ZodIssueCode.custom,
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
				code: z.ZodIssueCode.custom,
				message: `action "${entry.action}" should not have a targetName`,
				path: ["targetName"],
			});
		}

		// ── details structure ───────────────────────────────────────────
		// RENAMED and UPDATED_STATUS carry JSON {from, to} where both are strings.
		if (
			(entry.action === "RENAMED" || entry.action === "UPDATED_STATUS") &&
			entry.details
		) {
			try {
				const parsed = JSON.parse(entry.details);
				if (
					typeof parsed !== "object" ||
					!parsed ||
					typeof parsed.from !== "string" ||
					typeof parsed.to !== "string"
				) {
					throw new Error("invalid shape");
				}
			} catch {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `details for "${entry.action}" must be JSON with {from, to} strings`,
					path: ["details"],
				});
			}
		}

		// WATCHER_CHANGED carries JSON {from, to} where values are UUID strings or null.
		if (entry.action === "WATCHER_CHANGED" && entry.details) {
			try {
				const parsed = JSON.parse(entry.details);
				if (typeof parsed !== "object" || !parsed)
					throw new Error("invalid shape");
				if (parsed.from !== null && typeof parsed.from !== "string")
					throw new Error("invalid from");
				if (parsed.to !== null && typeof parsed.to !== "string")
					throw new Error("invalid to");
			} catch {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `details for WATCHER_CHANGED must be JSON with {from, to} as UUID strings or null`,
					path: ["details"],
				});
			}
		}

		// FINISHED carries JSON {from} with the previous status.
		if (entry.action === "FINISHED" && entry.details) {
			try {
				const parsed = JSON.parse(entry.details);
				if (
					typeof parsed !== "object" ||
					!parsed ||
					typeof parsed.from !== "string"
				) {
					throw new Error("invalid shape");
				}
			} catch {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `details for FINISHED must be JSON with {from} string`,
					path: ["details"],
				});
			}
		}

		// CREATED and DELETE carry JSON {ticket_name} string.
		if (
			(entry.action === "CREATED" || entry.action === "DELETE") &&
			entry.details
		) {
			try {
				const parsed = JSON.parse(entry.details);
				if (
					typeof parsed !== "object" ||
					!parsed ||
					typeof parsed.ticket_name !== "string"
				) {
					throw new Error("invalid shape");
				}
			} catch {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `details for "${entry.action}" must be JSON with {ticket_name} string`,
					path: ["details"],
				});
			}
		}
	});

export type TicketHistoryEntryInput = z.infer<typeof ticketHistoryEntrySchema>;
