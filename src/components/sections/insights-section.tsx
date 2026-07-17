import { Container } from "@/components/layout/container";
import { typography } from "@/styles/typography";

export function InsightsSection() {
  return (
    <section
      id="insights"
      className="border-t border-zinc-900 bg-black py-32 text-white"
    >
      <Container>
        <p className={`mb-6 ${typography.caption}`}>
          INSIGHTS
        </p>

        <h2 className={`max-w-5xl ${typography.display}`}>
          Insights that transform financial thinking.
        </h2>

        <p className={`mt-10 max-w-3xl ${typography.bodyLarge}`}>
          Discover structured articles, observations, and institutional insights
          designed to improve financial decision-making and long-term stability.
        </p>
      </Container>
    </section>
  );
}