import { Suspense } from "react";
import { Container } from "@/components/ui";
import { requireAdmin } from "@/lib/session";

// Same shape as the account layout. Every admin page, Server Action and route handler must
// also call `requireAdmin()` itself; this gate does not run on client navigation.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <Container className="py-section">
          <p className="type-caption text-muted">Loading…</p>
        </Container>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");
  return children;
}
