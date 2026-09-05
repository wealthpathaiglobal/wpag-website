import { Container } from "@/components/layout/container";
import { typography } from "@/styles/typography";

export function AboutSection() {
  return (
    <section id="about" className="border-t border-zinc-900 py-32">
      <Container>
       <p className={`mb-10 ${typography.caption}`}>
  ABOUT WEALTH PATH AI GLOBAL
</p>

<h2 className={`max-w-5xl ${typography.display}`}>
  Advancing long-term financial stability through structured systems.
</h2>

<p className={`mt-12 max-w-3xl ${typography.bodyLarge}`}>
  Wealth Path AI Global is an independent financial research and education
  organization founded by Srinivas Goud. It develops frameworks for understanding
  financial stability, pressure, capacity, and continuity.
</p>
<p className="mt-6 max-w-3xl text-sm leading-7 text-zinc-400">
  WPAG does not provide banking, lending, brokerage, investment-advisory, or
  other regulated financial services.
</p>
        <div className="mt-10 max-w-3xl">
          <h3 className="text-lg font-medium leading-7 text-zinc-200">
            Begin with HFOS Phase 1 — Stability
          </h3>
          <p className={`mt-3 ${typography.body}`}>
            A structured introduction to understanding financial stability before
            financial growth. A free preview is available to read now.
          </p>
          <a
            href="/books"
            className="mt-3 inline-block py-2 text-base leading-7 text-zinc-200 underline underline-offset-4 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Explore the book →
          </a>
        </div>
      </Container>
    </section>
  );
}