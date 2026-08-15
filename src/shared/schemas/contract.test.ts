import { describe, expect, it } from "vitest";
import { contractApproveSchema } from "./contract";

const uuid = "123e4567-e89b-12d3-a456-426614174000";

describe("contractApproveSchema", () => {
	it("accepts a valid owner approval", () => {
		const result = contractApproveSchema.safeParse({
			projectId: uuid,
			role: "owner",
		});
		expect(result.success).toBe(true);
	});

	it("accepts a valid client approval", () => {
		const result = contractApproveSchema.safeParse({
			projectId: uuid,
			role: "client",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an invalid role", () => {
		const result = contractApproveSchema.safeParse({
			projectId: uuid,
			role: "Client Viewer",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("role"))).toBe(true);
		}
	});

	it("rejects a non-uuid projectId", () => {
		const result = contractApproveSchema.safeParse({
			projectId: "not-a-uuid",
			role: "owner",
		});
		expect(result.success).toBe(false);
	});
});
