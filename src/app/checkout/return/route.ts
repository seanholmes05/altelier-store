import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CART_COOKIE } from "@/lib/cart";
import { CHECKOUT_COOKIE } from "@/lib/checkout";
import { SESSION_ID, reconcileBySession } from "@/lib/checkout-reconcile";

// Stripe sends the customer here after paying. Before showing anything we reconcile with Stripe
// server to server (see `reconcileBySession`), so the page is not stuck waiting on webhook
// latency and the URL can never be used to claim a payment.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  if (!SESSION_ID.test(sessionId)) {
    return NextResponse.redirect(new URL("/cart", request.url));
  }

  const status = await reconcileBySession(sessionId);
  if (!status) return NextResponse.redirect(new URL("/cart", request.url));

  const response = NextResponse.redirect(
    new URL(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`, request.url),
  );
  if (status === "paid") {
    // Only a confirmed payment empties the bag.
    response.cookies.delete(CART_COOKIE);
    response.cookies.delete(CHECKOUT_COOKIE);
  }
  return response;
}
