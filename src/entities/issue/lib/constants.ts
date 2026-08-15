import type { BugType, UrgencyLevel } from "../types";

export const URGENCY_WEIGHT: Record<UrgencyLevel, number> = {
	high: 3,
	medium: 2,
	low: 1,
};

export const BUG_TYPE_LABELS: Record<BugType, string> = {
	feature_request: "Feature Request",
	deadlinks: "Deadlinks",
	missing_fields: "Missing Fields",
	not_saving: "Not Saving to Database",
	slow_loading: "Slow Loading",
	other: "Other",
};

/**
 * Label for an issue's stored type. Issues of type "other" store the free
 * text in the DB `type` column, so the lookup falls back to the raw string.
 */
export function bugTypeLabel(type: string): string {
	return BUG_TYPE_LABELS[type as BugType] ?? type;
}
