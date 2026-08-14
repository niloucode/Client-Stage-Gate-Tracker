// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PendingContracts } from "./PendingContracts";

// PendingContracts uses next/navigation's useRouter for the Review & Sign
// button; jsdom has no app router mounted. Same pattern as account-menu.test.tsx.
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
	usePathname: () => "/dashboard",
}));

/**
 * Regression: the "View All" DialogTrigger previously wrapped a raw <button>,
 * producing <button><button> — invalid HTML that caused a hydration error on
 * the landing dashboard (base-ui's DialogTrigger renders its own button, so
 * the trigger content must be non-interactive phrasing content).
 */
describe("PendingContracts", () => {
	it("does not nest a button inside the DialogTrigger button", () => {
		const { container } = render(<PendingContracts />);
		expect(container.querySelectorAll("button button").length).toBe(0);
		// The base-ui trigger renders a single button whose accessible name
		// comes from the span content.
		expect(
			screen.getByRole("button", { name: "View All" }),
		).toBeInTheDocument();
	});

	it("renders the empty state when there are no contracts", () => {
		render(<PendingContracts contracts={[]} />);
		expect(screen.getByText("No contracts to show.")).toBeInTheDocument();
	});
});
