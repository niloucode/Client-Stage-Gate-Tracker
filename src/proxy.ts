// noinspection JSUnusedGlobalSymbols

import { NextRequest } from "next/server";
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
 * Build the connect-src allowlist from the environment (called once at
 * module load; the result is captured in CONNECT_SRC below):
 * - 'self' always;
 * - the Supabase project origin derived from NEXT_PUBLIC_SUPABASE_URL
 *   (falls back to the wildcard https://*.supabase.co when unset/invalid);
 * - extra origins from the comma-separated NEXT_PUBLIC_ALLOWED_CONNECT_ORIGINS.
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
		...extraOrigins,
	].join(" ");
}

/**
 * connect-src allowlist, resolved once at server startup (see buildConnectSrc).
 */
const CONNECT_SRC = buildConnectSrc();

/**
 * Per-request Content-Security-Policy.
 * - script-src uses a fresh nonce + 'strict-dynamic' instead of 'unsafe-inline';
 *   in dev, 'unsafe-eval' is required by React's dev-mode error tooling.
 * - style-src keeps 'unsafe-inline': React sets inline style attributes.
 */
function buildCsp(nonce: string): string {
	return [
		"default-src 'self'",
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"font-src 'self' data:",
		`connect-src ${CONNECT_SRC}`,
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	].join("; ");
}

export async function proxy(request: NextRequest) {
	// Fresh nonce per request; forward it via x-nonce so Next.js applies it to
	// its inline bootstrap scripts, and attach the matching CSP to the response.
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);
	const requestWithNonce = new NextRequest(request.url, {
		headers: requestHeaders,
	});

	// update user's auth session
	const response = await updateSession(requestWithNonce);
	response.headers.set("Content-Security-Policy", buildCsp(nonce));
	return response;
}

export const config = {
	matcher: [
		{
			/*
			 * Match all request paths except:
			 * - api routes, _next/static, _next/image, favicon.ico and static assets
			 * - prefetch requests (their cached HTML would carry a stale nonce)
			 */
			source:
				"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
