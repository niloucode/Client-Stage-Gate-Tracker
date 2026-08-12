import type { NextConfig } from "next";

/**
 * Static security headers. The Content-Security-Policy is deliberately NOT
 * here: it is emitted per-request from src/proxy.ts with a fresh nonce
 * (script-src 'nonce-…' 'strict-dynamic') so inline scripts can be allowed
 * without 'unsafe-inline'.
 */
type SecurityHeader = { key: string; value: string };

const securityHeaders: SecurityHeader[] = [
	// Block clickjacking
	{ key: "X-Frame-Options", value: "DENY" },
	// Prevent MIME-type sniffing
	{ key: "X-Content-Type-Options", value: "nosniff" },
	// Enforce HTTPS for one year (add `preload` only after confirming HSTS
	// is safe to pin for the domain)
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains",
	},
	// Only send the origin on cross-origin requests
	{ key: "Referrer-Policy", value: "origin-when-cross-origin" },
];

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
	async headers() {
		if (!isProd) return [];
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;
