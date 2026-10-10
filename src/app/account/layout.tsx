import { Suspense } from "react";
import { Container } from "@/components/ui";
import { requireUser } from "@/lib/session";

// The gate sits behind Suspense because it reads the session (request data). Layouts do not
// re-render on client navigation, so every page and action below must call `requireUser()` too.
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <Suspense
      fallback={
        <Container className="py-section">
          <p className="type-caption text-muted">Loading…</p>
        </Container>
      }
    >
      <AccountGate>{children}</AccountGate>
    </Suspense>
  );
}

async function AccountGate({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return children;
}
