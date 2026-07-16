import { Container } from "@/components/layout/container";
import { typography } from "@/styles/typography";

export function AboutSection() {
  return (
    <section
      id="about"
      className="border-t border-white/10 bg-black py-32 text-white"
    >
      <Container>
        <p className={`mb-8 ${typography.caption}`}>
          ABOUT WEALTH PATH AI GLOBAL
        </p>

        <h2 className={`max-w-5xl ${typography.display}`}>
          Financial stability should be measurable, structured, and
          understandable—not dependent on advice alone.
        </h2>

        <p className={`mt-10 max-w-3xl ${typography.bodyLarge}`}>
          Wealth Path AI Global is building institutional financial frameworks
          that help individuals, professionals, and organizations understand,
          diagnose, measure, and preserve long-term financial stability through
          structured systems and research.
        </p>
      </Container>
    </section>
  );
}