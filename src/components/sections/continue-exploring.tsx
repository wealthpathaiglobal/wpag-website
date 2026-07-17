import { Container } from "@/components/layout/container";
import { Button } from "@/ui/button";

type ContinueExploringProps = {
  title: string;
  description: string;
  href: string;
  buttonText: string;
};

export function ContinueExploring({
  title,
  description,
  href,
  buttonText,
}: ContinueExploringProps) {
  return (
    <section className="border-t border-zinc-900 bg-black py-24">
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
            Continue Exploring
          </p>

          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white">
            {title}
          </h2>

          <p className="mt-6 text-lg leading-8 text-zinc-400">
            {description}
          </p>

          <div className="mt-10">
            <Button href={href}>
              {buttonText} →
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}