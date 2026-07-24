import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

export const metadata: Metadata = {
  title: "Application Next Steps",
  description:
    "Review the next steps following completion of the preliminary WPAG participant application form.",
  alternates: {
    canonical: "/participant/application-submitted",
  },
};

const nextSteps = [
  {
    number: "01",
    title: "Application submission",
    description:
      "A production submission will securely record the application, generate a unique reference identifier, and create an immutable audit event.",
  },
  {
    number: "02",
    title: "Programme and eligibility review",
    description:
      "The application may be reviewed against programme-specific, jurisdictional, safeguarding, research, and governance requirements.",
  },
  {
    number: "03",
    title: "Contact verification",
    description:
      "The applicant may be asked to verify an email address or another approved communication channel before proceeding.",
  },
  {
    number: "04",
    title: "Identity and consent requirements",
    description:
      "Where required, identity verification and formal informed consent must be completed before enrollment or research data collection.",
  },
  {
    number: "05",
    title: "Participant access",
    description:
      "Approved applicants may receive controlled access to the participant portal, profile, assessments, evidence workflows, and follow-up activities.",
  },
];

export default function ApplicationSubmittedPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="py-24">
          <Container>
            <div className="max-w-4xl">
              <p className={`mb-6 ${typography.caption}`}>
                Participant Journey · Step 4
              </p>

              <h1 className={typography.display}>
                Preliminary application completed.
              </h1>

              <p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>
                The application form has passed the current prototype
                validation and the participant journey may continue to the
                verification and review stages.
              </p>

              <div className="mt-10 border border-zinc-800 p-6">
                <p className="text-sm leading-6 text-zinc-400">
                  This development version does not yet transmit, store, or
                  register application data. A submission reference and formal
                  receipt will be generated only after the approved database,
                  authentication, privacy, security, and audit systems are
                  connected.
                </p>
              </div>

              <div className="mt-16">
                <p className={`mb-6 ${typography.caption}`}>Next steps</p>

                <div className="divide-y divide-zinc-800 border-y border-zinc-800">
                  {nextSteps.map((step) => (
                    <article
                      key={step.number}
                      className="grid gap-5 py-8 md:grid-cols-[80px_240px_1fr]"
                    >
                      <p className="text-sm font-semibold tracking-[0.2em] text-zinc-500">
                        {step.number}
                      </p>

                      <h2 className="text-lg font-semibold text-white">
                        {step.title}
                      </h2>

                      <p className="max-w-2xl text-base leading-7 text-zinc-400">
                        {step.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-12 border border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-white">
                  Current prototype status
                </h2>

                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-zinc-500">Application status</dt>
                    <dd className="mt-2 font-semibold text-white">
                      Not stored
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-zinc-500">
                      Reference identifier
                    </dt>
                    <dd className="mt-2 font-semibold text-white">
                      Generated after backend integration
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-zinc-500">Enrollment status</dt>
                    <dd className="mt-2 font-semibold text-white">
                      Not confirmed
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-zinc-500">Next prototype step</dt>
                    <dd className="mt-2 font-semibold text-white">
                      Contact verification
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button href="/participant/verify-contact">
                  Continue to Verification
                </Button>

                <Button href="/participant" variant="secondary">
                  Return to Participant Portal
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