// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TicketsBoard } from "./TicketsBoard";

// jsdom makes @t3-oss/env-nextjs treat the bundle as a client and block
// server-only vars — TicketsBoard imports TICKET_STATUS_CONFIG from
// @/entities/ticket, which transitively loads prisma.ts (env.DATABASE_URL
// at module scope). Same pattern as account-menu.test.tsx.
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

/**
 * Regression: the "View All" DialogTrigger previously wrapped a raw <button>,
 * producing <button><button> — invalid HTML that caused a hydration error on
 * the landing dashboard (base-ui's DialogTrigger renders its own button, so
 * the trigger content must be non-interactive phrasing content).
 */
describe("TicketsBoard", () => {
	it("does not nest a button inside the DialogTrigger button", () => {
		const { container } = render(<TicketsBoard />);
		expect(container.querySelectorAll("button button").length).toBe(0);
		// The base-ui trigger renders a single button whose accessible name
		// comes from the span content.
		expect(
			screen.getByRole("button", { name: "View All" }),
		).toBeInTheDocument();
	});

	it("renders the empty state when there are no tickets", () => {
		render(<TicketsBoard tickets={[]} />);
		expect(screen.getByText("No tickets to show.")).toBeInTheDocument();
	});
});
