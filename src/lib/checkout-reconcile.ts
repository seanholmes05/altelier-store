import "server-only";
import { revalidateTag } from "next/cache";
import { getOrderBySessionId } from "@/db/queries/orders";
import type { OrderStatus } from "@/db/schema";
import { stripeDeps } from "@/lib/stripe-deps";
import { applySession } from "@/lib/stripe-events";

export const SESSION_ID = /^cs_[A-Za-z0-9_]{10,}$/;

/**
 * Looks an order up by its Stripe session id and, if it is still pending, asks Stripe where the
 * session is and applies that through the same idempotent path as the webhook. The id is only
 * a lookup key: nothing is trusted from the caller, so it can never be used to claim a payment.
 * Returns the order's status afterwards, or `null` when we have no such order.
 */
export async function reconcileBySession(sessionId: string): Promise<OrderStatus | null> {
  if (!SESSION_ID.test(sessionId)) return null;
  const order = await getOrderBySessionId(sessionId);
  if (!order) return null;
  if (order.status !== "pending_payment") return order.status;

  try {
    const deps = stripeDeps(() => revalidateTag("products", "max"));
    await applySession(await deps.retrieveSession(sessionId), deps);
    return (await getOrderBySessionId(sessionId))?.status ?? order.status;
  } catch (e) {
    // Stripe unreachable or not configured: the webhook or sweeper will still settle it.
    console.error("Checkout reconcile failed", e);
    return order.status;
  }
}
