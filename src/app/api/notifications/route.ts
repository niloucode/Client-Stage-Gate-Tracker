import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/projectAccess";

/**
 * Notifications endpoint — STUB.
 *
 * Requires an authenticated session (rejects with 401 otherwise). No
 * notifications are produced yet; the payload shape is defined when the
 * notifications feature lands (planned: HistoryEvent-driven digests).
 * @returns The result.
 */
export async function POST() {
	const userId = await getCurrentUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	return NextResponse.json({ ok: true });
}
