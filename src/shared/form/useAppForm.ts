"use client";

import { createFormHook } from "@tanstack/react-form";
import type { AppFieldExtendedReactFormApi } from "@tanstack/react-form";
import { fieldContext, formContext } from "./contexts";
import { TextField } from "./fields/TextField";
import { TextAreaField } from "./fields/TextAreaField";
import { SelectField } from "./fields/SelectField";
import { DateTimeField } from "./fields/DateTimeField";
import { PhoneField } from "./fields/PhoneField";
import { PasswordField } from "./fields/PasswordField";
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
const fieldComponents = {
	TextField,
	TextAreaField,
	SelectField,
	DateTimeField,
	PhoneField,
	PasswordField,
};

const formComponents = {
	SubmitButton,
};

export const { useAppForm } = createFormHook({
	fieldComponents,
	formComponents,
	fieldContext,
	formContext,
});

/**
 * Loose form instance type for reusable composites (e.g. `SchedulingFields`)
 * that need `form.AppField` but must accept any concrete form created by
 * `useAppForm`.
 *
 * The `any` type parameters are INTENTIONAL. A concrete form's
 * `AppFieldExtendedReactFormApi<Concrete, ...>` is not assignable to the
 * same type with `unknown`/`object` data params (contravariant positions
 * like `name: DeepKeysOfType<TFormData>` reject a wider target), and
 * composites address fields by runtime string names, so only `any` —
 * bivariant by definition — keeps the boundary assignable. This mirrors
 * TanStack Form's own `AnyFormApi` / `AnyFieldApi` escape hatches.
 *
 * The last two params keep the registered component maps concrete so
 * `field.DateTimeField` / `form.SubmitButton` stay typed on the instance.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type AppForm = AppFieldExtendedReactFormApi<
	// TFormData
	any,
	// Validators + submit meta (loosest valid values)
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
	// Field/form component maps
	typeof fieldComponents,
	typeof formComponents
>;
/* eslint-enable @typescript-eslint/no-explicit-any */
