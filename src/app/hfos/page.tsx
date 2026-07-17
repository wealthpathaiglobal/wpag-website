import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";

export default function HFOSPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <Container>
          <section className="flex min-h-screen flex-col justify-center pt-20">
            <p className={`mb-6 ${typography.caption}`}>
              HUMAN FINANCIAL OPERATING SYSTEM
            </p>

            <h1 className={`max-w-5xl ${typography.display}`}>
              A structural system for financial stability.
            </h1>

            <p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>
              HFOS is designed to help individuals, professionals, and
              institutions understand, diagnose, measure, and preserve
              financial stability through a structured operating system.
            </p>
          </section>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}