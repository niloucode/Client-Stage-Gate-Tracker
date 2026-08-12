/**
 * Normalizes TanStack Form's `state.errorMap.*` values (string, zod issue,
 * issue array, `GlobalFormValidationError`, or a thrown `Error`) into a
 * displayable message. Returns `null` when there is nothing to show.
 */
export function formErrorToMessage(err: unknown): string | null {
	if (!err) return null;
	if (typeof err === "string") return err;
	if (Array.isArray(err)) {
		const first = err[0];
		if (first && typeof first === "object" && "message" in first) {
			return String((first as { message: unknown }).message);
		}
		return null;
	}
	if (typeof err === "object") {
		const record = err as Record<string, unknown>;
		if ("form" in record) {
			const formErr = record.form;
			if (typeof formErr === "string") return formErr;
			if (formErr && typeof formErr === "object" && "message" in formErr) {
				const msg = (formErr as { message: unknown }).message;
				return msg == null ? null : String(msg);
			}
			return null;
		}
		if ("message" in record) {
			const msg = record.message;
			return msg == null ? null : String(msg);
		}
	}
	return String(err);
}
