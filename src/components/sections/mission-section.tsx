import { Container } from "@/components/layout/container";
import { typography } from "@/styles/typography";

export function MissionSection() {
  return (
    <section
     id="mission"
      className="border-t border-zinc-900 bg-black py-32 text-white"
    >
      <Container>
        <p className={`mb-6 ${typography.caption}`}>OUR MISSION</p>

        <h2 className="max-w-5xl break-words text-4xl font-semibold leading-tight sm:text-5xl">
          We build structured financial systems that help people understand,
          measure, and preserve financial stability.
        </h2>

        <p className="mt-10 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl sm:leading-9">
          Wealth Path AI Global develops institutional frameworks, research,
          and practical systems designed to move financial decision-making
          beyond advice toward measurable stability.
        </p>
      </Container>
    </section>
  );
}