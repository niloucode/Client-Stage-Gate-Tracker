// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./ui/LoginForm";
import { StaffSignupForm } from "./ui/StaffSignupForm";
import { ClientSignupForm } from "./ui/ClientSignupForm";

// jsdom makes @t3-oss/env-nextjs treat the bundle as a client and block
// server-only vars at import (prisma.ts reads env.DATABASE_URL at module
// scope). Provide a full test env so the REAL modules load; no DB is
// contacted because Prisma connects lazily.
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

// The forms call useRouter() from next/navigation — no App Router context
// exists in a bare jsdom render.
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
	usePathname: () => "/login",
	useParams: () => ({}),
}));

/**
 * Interaction regression tests for the auth forms (re-audit).
 * Covers the reported regressions: eye-toggle clicks, Base UI Select /
 * phone Combobox trigger clicks, and field-level validation warnings on
 * empty/wrong input. Base UI popups need a ResizeObserver in jsdom.
 */

// Base UI positioners observe the anchor; jsdom has no ResizeObserver.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
	(globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
}
if (!("scrollIntoView" in HTMLElement.prototype)) {
	(HTMLElement.prototype as { scrollIntoView?: () => void }).scrollIntoView = () => {};
}
if (!("getAnimations" in Element.prototype)) {
	(Element.prototype as { getAnimations?: () => unknown[] }).getAnimations = () => [];
}
if (!window.matchMedia) {
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	})) as unknown as typeof window.matchMedia;
}

function renderWithQuery(ui: React.ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
}

describe("LoginForm interactions", () => {
	it("eye toggle switches the password input between password and text", async () => {
		const user = userEvent.setup();
		renderWithQuery(<LoginForm />);

		const input = screen.getByLabelText("Password *");
		expect(input).toHaveAttribute("type", "password");

		await user.click(screen.getByRole("button", { name: "Show password" }));
		expect(screen.getByLabelText("Password *")).toHaveAttribute("type", "text");

		await user.click(screen.getByRole("button", { name: "Hide password" }));
		expect(screen.getByLabelText("Password *")).toHaveAttribute("type", "password");
	});

	it("submitting an empty form surfaces per-field validation warnings", async () => {
		const user = userEvent.setup();
		renderWithQuery(<LoginForm />);

		await user.click(screen.getByRole("button", { name: "Log In" }));

		expect(
			await screen.findByText("Enter a valid email address"),
		).toBeInTheDocument();
		expect(screen.getByText("Password is required")).toBeInTheDocument();
	});

	it("blurring fields does NOT flag the form before a submit attempt", async () => {
		const user = userEvent.setup();
		renderWithQuery(<LoginForm />);

		const email = screen.getByLabelText("Email Address *");
		await user.click(email);
		await user.tab();
		await user.tab();

		expect(screen.queryByText("Enter a valid email address")).not.toBeInTheDocument();
		expect(screen.queryByText("Password is required")).not.toBeInTheDocument();
	});
});

describe("StaffSignupForm interactions", () => {
	it("department Select trigger opens its popup without crashing", async () => {
		const user = userEvent.setup();
		renderWithQuery(<StaffSignupForm />);

		const trigger = document.querySelector('[data-slot="select-trigger"]');
		expect(trigger).not.toBeNull();

		await user.click(trigger as HTMLElement);

		// The popup content is portaled; at minimum the tree must survive
		// the click (no crash) and the popup should render its listbox.
		expect(document.querySelector('[data-slot="select-content"]')).toBeTruthy();
	});

	it("phone country dropdown trigger does not crash the form", async () => {
		const user = userEvent.setup();
		renderWithQuery(<StaffSignupForm />);

		const phoneTrigger = document.querySelector('[data-slot="combobox-trigger"]');
		expect(phoneTrigger).not.toBeNull();

		await user.click(phoneTrigger as HTMLElement);
		// The open is deferred via rAF (Base UI useClick), so wait for the
		// portaled popup instead of asserting synchronously.
		await waitFor(() => {
			expect(document.querySelector('[data-slot="combobox-content"]')).toBeTruthy();
		});
	});

	it("both password eye toggles work", async () => {
		const user = userEvent.setup();
		renderWithQuery(<StaffSignupForm />);

		const buttons = screen.getAllByRole("button", { name: "Show password" });
		expect(buttons).toHaveLength(2);

		await user.click(buttons[0]);
		expect(buttons[0]).toHaveAttribute("aria-label", "Hide password");
	});

	it("submitting an empty form surfaces field warnings", async () => {
		const user = userEvent.setup();
		renderWithQuery(<StaffSignupForm />);

		await user.click(screen.getByRole("button", { name: "Join Workspace" }));

		expect(
			await screen.findByText("First name is required"),
		).toBeInTheDocument();
		expect(screen.getByText("Last name is required")).toBeInTheDocument();
		expect(screen.getByText("Department is required")).toBeInTheDocument();
	});
});

describe("ClientSignupForm interactions", () => {
	it("renders invite-code and person fields plus the password eye toggle", async () => {
		const user = userEvent.setup();
		renderWithQuery(<ClientSignupForm />);

		expect(screen.getByLabelText("Invite Code *")).toBeInTheDocument();

		const toggles = screen.getAllByRole("button", { name: "Show password" });
		expect(toggles.length).toBeGreaterThanOrEqual(1);
		await user.click(toggles[0]);
		expect(toggles[0]).toHaveAttribute("aria-label", "Hide password");
	});

	it("submitting an empty form surfaces field warnings", async () => {
		const user = userEvent.setup();
		renderWithQuery(<ClientSignupForm />);

		await user.click(screen.getByRole("button", { name: "Create Account" }));

		expect(
			await screen.findByText("Invite code is required"),
		).toBeInTheDocument();
		expect(screen.getByText("First name is required")).toBeInTheDocument();
		expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
	});

	it("rejects a malformed invite code on submit", async () => {
		const user = userEvent.setup();
		renderWithQuery(<ClientSignupForm />);

		const code = screen.getByLabelText("Invite Code *");
		await user.type(code, "short");

		await user.click(screen.getByRole("button", { name: "Create Account" }));

		expect(
			await screen.findByText("Enter a valid invite code"),
		).toBeInTheDocument();
	});
});
