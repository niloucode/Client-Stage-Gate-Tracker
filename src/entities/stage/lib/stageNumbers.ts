/**
 * Stage numbering rules (specs 4 & 7 of the project-structure feature).
 *
 * Stages are ordered by an integer `number` column (no fractional sort_key —
 * stages cannot be reordered like phases/modules).
 *   - Create:   next number = max(existing numbers) + 1
 *   - Delete:   the deleted stage's number becomes NULL, and every remaining
 *               stage with a number greater than it shifts down by one.
 *
 * The `number` column is nullable with a partial unique index
 * `@@unique([project_id, number] where is_deleted = false)`, so NULLs
 * coexist and the shift-by-decrement never collides.
 */

/** Next sequential number for a new stage under a project. 
 * @param numbers - Existing stage numbers (nulls allowed).
 * @returns max + 1, or 1 when empty.
 */
export function nextStageNumber(numbers: (number | null)[]): number {
	let max = 0;
	for (const n of numbers) {
		if (n !== null && n > max) max = n;
	}
	return max + 1;
}

/**
 * How many remaining stages shift down after deleting the stage with
 * `deletedNumber` (spec 7: "the other stage's numbers shift accordingly").
 * Returns 0 when the deleted stage had no number (nothing to shift).
 * @param numbers - The stage numbers before deletion.
 * @param deletedNumber - The deleted stage's number (null = nothing to shift).
 * @returns How many stages shift down after the delete.
 */
export function renumberAfterDelete(
	numbers: (number | null)[],
	deletedNumber: number | null,
): number {
	if (deletedNumber === null) return 0;
	return numbers.filter((n) => n !== null && n > deletedNumber).length;
}
