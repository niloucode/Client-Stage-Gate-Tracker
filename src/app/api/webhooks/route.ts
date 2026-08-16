import { NextResponse, type NextRequest } from "next/server";

/**
 * Webhook endpoint — STUB.
 *
 * Do NOT wire a real provider (Stripe, Supabase, etc.) into this route
 * without, in the SAME change:
 *   1. Verifying the provider's request signature BEFORE reading the body.
 *      - Stripe: `Stripe-Signature` header + `stripe.webhooks.constructEvent`
 *        with the webhook secret; reject with 400 on signature mismatch.
 *      - Supabase: `x-supabase-signature` HMAC-SHA256 over the raw body
 *        using the webhook secret; constant-time compare
 *        (`crypto.timingSafeEqual`), reject 401 on mismatch.
 *      - Any other provider: their documented scheme, same rules —
 *        constant-time comparison, fail closed.
 *   2. Parsing and validating the JSON payload — enforce a body size limit
 *      (e.g. 1 MB) and a Zod schema for the event shape before acting.
 *   3. Handling events idempotently (store processed event IDs) so retries
 *      can't double-apply side effects.
 *
 * This route currently accepts anything and performs no side effects; it
 * must not gain unauthenticated behavior until signature verification
 * lands in the same commit.
 *
 * Reference implementation shape (Stripe):
 *
 *   const sig = request.headers.get("stripe-signature");
 *   if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });
 *   const rawBody = await request.text(); // verify BEFORE parsing
 *   let event: Stripe.Event;
 *   try {
 *     event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
 *   } catch {
 *     return NextResponse.json({ error: "invalid signature" }, { status: 400 });
 *   }
 *   // ... handle event.idempotently
 */
export async function POST(_request: NextRequest) {
	return NextResponse.json({ ok: true });
}
