// src/proxy.ts
import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Normalize a URL to its origin.
 * @param value - The URL string to normalize.
 * @returns The origin, or null for invalid input.
 */
function toOrigin(value: string): string | null {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

/**
 * Build the connect-src allowlist from the environment.
 * @returns The space-separated connect-src directive value.
 */
function buildConnectSrc(): string {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseOrigin = supabaseUrl ? toOrigin(supabaseUrl) : null;
	const extraOrigins = (process.env.NEXT_PUBLIC_ALLOWED_CONNECT_ORIGINS ?? "")
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map(toOrigin)
		.filter((origin): origin is string => origin !== null);

	return [
		"'self'",
		supabaseOrigin ?? "https://*.supabase.co",
		"wss://*.supabase.co",
		...extraOrigins,
	].join(" ");
}

const CONNECT_SRC = buildConnectSrc();

/**
 * Next.js-compatible Content-Security-Policy:
 * - 'self' allows Next.js chunk files (_next/static/chunks/*).
 * - 'unsafe-inline' & 'unsafe-eval' allow Next.js hydration and React Compiler bootstrap scripts.
 * - Google Fonts and Supabase Storage domains are permitted for styles, fonts, and images.
 * @returns The full Content-Security-Policy header value.
 */
function buildCsp(): string {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseOrigin = supabaseUrl
		? toOrigin(supabaseUrl)
		: "https://*.supabase.co";

	return [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		`img-src 'self' data: blob: ${supabaseOrigin} https://*.supabase.co`,
		"font-src 'self' data: https://fonts.gstatic.com",
		`connect-src ${CONNECT_SRC}`,
		// Contract PDFs render in an <embed> (ContractViewer) — object-src
		// must allow the app's own storage origin + blob: preview URLs.
		// Previously 'none' blocked the embed entirely (gray box).
		`object-src 'self' blob: ${supabaseOrigin} https://*.supabase.co`,
		// Chromium (>=76) runs a SECOND CSP check for PDF <embed> elements via
		// frame-src (falling back to child-src, then default-src) on top of
		// object-src. Without frame-src, a cross-origin storage PDF falls back
		// to default-src 'self' and is blocked — Chrome shows "This content is
		// blocked. Contact the site owner to fix the issue." inside the embed.
		`frame-src 'self' blob: ${supabaseOrigin} https://*.supabase.co`,
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	].join("; ");
}

/**
 * Middleware entry: refreshes the session and sets the CSP header.
 * @param request
 * @returns The result.
 */
export async function proxy(request: NextRequest) {
	const response = await updateSession(request);
	response.headers.set("Content-Security-Policy", buildCsp());
	return response;
}

export const config = {
	matcher: [
		{
			source:
				"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
