import { revalidateTag } from "next/cache";
import { getStripe } from "@/lib/stripe";
import { stripeDeps } from "@/lib/stripe-deps";
import { handleStripeEvent } from "@/lib/stripe-events";

// The only place payment status is accepted. Everything else (success page, query strings,
// cart cookie) is display. Fails closed: no secret configured means nothing is processed.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set; refusing webhook.");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // The raw body is required for signature verification: do not parse it first.
  const payload = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await handleStripeEvent(
      event,
      stripeDeps(() => revalidateTag("products", "max")),
    );
  } catch (e) {
    // Non-2xx makes Stripe retry (for up to 3 days in live mode). The event ledger records the
    // failure and lets the retry through.
    console.error("Stripe webhook processing failed", event.id, event.type, e);
    return new Response("Processing failed", { status: 500 });
  }
  return Response.json({ received: true });
}
