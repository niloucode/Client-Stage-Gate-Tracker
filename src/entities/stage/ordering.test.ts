import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateKeyBetween } from "fractional-indexing";

// The reorder functions delegate key math to fractional-indexing; this suite
// locks the ordering contract that the entity actions rely on: a key computed
// between two neighbors sorts strictly between them, and appending after the
// last key yields a key that sorts after everything existing.
describe("fractional-indexing key contract (used by reorder/create paths)", () => {
	let keys: string[];

	beforeEach(() => {
		keys = ["a0", "a1", "a2"];
	});

	it("generates a key between two existing neighbors", () => {
		const between = generateKeyBetween(keys[0], keys[1]);
		expect(keys[0] < between && between < keys[1]).toBe(true);
	});

	it("generates a key before the first neighbor", () => {
		const before = generateKeyBetween(null, keys[0]);
		expect(before < keys[0]).toBe(true);
	});

	it("generates a key after the last neighbor (create/append)", () => {
		const after = generateKeyBetween(keys[keys.length - 1], null);
		expect(after > keys[keys.length - 1]).toBe(true);
	});

	it("keeps total order after repeated moves", () => {
		// Simulate a series of reorders on a 3-item list: move item 3 to
		// position 1, then item 1 (now at 2) to position 3.
		const list = [...keys];
		const move = (id: string, targetIdx: number) => {
			const idx = list.indexOf(id);
			const rest = list.filter((k) => k !== id);
			const before = targetIdx > 0 ? rest[targetIdx - 1] : null;
			const after = targetIdx < rest.length ? rest[targetIdx] : null;
			const newKey = generateKeyBetween(before, after);
			list.splice(idx, 1);
			list.splice(targetIdx, 0, newKey);
		};

		move("a2", 0); // a2 to front
		expect([...list].sort().join() === list.join()).toBe(true);
		move(list[2], 2); // move the last item to the end (no-op position)
		expect([...list].sort().join() === list.join()).toBe(true);

		// Deep list: 20 sequential appends stay ordered
		let prev = "a0";
		for (let i = 0; i < 20; i++) {
			const next = generateKeyBetween(prev, null);
			expect(next > prev).toBe(true);
			prev = next;
		}
	});
});

// Ensure the entity modules stay importable under Vitest (no build-time
// side effects from the "use server" directive).
describe("entity action modules import cleanly", () => {
	it("reorderPhase imports without throwing", async () => {
		vi.resetModules();
		const mod = await import("@/entities/phase/phaseActions");
		expect(typeof mod.reorderPhase).toBe("function");
	});

	it("reorderWorkflow imports without throwing", async () => {
		vi.resetModules();
		const mod = await import("@/entities/workflow/workflowActions");
		expect(typeof mod.reorderWorkflow).toBe("function");
	});
});
