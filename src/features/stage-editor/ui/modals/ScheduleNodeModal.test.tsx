// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Behavior tests for the shared ScheduleNodeModal (extracted 2026-08-16
 * from ModuleModals/WorkflowModals). The config callbacks are mocked; the
 * modal's own validation, payload mapping, edit prefill and discard flow
 * are what is under test.
 */
import {
	ScheduleNodeModal,
	type ScheduleNodeEntity,
} from "./ScheduleNodeModal";

const ENTITY: ScheduleNodeEntity = {
	id: "entity-1",
	name: "Auth & Identity",
	planStart: new Date("2026-09-01T00:00:00Z"),
	planEnd: new Date("2026-09-30T00:00:00Z"),
	actualStart: null,
	actualEnd: null,
};

const STAGE_ID = "stage-1";

type CreateFn = (params: {
	parentId: string;
	stageId: string;
	name: string;
	planStart: Date;
	planEnd: Date;
	actualStart?: Date;
	actualEnd?: Date;
}) => Promise<unknown>;
type UpdateFn = (params: {
	id: string;
	stageId: string;
	name: string;
	planStart: Date;
	planEnd: Date;
	actualStart?: Date;
	actualEnd?: Date;
}) => Promise<unknown>;

function moduleConfig(
	create: CreateFn = vi.fn() as unknown as CreateFn,
	update: UpdateFn = vi.fn() as unknown as UpdateFn,
) {
	return {
		entityLabel: "Module",
		createdVerb: "added" as const,
		namePlaceholder: "e.g., Authentication & Identity",
		create,
		update,
	};
}

function renderModal(props: {
	entity?: ScheduleNodeEntity | null;
	create?: CreateFn;
	update?: UpdateFn;
}) {
	const onClose = vi.fn();
	const create = props.create ?? (vi.fn() as unknown as CreateFn);
	const update = props.update ?? (vi.fn() as unknown as UpdateFn);
	render(
		<ScheduleNodeModal
			isOpen
			onClose={onClose}
			entity={props.entity ?? null}
			stageId={STAGE_ID}
			parentId="parent-1"
			parentLabel={props.entity ? undefined : "Phase 3"}
			onDelete={undefined}
			config={moduleConfig(create, update)}
		/>,
	);
	return { onClose, create, update };
}

describe("ScheduleNodeModal", () => {
	it("renders create mode with entity-specific copy", () => {
		renderModal({});

		expect(screen.getByText("Create New Module")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Fill in the details to create a new module for Phase 3.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("e.g., Authentication & Identity"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Add Module/i }),
		).toBeInTheDocument();
	});

	it("surfaces schema validation errors and never calls create", async () => {
		const user = userEvent.setup();
		const { create } = renderModal({});

		await user.click(screen.getByRole("button", { name: /Add Module/i }));

		expect(
			await screen.findByText("Module name is required"),
		).toBeInTheDocument();
		expect(screen.getByText("Plan Start Date is required")).toBeInTheDocument();
		expect(screen.getByText("Plan End Date is required")).toBeInTheDocument();
		expect(create).not.toHaveBeenCalled();
	});

	it("prefills edit mode and submits the mapped payload on save", async () => {
		const user = userEvent.setup();
		const { update } = renderModal({ entity: ENTITY });

		expect(screen.getByText("Edit Module")).toBeInTheDocument();
		const nameInput = screen.getByPlaceholderText(
			"e.g., Authentication & Identity",
		);
		expect(nameInput).toHaveValue("Auth & Identity");

		await user.click(screen.getByRole("button", { name: /Save Changes/i }));

		await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
		expect(update).toHaveBeenCalledWith({
			id: "entity-1",
			stageId: STAGE_ID,
			name: "Auth & Identity",
			planStart: ENTITY.planStart,
			planEnd: ENTITY.planEnd,
			actualStart: undefined,
			actualEnd: undefined,
		});
	});

	it("asks to discard unsaved changes when closing a dirty form", async () => {
		const user = userEvent.setup();
		const { onClose } = renderModal({ entity: ENTITY });

		await user.type(
			screen.getByPlaceholderText("e.g., Authentication & Identity"),
			"x",
		);
		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(
			await screen.findByText("Discard Unsaved Changes?"),
		).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Discard Changes" }));

		await waitFor(() => expect(onClose).toHaveBeenCalled());
	});

	// NOTE: the create-path payload (parentId mapping) is not driven in
	// jsdom because the date picker popover is impractical to fill there;
	// it is pinned by the schema validation test above and by the wrapper
	// types (ModuleModals/WorkflowModals map parentId → phaseId/moduleId).
});
