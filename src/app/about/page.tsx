import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Wealth Path AI Global, an independent research and development organization building structured financial systems for long-term stability.",
};
export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <Container>
          <section className="flex min-h-screen flex-col justify-center pt-20">
            <p className={`mb-6 ${typography.caption}`}>
              ABOUT WEALTH PATH AI GLOBAL
            </p>

            <h1 className={`max-w-5xl ${typography.display}`}>
              Building structured financial systems for long-term stability.
            </h1>

            <p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>
              Wealth Path AI Global (WPAG) is an independent research and
              development organization focused on designing structured financial
              frameworks that help individuals, professionals, and institutions
              understand, diagnose, measure, and preserve financial stability.
            </p>
          </section>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}