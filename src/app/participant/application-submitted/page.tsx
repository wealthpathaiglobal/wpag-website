import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

export const metadata: Metadata = {
  title: "Application Status",
  description:
    "Neutral status information for the preliminary WPAG participant application process.",
  alternates: {
    canonical: "/participant/application-submitted",
  },
};

type ApplicationSubmittedPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ApplicationSubmittedPage({
  searchParams,
}: ApplicationSubmittedPageProps) {
  // Query-string values are intentionally ignored. A caller-controlled value
  // is not a verified application identity or submission context.
  await searchParams;

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="py-24">
          <Container>
            <div className="max-w-4xl">
              <p className={`mb-6 ${typography.caption}`}>
                Participant Application
              </p>

              <h1 className={typography.display}>
                Application status is not verified on this page.
              </h1>

              <p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>
                A web address or application reference entered into the address
                bar is not proof that an application was submitted or recorded.
              </p>

              <div className="mt-10 border border-zinc-700 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Verification status
                </p>

                <p className="mt-5 text-lg font-semibold text-white">
                  Unverified
                </p>

                <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400">
                  This page does not look up application records and cannot
                  confirm an application, eligibility review, participant
                  account, consent, or enrollment. WPAG will provide governed
                  confirmation through an approved communication process when
                  that process is authorized.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button href="/participant/information">
                  Read Participant Information
                </Button>

                <Button href="/" variant="secondary">
                  Return to Home
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
