import { generateKeyBetween } from "fractional-indexing";

/**
 * Shared fractional-indexing reorder core (Task 3.4).
 *
 * The reorder algorithm (target-bounds check + neighbor key computation)
 * used to be duplicated in `phaseActions.ts` and `workflowActions.ts`.
 * This pure function is the single implementation; callers pass their
 * siblings (fetched via their typed Prisma delegate) and apply the
 * returned key to exactly one row — no renumbering of siblings.
 */
export interface SortableSibling {
	id: string;
	sort_key: string | null;
}

export interface ReorderResult {
	success: boolean;
	error?: string;
	/** New fractional sort key; set when the row actually moves. */
	newKey?: string;
}

export function reorderBySortKey(
	siblings: SortableSibling[],
	rowId: string,
	targetNumber: number,
): ReorderResult {
	const currentIndex = siblings.findIndex((s) => s.id === rowId);
	if (currentIndex === -1) {
		return { success: false, error: `Row ${rowId} not found.` };
	}
	if (targetNumber < 1 || targetNumber > siblings.length) {
		return {
			success: false,
			error: `Target number ${targetNumber} is out of bounds (1–${siblings.length}).`,
		};
	}
	const targetIndex = targetNumber - 1;
	if (targetIndex === currentIndex) return { success: true };

	const rest = siblings.filter((s) => s.id !== rowId);
	const before = targetIndex > 0 ? rest[targetIndex - 1].sort_key : null;
	const after = targetIndex < rest.length ? rest[targetIndex].sort_key : null;
	const newKey = generateKeyBetween(before, after);

	return { success: true, newKey };
}
