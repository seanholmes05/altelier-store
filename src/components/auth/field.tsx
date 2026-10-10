"use client";

import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  /** Replaces the hint and marks the input invalid. May include a link. */
  error?: ReactNode;
};

/**
 * Labelled text input in the design system's square, hairline style. Password fields get a
 * Show/Hide toggle. The error is announced via `aria-describedby` and `aria-invalid`.
 */
export function Field({ label, hint, error, id, type, className, ...props }: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  const inputId = id ?? props.name;
  const messageId = `${inputId}-message`;
  const isPassword = type === "password";
  const message = error ?? hint;

  return (
    <div>
      <label htmlFor={inputId} className="type-label block">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={inputId}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(
            "type-body h-control w-full border bg-paper px-4 text-ink disabled:opacity-40",
            error ? "border-danger" : "border-line focus:border-ink",
            isPassword && "pr-20",
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            disabled={props.disabled}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="type-label absolute inset-y-0 right-0 px-4 disabled:opacity-40"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      {message ? (
        <p
          id={messageId}
          className={cn("type-caption mt-2", error ? "text-danger" : "text-muted")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
