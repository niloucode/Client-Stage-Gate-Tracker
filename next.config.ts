import type { NextConfig } from "next";

const securityHeaders = [
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Enforce HTTPS for one year (add `preload` only after confirming HSTS
  // is safe to pin for the domain)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Mitigate XSS. Applied in production only — Next's dev server relies on
  // inline scripts, which a strict script-src would break. Next.js also
  // injects inline bootstrap scripts in production (self.__next_f), which is
  // why script-src needs 'unsafe-inline' here; move to nonce-based CSP if
  // stricter policy is required later. Tune further on reported violations.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
    ].join("; "),
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
