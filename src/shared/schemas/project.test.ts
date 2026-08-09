import { describe, expect, it } from "vitest";
import {
	moduleCreateSchema,
	workflowCreateSchema,
} from "./project";

const d = (iso: string) => new Date(iso);

describe("moduleCreateSchema (canonical 4-date vocabulary, Task 3.1)", () => {
	it("accepts planStart before planEnd", () => {
		const result = moduleCreateSchema.safeParse({
			name: "Auth",
			planStart: d("2024-01-01T00:00:00Z"),
			planEnd: d("2024-01-10T00:00:00Z"),
			actualStart: null,
			actualEnd: null,
		});
		expect(result.success).toBe(true);
	});

	it("rejects planStart after planEnd", () => {
		const result = moduleCreateSchema.safeParse({
			name: "Auth",
			planStart: d("2024-01-10T00:00:00Z"),
			planEnd: d("2024-01-01T00:00:00Z"),
			actualStart: null,
			actualEnd: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("planStart"))).toBe(
				true,
			);
		}
	});

	it("accepts missing dates entirely", () => {
		const result = moduleCreateSchema.safeParse({
			name: "Auth",
			planStart: null,
			planEnd: null,
			actualStart: null,
			actualEnd: null,
		});
		expect(result.success).toBe(true);
	});
});

describe("workflowCreateSchema (canonical 4-date vocabulary, Task 3.1)", () => {
	it("rejects planStart after planEnd", () => {
		const result = workflowCreateSchema.safeParse({
			name: "Build",
			planStart: d("2024-05-10T00:00:00Z"),
			planEnd: d("2024-05-01T00:00:00Z"),
			actualStart: null,
			actualEnd: null,
			isApproved: false,
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid dates and isApproved", () => {
		const result = workflowCreateSchema.safeParse({
			name: "Build",
			planStart: d("2024-05-01T00:00:00Z"),
			planEnd: d("2024-05-10T00:00:00Z"),
			actualStart: null,
			actualEnd: null,
			isApproved: true,
		});
		expect(result.success).toBe(true);
	});
});
