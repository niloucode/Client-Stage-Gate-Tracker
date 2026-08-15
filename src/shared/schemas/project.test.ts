import { describe, expect, it } from "vitest";
import {
	moduleCreateSchema,
	phaseCreateSchema,
	projectCreateSchema,
	stageCreateSchema,
	workflowCreateSchema,
} from "./project";

const d = (iso: string) => new Date(iso);

describe("projectCreateSchema (required plan dates, Input Rules)", () => {
	it("accepts valid planStart and planEnd", () => {
		const result = projectCreateSchema.safeParse({
			name: "Portal",
			description: "",
			client_id: "123e4567-e89b-12d3-a456-426614174000",
			planStart: d("2024-01-01T00:00:00Z"),
			planEnd: d("2024-06-30T00:00:00Z"),
		});
		if (!result.success) {
			expect(result.error.issues).toEqual([]);
		}
		expect(result.success).toBe(true);
	});

	it("rejects a missing planStart (undefined)", () => {
		const result = projectCreateSchema.safeParse({
			name: "Portal",
			client_id: "123e4567-e89b-12d3-a456-426614174000",
			planEnd: d("2024-06-30T00:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("planStart")),
			).toBe(true);
		}
	});

	it("rejects a null planEnd", () => {
		const result = projectCreateSchema.safeParse({
			name: "Portal",
			client_id: "123e4567-e89b-12d3-a456-426614174000",
			planStart: d("2024-01-01T00:00:00Z"),
			planEnd: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("planEnd")),
			).toBe(true);
		}
	});

	it("rejects planStart after planEnd", () => {
		const result = projectCreateSchema.safeParse({
			name: "Portal",
			client_id: "123e4567-e89b-12d3-a456-426614174000",
			planStart: d("2024-06-30T00:00:00Z"),
			planEnd: d("2024-01-01T00:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("planStart")),
			).toBe(true);
		}
	});
});

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
			expect(
				result.error.issues.some((i) => i.path.includes("planStart")),
			).toBe(true);
		}
	});

	it("rejects missing plan dates (date rules: plan dates required)", () => {
		const result = moduleCreateSchema.safeParse({
			name: "Auth",
			planStart: null,
			planEnd: null,
			actualStart: null,
			actualEnd: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("planStart")),
			).toBe(true);
		}
	});
});

describe("phaseCreateSchema (canonical 4-date vocabulary, Task 3.1)", () => {
	it("accepts valid planned and actual ranges", () => {
		const result = phaseCreateSchema.safeParse({
			name: "Design",
			planStart: d("2024-01-01T00:00:00Z"),
			planEnd: d("2024-01-10T00:00:00Z"),
			actualStart: d("2024-01-02T00:00:00Z"),
			actualEnd: d("2024-01-09T00:00:00Z"),
		});
		expect(result.success).toBe(true);
	});

	it("rejects inverted planned range with a planStart-path issue", () => {
		const result = phaseCreateSchema.safeParse({
			name: "Design",
			planStart: d("2024-01-10T00:00:00Z"),
			planEnd: d("2024-01-01T00:00:00Z"),
			actualStart: null,
			actualEnd: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("planStart")),
			).toBe(true);
		}
	});

	it("rejects inverted actual range with an actualStart-path issue", () => {
		const result = phaseCreateSchema.safeParse({
			name: "Design",
			planStart: d("2024-01-01T00:00:00Z"),
			planEnd: d("2024-01-10T00:00:00Z"),
			actualStart: d("2024-01-10T00:00:00Z"),
			actualEnd: d("2024-01-01T00:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("actualStart")),
			).toBe(true);
		}
	});

	it("rejects missing plan dates (date rules: plan dates required)", () => {
		const result = phaseCreateSchema.safeParse({
			name: "Design",
			planStart: null,
			planEnd: null,
			actualStart: null,
			actualEnd: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("planStart")),
			).toBe(true);
		}
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

	it("rejects missing plan dates (date rules: plan dates required)", () => {
		const result = workflowCreateSchema.safeParse({
			name: "Build",
			planStart: null,
			planEnd: null,
			actualStart: null,
			actualEnd: null,
			isApproved: false,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("planStart")),
			).toBe(true);
		}
	});
});

describe("stageCreateSchema (date rules: plan dates required for stages)", () => {
	const validStage = {
		name: "Discovery",
		description: "Requirements gathering",
		planStart: new Date("2026-06-16T09:00:00Z"),
		planEnd: new Date("2026-07-11T17:00:00Z"),
	};

	it("accepts valid plan dates", () => {
		const result = stageCreateSchema.safeParse(validStage);
		expect(result.success).toBe(true);
	});

	it("accepts equal plan start and end", () => {
		const result = stageCreateSchema.safeParse({
			...validStage,
			planEnd: new Date("2026-06-16T09:00:00Z"),
		});
		expect(result.success).toBe(true);
	});

	it("rejects a null planStart", () => {
		const result = stageCreateSchema.safeParse({
			...validStage,
			planStart: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("planStart"))).toBe(true);
		}
	});

	it("rejects a null planEnd", () => {
		const result = stageCreateSchema.safeParse({ ...validStage, planEnd: null });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("planEnd"))).toBe(true);
		}
	});

	it("rejects planStart after planEnd", () => {
		const result = stageCreateSchema.safeParse({
			...validStage,
			planStart: new Date("2026-07-12T09:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("planStart"))).toBe(true);
		}
	});

	it("rejects an empty name", () => {
		const result = stageCreateSchema.safeParse({ ...validStage, name: "  " });
		expect(result.success).toBe(false);
	});

});
