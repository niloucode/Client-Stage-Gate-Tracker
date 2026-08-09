import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without globals in this repo, so @testing-library/react
// cannot auto-register its cleanup — do it explicitly (Task 1.10).
afterEach(() => {
	cleanup();
});
