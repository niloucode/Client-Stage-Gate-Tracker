import { describe, it, expect } from "vitest";
import {
	currentWeekStart,
	previousWeekStart,
	nextWeekStart,
	weekdayIndex,
	startOfToday,
	endOfToday,
	riskLabel,
	velocityChange,
	upcomingSummary,
} from "./activityStats";

describe("currentWeekStart / previousWeekStart", () => {
	it("returns Monday 00:00 for a mid-week date", () => {
		// 2026-08-14 is a Friday (local).
		const start = currentWeekStart(new Date(2026, 7, 14, 15, 30));
		expect(start.getFullYear()).toBe(2026);
		expect(start.getMonth()).toBe(7); // August
		expect(start.getDate()).toBe(10); // Monday
		expect(start.getHours()).toBe(0);
	});

	it("returns the same Monday for any day of the week", () => {
		const monday = new Date(2026, 7, 10, 9, 0);
		expect(currentWeekStart(monday).getTime()).toBe(
			currentWeekStart(new Date(2026, 7, 16, 23, 0)).getTime(),
		);
	});

	it("maps Sunday to the previous Monday (Sunday is the week end)", () => {
		const start = currentWeekStart(new Date(2026, 7, 16, 12, 0)); // Sunday
		expect(start.getDate()).toBe(10); // Monday of the same week
	});

	it("previousWeekStart is exactly one calendar week before currentWeekStart", () => {
		const now = new Date(2026, 7, 14, 12, 0);
		expect(previousWeekStart(now).getTime()).toBe(
			currentWeekStart(now).getTime() - 7 * 86_400_000,
		);
	});

	it("nextWeekStart is exactly one calendar week after currentWeekStart", () => {
		const now = new Date(2026, 7, 14, 12, 0);
		expect(nextWeekStart(now).getTime()).toBe(
			currentWeekStart(now).getTime() + 7 * 86_400_000,
		);
	});

	it("week helpers stay Monday-aligned across a DST transition (calendar math, not fixed ms)", () => {
		// DST changes happen on Sundays in most zones; Monday alignment and
		// the 7-day offset must survive them (including the 00:00 hour).
		const beforeDst = new Date(2026, 2, 8, 12, 0); // Sunday before US DST start
		const start = currentWeekStart(beforeDst);
		expect(start.getDay()).toBe(1);
		expect(start.getHours()).toBe(0);
		expect(previousWeekStart(beforeDst).getDay()).toBe(1);
		expect(previousWeekStart(beforeDst).getHours()).toBe(0);
		expect(nextWeekStart(beforeDst).getDay()).toBe(1);
		expect(nextWeekStart(beforeDst).getHours()).toBe(0);
	});
});

describe("weekdayIndex", () => {
	it("indexes Monday as 0 and Sunday as 6", () => {
		expect(weekdayIndex(new Date(2026, 7, 10))).toBe(0); // Monday
		expect(weekdayIndex(new Date(2026, 7, 16))).toBe(6); // Sunday
		expect(weekdayIndex(new Date(2026, 7, 14))).toBe(4); // Friday
	});
});

describe("startOfToday / endOfToday", () => {
	it("bounds today at 00:00:00.000 and 23:59:59.999", () => {
		const now = new Date(2026, 7, 14, 15, 30, 45, 123);
		expect(startOfToday(now).getHours()).toBe(0);
		expect(startOfToday(now).getMinutes()).toBe(0);
		expect(endOfToday(now).getHours()).toBe(23);
		expect(endOfToday(now).getMinutes()).toBe(59);
		expect(endOfToday(now).getSeconds()).toBe(59);
		expect(endOfToday(now).getMilliseconds()).toBe(999);
	});
});

describe("riskLabel", () => {
	it("is Low with no active tickets", () => {
		expect(riskLabel(0, 0)).toBe("Low");
	});

	it("is Low with zero overdue", () => {
		expect(riskLabel(0, 10)).toBe("Low");
	});

	it("is Medium for some overdue (ratio < 50%)", () => {
		expect(riskLabel(2, 10)).toBe("Medium");
		expect(riskLabel(1, 10)).toBe("Medium");
	});

	it("is High at a 50% overdue ratio and above", () => {
		expect(riskLabel(5, 10)).toBe("High");
		expect(riskLabel(9, 10)).toBe("High");
	});
});

describe("velocityChange", () => {
	it("returns '—' when last week had no completions", () => {
		expect(velocityChange(0, 0)).toEqual({ change: "—", changePositive: false });
		expect(velocityChange(3, 0)).toEqual({ change: "—", changePositive: true });
	});

	it("formats a positive change", () => {
		// 28 vs 25 → +12%
		expect(velocityChange(28, 25)).toEqual({
			change: "+12%",
			changePositive: true,
		});
	});

	it("formats a negative change", () => {
		expect(velocityChange(20, 25)).toEqual({
			change: "-20%",
			changePositive: false,
		});
	});

	it("formats zero change as +0%", () => {
		expect(velocityChange(10, 10)).toEqual({
			change: "+0%",
			changePositive: true,
		});
	});
});

describe("upcomingSummary", () => {
	it("is Today + urgent when at least one ticket is due today", () => {
		expect(upcomingSummary(3, true)).toEqual({
			urgencyLabel: "Today",
			isUrgent: true,
		});
	});

	it("is neutral when tickets are due but not today", () => {
		expect(upcomingSummary(3, false)).toEqual({
			urgencyLabel: "Due soon",
			isUrgent: false,
		});
	});

	it("is All clear with nothing upcoming", () => {
		expect(upcomingSummary(0, false)).toEqual({
			urgencyLabel: "All clear",
			isUrgent: false,
		});
	});
});
