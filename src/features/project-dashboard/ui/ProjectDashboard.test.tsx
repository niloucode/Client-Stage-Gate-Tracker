// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectDashboard } from "./ProjectDashboard";
import type { ProjectWithStatus } from "@/entities/project";

// jsdom makes @t3-oss/env-nextjs block server-only vars; the closed modals
// still import the @/entities/client hook chain (prisma.ts at module scope).
vi.mock("@/env", () => ({
	env: {
		DATABASE_URL: "postgres://test:test@localhost:5432/test",
		DIRECT_URL: "postgres://test:test@localhost:5432/test",
		SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
		NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
		NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
		NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
		PRISMA_LOG_LEVEL: undefined,
		NEXT_PUBLIC_ALLOWED_CONNECT_ORIGINS: undefined,
	},
}));

const mockProjects = vi.hoisted(() => ({
	value: undefined as ProjectWithStatus[] | undefined,
}));
const mockProfile = vi.hoisted(() => ({
	value: undefined as { client_id: string | null } | undefined,
}));

vi.mock("@/entities/project", () => ({
	useProjectsForMember: () => ({
		data: mockProjects.value,
		isLoading: false,
		error: null,
	}),
	useCreateProject: () => ({ mutateAsync: vi.fn() }),
	useUpdateProject: () => ({ mutateAsync: vi.fn() }),
	useDeleteProject: () => ({ mutateAsync: vi.fn() }),
	useProjectMembers: () => ({ data: [], isLoading: false }),
	useAddProjectMember: () => ({ mutateAsync: vi.fn() }),
	useRemoveProjectMember: () => ({ mutateAsync: vi.fn() }),
	searchProfilesForProject: vi.fn(async () => []),
}));

vi.mock("@/entities/profile", () => ({
	useCurrentUser: () => ({ data: mockProfile.value }),
}));

const ownedProject: ProjectWithStatus = {
	project_id: "123e4567-e89b-12d3-a456-426614174000",
	name: "Portal 2.0",
	description: null,
	planStart: new Date("2026-01-01T00:00:00Z"),
	actualEnd: null,
	planEnd: new Date("2026-06-30T00:00:00Z"),
	is_deleted: false,
	deleted_at: null,
	project_status: "ACTIVE",
	is_owner: true,
	client_name: "Nexus",
	client_id: "123e4567-e89b-12d3-a456-426614174001",
};

const memberProject: ProjectWithStatus = {
	...ownedProject,
	project_id: "123e4567-e89b-12d3-a456-426614174002",
	is_owner: false,
};

function renderDashboard() {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<ProjectDashboard />
		</QueryClientProvider>,
	);
}

describe("ProjectDashboard '+ Add Project' gating", () => {
	it("shows the button for a staff user with no projects (bootstrap)", () => {
		mockProjects.value = [];
		mockProfile.value = { client_id: null };
		renderDashboard();
		expect(
			screen.getByRole("button", { name: /add project/i }),
		).toBeInTheDocument();
	});

	it("hides the button for a team member who owns nothing", () => {
		mockProjects.value = [memberProject];
		mockProfile.value = { client_id: null };
		renderDashboard();
		expect(screen.queryByRole("button", { name: /add project/i })).toBeNull();
	});

	it("shows the button for a project owner", () => {
		mockProjects.value = [ownedProject, memberProject];
		mockProfile.value = { client_id: null };
		renderDashboard();
		expect(
			screen.getByRole("button", { name: /add project/i }),
		).toBeInTheDocument();
	});

	it("hides the button for client profiles even without projects", () => {
		mockProjects.value = [];
		mockProfile.value = { client_id: "123e4567-e89b-12d3-a456-426614174001" };
		renderDashboard();
		expect(screen.queryByRole("button", { name: /add project/i })).toBeNull();
	});
});
