import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPublicParticipationReleaseOpen } from "@/lib/governance/public-participation-release-gate";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Participant Portal",
  description:
    "Access the Wealth Path AI Global participant research and evidence collection portal.",
  alternates: {
    canonical: "/participant",
  },
};

export default function ParticipantPage() {
  const releaseOpen = isPublicParticipationReleaseOpen();

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
                {releaseOpen
                  ? "Participate in structured financial stability research."
                  : "Research participation is not currently open."}
              </h1>

              <p className={`mt-8 max-w-2xl ${typography.bodyLarge}`}>
                {releaseOpen
                  ? "This portal supports participant onboarding, informed consent, structured assessment, evidence submission, and longitudinal research participation."
                  : "You may read about WPAG research and the future participation process. Eligibility screening and participant applications remain unavailable while the research release gate is closed."}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                {releaseOpen ? (
                  <Button href="/participant/information">
                    Begin Participation
                  </Button>
                ) : (
                  <Button href="/participant/information">
                    Read Participation Information
                  </Button>
                )}

                <Button href="/research" variant="secondary">
                  Learn About the Research
                </Button>

                <Button href="/auth/login" variant="secondary">
                  Invited Participant Sign In
                </Button>
              </div>

              <p className="mt-8 max-w-2xl text-sm leading-6 text-zinc-500">
                Participation is voluntary. Research information, consent
                requirements, privacy terms, and eligibility conditions will be
                presented before any participant data is collected.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
                Participant sign-in is invitation-only. It does not provide
                self-registration, create an application, or authorize
                enrollment.
              </p>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
