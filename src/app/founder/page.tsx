import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/layout/container";
import { ContinueExploring } from "@/components/sections/continue-exploring";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founder",
  description:
    "Learn about the founder of Wealth Path AI Global and the research journey behind the Human Financial Operating System.",
};

export default function FounderPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[80vh] items-center py-24 lg:min-h-[calc(100vh-86px)]">
          <Container>
            <div className="max-w-4xl">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-zinc-400">
                Founder
              </p>

              <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Every framework begins with a question.
              </h1>

              <p className="mt-10 max-w-2xl text-lg leading-8 text-zinc-400">
                Wealth Path AI Global began with a simple observation:
                financial success and financial collapse often followed
                patterns that were rarely explained through structure. That
                question became the starting point for years of research that
                later evolved into the Human Financial Operating System
                (HFOS).
              </p>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  The Question
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Why do financially capable people still experience
                  instability and collapse?
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    The work began with a recurring contradiction. People could
                    earn, work, plan, and make progress, yet still remain
                    vulnerable to disruption.
                  </p>

                  <p>
                    Conventional explanations often focused on income,
                    spending, or investment decisions. But those explanations
                    did not fully describe why some financial systems remained
                    stable while others weakened under pressure.
                  </p>

                  <p>
                    That gap led to a deeper question: could financial stability
                    be understood as a structural condition rather than only as
                    a collection of financial behaviours?
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
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  The Observation
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Different financial lives often revealed the same structural
                  patterns.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Over time, practical experience across technical work,
                    business environments, collections, transport, trading, and
                    the gig economy exposed very different forms of financial
                    life.
                  </p>

                  <p>
                    Income levels varied. Occupations varied.
                    Responsibilities, obligations, and financial behaviours
                    varied. Yet the underlying signs of pressure often appeared
                    in similar ways.
                  </p>

                  <p>
                    Systems weakened when load exceeded capacity, when income
                    flow became unreliable, and when insufficient margin left
                    no room to absorb disruption.
                  </p>

                  <p>
                    These recurring patterns suggested that financial
                    instability could not be understood through isolated
                    decisions alone. A broader structural method was needed.
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
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  The Research Journey
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Observation gradually became structured research.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    The search did not begin with the intention of creating a
                    new financial framework. It began with an effort to
                    understand why recurring patterns of instability continued
                    to appear across different financial situations.
                  </p>

                  <p>
                    Existing financial approaches were studied alongside
                    practical observations. Notes were documented, assumptions
                    were questioned, and recurring behaviours were compared
                    over time. Each iteration refined the understanding of how
                    financial systems respond to load, flow, capacity, and
                    disruption.
                  </p>

                  <p>
                    Progress was not linear. Early concepts were repeatedly
                    revised, simplified, and reorganised. The objective was
                    never complexity for its own sake, but a framework that
                    could explain financial stability with clarity,
                    consistency, and practical application.
                  </p>

                  <p>
                    This progression laid the foundation for what would later
                    become the Human Financial Operating System (HFOS).
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
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  HFOS Evolution
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  The framework evolved through refinement rather than
                  invention.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    The earliest versions of the Human Financial Operating
                    System were intentionally challenged rather than protected.
                    Concepts were rewritten, structures were reorganised, and
                    assumptions were tested against repeated observations.
                  </p>

                  <p>
                    Simplicity became a design principle. Each revision removed
                    unnecessary complexity while preserving the ability to
                    explain how financial systems remain stable, operate under
                    pressure, or become fragile.
                  </p>

                  <p>
                    Through successive iterations, the framework matured into a
                    structured seven-phase architecture covering Stability,
                    Margin Construction, Controlled Growth, Risk Containment,
                    Asset Architecture, Protection Systems, and Legacy
                    Structure.
                  </p>

                  <p>
                    This evolution transformed HFOS from a collection of
                    research notes into an institutional framework designed for
                    long-term development, validation, and governance.
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
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  Research Principles
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Research is guided by discipline rather than certainty.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  The founder&apos;s role is not to protect early assumptions,
                  but to ensure that the framework remains accountable to
                  observation, documentation, correction, and evidence.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2">
              {[
                {
                  title: "Observation",
                  description:
                    "Begin with real financial conditions before forming conclusions about how a system behaves.",
                },
                {
                  title: "Documentation",
                  description:
                    "Record assumptions, variables, classifications, outcomes, and changes so that development remains traceable.",
                },
                {
                  title: "Revision",
                  description:
                    "Correct structures when evidence reveals limitations, contradictions, or misclassification.",
                },
                {
                  title: "Evidence",
                  description:
                    "Allow claims to expand only when documented cases and repeated patterns provide sufficient support.",
                },
              ].map((item) => (
                <article key={item.title} className="bg-black p-8 sm:p-10">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">
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
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  Timeline
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Key milestones in the development of HFOS and WPAG.
                </h2>

                <div className="mt-12 space-y-10">
                  {[
                    {
                      year: "2005–2022",
                      title: "Professional Experience",
                      description:
                        "Experience across technical services, business operations, finance, transport, trading, and the gig economy provided broad practical exposure to financial life.",
                    },
                    {
                      year: "2022",
                      title: "The Question Emerged",
                      description:
                        "Financial instability raised deeper structural questions that existing explanations could not fully answer.",
                    },
                    {
                      year: "2023–2025",
                      title: "Observation and Research",
                      description:
                        "Systematic documentation, pattern analysis, and comparison of financial behaviours became the foundation of structured research.",
                    },
                    {
                      year: "2025",
                      title: "HFOS Research Begins",
                      description:
                        "The Human Financial Operating System was formally developed as a structural framework for understanding financial stability.",
                    },
                    {
                      year: "2026",
                      title: "Seven-Phase Architecture",
                      description:
                        "HFOS matured into a complete long-term architecture covering seven interconnected phases.",
                    },
                    {
                      year: "2026",
                      title: "WPAG Established",
                      description:
                        "Wealth Path AI Global was established to govern, preserve, validate, and advance HFOS as an institutional body of knowledge.",
                    },
                    {
                      year: "Present",
                      title: "Continuing the Mission",
                      description:
                        "Research, validation, documentation, and evidence collection continue to expand the Human Financial Operating System.",
                    },
                  ].map((item) => (
                    <article
                      key={item.year + item.title}
                      className="border-l border-zinc-800 pl-6"
                    >
                      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
                        {item.year}
                      </p>

                      <h3 className="mt-2 text-xl font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-lg leading-8 text-zinc-400">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
                  The Continuing Mission
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  The work continues through evidence, refinement, and
                  institutional stewardship.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    HFOS is not presented as a finished destination. It remains
                    an evolving body of structured research that must be tested
                    against real financial conditions, documented carefully,
                    and refined when evidence reveals limitations.
                  </p>

                  <p>
                    Wealth Path AI Global exists to preserve the integrity of
                    that process. Its role is to support research, establish
                    documentation standards, collect evidence, examine
                    misclassifications, and govern the long-term development of
                    the framework.
                  </p>

                  <p>
                    The objective is not rapid expansion without proof.
                    Progress must follow structure, validation, and disciplined
                    interpretation.
                  </p>

                  <p>
                    Through continuing research and institutional preservation,
                    WPAG aims to build knowledge that future generations can
                    examine, challenge, extend, and apply responsibly.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <ContinueExploring
        title="Contact WPAG"
        description="Connect with Wealth Path AI Global for research, collaboration, or general enquiries."
        href="/contact"
        buttonText="Contact WPAG"
      />

      <SiteFooter />
    </>
  );
}