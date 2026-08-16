// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// AccountMenu interaction tests: the LOG-OUT button must invoke logout
// exactly once per press. Data hooks and the router are mocked; the menu
// itself (Base UI dropdown) is real.
const mockAuth = vi.hoisted(() => ({
	user: null as {
		client_id: string | null;
		department_id: string | null;
		first_name: string;
		last_name: string;
		email: string;
	} | null,
	isLoading: false,
	logout: vi.fn(),
}));

// jsdom makes @t3-oss/env-nextjs treat the bundle as a client and block
// server-only vars (prisma.ts reads env.DATABASE_URL at module scope).
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

vi.mock("@/features/auth", () => ({
	useAuth: () => ({
		user: mockAuth.user,
		isLoading: mockAuth.isLoading,
		logout: mockAuth.logout,
	}),
}));
vi.mock("@/entities/department", () => ({
	useDepartment: () => ({ data: undefined }),
}));
vi.mock("@/entities/client", () => ({
	useClientOwn: () => ({ data: undefined }),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
	usePathname: () => "/projects",
}));

// Base UI positioners need jsdom polyfills to mount the dropdown popup.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
if (!("ResizeObserver" in globalThis)) {
	(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
		ResizeObserverStub;
}
if (!("scrollIntoView" in HTMLElement.prototype)) {
	(HTMLElement.prototype as { scrollIntoView?: () => void }).scrollIntoView =
		() => {};
}

import { AccountMenu } from "@/features/navigation/ui";

beforeEach(() => {
	mockAuth.user = {
		client_id: null,
		department_id: "dept-owner",
		first_name: "Ada",
		last_name: "Lovelace",
		email: "ada@asceoft.test",
	};
	mockAuth.logout.mockReset();
	mockAuth.logout.mockResolvedValue(undefined);
});

describe("AccountMenu logout", () => {
	it("invokes logout exactly once when LOG OUT is pressed", async () => {
		const user = userEvent.setup();
		render(<AccountMenu />);

		// Open the dropdown via the avatar trigger.
		await user.click(screen.getByText("AL"));
		const logoutButton = await screen.findByRole("button", { name: "LOG OUT" });

		await user.click(logoutButton);

		expect(mockAuth.logout).toHaveBeenCalledTimes(1);
	});

	it("disables the button and shows a pending label while logout runs", async () => {
		const user = userEvent.setup();
		let resolveLogout: (() => void) | undefined;
		mockAuth.logout.mockImplementation(
			() => new Promise<void>((resolve) => (resolveLogout = resolve)),
		);
		render(<AccountMenu />);

		await user.click(screen.getByText("AL"));
		const logoutButton = await screen.findByRole("button", { name: "LOG OUT" });

		await user.click(logoutButton);

		await waitFor(() => {
			expect(logoutButton).toBeDisabled();
		});
		expect(screen.getByText("LOG OUT…")).toBeInTheDocument();
		// A second press while in flight is a no-op at the UI level.
		await user.click(logoutButton);
		expect(mockAuth.logout).toHaveBeenCalledTimes(1);

		resolveLogout?.();
	});
});
