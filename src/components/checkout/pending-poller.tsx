"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

const INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 20; // about a minute, then hand control back to the shopper

/**
 * Re-checks a pending order until our server reports a final status, then re-renders the page
 * with it. The check goes through our own status route, which reconciles with Stripe
 * server-side; this component never decides what happened.
 */
export function PendingPoller({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  const gaveUp = attempt >= MAX_ATTEMPTS;

  useEffect(() => {
    if (gaveUp) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = (await res.json()) as { status?: string };
        if (data.status && data.status !== "pending_payment") {
          router.refresh();
          return;
        }
      } catch {
        // Offline or aborted: just try again on the next tick.
      }
      if (!controller.signal.aborted) setAttempt((n) => n + 1);
    }, INTERVAL_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [attempt, gaveUp, router, sessionId]);

  if (gaveUp) {
    return (
      <div className="mt-8">
        <p className="type-body text-muted">
          This is taking longer than usual. If your payment goes through, this order will be
          confirmed automatically.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setAttempt(0)}>
          Check again
        </Button>
      </div>
    );
  }

  return (
    <p role="status" aria-live="polite" className="type-caption mt-8 flex items-center gap-2 text-muted">
      <span aria-hidden className="inline-block size-2 animate-pulse bg-ink" />
      Checking your payment…
    </p>
  );
}
