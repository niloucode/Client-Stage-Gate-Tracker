// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const isDev = process.env.NODE_ENV === "development";

/** Normalize a URL to its origin; returns null for invalid input. */
function toOrigin(value: string): string | null {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

/**
 * Build the connect-src allowlist from the environment.
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
 */
function buildCsp(): string {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseOrigin = supabaseUrl ? toOrigin(supabaseUrl) : "https://*.supabase.co";

	return [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		`img-src 'self' data: blob: ${supabaseOrigin} https://*.supabase.co`,
		"font-src 'self' data: https://fonts.gstatic.com",
		`connect-src ${CONNECT_SRC}`,
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	].join("; ");
}

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