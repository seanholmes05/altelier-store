import { Suspense } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { Container, Section } from "@/components/ui";
import { requireUser } from "@/lib/session";

// The heading and navigation are static and prerender. Only the gate and the pages read the
// session, so they sit behind Suspense. Layouts do not re-render on client navigation, so
// every page and action below must call `requireUser()` too.
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main id="main">
      <Section>
        <Container>
          <h1 className="type-statement">Account</h1>
          <div className="mt-6 md:mt-10 md:grid md:grid-cols-[12rem_minmax(0,1fr)] md:gap-16">
            <AccountNav />
            <div className="mt-8 md:mt-0">
              <Suspense fallback={<p className="type-caption text-muted">Loading…</p>}>
                <AccountGate>{children}</AccountGate>
              </Suspense>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

async function AccountGate({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return children;
}
