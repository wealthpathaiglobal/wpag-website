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
      <section className="mx-auto flex min-h-[calc(100vh-86px)] max-w-7xl items-center px-6 py-24 sm:px-10 lg:px-16">
        <div className="max-w-5xl">
          <p className="mb-8 text-sm font-medium uppercase tracking-[0.32em] text-zinc-500">
            Research at Wealth Path AI Global
          </p>

          <h1 className="max-w-5xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Advancing structured understanding through disciplined research.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
            WPAG studies the structural conditions that influence financial
            stability, pressure, fragility, and long-term continuity. Its
            research is focused on developing frameworks that can be observed,
            tested, refined, and applied across different financial systems.
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
                Financial stability requires more than conventional advice.
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  Financial outcomes are shaped by interacting structural
                  conditions, including load, flow, capacity, obligations,
                  pressure, and available margin.
                </p>

                <p>
                  Understanding these conditions requires disciplined
                  observation, consistent measurement, and continuous
                  refinement rather than isolated recommendations.
                </p>

                <p>
                  WPAG research is therefore designed to identify patterns,
                  test structural relationships, and improve the clarity of
                  financial diagnosis over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
            Research Philosophy
          </p>

          <div className="mt-12 grid gap-px overflow-hidden border border-zinc-900 bg-zinc-900 md:grid-cols-2">
            {[
              {
                title: "Structured Observation",
                description:
                  "Research begins by observing how financial systems behave under normal conditions, rising pressure, and disruption.",
              },
              {
                title: "Systematic Analysis",
                description:
                  "Variables are examined in relation to one another so that conclusions are based on structure rather than isolated events.",
              },
              {
                title: "Evidence Before Claims",
                description:
                  "Frameworks must be supported by documented cases, measurable conditions, and repeatable patterns before broader claims are made.",
              },
              {
                title: "Continuous Refinement",
                description:
                  "Research remains open to correction. Misclassifications, limitations, and new evidence are documented and used to improve the system.",
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
        </div>
      </section>

      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
            Areas of Research
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Financial Stability",
              "Structural Diagnosis",
              "Financial Pressure and Fragility",
              "Capacity and Margin",
              "Measurement Systems",
              "Long-Term Financial Continuity",
            ].map((area, index) => (
              <div key={area} className="border-t border-zinc-800 pt-6">
                <p className="text-sm text-zinc-600">
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h3 className="mt-4 text-xl font-medium">{area}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
            Research Method
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["01", "Observe", "Document real financial conditions and system behaviour."],
              ["02", "Identify Patterns", "Compare repeated conditions, pressures, and outcomes."],
              ["03", "Develop Frameworks", "Translate observations into structured models."],
              ["04", "Test", "Apply the framework to real cases and record results."],
              ["05", "Refine", "Correct limitations and improve classifications."],
              ["06", "Publish", "Present validated knowledge with clarity and transparency."],
            ].map(([number, title, description]) => (
              <article key={number} className="border border-zinc-900 p-8">
                <p className="text-sm text-zinc-600">{number}</p>

                <h3 className="mt-8 text-2xl font-semibold">{title}</h3>

                <p className="mt-4 leading-7 text-zinc-400">{description}</p>
              </article>
            ))}
          </div>
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
                Current research is centered on the ongoing development,
                application, and validation of the Human Financial Operating
                System.
              </p>

              <p>
                The present focus is Phase 1: Stability, including structural
                diagnosis, measurement, classification, implementation, and
                the conditions required to preserve financial continuity.
              </p>

              <p>
                Real-world testing, case documentation, and misclassification
                review will support future refinement of the framework.
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
              Future work may include case studies, research notes,
              measurement systems, publications, framework updates, and
              digital research tools. Each area will be introduced according
              to the maturity of the evidence and the readiness of the
              underlying system.
            </p>
          </div>
        </div>
           </section>
      </main>
<ContinueExploring
  title="Meet the Founder"
  description="Learn about the observations, research philosophy, and long-term commitment behind Wealth Path AI Global and the Human Financial Operating System."
  href="/founder"
  buttonText="Meet the Founder"
/>
      <SiteFooter />
    </>
  );
}