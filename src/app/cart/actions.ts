"use server";

import { cookies } from "next/headers";
import { getLiveProducts } from "@/db/queries/cart";
import {
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  CART_MAX_LINES,
  isValidSlug,
  maxQuantityFor,
  parseCart,
  serializeCart,
} from "@/lib/cart";
import type { CartEntry } from "@/lib/cart";

// Every action re-reads the cookie and re-checks price-relevant facts against the database.
// Arguments are untrusted input: only a slug and a quantity are accepted, and nothing the
// client sends is ever used as a price or a stock level. Setting the cookie re-renders the
// current page, so the UI reflects the new cart without an explicit refresh.

export type CartActionResult =
  | { ok: true; quantity: number; message?: string }
  | { ok: false; message: string };

const GONE = "This piece is no longer available.";

async function load() {
  const store = await cookies();
  return { store, entries: parseCart(store.get(CART_COOKIE)?.value) };
}

type Store = Awaited<ReturnType<typeof cookies>>;

function save(store: Store, entries: CartEntry[]) {
  if (entries.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, serializeCart(entries), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

function without(entries: CartEntry[], slug: string) {
  return entries.filter((e) => e.slug !== slug);
}

/** Adds `quantity` (default 1) of a product, never exceeding live stock. */
export async function addToCart(slug: string, quantity = 1): Promise<CartActionResult> {
  if (!isValidSlug(slug) || !Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, message: "We couldn't add that to your bag." };
  }

  const product = (await getLiveProducts([slug])).get(slug);
  if (!product) return { ok: false, message: GONE };
  const limit = maxQuantityFor(product.stock);
  if (limit === 0) return { ok: false, message: "This piece is out of stock." };

  const { store, entries } = await load();
  const current = entries.find((e) => e.slug === slug)?.quantity ?? 0;

  if (current === 0 && entries.length >= CART_MAX_LINES) {
    return { ok: false, message: "Your bag is full. Remove a piece to add another." };
  }
  if (current >= limit) {
    return {
      ok: false,
      message:
        limit < product.stock
          ? `You can have at most ${limit} of one piece in your bag.`
          : `You already have all ${limit} available in your bag.`,
    };
  }

  const next = Math.min(current + quantity, limit);
  save(
    store,
    current === 0
      ? [...entries, { slug, quantity: next }]
      : entries.map((e) => (e.slug === slug ? { slug, quantity: next } : e)),
  );

  return {
    ok: true,
    quantity: next,
    message: current + quantity > limit ? `Only ${limit} available, so we added what we could.` : undefined,
  };
}

/** Sets a line's quantity (0 removes it), clamped to live stock. */
export async function setCartQuantity(slug: string, quantity: number): Promise<CartActionResult> {
  if (!isValidSlug(slug) || !Number.isInteger(quantity) || quantity < 0) {
    return { ok: false, message: "We couldn't update your bag." };
  }

  const { store, entries } = await load();
  if (!entries.some((e) => e.slug === slug)) {
    return { ok: false, message: "That piece isn't in your bag." };
  }
  if (quantity === 0) {
    save(store, without(entries, slug));
    return { ok: true, quantity: 0 };
  }

  const product = (await getLiveProducts([slug])).get(slug);
  const limit = product ? maxQuantityFor(product.stock) : 0;
  if (limit === 0) {
    save(store, without(entries, slug));
    return { ok: false, message: GONE };
  }

  const next = Math.min(quantity, limit);
  save(
    store,
    entries.map((e) => (e.slug === slug ? { slug, quantity: next } : e)),
  );
  return {
    ok: true,
    quantity: next,
    message: quantity > limit ? `Only ${limit} available.` : undefined,
  };
}

export async function removeFromCart(slug: string): Promise<CartActionResult> {
  if (!isValidSlug(slug)) return { ok: false, message: "We couldn't update your bag." };
  const { store, entries } = await load();
  save(store, without(entries, slug));
  return { ok: true, quantity: 0 };
}
