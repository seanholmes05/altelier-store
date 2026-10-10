import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Container, Section } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { getVerifiedUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in | Altelier",
  robots: { index: false },
};

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main id="main">
      <Section>
        <Container prose>
          <h1 className="type-statement">Sign in</h1>
          <Suspense fallback={null}>
            <SignIn searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
    </main>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const next = safeNext((await searchParams).next);
  // Done here rather than in the proxy: a stale cookie would otherwise loop between the two.
  if (await getVerifiedUser()) redirect(next);
  return <SignInForm next={next} />;
}
