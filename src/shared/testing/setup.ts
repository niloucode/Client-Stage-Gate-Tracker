import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Vitest runs without globals in this repo, so @testing-library/react
// cannot auto-register its cleanup — do it explicitly (Task 1.10).
afterEach(() => {
	cleanup();
});

// Components that call useRouter/useSearchParams need the Next router
// context; stub it globally so tests render without a provider.
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		prefetch: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/",
	useParams: () => ({}),
}));
