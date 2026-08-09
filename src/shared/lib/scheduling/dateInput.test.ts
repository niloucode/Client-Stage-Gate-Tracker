import { describe, expect, it } from "vitest";
import {
	fromDateTimeLocalInput,
	toDateTimeLocalInput,
} from "./dateInput";

describe("toDateTimeLocalInput", () => {
	it("returns an empty string for null/undefined", () => {
		expect(toDateTimeLocalInput(null)).toBe("");
		expect(toDateTimeLocalInput(undefined)).toBe("");
	});

	it("formats a Date as a local datetime-local string (yyyy-MM-ddTHH:mm)", () => {
		// Local-time construction: Jan 5, 2024 at 09:30 local
		const date = new Date(2024, 0, 5, 9, 30);
		expect(toDateTimeLocalInput(date)).toBe("2024-01-05T09:30");
	});

	it("round-trips through fromDateTimeLocalInput", () => {
		const date = new Date(2024, 5, 15, 14, 45);
		const input = toDateTimeLocalInput(date);
		const back = fromDateTimeLocalInput(input);
		expect(back?.getTime()).toBe(date.getTime());
	});
});

describe("fromDateTimeLocalInput", () => {
	it("returns null for empty input", () => {
		expect(fromDateTimeLocalInput("")).toBeNull();
	});

	it("returns null for invalid input", () => {
		expect(fromDateTimeLocalInput("not-a-date")).toBeNull();
	});

	it("parses a datetime-local string as local time", () => {
		const date = fromDateTimeLocalInput("2024-03-10T08:00");
		expect(date?.getFullYear()).toBe(2024);
		expect(date?.getMonth()).toBe(2); // March
		expect(date?.getDate()).toBe(10);
		expect(date?.getHours()).toBe(8);
		expect(date?.getMinutes()).toBe(0);
	});
});
