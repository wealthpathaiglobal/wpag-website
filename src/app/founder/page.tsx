import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/layout/container";
import { ContinueExploring } from "@/components/sections/continue-exploring";

export default function FounderPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="py-32">
          <Container>
            <div className="max-w-4xl">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-zinc-500">
                Founder
              </p>

              <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Every framework begins with a question.
              </h1>

              <p className="mt-10 max-w-2xl text-lg leading-8 text-zinc-400">
                Wealth Path AI Global began with a simple observation:
                financial success and financial collapse often followed
                patterns that were rarely explained through structure.
                That question became the starting point for years of
                research that later evolved into the Human Financial
                Operating System (HFOS).
              </p>
            </div>
          </Container>
        </section>
      </main>

      <ContinueExploring
        title="Contact WPAG"
        description="Connect with Wealth Path AI Global for research, collaboration, or general enquiries."
        href="/contact"
        buttonText="Contact WPAG"
      />

      <SiteFooter />
    </>
  );
}