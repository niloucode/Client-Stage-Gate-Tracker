// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "./ProjectCard";
import type { ProjectWithStatus } from "@/entities/project";

const baseProject: ProjectWithStatus = {
	project_id: "123e4567-e89b-12d3-a456-426614174000",
	name: "Portal 2.0",
	description: "Rebuild the client portal",
	planStart: new Date("2026-01-01T00:00:00Z"),
	actualEnd: null,
	planEnd: new Date("2026-06-30T00:00:00Z"),
	is_deleted: false,
	deleted_at: null,
	project_status: "ACTIVE",
	is_owner: false,
	client_name: "Nexus Dynamics",
	client_id: "123e4567-e89b-12d3-a456-426614174001",
};

const noop = vi.fn();

function renderCard(isOwner: boolean) {
	return render(
		<ProjectCard
			project={{ ...baseProject, is_owner: isOwner }}
			isOwner={isOwner}
			onEdit={noop}
			onManageMembers={noop}
			onDelete={noop}
		/>,
	);
}

describe("ProjectCard role gating", () => {
	it("hides the ellipsis menu for non-owners (team members, clients)", () => {
		const { container } = renderCard(false);
		expect(
			container.querySelector('[data-slot="dropdown-menu-trigger"]'),
		).toBeNull();
		expect(screen.queryByLabelText(/edit project details/i)).toBeNull();
	});

	it("renders the ellipsis menu for project owners", () => {
		const { container } = renderCard(true);
		expect(
			container.querySelector('[data-slot="dropdown-menu-trigger"]'),
		).not.toBeNull();
	});

	it("always shows the project name and dates regardless of role", () => {
		renderCard(false);
		expect(screen.getByText("Portal 2.0")).toBeInTheDocument();
		expect(screen.getByText("Jan 1, 2026")).toBeInTheDocument();
	});
});
