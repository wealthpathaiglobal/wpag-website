import { Container } from "@/components/layout/container";
import { typography } from "@/styles/typography";

export function MissionSection() {
  return (
    <section className="border-t border-zinc-900 bg-black py-32 text-white">
      <Container>
        <p className={`mb-6 ${typography.caption}`}>OUR MISSION</p>

        <h2 className="max-w-5xl text-5xl font-semibold leading-tight">
          We build structured financial systems that help people understand,
          measure, and preserve financial stability.
        </h2>

        <p className="mt-10 max-w-3xl text-xl leading-9 text-zinc-400">
          Wealth Path AI Global develops institutional frameworks, research,
          and practical systems designed to move financial decision-making
          beyond advice toward measurable stability.
        </p>
      </Container>
    </section>
  );
}