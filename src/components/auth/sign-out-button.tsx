"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

/**
 * `button` is the standalone control; `link` is a plain text button for use as a navigation
 * item, styled by the caller through `className`.
 */
export function SignOutButton({
  variant = "button",
  className,
}: {
  variant?: "button" | "link";
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const label = pending ? "Signing out…" : "Sign out";

  if (variant === "link") {
    return (
      <button type="button" onClick={onClick} disabled={pending} className={className}>
        {label}
      </button>
    );
  }
  return (
    <Button variant="secondary" onClick={onClick} disabled={pending}>
      {label}
    </Button>
  );
}
