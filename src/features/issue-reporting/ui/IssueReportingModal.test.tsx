// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useState, type ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Regression + behavior tests for IssueReportingModal (the form-kit
 * migration keeps the same UX; the schema is the canonical validation
 * source). Supabase storage and the create mutation are mocked; the modal's
 * own mapping, validation, discard flow and wiring are what is under test.
 */

const mockMutateAsync = vi.hoisted(() => vi.fn());

vi.mock("@/entities/issue", () => ({
	useCreateIssue: () => ({ mutateAsync: mockMutateAsync }),
}));

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		storage: {
			from: () => ({
				upload: vi.fn().mockResolvedValue({ error: null }),
				getPublicUrl: () => ({
					data: { publicUrl: "https://cdn.example.test/1.png" },
				}),
				remove: vi.fn().mockResolvedValue({ error: null }),
			}),
		},
	}),
}));

import { IssueReportingModal } from "./IssueReportingModal";

/**
 * Renders the modal inside a tiny controlled harness that mirrors
 * IssueDashboard: `open` is real state so closing propagates and unmounts
 * the dialog (needed for the in-flight-close assertion).
 */
function renderModal(
	props: Partial<ComponentProps<typeof IssueReportingModal>> = {},
) {
	const onOpenChange = vi.fn();
	function Harness() {
		const [open, setOpenState] = useState(true);
		return (
			<IssueReportingModal
				projectId="project-1"
				open={open}
				onOpenChange={(next) => {
					onOpenChange(next);
					setOpenState(next);
				}}
				{...props}
			/>
		);
	}
	render(<Harness />);
	return { onOpenChange };
}

describe("IssueReportingModal (form kit)", () => {
	beforeEach(() => {
		mockMutateAsync.mockReset();
		mockMutateAsync.mockResolvedValue({});
	});

	it("renders the required sections of the report form", () => {
		renderModal();

		expect(screen.getByLabelText("Name *")).toBeInTheDocument();
		expect(screen.getByRole("combobox")).toBeInTheDocument(); // Type
		expect(screen.getByRole("button", { name: /low/i })).toBeInTheDocument(); // Priority
		expect(screen.getByLabelText("Description")).toBeInTheDocument();
		expect(screen.getByLabelText("System Environment")).toBeInTheDocument();
		expect(screen.getByText("Steps to Reproduce")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Report Bug" }),
		).toBeInTheDocument();
	});

	it("submits the mapped payload to the create mutation", async () => {
		const user = userEvent.setup();
		renderModal();

		await user.type(screen.getByLabelText("Name *"), "Broken login");
		// Pick a type through the Radix select.
		await user.click(screen.getByRole("combobox"));
		await user.click(
			await screen.findByRole("option", { name: "Feature Request" }),
		);
		await user.click(screen.getByRole("button", { name: /^High$/i }));
		await user.click(screen.getByRole("button", { name: "Report Bug" }));

		await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
		expect(mockMutateAsync).toHaveBeenCalledWith({
			name: "Broken login",
			type: "feature_request",
			specificType: "",
			urgency: "high",
			description: "",
			systemEnv: "",
			timeOfError: null,
			// Both default step rows are blank → filtered out.
			steps: [],
		});
	});

	it("surfaces schema validation errors and never calls the mutation", async () => {
		const user = userEvent.setup();
		renderModal();

		await user.click(screen.getByRole("button", { name: "Report Bug" }));

		expect(
			await screen.findByText("Issue name is required"),
		).toBeInTheDocument();
		expect(screen.getByText("Issue type is required")).toBeInTheDocument();
		expect(screen.getByText("Priority level is required")).toBeInTheDocument();
		expect(mockMutateAsync).not.toHaveBeenCalled();
	});

	it("hides steps for feature requests and requires the specific type for 'other'", async () => {
		const user = userEvent.setup();
		renderModal();

		// Feature request → no steps section.
		await user.click(screen.getByRole("combobox"));
		await user.click(
			await screen.findByRole("option", { name: "Feature Request" }),
		);
		expect(screen.queryByText("Steps to Reproduce")).not.toBeInTheDocument();

		// "Other" → specific type appears and is required.
		await user.click(screen.getByRole("combobox"));
		await user.click(await screen.findByRole("option", { name: "Other" }));
		const specific = screen.getByLabelText("Specific Issue Type *");
		expect(specific).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Report Bug" }));
		expect(
			await screen.findByText("Specific type is required"),
		).toBeInTheDocument();
		expect(mockMutateAsync).not.toHaveBeenCalled();
	});

	it("asks to discard unsaved changes when closing a dirty form", async () => {
		const user = userEvent.setup();
		const { onOpenChange } = renderModal();

		await user.type(screen.getByLabelText("Name *"), "half-typed");

		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(
			await screen.findByText("Discard Unsaved Issue Report?"),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Discard Changes" }));
		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
	});

	it("closes cleanly without a discard prompt when the form is untouched", async () => {
		const user = userEvent.setup();
		const { onOpenChange } = renderModal();

		await user.click(screen.getByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
		expect(
			screen.queryByText("Discard Unsaved Issue Report?"),
		).not.toBeInTheDocument();
	});

	it("keeps the modal open while a submit is in flight", async () => {
		const user = userEvent.setup();
		const { onOpenChange } = renderModal();
		let resolveSubmit: (value: unknown) => void = () => {};
		mockMutateAsync.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveSubmit = resolve;
			}),
		);

		await user.type(screen.getByLabelText("Name *"), "Broken login");
		await user.click(screen.getByRole("combobox"));
		await user.click(await screen.findByRole("option", { name: "Other" }));
		await user.type(screen.getByLabelText("Specific Issue Type *"), "login");
		await user.click(screen.getByRole("button", { name: /^High$/i }));
		await user.click(screen.getByRole("button", { name: "Report Bug" }));

		await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));

		// While the mutation hangs, Cancel must not fire the discard dialog
		// nor close the modal.
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(
			screen.queryByText("Discard Unsaved Issue Report?"),
		).not.toBeInTheDocument();
		expect(onOpenChange).not.toHaveBeenCalled();

		resolveSubmit({});
		await waitFor(() =>
			expect(
				screen.queryByRole("button", { name: "Report Bug" }),
			).not.toBeInTheDocument(),
		);
	});
});
