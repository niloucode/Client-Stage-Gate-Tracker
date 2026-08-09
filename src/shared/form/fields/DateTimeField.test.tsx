// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppForm } from "@/shared/form";
import { z } from "zod";

/**
 * Component test for DateTimeField — the scheduling date control used by
 * the Add/Edit Phase pilot (Tasks 1.4 + 1.5). Verifies the Date value
 * round-trips through the shared date adapter and is submitted correctly.
 */

const testSchema = z.object({
	planStart: z.date().nullable().optional(),
});

type TestFormValues = z.input<typeof testSchema>;

function DateTimeTestForm({
	onSubmit,
}: {
	onSubmit: (value: TestFormValues) => void;
}) {
	const defaultValues: TestFormValues = { planStart: null };

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: testSchema },
		onSubmit: async ({ value }) => onSubmit(value),
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.AppField
				name="planStart"
				children={(field) => (
					<field.DateTimeField label="Plan Start" />
				)}
			/>
			<form.AppForm>
				<form.SubmitButton>Save</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

describe("DateTimeField (shared form kit)", () => {
	it("renders an accessible datetime-local input", () => {
		render(<DateTimeTestForm onSubmit={() => {}} />);
		expect(screen.getByLabelText("Plan Start")).toBeInTheDocument();
		expect(screen.getByLabelText("Plan Start")).toHaveAttribute(
			"type",
			"datetime-local",
		);
	});

	it("submits the typed date as a local-time Date", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<DateTimeTestForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText("Plan Start"), "2024-06-01T09:30");
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(onSubmit).toHaveBeenCalledTimes(1);
		const value = onSubmit.mock.calls[0][0].planStart as Date;		expect(value).toBeInstanceOf(Date);
		// Local-time interpretation (no UTC shift).
		expect(value.getFullYear()).toBe(2024);
		expect(value.getMonth()).toBe(5); // June
		expect(value.getDate()).toBe(1);
		expect(value.getHours()).toBe(9);
		expect(value.getMinutes()).toBe(30);
	});
});
