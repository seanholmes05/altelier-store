"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Button, TextLink } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { validateCurrentPassword, validateEmail } from "@/lib/auth-validation";
import { Field } from "./field";
import { FormError } from "./form-error";
import { useAuthForm } from "./use-auth-form";

const validators = { email: validateEmail, password: validateCurrentPassword };

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const form = useAuthForm(validators);
  const { errors, formError, pending } = form;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    form.setFormError(null);
    if (!form.validateAll(el)) return;

    const data = new FormData(el);
    form.setPending(true);

    let status: number | undefined;
    try {
      const { error } = await authClient.signIn.email({
        email: String(data.get("email")).trim(),
        password: String(data.get("password")),
      });
      if (!error) {
        // Keep the form disabled while the router swaps pages.
        router.push(next);
        router.refresh();
        return;
      }
      status = error.status;
    } catch {
      status = 0;
    }

    form.setPending(false);
    if (status === 429) {
      form.setFormError("Too many attempts. Please wait a moment and try again.");
    } else if (status === 0 || (status !== undefined && status >= 500)) {
      form.setFormError("We couldn't sign you in right now. Check your connection and try again.");
    } else {
      // One message for unknown email and wrong password, so it can't be used to probe accounts.
      form.setFormError("That email and password don't match. Check them and try again.");
      const password = el.elements.namedItem("password") as HTMLInputElement;
      password.value = "";
      password.focus();
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onBlur={form.onBlur}
      onChange={form.onChange}
      noValidate
      aria-busy={pending}
      className="mt-8"
    >
      <fieldset disabled={pending} className="grid gap-6">
        <legend className="sr-only">Sign in</legend>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          required
          error={errors.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <FormError message={formError} />
        <Button type="submit" className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </fieldset>
      <p className="type-caption mt-6 text-muted">
        New to Altelier?{" "}
        <TextLink href={`/sign-up?next=${encodeURIComponent(next)}`}>Create an account</TextLink>
      </p>
    </form>
  );
}
