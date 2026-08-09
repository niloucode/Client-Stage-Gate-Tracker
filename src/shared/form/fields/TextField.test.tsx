// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppForm } from "@/shared/form";
import { z } from "zod";

/**
 * Component tests for the shared TanStack Form kit (Task 1.10).
 * Renders a minimal form using `useAppForm` + bound TextField and
 * verifies value binding, error surfacing, and accessibility labels.
 */

const testSchema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters"),
});

function TestForm({ onSubmit }: { onSubmit: (value: { name: string }) => void }) {
	const form = useAppForm({
		defaultValues: { name: "" },
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
				name="name"
				children={(field) => (
					<field.TextField label="Name" required placeholder="Your name" />
				)}
			/>
			<form.Subscribe
				selector={(state) => state.errorMap.onSubmit}
				children={(err) =>
					err ? <p role="alert">{String(err)}</p> : null
				}
			/>
			<form.AppForm>
				<form.SubmitButton>Save</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

describe("TextField (shared form kit)", () => {
	it("renders an accessible labeled input", () => {
		render(<TestForm onSubmit={() => {}} />);
		expect(screen.getByLabelText("Name *")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
	});

	it("binds user input to the form value and submits it", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TestForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText("Name *"), "Discovery");
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(onSubmit).toHaveBeenCalledWith({ name: "Discovery" });
	});

	it("surfaces zod validation errors on submit", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TestForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText("Name *"), "ab");
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByText("Name must be at least 3 characters"),
		).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
