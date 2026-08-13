// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppForm } from "@/shared/form";
import { z } from "zod";

/**
 * Component tests for the shared PasswordField (form kit).
 * Verifies value binding, submit validation, and the show/hide toggle.
 */

const testSchema = z.object({
	password: z.string().min(6, "Password must be at least 6 characters"),
});

function TestForm({ onSubmit }: { onSubmit: (value: { password: string }) => void }) {
	const form = useAppForm({
		defaultValues: { password: "" },
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
			<form.AppField name="password">
				{(field) => (
					<field.PasswordField
						label="Password"
						required
						placeholder="Enter a password"
						autoComplete="new-password"
					/>
				)}
			</form.AppField>
			<form.AppForm>
				<form.SubmitButton>Save</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

describe("PasswordField (shared form kit)", () => {
	it("renders an accessible labeled password input", () => {
		render(<TestForm onSubmit={() => {}} />);
		const input = screen.getByLabelText("Password *");
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute("type", "password");
		expect(input).toHaveAttribute("autocomplete", "new-password");
		expect(screen.getByPlaceholderText("Enter a password")).toBeInTheDocument();
	});

	it("binds user input to the form value and submits it", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TestForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText("Password *"), "secret123");
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(onSubmit).toHaveBeenCalledWith({ password: "secret123" });
	});

	it("surfaces zod validation errors on submit", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TestForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText("Password *"), "abc");
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByText("Password must be at least 6 characters"),
		).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("toggles between password and text via the eye button", async () => {
		const user = userEvent.setup();
		render(<TestForm onSubmit={() => {}} />);

		const input = screen.getByLabelText("Password *");
		expect(input).toHaveAttribute("type", "password");

		await user.click(screen.getByRole("button", { name: "Show password" }));
		expect(screen.getByLabelText("Password *")).toHaveAttribute("type", "text");

		await user.click(screen.getByRole("button", { name: "Hide password" }));
		expect(screen.getByLabelText("Password *")).toHaveAttribute("type", "password");
	});
});
