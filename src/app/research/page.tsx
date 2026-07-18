import { ContinueExploring } from "@/components/sections/continue-exploring";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Explore WPAG research into financial stability, structural diagnosis, and long-term evidence development.",
};

export default function ResearchPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[80vh] lg:min-h-[calc(100vh-86px)] max-w-7xl items-center px-6 py-24 sm:px-10 lg:px-16">
          <div className="max-w-5xl">
            <p className="mb-8 text-sm font-medium uppercase tracking-[0.32em] text-zinc-500">
              Research at Wealth Path AI Global
            </p>

            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Advancing the understanding of financial stability through
              disciplined research.
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
              WPAG studies the structural conditions that influence financial
              stability, pressure, fragility, and long-term continuity. Its
              research develops frameworks that can be observed, tested,
              refined, and applied across different financial systems.
            </p>
          </div>
        </section>

        <section className="border-t border-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  Why Research Matters
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Financial stability cannot be understood through isolated
                  advice alone.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Financial outcomes are shaped by interacting structural
                    conditions, including load, flow, capacity, obligations,
                    pressure, and available margin.
                  </p>

                  <p>
                    These conditions must be observed together. Examining
                    individual financial decisions in isolation often hides
                    the underlying structure influencing long-term stability.
                  </p>

                  <p>
                    WPAG research is designed to identify structural
                    relationships, improve financial diagnosis, and develop
                    evidence-based frameworks through continuous observation,
                    testing, and refinement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  Research Philosophy
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Research must remain accountable to observable conditions.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  WPAG approaches research as a disciplined process of
                  observation, structural interpretation, testing, correction,
                  and documentation. Frameworks are treated as developing
                  systems that must remain open to evidence, limitations, and
                  revision.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2">
              {[
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
              ].map((item) => (
                <article key={item.title} className="bg-black p-8 sm:p-10">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                    {item.title}
                  </h3>

                  <p className="mt-5 max-w-xl leading-7 text-zinc-400">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  Areas of Research
                </p>
              </div>

              <div>
                <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Examining the conditions that determine whether a financial
                  system can remain stable over time.
                </h2>
              </div>
            </div>

            <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Financial Stability",
                  description:
                    "The conditions required for a financial system to maintain essential continuity.",
                },
                {
                  title: "Structural Diagnosis",
                  description:
                    "The identification of underlying system conditions before treatment or intervention.",
                },
                {
                  title: "Pressure and Fragility",
                  description:
                    "How financial systems respond as obligations, disruption, and structural strain increase.",
                },
                {
                  title: "Capacity and Margin",
                  description:
                    "The ability of a system to carry load, absorb pressure, and preserve room for adjustment.",
                },
                {
                  title: "Measurement Systems",
                  description:
                    "The development of classifications, indicators, and decision conditions for financial diagnosis.",
                },
                {
                  title: "Long-Term Continuity",
                  description:
                    "The structures that support preservation, controlled progress, and transition across time.",
                },
              ].map((area, index) => (
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
          </div>
        </section>

        <section className="border-t border-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  Research Method
                </p>
              </div>

              <div>
                <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Evidence develops through a controlled sequence.
                </h2>

                <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-400">
                  WPAG uses a repeatable research process to move from
                  real-world observation toward clearer frameworks, stronger
                  classifications, and more defensible conclusions.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Observe",
                  description:
                    "Document financial conditions, system behaviour, and relevant contextual factors.",
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
                    "Translate observed relationships into defined variables, models, and classifications.",
                },
                {
                  number: "04",
                  title: "Test",
                  description:
                    "Apply the framework to real cases and record how accurately it represents the system.",
                },
                {
                  number: "05",
                  title: "Correct",
                  description:
                    "Review misclassifications, limitations, contradictions, and incomplete assumptions.",
                },
                {
                  number: "06",
                  title: "Communicate",
                  description:
                    "Present methods, findings, limitations, and framework changes with appropriate clarity.",
                },
              ].map((item) => (
                <article key={item.number} className="bg-black p-8 sm:p-10">
                  <p className="text-sm tabular-nums text-zinc-600">
                    {item.number}
                  </p>

                  <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">
                    {item.title}
                  </h3>

                  <p className="mt-4 leading-7 text-zinc-400">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>

            <p className="mt-10 text-sm uppercase tracking-[0.22em] text-zinc-600">
              Observe · Compare · Structure · Test · Correct · Communicate
            </p>
          </div>
        </section>

        <section className="border-t border-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  Current Research Direction
                </p>

                <h2 className="mt-8 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Human Financial Operating System
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG&apos;s current research program is centered on the Human
                  Financial Operating System, a structured framework for
                  examining financial stability from instability through
                  long-term continuity.
                </p>

                <p>
                  The present empirical focus is Phase 1: Stability. This work
                  examines whether its variables, measurements,
                  classifications, and transition conditions accurately
                  represent real financial systems.
                </p>

                <p>
                  Case documentation, longitudinal observation, treatment
                  outcomes, and misclassification review will be used to
                  assess where the framework performs reliably and where
                  further correction is required.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  Evidence Development
                </p>
              </div>

              <div>
                <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
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
                    diversity, and duration of the available evidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
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
                  observation duration, data quality, and external review all
                  influence the strength of a conclusion.
                </p>

                <p>
                  Research maturity will not be represented as greater than
                  the evidence allows.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
            <div className="max-w-4xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                Looking Ahead
              </p>

              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Research will expand only as evidence develops.
              </h2>

              <p className="mt-8 text-lg leading-8 text-zinc-400">
                Future work may include documented case studies, research
                notes, measurement systems, methodology papers, framework
                revisions, digital research tools, and external collaboration.
                Each area will be introduced according to the maturity of the
                evidence and the readiness of the underlying system.
              </p>

              <div className="mt-12 border-l border-zinc-700 pl-6 sm:pl-8">
                <p className="text-xl leading-8 text-zinc-200 sm:text-2xl sm:leading-9">
                  Structure precedes speed. Evidence precedes scale. Stability
                  precedes growth.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ContinueExploring
        title="Meet the Founder"
        description="Learn about the observations, research discipline, and long-term commitment behind Wealth Path AI Global and the Human Financial Operating System."
        href="/founder"
        buttonText="Meet the Founder"
      />

      <SiteFooter />
    </>
  );
}