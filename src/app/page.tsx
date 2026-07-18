import { AboutSection } from "@/components/sections/about-section";
import { ContactSection } from "@/components/sections/contact-section";
import { FounderSection } from "@/components/sections/founder-section";
import { InsightsSection } from "@/components/sections/insights-section";
import { MissionSection } from "@/components/sections/mission-section";
import { ResearchSection } from "@/components/sections/research-section";
import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Wealth Path AI Global develops structured financial systems and the Human Financial Operating System for long-term financial stability.",
};

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="flex min-h-[80vh] items-center py-24 lg:min-h-[calc(100vh-86px)]">
          <Container>
            <div className="max-w-5xl">
              <p className={`mb-6 ${typography.caption}`}>
                Wealth Path AI Global
              </p>

              <h1 className={typography.display}>
                Building the Human Financial Operating System.
              </h1>

              <p className={`mt-8 max-w-2xl ${typography.bodyLarge}`}>
                A structured framework for understanding financial stability,
                diagnosing pressure, and building long-term financial
                resilience.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button href="/hfos">Explore HFOS</Button>

                <Button href="/founder" variant="secondary">
                  About the Founder
                </Button>
              </div>

              <div className="mt-20 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
                Founded by Srinivas Goud
              </div>
            </div>
          </Container>
        </section>

        <MissionSection />
        <AboutSection />
        <ResearchSection />
        <InsightsSection />
        <FounderSection />
        <ContactSection />
      </main>

      <SiteFooter />
    </>
  );
}