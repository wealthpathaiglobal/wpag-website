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
      </Container>
    </section>
  );
}