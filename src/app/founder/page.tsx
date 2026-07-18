import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/layout/container";
import { ContinueExploring } from "@/components/sections/continue-exploring";

export default function FounderPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="py-32">
          <Container>
            <div className="max-w-4xl">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-zinc-500">
                Founder
              </p>

              <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Every framework begins with a question.
              </h1>

              <p className="mt-10 max-w-2xl text-lg leading-8 text-zinc-400">
                Wealth Path AI Global began with a simple observation:
                financial success and financial collapse often followed
                patterns that were rarely explained through structure.
                That question became the starting point for years of
                research that later evolved into the Human Financial
                Operating System (HFOS).
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
          Why do financially capable people still experience instability and collapse?
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
          <p>
            The work began with a recurring contradiction. People could earn,
            work, plan, and make progress, yet still remain vulnerable to
            disruption.
          </p>

          <p>
            Conventional explanations often focused on income, spending, or
            investment decisions. But those explanations did not fully describe
            why some financial systems remained stable while others weakened
            under pressure.
          </p>

          <p>
            That gap led to a deeper question: could financial stability be
            understood as a structural condition rather than only as a
            collection of financial behaviours?
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
          Different financial lives often revealed the same structural patterns.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
          <p>
            Over time, practical experience across technical work, business
            environments, collections, transport, trading, and the gig economy
            exposed very different forms of financial life.
          </p>

          <p>
            Income levels varied. Occupations varied. Responsibilities,
            obligations, and financial behaviours varied. Yet the underlying
            signs of pressure often appeared in similar ways.
          </p>

          <p>
            Systems weakened when load exceeded capacity, when income flow
            became unreliable, and when insufficient margin left no room to
            absorb disruption.
          </p>

          <p>
            These recurring patterns suggested that financial instability could
            not be understood through isolated decisions alone. A broader
            structural method was needed.
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
            The search did not begin with the intention of creating a new
            financial framework. It began with an effort to understand why
            recurring patterns of instability continued to appear across
            different financial situations.
          </p>

          <p>
            Existing financial approaches were studied alongside practical
            observations. Notes were documented, assumptions were questioned,
            and recurring behaviours were compared over time. Each iteration
            refined the understanding of how financial systems respond to load,
            flow, capacity, and disruption.
          </p>

          <p>
            Progress was not linear. Early concepts were repeatedly revised,
            simplified, and reorganised. The objective was never complexity for
            its own sake, but a framework that could explain financial
            stability with clarity, consistency, and practical application.
          </p>

          <p>
            This progression laid the foundation for what would later become
            the Human Financial Operating System (HFOS).
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