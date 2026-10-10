import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Container, Section } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { getVerifiedUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create account | Altelier",
  robots: { index: false },
};

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <main id="main">
      <Section>
        <Container prose>
          <h1 className="type-statement">Create account</h1>
          <Suspense fallback={null}>
            <SignUp searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
    </main>
  );
}

async function SignUp({ searchParams }: Pick<PageProps<"/sign-up">, "searchParams">) {
  const next = safeNext((await searchParams).next);
  if (await getVerifiedUser()) redirect(next);
  return <SignUpForm next={next} />;
}
