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
  Wealth Path AI Global (WPAG) is an independent research and development
  organization focused on designing structured financial frameworks that help
  individuals, professionals, and institutions understand, diagnose, measure,
  and preserve financial stability.
</p>
      </Container>
    </section>
  );
}