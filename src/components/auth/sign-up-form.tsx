"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, TextLink } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { Field } from "./field";

// Mirrors `emailAndPassword.minPasswordLength` / `maxPasswordLength` in `src/lib/auth.ts`.
// The server enforces them; these only give faster feedback.
const MIN_PASSWORD = 10;
const MAX_PASSWORD = 128;

export function SignUpForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setPending(true);

    const { error } = await authClient.signUp.email({
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (error) {
      setPending(false);
      if (error.status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (error.code?.includes("EXISTS")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else {
        setError(error.message || "We couldn't create your account. Please try again.");
      }
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-6">
      <Field label="Name" name="name" autoComplete="name" required />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        maxLength={MAX_PASSWORD}
        hint={`At least ${MIN_PASSWORD} characters.`}
        required
      />
      {error ? (
        <p role="alert" className="type-caption border-l border-ink pl-3 text-ink">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="type-caption text-muted">
        Already have an account?{" "}
        <TextLink href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</TextLink>
      </p>
    </form>
  );
}
