/** Form-level error. Always rendered so the live region exists before the message arrives. */
export function FormError({ message }: { message: string | null }) {
  return (
    <div role="alert" aria-live="assertive">
      {message ? (
        <p className="type-caption border-l border-danger pl-3 text-danger">{message}</p>
      ) : null}
    </div>
  );
}
