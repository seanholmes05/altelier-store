import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOrderById } from "@/db/queries/orders";
import { CHECKOUT_COOKIE, isUuid } from "@/lib/checkout";
import { stripeDeps } from "@/lib/stripe-deps";
import { cancelPendingOrder } from "@/lib/stripe-events";

// Stripe's "back" link. Let go of the stock hold now rather than make everyone wait out the
// 30 minutes. Only this browser's own pending order (from its HttpOnly cookie) is touched; if
// Stripe is unreachable the sweeper releases it, so the customer is never blocked.
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/cart?checkout=canceled", request.url));
  const orderId = request.cookies.get(CHECKOUT_COOKIE)?.value;

  if (isUuid(orderId)) {
    try {
      const order = await getOrderById(orderId);
      if (order?.status === "pending_payment") {
        await cancelPendingOrder(
          order.id,
          order.stripeCheckoutSessionId,
          "canceled",
          stripeDeps(() => revalidateTag("products", "max")),
        );
      }
    } catch (e) {
      console.error("Checkout cancel failed", e);
    }
  }
  response.cookies.delete(CHECKOUT_COOKIE);
  return response;
}
