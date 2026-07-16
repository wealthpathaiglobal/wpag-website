import Link from "next/link";

import { Container } from "@/components/layout/container";

const footerNavigation = [
  { name: "About", href: "/about" },
  { name: "HFOS", href: "/hfos" },
  { name: "Research", href: "/research" },
  { name: "Insights", href: "/insights" },
  { name: "Founder", href: "/founder" },
  { name: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-900 bg-black py-16 text-white">
      <Container>
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.2em]"
            >
              Wealth Path AI Global
            </Link>

            <p className="mt-5 max-w-md text-base leading-7 text-zinc-500">
              Building structured systems for financial stability, research,
              education, and long-term institutional knowledge.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-8 gap-y-4 md:justify-self-end"
          >
            {footerNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-zinc-400 transition hover:text-white"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-zinc-900 pt-6 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Wealth Path AI Global. All rights reserved.</p>

          <p>Structure precedes speed.</p>
        </div>
      </Container>
    </footer>
  );
}