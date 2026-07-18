import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/layout/container";
import { ContinueExploring } from "@/components/sections/continue-exploring";
export default function InsightsPage() {
  return (
    <>
      <SiteHeader />

      <main className="bg-black text-white">

        {/* Hero */}
        <section className="border-b border-white/10">
          <Container className="py-40">

            <p className="mb-8 text-sm uppercase tracking-[0.35em] text-white/40">
              Insights
            </p>

            <h1 className="max-w-5xl text-6xl font-bold leading-tight md:text-7xl">
              Ideas developed through structured research.
            </h1>

            <p className="mt-12 max-w-4xl text-2xl leading-relaxed text-white/60">
              Insights communicate observations, research notes, and
              structured thinking developed during the ongoing evolution
              of the Human Financial Operating System. Every publication
              is intended to improve clarity, encourage disciplined
              discussion, and support evidence-based understanding.
            </p>

          </Container>
        </section>
<section className="border-b border-white/10">
  <Container className="py-40">
    <div className="grid gap-20 lg:grid-cols-2">

      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-white/40">
          Publishing Philosophy
        </p>
      </div>

      <div>
        <h2 className="text-5xl font-bold leading-tight">
          Every publication begins with evidence, not opinion.
        </h2>

        <div className="mt-12 space-y-10 text-xl leading-relaxed text-white/60">

          <p>
            WPAG publishes insights only after concepts have been observed,
            questioned, compared, and refined through structured research.
          </p>

          <p>
            Publications are intended to improve understanding rather than
            provide immediate financial advice or predictions.
          </p>

          <p>
            As evidence develops, earlier ideas may be expanded, revised,
            clarified, or replaced to preserve the integrity of the research.
          </p>

        </div>
      </div>

    </div>
  </Container>
</section>
<section className="border-b border-white/10">
  <Container className="py-40">
    <p className="text-sm uppercase tracking-[0.35em] text-white/40">
      Areas of Insight
    </p>

    <div className="mt-16 grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
      {[
        {
          number: "01",
          title: "Financial Stability",
          description:
            "Structured thinking on the conditions required to preserve financial continuity.",
        },
        {
          number: "02",
          title: "Structural Diagnosis",
          description:
            "Insights into identifying pressure, fragility, and system-level financial conditions.",
        },
        {
          number: "03",
          title: "Load, Flow, and Capacity",
          description:
            "Research notes examining the core structural variables within financial systems.",
        },
        {
          number: "04",
          title: "Margin and Resilience",
          description:
            "Observations on how financial systems absorb disruption and maintain continuity.",
        },
        {
          number: "05",
          title: "Measurement and Classification",
          description:
            "Developments related to diagnosis, measurement systems, and financial states.",
        },
        {
          number: "06",
          title: "Research Notes",
          description:
            "Ongoing observations, framework refinements, and documented learning from HFOS development.",
        },
      ].map((item) => (
        <article key={item.number} className="bg-black p-10">
          <p className="text-sm text-white/30">{item.number}</p>

          <h3 className="mt-8 text-2xl font-semibold">
            {item.title}
          </h3>

          <p className="mt-5 text-lg leading-8 text-white/50">
            {item.description}
          </p>
        </article>
      ))}
    </div>
  </Container>
</section>
<section className="border-b border-white/10">
  <Container className="py-40">
    <div className="grid gap-20 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-white/40">
          Current Publishing Status
        </p>

        <h2 className="mt-10 max-w-xl text-4xl font-bold leading-tight md:text-5xl">
          Publications will expand only as the research matures.
        </h2>
      </div>

      <div className="space-y-8 text-xl leading-relaxed text-white/60">
        <p>
          WPAG is currently building the evidence, documentation, and
          institutional standards required to support a responsible publishing
          programme.
        </p>

        <p>
          Future releases may include research notes, doctrine essays, case
          studies, measurement updates, framework revisions, and formal
          publications.
        </p>

        <p>
          Each publication category will be introduced only when its underlying
          research is sufficiently clear, documented, and ready for disciplined
          public examination.
        </p>
      </div>
    </div>
  </Container>
</section>
        <ContinueExploring
          title="Contact WPAG"
          description="Connect with Wealth Path AI Global for research, collaboration, or general enquiries."
          href="/contact"
          buttonText="Contact WPAG"
        />

      </main>

      <SiteFooter />
    </>
  );
}