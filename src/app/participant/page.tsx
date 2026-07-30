import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

export const metadata: Metadata = {
  title: "Participant Portal",
  description:
    "Access the Wealth Path AI Global participant research and evidence collection portal.",
  alternates: {
    canonical: "/participant",
  },
};

export default function ParticipantPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="flex min-h-[75vh] items-center py-24">
          <Container>
            <div className="max-w-3xl">
              <p className={`mb-6 ${typography.caption}`}>
                WPAG Participant Portal
              </p>

              <h1 className={typography.display}>
                Participate in structured financial stability research.
              </h1>

              <p className={`mt-8 max-w-2xl ${typography.bodyLarge}`}>
                This portal supports participant onboarding, informed consent,
                structured assessment, evidence submission, and longitudinal
                research participation.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button href="/participant/consent">
                  Begin Participation
                </Button>

                <Button href="/research" variant="secondary">
                  Learn About the Research
                </Button>
              </div>

              <p className="mt-8 max-w-2xl text-sm leading-6 text-zinc-500">
                Participation is voluntary. Research information, consent
                requirements, privacy terms, and eligibility conditions will be
                presented before any participant data is collected.
              </p>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}