"use client";

import { createFormHookContexts } from "@tanstack/react-form";

/**
 * Shared form/field contexts for the whole app. Every form must go through
 * `useAppForm` (from `./useAppForm`) so fields stay bound to these contexts.
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();
