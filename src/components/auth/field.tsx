import type { ComponentProps } from "react";

type FieldProps = ComponentProps<"input"> & { label: string; hint?: string };

/** Labelled text input in the design system's square, hairline style. */
export function Field({ label, hint, id, ...props }: FieldProps) {
  const inputId = id ?? props.name;
  return (
    <div>
      <label htmlFor={inputId} className="type-label block">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className="type-body mt-2 h-control w-full border border-line bg-paper px-4 text-ink focus:border-ink"
        {...props}
      />
      {hint ? (
        <p id={`${inputId}-hint`} className="type-caption mt-2 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
