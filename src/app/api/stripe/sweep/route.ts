import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { stripeDeps } from "@/lib/stripe-deps";
import { sweepStaleOrders } from "@/lib/stripe-events";

// Backstop for lost webhooks and crashed requests: reconciles pending orders whose hold has
// ended against Stripe, then releases or confirms them. Call it on a schedule (every few
// minutes) with `Authorization: Bearer $CRON_SECRET`. Disabled until CRON_SECRET is set.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return new Response("Sweeper not configured", { status: 500 });

  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const summary = await sweepStaleOrders(stripeDeps(() => revalidateTag("products", "max")));
  return Response.json(summary);
}
