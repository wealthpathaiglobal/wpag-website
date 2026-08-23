import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

export function PublicParticipationUnavailable({
  step,
  children,
}: {
  step: "eligibility" | "application";
  children?: ReactNode;
}) {
  const stepLabel =
    step === "eligibility" ? "Eligibility screening" : "Participant application";

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="py-24">
          <Container>
            <div className="max-w-3xl">
              <p className={`mb-6 ${typography.caption}`}>{stepLabel}</p>

              <h1 className={typography.display}>
                Research participation is not currently open.
              </h1>

              <p className={`mt-8 max-w-2xl ${typography.bodyLarge}`}>
                Eligibility screening and participant applications are not
                available while the WPAG research release gate remains closed.
                No application can be submitted from this page.
              </p>

              {children}

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button href="/participant/information">
                  Read Participation Information
                </Button>

                <Button href="/auth/login" variant="secondary">
                  Invited Participant Sign In
                </Button>
              </div>

              <p className="mt-8 max-w-2xl text-sm leading-6 text-zinc-500">
                Participant sign-in is invitation-only. This page does not
                create an account, record consent, or enroll anyone in research.
              </p>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
