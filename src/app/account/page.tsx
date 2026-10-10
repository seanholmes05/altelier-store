import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Container, Section, TextLink } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Account | Altelier",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await requireUser("/account");

  return (
    <main id="main">
      <Section>
        <Container prose>
          <h1 className="type-statement">Account</h1>
          <dl className="mt-8 grid gap-6">
            <div>
              <dt className="type-label">Name</dt>
              <dd className="type-body mt-2">{user.name}</dd>
            </div>
            <div>
              <dt className="type-label">Email</dt>
              <dd className="type-body mt-2">{user.email}</dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <SignOutButton />
            {user.role === "admin" ? <TextLink href="/admin">Admin</TextLink> : null}
          </div>
        </Container>
      </Section>
    </main>
  );
}
