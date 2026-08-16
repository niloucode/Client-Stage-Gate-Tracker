import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-confirmation callback (Supabase). Exchanges the ?code param for a
 * real session so clicking the confirmation link signs the user in, then
 * routes them to the app shell (which redirects role-appropriately).
 * Falls back to /login when the code is missing or invalid.
 * @returns The result.
 */
/**
 * OAuth callback: exchanges the code for a session.
 * @param request
 * @returns The result.
 */
export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	if (!code) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return NextResponse.redirect(new URL("/dashboard", request.url));
}
