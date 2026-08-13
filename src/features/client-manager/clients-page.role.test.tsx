// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Role-visibility tests for the clients page. The data hooks and router are
// mocked; the page's own gating logic is what's under test.
const mockAuth = vi.hoisted(() => ({
	user: null as {
		client_id: string | null;
		department_id: string | null;
		first_name: string;
		last_name: string;
		email: string;
	} | null,
	isLoading: false,
}));
const mockDepartment = vi.hoisted(() => ({ name: null as string | null }));
const mockClients = vi.hoisted(() => ({
	data: [] as unknown[],
	refetch: vi.fn(),
}));
const mockUseClients = vi.hoisted(() => vi.fn());
const mockRouter = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("@/features/auth", () => ({
	useAuth: () => ({
		user: mockAuth.user,
		isLoading: mockAuth.isLoading,
		logout: vi.fn(),
	}),
}));
vi.mock("@/entities/department", () => ({
	useDepartment: () => ({ data: mockDepartment.name ? { name: mockDepartment.name } : undefined }),
}));
vi.mock("@/entities/client", () => ({
	useClients: mockUseClients,
	regenerateClientInviteCode: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => mockRouter,
	usePathname: () => "/clients",
}));

import { ClientsPage } from "@/features/client-manager";

function renderPage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<ClientsPage />
		</QueryClientProvider>,
	);
}

const CLIENT_ROW = {
	client_id: "c1",
	client_name: "Acme Corp",
	email: "hello@acme.test",
	phone: "+1 555 000 0000",
	billing_address: "1 Test St",
	has_invite_code: true,
	tin: "123-456-789",
	Profiles: [],
};

beforeEach(() => {
	mockAuth.user = null;
	mockAuth.isLoading = false;
	mockDepartment.name = null;
	mockClients.data = [];
	mockRouter.replace.mockClear();
	mockClients.refetch.mockClear();
	mockUseClients.mockClear();
	mockUseClients.mockImplementation((options?: { enabled?: boolean }) => ({
		data: options?.enabled === false ? undefined : (mockClients.data as never),
		refetch: mockClients.refetch,
	}));
});

describe("ClientsPage role visibility", () => {
	it("project owner sees Add Client, the company-code column, and the edit pencil", () => {
		mockAuth.user = {
			client_id: null,
			department_id: "dept-owner",
			first_name: "Ada",
			last_name: "Lovelace",
			email: "ada@asceoft.test",
		};
		mockDepartment.name = "Project Owner";
		mockClients.data = [CLIENT_ROW];

		renderPage();

		expect(screen.getByRole("button", { name: "Add Client" })).toBeInTheDocument();
		expect(screen.getByText("COMPANY CODE")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Edit client" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Regenerate invite code" })).toBeInTheDocument();
	});

	it("project team sees the list and members but NOT add/code/edit", () => {
		mockAuth.user = {
			client_id: null,
			department_id: "dept-team",
			first_name: "Grace",
			last_name: "Hopper",
			email: "grace@asceoft.test",
		};
		mockDepartment.name = "Project Team";
		mockClients.data = [CLIENT_ROW];

		renderPage();

		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "View team members" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Add Client" })).not.toBeInTheDocument();
		expect(screen.queryByText("COMPANY CODE")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Edit client" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Regenerate invite code" })).not.toBeInTheDocument();
	});

	it("client profiles are redirected away and never render the page", () => {
		mockAuth.user = {
			client_id: "client-1",
			department_id: null,
			first_name: "Jean",
			last_name: "Gunnhildr",
			email: "jean@acme.test",
		};

		renderPage();

		expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard");
		expect(screen.queryByRole("heading", { name: "Clients" })).not.toBeInTheDocument();
		// The list must not be fetched for client profiles.
		const enabledArg = mockUseClients.mock.calls[0]?.[0] as
			| { enabled?: boolean }
			| undefined;
		expect(enabledArg?.enabled).toBe(false);
	});
});
