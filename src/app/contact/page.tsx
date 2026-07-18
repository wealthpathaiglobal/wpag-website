import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Wealth Path AI Global regarding research, collaboration, institutional partnerships, publications, and the Human Financial Operating System.",
};

const CONTACT_EMAIL = "contact@wealthpathaiglobal.com";

const enquiryAreas = [
  {
    number: "01",
    title: "Research Collaboration",
    description:
      "Enquiries related to structured financial research, case documentation, framework testing, methodology, and evidence development.",
  },
  {
    number: "02",
    title: "Institutional Partnerships",
    description:
      "Conversations with organizations interested in research support, knowledge development, professional education, or long-term institutional collaboration.",
  },
  {
    number: "03",
    title: "Academic and Professional Discussion",
    description:
      "Engagement with researchers, educators, and professionals examining financial stability, diagnosis, measurement, pressure, and continuity.",
  },
  {
    number: "04",
    title: "Media and Publications",
    description:
      "Requests concerning interviews, research commentary, publications, and the responsible public communication of WPAG and HFOS.",
  },
];

const contactGuidelines = [
  {
    number: "01",
    title: "Provide Context",
    description:
      "Explain the subject of the enquiry, the organization or role involved, and why the matter is relevant to WPAG.",
  },
  {
    number: "02",
    title: "Define the Purpose",
    description:
      "State whether the enquiry concerns research, evidence development, collaboration, publication, education, or institutional discussion.",
  },
  {
    number: "03",
    title: "Describe the Contribution",
    description:
      "Collaboration requests should identify the proposed contribution, expected responsibilities, and intended outcome.",
  },
  {
    number: "04",
    title: "Identify the Audience",
    description:
      "Media and publication requests should specify the format, intended audience, publication channel, and expected timeline.",
  },
];

const responsePrinciples = [
  {
    title: "Relevance",
    description:
      "Priority is given to enquiries connected to financial stability research, HFOS development, evidence, and institutional knowledge.",
  },
  {
    title: "Clarity",
    description:
      "Enquiries containing sufficient context and a clearly defined purpose can be reviewed more effectively.",
  },
  {
    title: "Alignment",
    description:
      "Potential collaboration is considered according to its compatibility with WPAG’s research standards and long-term direction.",
  },
  {
    title: "Capacity",
    description:
      "Response times and participation depend on current research responsibilities and available organizational capacity.",
  },
];

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="flex min-h-[80vh] items-center py-24 lg:min-h-[calc(100vh-86px)]">
          <Container>
            <div className="max-w-5xl">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-zinc-400">
                Contact
              </p>

              <h1 className="mt-8 max-w-5xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Connect with Wealth Path AI Global.
              </h1>

              <p className="mt-10 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
                WPAG welcomes thoughtful enquiries concerning research,
                evidence development, institutional collaboration,
                publications, and the continuing development of the Human
                Financial Operating System.
              </p>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Direct Contact
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Begin with a clear and relevant enquiry.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  Include sufficient context, the purpose of the communication,
                  and any relevant organization, publication, research
                  programme, or proposed contribution.
                </p>

                <div className="mt-12 border-y border-zinc-900 py-8">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
                    Email
                  </p>

                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-4 inline-block break-all text-2xl font-medium tracking-[-0.02em] text-white transition-colors hover:text-zinc-300 sm:text-3xl"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>

                <p className="mt-6 max-w-2xl text-sm leading-6 text-zinc-500">
                  Please do not include passwords, banking credentials, account
                  access information, identity documents, or other highly
                  sensitive personal data in an initial enquiry.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Enquiry Areas
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Communication should support research, knowledge, or
                  institutional development.
                </h2>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2">
              {enquiryAreas.map((area) => (
                <article key={area.number} className="bg-black p-8 sm:p-10">
                  <p className="text-sm tabular-nums text-zinc-600">
                    {area.number}
                  </p>

                  <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">
                    {area.title}
                  </h3>

                  <p className="mt-5 max-w-xl leading-7 text-zinc-400">
                    {area.description}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Contact Guidelines
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Clear context supports meaningful communication.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  A structured enquiry allows WPAG to understand the relevance,
                  requirements, and potential value of the proposed discussion.
                </p>
              </div>
            </div>

            <div className="mt-16 divide-y divide-zinc-900 border-y border-zinc-900">
              {contactGuidelines.map((guideline) => (
                <article
                  key={guideline.number}
                  className="grid gap-5 py-8 sm:grid-cols-[80px_1fr] sm:gap-8"
                >
                  <p className="text-sm font-medium tracking-[0.24em] text-zinc-500">
                    {guideline.number}
                  </p>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                      {guideline.title}
                    </h3>

                    <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
                      {guideline.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Appropriate Communication
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Not every message requires the same form of engagement.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG welcomes enquiries that contribute to research,
                  institutional dialogue, evidence development, responsible
                  publication, and long-term knowledge building.
                </p>

                <p>
                  Commercial solicitations, unrelated promotional messages,
                  mass outreach, requests for endorsements, and communications
                  without sufficient context may not receive a response.
                </p>

                <p>
                  Personal financial cases should not be submitted through an
                  initial general enquiry unless WPAG has specifically opened a
                  documented research or case-participation programme.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Review Principles
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Enquiries are reviewed according to relevance, clarity,
                  alignment, and capacity.
                </h2>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2">
              {responsePrinciples.map((principle) => (
                <article key={principle.title} className="bg-black p-8 sm:p-10">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                    {principle.title}
                  </h3>

                  <p className="mt-5 max-w-xl leading-7 text-zinc-400">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Response Policy
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Every relevant enquiry is considered with care.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG reviews enquiries individually. Responses are
                  prioritized according to research relevance, institutional
                  value, clarity of purpose, and alignment with the
                  organization&apos;s long-term objectives.
                </p>

                <p>
                  Response times may vary according to the nature of the
                  enquiry and current research responsibilities.
                </p>

                <p>
                  Submission of an enquiry does not guarantee a response,
                  collaboration, publication, endorsement, partnership, or
                  participation in a WPAG programme.
                </p>

                <p>
                  The purpose of every interaction is to preserve clarity,
                  professionalism, research integrity, and responsible use of
                  organizational capacity.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="max-w-4xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                Institutional Communication
              </p>

              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Meaningful collaboration begins with clarity.
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG is being developed through disciplined research,
                  documented learning, responsible communication, and a
                  long-term commitment to financial stability.
                </p>

                <p>
                  Enquiries aligned with that direction are welcome and will be
                  considered according to the maturity, relevance, and
                  requirements of the proposed work.
                </p>
              </div>

              <div className="mt-12 border-l border-zinc-700 pl-6 sm:pl-8">
                <p className="text-xl leading-8 text-zinc-200 sm:text-2xl sm:leading-9">
                  Clear purpose. Relevant context. Responsible collaboration.
                </p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}