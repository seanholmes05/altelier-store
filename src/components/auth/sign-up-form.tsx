"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Button, TextLink } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import {
  NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  validateEmail,
  validateName,
  validateNewPassword,
} from "@/lib/auth-validation";
import { Field } from "./field";
import { FormError } from "./form-error";
import { useAuthForm } from "./use-auth-form";

const validators = {
  name: validateName,
  email: validateEmail,
  password: validateNewPassword,
};

export function SignUpForm({ next }: { next: string }) {
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
    let code = "";
    try {
      const { error } = await authClient.signUp.email({
        name: String(data.get("name")).trim(),
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
      code = error.code ?? "";
    } catch {
      status = 0;
    }

    form.setPending(false);
    const focus = (name: keyof typeof validators) =>
      (el.elements.namedItem(name) as HTMLInputElement | null)?.focus();

    if (status === 429) {
      form.setFormError("Too many attempts. Please wait a moment and try again.");
    } else if (status === 0 || (status !== undefined && status >= 500)) {
      form.setFormError("We couldn't create your account right now. Check your connection and try again.");
    } else if (code.includes("EXISTS")) {
      form.setFieldError("email", "An account with this email already exists. Try signing in instead.");
      focus("email");
    } else if (code.includes("PASSWORD")) {
      form.setFieldError("password", `Use ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`);
      focus("password");
    } else if (code.includes("EMAIL")) {
      form.setFieldError("email", "Enter a valid email address, like name@example.com.");
      focus("email");
    } else {
      form.setFormError("We couldn't create your account. Please check your details and try again.");
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
        <legend className="sr-only">Create account</legend>
        <Field
          label="Name"
          name="name"
          autoComplete="name"
          maxLength={NAME_MAX}
          required
          error={errors.name}
        />
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
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          hint={`At least ${PASSWORD_MIN} characters.`}
          required
          error={errors.password}
        />
        <FormError message={formError} />
        <Button type="submit" className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </fieldset>
      <p className="type-caption mt-6 text-muted">
        Already have an account?{" "}
        <TextLink href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</TextLink>
      </p>
    </form>
  );
}
