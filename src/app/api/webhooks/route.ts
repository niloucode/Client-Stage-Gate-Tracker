import { NextResponse } from "next/server";

/**
 * Webhook endpoint — STUB.
 *
 * Do NOT wire a real provider (Stripe, Supabase, etc.) into this route
 * without, in the SAME change:
 *   1. Verifying the provider's request signature (e.g. `Stripe-Signature` /
 *      webhook secret) BEFORE reading the body, and
 *   2. Parsing and validating the JSON payload (size limit, schema check).
 *
 * This route currently accepts anything; it must not perform any
 * unauthenticated side effects until signature verification lands.
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
