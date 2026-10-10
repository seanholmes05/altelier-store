import "server-only";
import { getStripe } from "@/lib/stripe";
import type { StripeDeps } from "@/lib/stripe-events";

/**
 * The real Stripe side effects for `stripe-events.ts`. `invalidate` differs by caller: Server
 * Actions use `updateTag`, route handlers use `revalidateTag(tag, "max")`.
 */
export function stripeDeps(invalidate: () => void): StripeDeps {
  return {
    retrieveSession: (id) => getStripe().checkout.sessions.retrieve(id),
    expireSession: async (id) => {
      await getStripe().checkout.sessions.expire(id);
    },
    refundPaymentIntent: async (paymentIntentId, orderId) => {
      await getStripe().refunds.create(
        { payment_intent: paymentIntentId, metadata: { order_id: orderId } },
        { idempotencyKey: `refund-${orderId}` },
      );
    },
    invalidateProducts: invalidate,
  };
}
