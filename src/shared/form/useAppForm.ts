"use client";

import { createFormHook } from "@tanstack/react-form";
import type { AppFieldExtendedReactFormApi } from "@tanstack/react-form";
import { fieldContext, formContext } from "./contexts";
import { TextField } from "./fields/TextField";
import { TextAreaField } from "./fields/TextAreaField";
import { SelectField } from "./fields/SelectField";
import { DateTimeField } from "./fields/DateTimeField";
import { PhoneField } from "./fields/PhoneField";
import { SubmitButton } from "./SubmitButton";

/**
 * The app-wide form factory. Every form must use `useAppForm` so fields
 * share one set of bound components (Shadcn + accessible labels).
 *
 * Usage:
 *   const form = useAppForm({ defaultValues, validators: { onSubmit: schema }, onSubmit: async ({ value }) => {...} });
 *   <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
 *     <form.AppField name="name" children={(field) => <field.TextField label="Name" />} />
 *     <form.AppForm><form.SubmitButton /></form.AppForm>
 *   </form>
 */
export const { useAppForm, withForm } = createFormHook({
	fieldComponents: {
		TextField,
		TextAreaField,
		SelectField,
		DateTimeField,
		PhoneField,
	},
	formComponents: {
		SubmitButton,
	},
	fieldContext,
	formContext,
});

/**
 * Loose form instance type for reusable composites (e.g. `SchedulingFields`)
 * that need `form.AppField` but must accept any concrete form.
 */
export type AppForm = AppFieldExtendedReactFormApi<
	// TFormData
	any,
	// Validators + submit meta
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any
>;
