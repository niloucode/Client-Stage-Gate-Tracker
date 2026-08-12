import { z, type ZodError } from "zod";

/**
 * Maps a failed zod `safeParse` into `{ [field]: firstErrorMessage }`.
 * Returns `{}` for successful parses.
 */
export function getFieldErrors(
	result: { success: false; error: ZodError } | { success: true },
): Record<string, string> {
	if (result.success) return {};
	const fieldErrors = z.flattenError(result.error).fieldErrors as Record<
		string,
		string[]
	>;
	const mapped: Record<string, string> = {};
	for (const [key, msgs] of Object.entries(fieldErrors)) {
		if (msgs && msgs.length > 0) mapped[key] = msgs[0];
	}
	return mapped;
}
