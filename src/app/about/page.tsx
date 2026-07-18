import { Container } from "@/components/layout/container";
import { ContinueExploring } from "@/components/sections/continue-exploring";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Wealth Path AI Global, an independent research and development organization advancing structured financial stability through research, evidence development, and institutional stewardship.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="flex min-h-[80vh] items-center py-24 lg:min-h-[calc(100vh-86px)]">
          <Container>
            <div className="max-w-5xl">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-zinc-400">
                About Wealth Path AI Global
              </p>

              <h1 className="mt-8 max-w-5xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                An independent research organization advancing financial
                stability.
              </h1>

              <p className="mt-10 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
                Wealth Path AI Global develops structured financial frameworks
                designed to improve how stability, pressure, fragility,
                capacity, and long-term continuity are understood.
              </p>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Who We Are
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Building structured knowledge for financial systems.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Wealth Path AI Global is an independent research and
                    development organization focused on the structural
                    conditions that influence financial stability.
                  </p>

                  <p>
                    Its work examines how financial systems carry obligations,
                    maintain income flow, absorb pressure, preserve capacity,
                    and continue operating through disruption.
                  </p>

                  <p>
                    WPAG develops frameworks, measurement systems,
                    classifications, documentation standards, and research
                    tools intended to support clearer diagnosis and more
                    disciplined financial decision-making.
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
                  Why WPAG Exists
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Financial progress is difficult to preserve without
                  structural stability.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Financial knowledge often concentrates on earning,
                    budgeting, investing, or growth. These areas matter, but
                    they do not fully explain whether a financial system can
                    remain stable under pressure.
                  </p>

                  <p>
                    Two individuals or households may earn similar incomes
                    while carrying very different levels of load, obligation,
                    risk, and available margin. Income alone cannot explain the
                    strength of the underlying system.
                  </p>

                  <p>
                    WPAG exists to study these structural differences and to
                    develop methods that place stability before expansion,
                    evidence before scale, and continuity before ambition.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Mission
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  To advance the understanding and preservation of financial
                  stability.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG&apos;s mission is to research, develop, document, test,
                  and refine structured financial systems that improve the
                  diagnosis of stability, pressure, and fragility.
                </p>

                <p>
                  This work is intended to support individuals, professionals,
                  researchers, and institutions seeking clearer ways to
                  understand how financial systems behave over time.
                </p>

                <p>
                  The mission is pursued through disciplined research,
                  transparent documentation, evidence development, and
                  long-term institutional stewardship.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Vision
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  A future in which financial stability can be understood,
                  measured, and preserved systematically.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG envisions financial stability becoming a defined and
                  examinable field rather than an assumed outcome of income or
                  growth.
                </p>

                <p>
                  In that future, financial systems can be evaluated according
                  to their load, flow, capacity, margin, exposure, and ability
                  to preserve continuity.
                </p>

                <p>
                  The long-term objective is to establish knowledge that can be
                  examined, challenged, improved, and responsibly extended
                  across generations.
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
                  Core Principles
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  The organization is governed by disciplined sequencing.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  WPAG does not treat speed, expansion, or visibility as
                  substitutes for structural readiness. Its work follows
                  principles designed to protect research integrity and
                  long-term continuity.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Stability Before Growth",
                  description:
                    "Expansion should begin only after the underlying system can carry its existing load and preserve continuity.",
                },
                {
                  title: "Structure Before Speed",
                  description:
                    "Progress must follow a defined architecture, clear responsibilities, and controlled execution.",
                },
                {
                  title: "Evidence Before Scale",
                  description:
                    "Broader claims and adoption must follow documented cases, repeated observation, and measurable results.",
                },
                {
                  title: "Diagnosis Before Treatment",
                  description:
                    "Financial action should be based on the actual condition of the system rather than generic advice.",
                },
                {
                  title: "Correction Before Protection",
                  description:
                    "Assumptions and classifications must remain open to revision when evidence reveals limitations.",
                },
                {
                  title: "Continuity Before Expansion",
                  description:
                    "A system should protect its essential function before taking on additional complexity or exposure.",
                },
              ].map((principle) => (
                <article
                  key={principle.title}
                  className="bg-black p-8 sm:p-10"
                >
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                    {principle.title}
                  </h3>

                  <p className="mt-5 leading-7 text-zinc-400">
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
                  Institutional Role
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  WPAG exists to develop, govern, and preserve structured
                  financial knowledge.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    The organization&apos;s role extends beyond framework
                    creation. It includes maintaining definitions, documenting
                    methodology, reviewing evidence, recording limitations,
                    and protecting the consistency of the underlying system.
                  </p>

                  <p>
                    WPAG also supports the development of diagnostic tools,
                    research notes, case documentation, educational materials,
                    and future digital systems connected to its research.
                  </p>

                  <p>
                    As the evidence base develops, institutional responsibilities
                    may expand to include collaboration, external review,
                    publications, professional education, and research
                    governance.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Research Commitment
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Research maturity will not be represented as greater than
                  the evidence allows.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG distinguishes between conceptual development, internal
                  testing, observed evidence, and independently established
                  conclusions.
                </p>

                <p>
                  Early-stage frameworks may identify meaningful patterns
                  without proving universal applicability. Limitations,
                  misclassifications, incomplete assumptions, and unsuccessful
                  outcomes remain part of the research record.
                </p>

                <p>
                  Claims will expand only as case quality, diversity,
                  observation duration, repeatability, and external examination
                  provide adequate support.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="max-w-4xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                Long-Term Commitment
              </p>

              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                The objective is not temporary attention, but durable
                institutional knowledge.
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  WPAG is being developed with a long-term horizon. Its
                  frameworks, documentation systems, research principles, and
                  governance standards are intended to remain understandable
                  beyond a single product, platform, or generation.
                </p>

                <p>
                  The organization will continue to refine its work as evidence
                  develops, technology changes, and new financial conditions
                  emerge.
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
        title="Explore Our Research"
        description="Learn how Wealth Path AI Global studies financial stability, structural diagnosis, evidence development, and long-term continuity."
        href="/research"
        buttonText="Explore Research"
      />

      <SiteFooter />
    </>
  );
}