"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `resetFn` on the frame after `trigger` becomes truthy (or after it
 * becomes falsy when `whenOpen` is false). The deferred call lets the dialog
 * finish mounting before controlled inputs are reset — replacing the
 * hand-rolled `useEffect` + `setTimeout(fn, 0)` pattern duplicated across
 * modals.
 * @param trigger - When `whenOpen` is true, reset after this becomes truthy.
 * @param resetFn - The callback to run (kept fresh via a ref).
 * @param whenOpen - Invert the trigger polarity (reset when false instead).
 */
export function useResetOnOpen(
	trigger: boolean,
	resetFn: () => void,
	whenOpen = true,
) {
	const resetRef = useRef(resetFn);

	// Keep the ref fresh without writing during render (react-hooks/refs).
	// Runs after every render, before the scheduling effect below.
	useEffect(() => {
		resetRef.current = resetFn;
	});

	useEffect(() => {
		const shouldReset = whenOpen ? trigger : !trigger;
		if (!shouldReset) return;
		const id = setTimeout(() => {
			resetRef.current();
		}, 0);
		return () => clearTimeout(id);
	}, [trigger, whenOpen]);
}
