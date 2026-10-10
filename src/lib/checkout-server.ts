import "server-only";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { attachSession, createReservedOrder, getOrderById, releaseOrder } from "@/db/queries/orders";
import { getCart } from "@/lib/cart-server";
import {
  CHECKOUT_COOKIE,
  CHECKOUT_INTEGRATION_IDENTIFIER,
  SHIPPING_COUNTRIES,
  cartHash,
  holdUntil,
  isUuid,
} from "@/lib/checkout";
import { getVerifiedUser } from "@/lib/session";
import { CheckoutError, getStripe } from "@/lib/stripe";
import { stripeDeps } from "@/lib/stripe-deps";
import { cancelPendingOrder } from "@/lib/stripe-events";

const invalidateProducts = () => updateTag("products");

/** The origin Stripe sends customers back to. Required: never derived from the request. */
function appOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (!origin) {
    console.error("NEXT_PUBLIC_APP_URL is not set; checkout is disabled.");
    throw new CheckoutError("Checkout isn't available right now. Please try again soon.");
  }
  return origin;
}

/**
 * Starts (or resumes) checkout for the current bag and returns the Stripe-hosted URL.
 *
 * Trust: the only input is the cart cookie, which holds slugs and quantities. Prices, names and
 * stock come from the database now; nothing price-like is accepted from the browser.
 *
 * Order of operations is deliberate: reserve stock and create the order FIRST, then create the
 * Stripe session. A session with no order behind it would be payable but unfulfillable; an order
 * with no session is just a hold that the sweeper releases.
 */
export async function createCheckoutUrl(): Promise<string> {
  const stripe = getStripe();
  const origin = appOrigin();

  const cart = await getCart();
  if (cart.lines.length === 0) throw new CheckoutError("Your bag is empty.");

  const lines = cart.lines.map((l) => ({
    productId: l.productId,
    slug: l.slug,
    name: l.name,
    unitPriceCents: l.priceCents,
    quantity: l.quantity,
    image: l.image.src,
  }));
  const hash = cartHash(lines);

  const store = await cookies();
  const previousId = store.get(CHECKOUT_COOKIE)?.value;
  if (isUuid(previousId)) {
    const previous = await getOrderById(previousId);
    if (previous?.status === "pending_payment") {
      // Same bag, session still open: resume it instead of holding the stock twice.
      if (previous.cartHash === hash && previous.stripeCheckoutSessionId) {
        const open = await stripe.checkout.sessions.retrieve(previous.stripeCheckoutSessionId);
        if (open.status === "open" && open.url) return open.url;
      }
      // The bag changed (or the session is gone): let go of the old hold first.
      await cancelPendingOrder(
        previous.id,
        previous.stripeCheckoutSessionId,
        "canceled",
        stripeDeps(invalidateProducts),
      );
    }
  }

  const user = await getVerifiedUser();
  const reservedUntil = holdUntil();
  const reserved = await createReservedOrder({
    userId: user?.id ?? null,
    lines,
    cartHash: hash,
    reservedUntil,
  });
  if (!reserved.ok) {
    invalidateProducts();
    throw new CheckoutError(
      "Some pieces just sold out or are low on stock. Please review your bag and try again.",
    );
  }
  invalidateProducts();
  const orderId = reserved.orderId;

  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: orderId,
        metadata: { order_id: orderId },
        payment_intent_data: { metadata: { order_id: orderId } },
        line_items: lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "usd",
            unit_amount: l.unitPriceCents,
            product_data: { name: l.name, images: [l.image], metadata: { slug: l.slug } },
          },
        })),
        shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
        ...(user ? { customer_email: user.email } : {}),
        expires_at: Math.floor(reservedUntil.getTime() / 1000),
        success_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
        integration_identifier: CHECKOUT_INTEGRATION_IDENTIFIER,
      },
      { idempotencyKey: `checkout-session-${orderId}` },
    );
  } catch (e) {
    // No session means nothing can be paid: give the stock straight back.
    if (await releaseOrder(orderId, "canceled")) invalidateProducts();
    console.error("Stripe checkout session creation failed", e);
    throw new CheckoutError("We couldn't start checkout. Please try again in a moment.");
  }
  if (!session.url) {
    if (await releaseOrder(orderId, "canceled")) invalidateProducts();
    throw new CheckoutError("We couldn't start checkout. Please try again in a moment.");
  }

  await attachSession(orderId, session.id);
  store.set(CHECKOUT_COOKIE, orderId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  return session.url;
}
