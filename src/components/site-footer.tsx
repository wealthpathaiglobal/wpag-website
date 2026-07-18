import Link from "next/link";

import { Container } from "@/components/layout/container";

const footerNavigation = [
  { name: "About", href: "/about" },
  { name: "HFOS", href: "/hfos" },
  { name: "Research", href: "/research" },
  { name: "Insights", href: "/insights" },
  { name: "Founder", href: "/founder" },
  { name: "Contact", href: "/contact" },

  // Legal
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Use", href: "/terms-of-use" },
  { name: "Cookie Policy", href: "/cookie-policy" },
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
            className="grid grid-cols-2 gap-x-10 gap-y-4 md:grid-cols-3 md:justify-self-end"
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

        <div className="mt-16 flex flex-col gap-4 border-t border-zinc-900 pt-6 text-sm text-zinc-600 sm:flex-row sm:items-start sm:justify-between">
          <p>© 2026 Wealth Path AI Global. All rights reserved.</p>

          <div className="space-y-2 text-sm text-zinc-600">
            <p>Structure precedes speed.</p>
            <p>Evidence precedes scale.</p>
            <p>Stability precedes growth.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}