import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CART_COOKIE } from "@/lib/cart";
import { CHECKOUT_COOKIE } from "@/lib/checkout";
import { reconcileBySession } from "@/lib/checkout-reconcile";

// Polled by the "confirming your payment" state. Reconciles with Stripe and reports OUR order's
// status; it reveals nothing beyond that and changes nothing a client could influence.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  const status = await reconcileBySession(sessionId);
  if (!status) {
    return NextResponse.json({ status: "not_found" }, { status: 404, headers: noStore });
  }

  const response = NextResponse.json({ status }, { headers: noStore });
  if (status === "paid") {
    response.cookies.delete(CART_COOKIE);
    response.cookies.delete(CHECKOUT_COOKIE);
  }
  return response;
}

const noStore = { "cache-control": "no-store" };
