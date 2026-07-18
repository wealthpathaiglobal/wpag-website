import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main className="bg-black text-white">
        <section className="border-b border-white/10">
          <Container className="py-40">
            <p className="mb-8 text-sm uppercase tracking-[0.35em] text-white/40">
              404
            </p>

            <h1 className="max-w-4xl text-6xl font-bold leading-tight md:text-7xl">
              The requested page could not be found.
            </h1>

            <p className="mt-12 max-w-3xl text-xl leading-relaxed text-white/60">
              The page may have been moved, renamed, or may no longer be
              available. Return to the Wealth Path AI Global homepage to
              continue exploring the Human Financial Operating System,
              research, and institutional work.
            </p>

            <div className="mt-12">
              <Link
                href="/"
                className="inline-flex border border-white bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Return Home →
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}