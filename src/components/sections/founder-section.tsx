import { Container } from "@/components/layout/container";
import { typography } from "@/styles/typography";

export function FounderSection() {
  return (
    <section
      id="founder"
      className="border-t border-zinc-900 bg-black py-32 text-white"
    >
      <Container>
        <p className={`mb-6 ${typography.caption}`}>
          FOUNDER
        </p>

        <h2 className={`max-w-5xl ${typography.display}`}>
          Building a long-term framework for financial stability.
        </h2>

        <p className={`mt-10 max-w-3xl ${typography.bodyLarge}`}>
          Wealth Path AI Global was founded by Srinivas Goud with the objective
          of developing structured financial systems that help individuals,
          professionals, and institutions understand, measure, diagnose, and
          preserve long-term financial stability through structured frameworks
          and research.
        </p>
      </Container>
    </section>
  );
}