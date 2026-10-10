import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin | Altelier",
  robots: { index: false },
};

export default async function AdminPage() {
  const user = await requireAdmin("/admin");

  return (
    <main id="main">
      <Section>
        <Container prose>
          <h1 className="type-statement">Admin</h1>
          <p className="type-body mt-4 text-muted">Signed in as {user.email}.</p>
        </Container>
      </Section>
    </main>
  );
}
