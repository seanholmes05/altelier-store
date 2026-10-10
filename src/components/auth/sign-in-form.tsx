"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, TextLink } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { Field } from "./field";

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setPending(true);

    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (error) {
      setPending(false);
      // One message for unknown email and wrong password, so it can't be used to probe accounts.
      setError(
        error.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : "Email or password is incorrect.",
      );
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-6">
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {error ? (
        <p role="alert" className="type-caption border-l border-ink pl-3 text-ink">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="type-caption text-muted">
        New to Altelier?{" "}
        <TextLink href={`/sign-up?next=${encodeURIComponent(next)}`}>Create an account</TextLink>
      </p>
    </form>
  );
}
