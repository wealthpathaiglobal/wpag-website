import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

export const metadata: Metadata = {
  title: "Application Submitted",
  description:
    "Confirmation and next steps following submission of a preliminary WPAG participant application.",
  alternates: {
    canonical: "/participant/application-submitted",
  },
};

const nextSteps = [
  {
    number: "01",
    title: "Application recorded",
    description:
      "Your preliminary application has been securely recorded and assigned a unique application reference.",
  },
  {
    number: "02",
    title: "Programme and eligibility review",
    description:
      "The application will be reviewed against programme-specific, jurisdictional, safeguarding, research, and governance requirements.",
  },
  {
    number: "03",
    title: "Additional information",
    description:
      "WPAG may contact you if clarification, supporting information, or another approved communication method is required.",
  },
  {
    number: "04",
    title: "Identity and consent requirements",
    description:
      "Where applicable, identity verification and formal informed consent must be completed before enrollment or research data collection.",
  },
  {
    number: "05",
    title: "Participant access",
    description:
      "Applicants who successfully complete the review process may receive controlled access to participant onboarding and approved programme activities.",
  },
];

type ApplicationSubmittedPageProps = {
  searchParams: Promise<{
    code?: string | string[];
  }>;
};

function resolveApplicationCode(
  code: string | string[] | undefined,
): string | null {
  const value = Array.isArray(code) ? code[0] : code;

  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

export default async function ApplicationSubmittedPage({
  searchParams,
}: ApplicationSubmittedPageProps) {
  const params = await searchParams;
  const applicationCode = resolveApplicationCode(params.code);

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
                Preliminary application submitted.
              </h1>

              <p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>
                Your application has been received and entered into the Wealth
                Path AI Global preliminary review process.
              </p>

              <div className="mt-10 border border-zinc-800 p-6">
                <p className="text-sm leading-6 text-zinc-400">
                  Submission of an application does not confirm eligibility,
                  create a participant account, record formal informed consent,
                  or guarantee enrollment. The application remains subject to
                  programme, jurisdictional, identity, privacy, safeguarding,
                  and governance review.
                </p>
              </div>

              <div className="mt-12 border border-zinc-700 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Application reference
                </p>

                {applicationCode ? (
                  <>
                    <p className="mt-5 break-all font-mono text-2xl font-semibold tracking-wide text-white sm:text-3xl">
                      {applicationCode}
                    </p>

                    <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400">
                      Retain this reference and include it in future
                      correspondence concerning your application.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-5 text-lg font-semibold text-white">
                      Reference unavailable
                    </p>

                    <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400">
                      No application reference was provided in this page
                      request. Return to the application form if you have not
                      completed a submission.
                    </p>
                  </>
                )}
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
                  Current application status
                </h2>

                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-zinc-500">
                      Application status
                    </dt>
                    <dd className="mt-2 font-semibold text-white">
                      Submitted
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-zinc-500">
                      Reference identifier
                    </dt>
                    <dd className="mt-2 break-all font-mono font-semibold text-white">
                      {applicationCode ?? "Unavailable"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-zinc-500">
                      Enrollment status
                    </dt>
                    <dd className="mt-2 font-semibold text-white">
                      Not confirmed
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-zinc-500">
                      Current review stage
                    </dt>
                    <dd className="mt-2 font-semibold text-white">
                      Administrator eligibility review pending
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button href="/participant/information">
                  Return to Participant Information
                </Button>

                <Button href="/" variant="secondary">
                  Return to Home
                </Button>
              </div>

              <p className="mt-10 max-w-3xl text-sm leading-6 text-zinc-500">
                Do not submit another application solely because a response is
                not immediate. WPAG may contact you through the information
                supplied in your application when the review progresses.
              </p>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
