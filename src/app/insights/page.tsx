import { Container } from "@/components/layout/container";
import { ContinueExploring } from "@/components/sections/continue-exploring";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights",

  description:
    "Read structured observations, research notes, doctrine essays, and framework developments from Wealth Path AI Global and the Human Financial Operating System (HFOS).",

  alternates: {
    canonical: "/insights",
  },

  openGraph: {
    title: "Insights | Wealth Path AI Global",
    description:
      "Structured observations, research notes, doctrine essays, and framework developments from Wealth Path AI Global.",
    url: "/insights",
    siteName: "Wealth Path AI Global",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Insights | Wealth Path AI Global",
    description:
      "Structured observations, research notes, doctrine essays, and framework developments from Wealth Path AI Global.",
  },
};

const insightAreas = [
  {
    number: "01",
    title: "Financial Stability",
    description:
      "Structured observations on the conditions required to meet essential obligations and preserve financial continuity.",
  },
  {
    number: "02",
    title: "Structural Diagnosis",
    description:
      "Insights into identifying pressure, fragility, capacity constraints, and underlying system conditions.",
  },
  {
    number: "03",
    title: "Load, Flow, and Capacity",
    description:
      "Research notes examining the interaction of the core structural variables within a financial system.",
  },
  {
    number: "04",
    title: "Margin and Resilience",
    description:
      "Observations on how financial systems absorb disruption, recover from pressure, and maintain continuity.",
  },
  {
    number: "05",
    title: "Measurement and Classification",
    description:
      "Developments relating to diagnostic measures, financial states, thresholds, and transition conditions.",
  },
  {
    number: "06",
    title: "Framework Development",
    description:
      "Documented learning, revisions, limitations, and structural refinements emerging from HFOS development.",
  },
];

const publicationTypes = [
  {
    title: "Research Notes",
    description:
      "Focused records of observations, questions, emerging patterns, and areas requiring further examination.",
  },
  {
    title: "Doctrine Essays",
    description:
      "Clear statements of financial principles developed through the architecture and research of HFOS.",
  },
  {
    title: "Case Findings",
    description:
      "Structured analysis of documented cases, including diagnosis, treatment response, limitations, and change over time.",
  },
  {
    title: "Framework Updates",
    description:
      "Formal communication of revised definitions, measurements, classifications, rules, and structural logic.",
  },
];

const publicationStandards = [
  {
    number: "01",
    title: "Evidence Boundary",
    description:
      "Every publication should make clear what is observed, what is interpreted, and what remains unproven.",
  },
  {
    number: "02",
    title: "Research Maturity",
    description:
      "The strength of the language used must reflect the quantity, diversity, duration, and quality of the evidence.",
  },
  {
    number: "03",
    title: "Revision Visibility",
    description:
      "Material corrections and framework revisions should remain visible as part of the institutional record.",
  },
  {
    number: "04",
    title: "Responsible Use",
    description:
      "Publications should improve structural understanding without presenting general research as personal financial advice.",
  },
];

export default function InsightsPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="flex min-h-[80vh] items-center py-24 lg:min-h-[calc(100vh-86px)]">
          <Container>
            <div className="max-w-5xl">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-zinc-400">
                Insights
              </p>

              <h1 className="mt-8 max-w-5xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Ideas developed through structured research.
              </h1>

              <p className="mt-10 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
                WPAG Insights communicates structured observations, research
                notes, doctrine, and framework developments emerging from the
                ongoing evolution of the Human Financial Operating System.
              </p>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Purpose of Insights
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Insights make developing knowledge visible without
                  overstating its maturity.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Research often develops through partial observations,
                    emerging relationships, questions, corrections, and
                    repeated refinement before it becomes a formal conclusion.
                  </p>

                  <p>
                    Insights provide a disciplined space to communicate that
                    development while preserving the distinction between
                    observation, interpretation, framework doctrine, and
                    established evidence.
                  </p>

                  <p>
                    The objective is not constant publication. The objective is
                    clearer thinking, stronger documentation, and responsible
                    public examination.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Publishing Philosophy
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Every publication begins with disciplined inquiry, not
                  unsupported opinion.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    WPAG publishes ideas after concepts have been observed,
                    questioned, compared, structured, and refined through the
                    research process.
                  </p>

                  <p>
                    Publications are intended to improve understanding. They
                    are not designed to provide market predictions, personal
                    financial recommendations, or simplified certainty where
                    the evidence remains incomplete.
                  </p>

                  <p>
                    As research develops, earlier publications may be expanded,
                    clarified, corrected, reclassified, or replaced to preserve
                    the integrity of the institutional record.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Areas of Insight
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Publishing will remain focused on the structural conditions
                  that influence financial continuity.
                </h2>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2 lg:grid-cols-3">
              {insightAreas.map((item) => (
                <article key={item.number} className="bg-black p-8 sm:p-10">
                  <p className="text-sm tabular-nums text-zinc-600">
                    {item.number}
                  </p>

                  <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">
                    {item.title}
                  </h3>

                  <p className="mt-5 leading-7 text-zinc-400">
                    {item.description}
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
                  Publication Categories
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Different forms of knowledge require different forms of
                  publication.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  WPAG will distinguish between early research observations,
                  institutional doctrine, case-based evidence, and formal
                  framework revisions.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2">
              {publicationTypes.map((type) => (
                <article key={type.title} className="bg-black p-8 sm:p-10">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                    {type.title}
                  </h3>

                  <p className="mt-5 max-w-xl leading-7 text-zinc-400">
                    {type.description}
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
                  Current Publishing Status
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Publications will expand only as the research matures.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG is currently building the evidence, documentation, and
                  institutional standards required to support a responsible
                  publishing programme.
                </p>

                <p>
                  The present priority is the development and testing of HFOS
                  Phase 1: Stability, including its variables, measurements,
                  diagnostic states, treatment sequence, and transition
                  conditions.
                </p>

                <p>
                  Public material will expand as the framework becomes more
                  clearly documented and supported by stronger real-world
                  evidence.
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
                  Publication Standard
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Every publication must reflect the actual condition of the
                  evidence behind it.
                </h2>
              </div>
            </div>

            <div className="mt-16 divide-y divide-zinc-900 border-y border-zinc-900">
              {publicationStandards.map((standard) => (
                <article
                  key={standard.number}
                  className="grid gap-5 py-8 sm:grid-cols-[80px_1fr] sm:gap-8"
                >
                  <p className="text-sm font-medium tracking-[0.24em] text-zinc-500">
                    {standard.number}
                  </p>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                      {standard.title}
                    </h3>

                    <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
                      {standard.description}
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
                  Revision and Correction
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Correction is part of publishing integrity.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  Developing systems may change as new cases, contradictions,
                  measurement limitations, and alternative explanations become
                  visible.
                </p>

                <p>
                  WPAG will not treat an earlier publication as permanently
                  correct merely because it has already been made public.
                </p>

                <p>
                  Significant revisions should identify what changed, why it
                  changed, and how the updated understanding affects the wider
                  framework.
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
                  Responsible Interpretation
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  General research should not be mistaken for individual
                  financial advice.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Insights may provide useful concepts, questions,
                    classifications, and structural perspectives. Their
                    relevance to a particular person or institution depends on
                    the actual condition of that financial system.
                  </p>

                  <p>
                    Publications do not replace regulated financial, legal,
                    accounting, tax, investment, credit, or professional
                    advice.
                  </p>

                  <p>
                    Readers should interpret each publication according to its
                    stated evidence level, purpose, limitations, and date of
                    publication.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="max-w-4xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                Looking Ahead
              </p>

              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Publishing will develop alongside the evidence.
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  Future releases may include research notes, doctrine essays,
                  documented cases, measurement updates, framework revisions,
                  methodological papers, and formal institutional
                  publications.
                </p>

                <p>
                  Each category will be introduced only when its purpose,
                  evidence basis, documentation standard, and governance
                  requirements are sufficiently clear.
                </p>
              </div>

              <div className="mt-12 border-l border-zinc-700 pl-6 sm:pl-8">
                <p className="text-xl leading-8 text-zinc-200 sm:text-2xl sm:leading-9">
                  Publish for clarity. Revise for accuracy. Preserve the
                  evidence.
                </p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <ContinueExploring
        title="Explore the Research"
        description="Review the research philosophy, method, evidence standards, and current development direction supporting WPAG publications."
        href="/research"
        buttonText="Explore Research"
      />

      <SiteFooter />
    </>
  );
}