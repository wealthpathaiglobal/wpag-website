import { Container } from "@/components/layout/container";
import { ContinueExploring } from "@/components/sections/continue-exploring";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Explore Wealth Path AI Global research into financial stability, structural diagnosis, evidence development, and the Human Financial Operating System.",
};

const researchPrinciples = [
  {
    title: "Structured Observation",
    description:
      "Research begins by documenting how financial systems behave under ordinary conditions, increasing pressure, and disruption.",
  },
  {
    title: "Relational Analysis",
    description:
      "Financial variables are examined in relation to one another so that conclusions reflect the wider system rather than isolated events.",
  },
  {
    title: "Evidence Before Claims",
    description:
      "Broader conclusions are withheld until patterns are supported by documented cases, measurable conditions, and repeated observation.",
  },
  {
    title: "Correction as Progress",
    description:
      "Misclassifications, contradictions, limitations, and failed assumptions are recorded because correction is part of research development.",
  },
];

const researchAreas = [
  {
    title: "Financial Stability",
    description:
      "The conditions required for a financial system to meet essential obligations and preserve continuity.",
  },
  {
    title: "Structural Diagnosis",
    description:
      "The identification of underlying system conditions before treatment, intervention, or expansion.",
  },
  {
    title: "Pressure and Fragility",
    description:
      "How financial systems respond as obligations, disruption, and structural strain increase.",
  },
  {
    title: "Capacity and Margin",
    description:
      "The ability of a system to carry load, absorb pressure, recover, and preserve room for adjustment.",
  },
  {
    title: "Measurement Systems",
    description:
      "The development of indicators, classifications, and decision conditions for financial diagnosis.",
  },
  {
    title: "Long-Term Continuity",
    description:
      "The structures required to preserve progress, protection, transition, and institutional knowledge over time.",
  },
];

const researchMethod = [
  {
    number: "01",
    title: "Observe",
    description:
      "Document financial conditions, system behaviour, relevant variables, and contextual factors.",
  },
  {
    number: "02",
    title: "Compare",
    description:
      "Examine repeated conditions, differences, pressures, and outcomes across cases.",
  },
  {
    number: "03",
    title: "Structure",
    description:
      "Translate observed relationships into defined variables, models, classifications, and decision rules.",
  },
  {
    number: "04",
    title: "Test",
    description:
      "Apply the framework to real cases and record how accurately it represents the financial system.",
  },
  {
    number: "05",
    title: "Correct",
    description:
      "Review misclassifications, limitations, contradictions, and incomplete assumptions.",
  },
  {
    number: "06",
    title: "Document",
    description:
      "Preserve methods, findings, limitations, revisions, and outcomes as part of the research record.",
  },
];

const evidenceConditions = [
  {
    title: "Case Quality",
    description:
      "The completeness, accuracy, and relevance of the financial information available for each case.",
  },
  {
    title: "Case Diversity",
    description:
      "The range of professions, income structures, responsibilities, risks, and financial conditions represented.",
  },
  {
    title: "Observation Duration",
    description:
      "The length of time required to understand whether diagnosis and treatment remain valid beyond the initial assessment.",
  },
  {
    title: "Repeatability",
    description:
      "The degree to which similar structural conditions produce consistent classifications and outcomes.",
  },
];

export default function ResearchPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="flex min-h-[80vh] items-center py-24 lg:min-h-[calc(100vh-86px)]">
          <Container>
            <div className="max-w-5xl">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-zinc-400">
                Research at Wealth Path AI Global
              </p>

              <h1 className="mt-8 max-w-5xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Advancing the understanding of financial stability through
                disciplined research.
              </h1>

              <p className="mt-10 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
                WPAG studies the structural conditions that influence
                financial stability, pressure, fragility, capacity, and
                long-term continuity.
              </p>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Why Research Matters
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Financial stability cannot be understood through isolated
                  advice alone.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Financial outcomes are shaped by interacting structural
                    conditions, including load, flow, capacity, obligations,
                    pressure, exposure, and available margin.
                  </p>

                  <p>
                    These conditions must be examined together. Isolated
                    financial decisions may appear appropriate while the wider
                    system remains weak, overloaded, or unable to absorb
                    disruption.
                  </p>

                  <p>
                    WPAG research is intended to identify these structural
                    relationships, improve diagnosis, and develop frameworks
                    that can be observed, tested, corrected, and documented.
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
                  Research Philosophy
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Research must remain accountable to observable conditions.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  WPAG approaches research as a disciplined process of
                  observation, interpretation, testing, correction, and
                  documentation. Frameworks are treated as developing systems
                  that must remain open to evidence, limitations, and revision.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2">
              {researchPrinciples.map((principle) => (
                <article
                  key={principle.title}
                  className="bg-black p-8 sm:p-10"
                >
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
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Areas of Research
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Examining the conditions that determine whether a financial
                  system can remain stable over time.
                </h2>
              </div>
            </div>

            <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {researchAreas.map((area, index) => (
                <article
                  key={area.title}
                  className="border-t border-zinc-800 pt-6"
                >
                  <p className="text-sm tabular-nums text-zinc-600">
                    {String(index + 1).padStart(2, "0")}
                  </p>

                  <h3 className="mt-5 text-xl font-medium tracking-[-0.01em]">
                    {area.title}
                  </h3>

                  <p className="mt-4 leading-7 text-zinc-400">
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
                  Research Method
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Evidence develops through a controlled sequence.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  WPAG uses a repeatable process to move from real-world
                  observation toward clearer frameworks, stronger
                  classifications, and more defensible conclusions.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 sm:grid-cols-2 lg:grid-cols-3">
              {researchMethod.map((step) => (
                <article key={step.number} className="bg-black p-8 sm:p-10">
                  <p className="text-sm tabular-nums text-zinc-600">
                    {step.number}
                  </p>

                  <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">
                    {step.title}
                  </h3>

                  <p className="mt-4 leading-7 text-zinc-400">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>

            <p className="mt-10 text-sm uppercase tracking-[0.22em] text-zinc-600">
              Observe · Compare · Structure · Test · Correct · Document
            </p>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Current Research Direction
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Human Financial Operating System
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG&apos;s current research program is centered on the Human
                  Financial Operating System, a structured framework for
                  examining financial condition from instability through
                  long-term continuity.
                </p>

                <p>
                  The present empirical focus is Phase 1: Stability. This work
                  examines whether its variables, measurements,
                  classifications, treatment sequence, and transition
                  conditions accurately represent real financial systems.
                </p>

                <p>
                  Case documentation, longitudinal observation, treatment
                  outcomes, and misclassification review are being used to
                  assess where the framework performs reliably and where
                  correction is required.
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
                  Evidence Development
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Evidence is built through documented cases, not assumed from
                  theory.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Each case contributes to the evaluation of diagnostic
                    accuracy, classification quality, treatment relevance, and
                    change over time.
                  </p>

                  <p>
                    Strong evidence requires more than an initial assessment.
                    It requires consistent records, observable conditions,
                    follow-up periods, and transparent documentation of both
                    successful and unsuccessful outcomes.
                  </p>

                  <p>
                    Findings will be interpreted according to the maturity,
                    diversity, duration, and repeatability of the available
                    evidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2">
              {evidenceConditions.map((condition) => (
                <article
                  key={condition.title}
                  className="bg-black p-8 sm:p-10"
                >
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                    {condition.title}
                  </h3>

                  <p className="mt-5 max-w-xl leading-7 text-zinc-400">
                    {condition.description}
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
                  Research Integrity
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Limitations must remain visible.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG distinguishes between conceptual development, internal
                  testing, observed evidence, and independently established
                  conclusions.
                </p>

                <p>
                  Early findings may identify useful patterns without proving
                  universal applicability. Case quantity, case diversity,
                  observation duration, data quality, and external examination
                  all influence the strength of a conclusion.
                </p>

                <p>
                  Misclassifications, failed assumptions, incomplete data, and
                  unsuccessful outcomes remain part of the research record.
                </p>

                <p>
                  Research maturity will not be represented as greater than the
                  evidence allows.
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
                  Findings must be communicated according to their actual level
                  of maturity.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Research notes, case findings, framework revisions, and
                    methodology documents should clearly distinguish
                    observation from interpretation and interpretation from
                    established conclusion.
                  </p>

                  <p>
                    Claims should identify relevant limitations, evidence
                    boundaries, and the conditions under which the findings
                    were observed.
                  </p>

                  <p>
                    Publication is treated as part of research governance, not
                    merely as communication or visibility.
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
                Research will expand only as evidence develops.
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  Future work may include documented case studies, research
                  notes, measurement systems, methodology papers, framework
                  revisions, digital research tools, professional education,
                  and external collaboration.
                </p>

                <p>
                  Each area will be introduced according to the maturity of the
                  evidence, the readiness of the underlying system, and the
                  organization&apos;s ability to govern the work responsibly.
                </p>
              </div>

              <div className="mt-12 border-l border-zinc-700 pl-6 sm:pl-8">
                <p className="text-xl leading-8 text-zinc-200 sm:text-2xl sm:leading-9">
                  Structure precedes speed. Evidence precedes scale. Stability
                  precedes growth.
                </p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <ContinueExploring
        title="Explore HFOS"
        description="Examine the architecture, diagnostic states, measurement system, and long-term development of the Human Financial Operating System."
        href="/hfos"
        buttonText="Explore HFOS"
      />

      <SiteFooter />
    </>
  );
}