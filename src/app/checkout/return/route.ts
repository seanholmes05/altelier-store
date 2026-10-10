import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOrderBySessionId } from "@/db/queries/orders";
import { CART_COOKIE } from "@/lib/cart";
import { CHECKOUT_COOKIE } from "@/lib/checkout";
import { stripeDeps } from "@/lib/stripe-deps";
import { applySession } from "@/lib/stripe-events";

// Stripe sends the customer here after paying. The `session_id` is only a lookup key: before
// anything is shown we ask Stripe (server to server) where that session is and apply it through
// the same idempotent path as the webhook, so the page is not stuck waiting on webhook latency
// and the URL can never be used to claim a payment.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]{10,}$/.test(sessionId)) {
    return NextResponse.redirect(new URL("/cart", request.url));
  }

  let order = await getOrderBySessionId(sessionId);
  if (!order) return NextResponse.redirect(new URL("/cart", request.url));

  if (order.status === "pending_payment") {
    try {
      const deps = stripeDeps(() => revalidateTag("products", "max"));
      await applySession(await deps.retrieveSession(sessionId), deps);
      order = (await getOrderBySessionId(sessionId)) ?? order;
    } catch (e) {
      // The webhook or the sweeper will still settle it; the page shows "confirming".
      console.error("Checkout return reconcile failed", e);
    }
  }

  const response = NextResponse.redirect(
    new URL(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`, request.url),
  );
  if (order.status === "paid") {
    // Only a confirmed payment empties the bag.
    response.cookies.delete(CART_COOKIE);
    response.cookies.delete(CHECKOUT_COOKIE);
  }
  return response;
}
