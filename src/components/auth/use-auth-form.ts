"use client";

import { useState } from "react";
import type { FocusEvent, FormEvent } from "react";
import type { Validator } from "@/lib/auth-validation";

type Errors<K extends string> = Partial<Record<K, string>>;

/**
 * Shared state for the sign-in and sign-up forms: per-field errors, a form-level error,
 * and a pending flag. Fields validate on blur (only once they have a value, so tabbing
 * past an empty field is not scolded), re-validate on change while showing an error, and
 * everything validates on submit, moving focus to the first invalid field.
 */
export function useAuthForm<K extends string>(validators: Record<K, Validator>) {
  const [errors, setErrors] = useState<Errors<K>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const names = Object.keys(validators) as K[];

  function setFieldError(name: K, message: string | null) {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  function isField(name: string): name is K {
    return name in validators;
  }

  function onBlur(e: FocusEvent<HTMLFormElement>) {
    // Blur bubbles from the focused input to the form, so the target is the input.
    const { name, value } = e.target as unknown as HTMLInputElement;
    if (isField(name) && value) setFieldError(name, validators[name](value));
  }

  function onChange(e: FormEvent<HTMLFormElement>) {
    const { name, value } = e.target as HTMLInputElement;
    setFormError(null);
    if (isField(name) && errors[name]) setFieldError(name, validators[name](value));
  }

  /** Validates every field. Returns false and focuses the first invalid one if any fail. */
  function validateAll(form: HTMLFormElement): boolean {
    const next: Errors<K> = {};
    let firstInvalid: K | null = null;
    for (const name of names) {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      const message = validators[name](el?.value ?? "");
      if (message) {
        next[name] = message;
        firstInvalid ??= name;
      }
    }
    setErrors(next);
    if (firstInvalid) {
      (form.elements.namedItem(firstInvalid) as HTMLInputElement | null)?.focus();
      return false;
    }
    return true;
  }

  return {
    errors,
    formError,
    pending,
    setFormError,
    setPending,
    setFieldError,
    onBlur,
    onChange,
    validateAll,
  };
}
