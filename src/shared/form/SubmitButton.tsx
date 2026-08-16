"use client";

import { useFormContext } from "./contexts";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

interface SubmitButtonProps extends ComponentProps<typeof Button> {
	/** Text shown while the form is submitting (defaults to `children`). */
	pendingLabel?: string;
}

/**
 * Form-level submit button bound to the shared form context.
 * Disables itself while the form is submitting so double-submits are
 * impossible; use inside `<form.AppForm>`.
 
 * @returns The rendered submit button.
 */
export function SubmitButton({
	children,
	pendingLabel,
	disabled,
	...props
}: SubmitButtonProps) {
	const form = useFormContext();
	const isSubmitting = form.state.isSubmitting;

	return (
		<Button
			{...props}
			type="submit"
			disabled={disabled || isSubmitting}
			aria-busy={isSubmitting || undefined}
		>
			{isSubmitting && pendingLabel ? pendingLabel : children}
		</Button>
	);
}
