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
  Structured insights for long-term financial stability.
</h2>

        <p className={`mt-10 max-w-3xl ${typography.bodyLarge}`}>
  Explore structured articles, observations, and institutional insights that
  support stronger financial decision-making and long-term financial stability.
</p>
      </Container>
    </section>
  );
}