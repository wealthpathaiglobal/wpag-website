import { Container } from "@/components/layout/container";
import { typography } from "@/styles/typography";

export function ResearchSection() {
  return (
    <section
      id="research"
      className="border-t border-zinc-900 bg-black py-32 text-white"
    >
      <Container>
        <p className={`mb-6 ${typography.caption}`}>
          RESEARCH
        </p>

        <h2 className={`max-w-5xl ${typography.display}`}>
          Advancing the understanding of financial stability through research.
        </h2>

        <p className={`mt-10 max-w-3xl ${typography.bodyLarge}`}>
          Wealth Path AI Global conducts structured research to improve the
          diagnosis, measurement, and preservation of long-term financial
          stability through evidence-based frameworks and systematic analysis.
        </p>
      </Container>
    </section>
  );
}