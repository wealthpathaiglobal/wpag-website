import { Container } from "@/components/layout/container";
import { ContinueExploring } from "@/components/sections/continue-exploring";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HFOS",
  description:
    "Explore the Human Financial Operating System, a structured framework for diagnosing financial stability, pressure, fragility, capacity, and continuity.",
};

const phases = [
  {
    number: "01",
    title: "Stability",
    description:
      "Establish whether the financial system can carry its current load and preserve continuity.",
  },
  {
    number: "02",
    title: "Margin Construction",
    description:
      "Build the space required to absorb disruption without immediate structural damage.",
  },
  {
    number: "03",
    title: "Controlled Growth",
    description:
      "Expand only after stability and margin are sufficiently established.",
  },
  {
    number: "04",
    title: "Risk Containment",
    description:
      "Identify, isolate, and limit exposures that can weaken the system.",
  },
  {
    number: "05",
    title: "Asset Architecture",
    description:
      "Organize assets according to function, resilience, and long-term continuity.",
  },
  {
    number: "06",
    title: "Protection Systems",
    description:
      "Create safeguards against events that can interrupt or destroy financial progress.",
  },
  {
    number: "07",
    title: "Legacy Structure",
    description:
      "Preserve knowledge, assets, responsibilities, and continuity across generations.",
  },
];

const states = [
  {
    title: "Stable",
    description:
      "The system can meet its essential obligations, maintain continuity, and absorb expected pressure.",
  },
  {
    title: "Under Pressure",
    description:
      "The system is functioning, but reduced margin or rising load is weakening its ability to absorb disruption.",
  },
  {
    title: "Fragile",
    description:
      "The system has limited capacity to carry its obligations and may fail when exposed to additional pressure.",
  },
];

const measures = [
  {
    title: "Financial Stability Health",
    abbreviation: "FSH",
    description:
      "A structured view of the system’s ability to meet obligations and preserve continuity.",
  },
  {
    title: "Stress Level",
    abbreviation: "SL",
    description:
      "An indication of the pressure being placed on the system relative to its available capacity.",
  },
  {
    title: "Runway",
    abbreviation: "RW",
    description:
      "The period for which essential financial activity may continue under reduced or interrupted flow.",
  },
];

export default function HFOSPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="flex min-h-[80vh] items-center py-24 lg:min-h-[calc(100vh-86px)]">
          <Container>
            <div className="max-w-5xl">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-zinc-400">
                Human Financial Operating System
              </p>

              <h1 className="mt-8 max-w-5xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                A structural system for financial stability.
              </h1>

              <p className="mt-10 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
                HFOS is a structured financial framework designed to diagnose
                stability, pressure, fragility, capacity, and continuity before
                growth decisions are made.
              </p>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  What HFOS Is
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  A financial operating system built around structural
                  condition.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    HFOS treats a financial life as an operating system rather
                    than a collection of separate financial activities.
                  </p>

                  <p>
                    Income, obligations, debt, expenses, reserves, protection,
                    assets, and long-term responsibilities interact with one
                    another. Their combined condition determines whether the
                    system remains stable, weakens under pressure, or moves
                    toward fragility.
                  </p>

                  <p>
                    The framework is designed to create a consistent language
                    for diagnosis, measurement, treatment sequencing, and
                    long-term preservation.
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
                  The Problem
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Financial activity can continue even while the underlying
                  system is weakening.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    Income may continue. Payments may still be made. Assets may
                    remain visible. Yet the system can be carrying excessive
                    load, insufficient margin, unstable flow, or limited
                    recovery capacity.
                  </p>

                  <p>
                    The absence of immediate failure is not proof of stability.
                    Many systems appear functional until an interruption,
                    expense, delay, or obligation exposes their weakness.
                  </p>

                  <p>
                    HFOS is designed to identify structural weakness before
                    collapse becomes the first visible signal.
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
                Core Architecture
              </p>

              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                HFOS is organized as a seven-phase progression.
              </h2>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-400">
                Each phase addresses a distinct structural requirement. The
                sequence is intentional: later phases should not substitute for
                unresolved weakness in earlier phases.
              </p>
            </div>

            <div className="mt-16 divide-y divide-zinc-900 border-y border-zinc-900">
              {phases.map((phase) => (
                <article
                  key={phase.number}
                  className="grid gap-5 py-8 sm:grid-cols-[80px_1fr] sm:gap-8"
                >
                  <p className="text-sm font-medium tracking-[0.24em] text-zinc-500">
                    {phase.number}
                  </p>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                      {phase.title}
                    </h3>

                    <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
                      {phase.description}
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
                  Phase 1
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Stability is the entry condition for the entire system.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  Phase 1 determines whether the system can carry its current
                  load, maintain sufficient flow, and preserve the capacity
                  required for continuity.
                </p>

                <p>
                  It does not begin with investment, optimization, or
                  expansion. It begins by identifying the actual structural
                  condition of the financial system.
                </p>

                <p>
                  Progression to the next phase is governed by a strict
                  transition gate. Growth is not treated as evidence that
                  stability has already been achieved.
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
                  Diagnostic States
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Every system is classified according to its current
                  structural condition.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  The classification is designed to guide treatment priority,
                  not to describe personal worth, intelligence, or future
                  potential.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-3">
              {states.map((state) => (
                <article key={state.title} className="bg-black p-8 sm:p-10">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                    {state.title}
                  </h3>

                  <p className="mt-5 leading-7 text-zinc-400">
                    {state.description}
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
                  Measurement System
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Diagnosis is supported by defined structural measures.
                </h2>

                <p className="mt-8 text-lg leading-8 text-zinc-400">
                  HFOS uses multiple measures because no single number can fully
                  represent the condition of a financial system.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-3">
              {measures.map((measure) => (
                <article key={measure.abbreviation} className="bg-black p-8 sm:p-10">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
                    {measure.abbreviation}
                  </p>

                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">
                    {measure.title}
                  </h3>

                  <p className="mt-5 leading-7 text-zinc-400">
                    {measure.description}
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
                  Operating Sequence
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Load, flow, and capacity are examined in sequence.
                </h2>
              </div>

              <div className="space-y-8">
                {[
                  {
                    number: "01",
                    title: "Load",
                    description:
                      "Identify what the system is required to carry, including essential costs, debt, obligations, and responsibilities.",
                  },
                  {
                    number: "02",
                    title: "Flow",
                    description:
                      "Examine whether income and available resources move through the system consistently enough to support continuity.",
                  },
                  {
                    number: "03",
                    title: "Capacity",
                    description:
                      "Determine whether the system has the ability to absorb pressure, recover from disruption, and sustain its obligations.",
                  },
                ].map((item) => (
                  <article
                    key={item.number}
                    className="border-t border-zinc-900 pt-8 first:border-t-0 first:pt-0"
                  >
                    <p className="text-sm font-medium tracking-[0.24em] text-zinc-500">
                      {item.number}
                    </p>

                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
                      {item.title}
                    </h3>

                    <p className="mt-4 leading-7 text-zinc-400">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-zinc-900 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-400">
                  Research Status
                </p>

                <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  HFOS is being developed through structured documentation,
                  testing, and evidence collection.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  The framework has progressed through conceptual development,
                  architecture design, internal refinement, and early-stage
                  real-world observation.
                </p>

                <p>
                  Case data, classification outcomes, treatment responses,
                  misclassifications, and limitations are being documented as
                  part of the validation process.
                </p>

                <p>
                  HFOS is not represented as universally proven. Claims will
                  expand only as the quality, diversity, duration, and
                  repeatability of the evidence improve.
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
                  Intended Use
                </p>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  HFOS is intended to support structured financial diagnosis,
                  not replace professional judgment.
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                  <p>
                    The framework may support individuals, financial
                    professionals, researchers, educators, and institutions in
                    examining financial condition more systematically.
                  </p>

                  <p>
                    It is not a substitute for legal, tax, investment,
                    accounting, credit, or regulated financial advice.
                  </p>

                  <p>
                    Its role is to improve structural understanding, clarify
                    treatment sequence, and support more disciplined
                    decision-making.
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
                Long-Term Development
              </p>

              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                HFOS is being developed as a durable system rather than a
                temporary product.
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  The long-term objective is to build a framework that remains
                  understandable, testable, governable, and extensible across
                  changing financial conditions, technologies, and
                  generations.
                </p>

                <p>
                  Definitions, measurement rules, diagnostic logic, transition
                  gates, and evidence standards will continue to be refined as
                  the research develops.
                </p>
              </div>

              <div className="mt-12 border-l border-zinc-700 pl-6 sm:pl-8">
                <p className="text-xl leading-8 text-zinc-200 sm:text-2xl sm:leading-9">
                  Stability before growth. Structure before speed. Evidence
                  before scale.
                </p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <ContinueExploring
        title="Explore the Research"
        description="Review the research principles, evidence standards, and development approach supporting the Human Financial Operating System."
        href="/research"
        buttonText="Explore Research"
      />

      <SiteFooter />
    </>
  );
}