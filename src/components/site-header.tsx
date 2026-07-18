"use client";

import Link from "next/link";
import { useState } from "react";

import { Container } from "@/components/layout/container";

const navigation = [
  { name: "About", href: "/about" },
  { name: "HFOS", href: "/hfos" },
  { name: "Research", href: "/research" },
  { name: "Insights", href: "/insights" },
  { name: "Founder", href: "/founder" },
];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 text-white backdrop-blur">
      <Container>
        <div className="flex h-20 items-center justify-between gap-3">
          <Link
            href="/"
            onClick={closeMenu}
            className="min-w-0 truncate whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-white sm:text-sm sm:tracking-[0.2em]"
          >
            Wealth Path AI Global
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-8 md:flex"
          >
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-zinc-400 transition hover:text-white"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/contact"
              onClick={closeMenu}
              className="hidden border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/50 sm:inline-flex"
            >
              Contact
            </Link>

            <button
              type="button"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center border border-white/20 text-white transition hover:border-white/50 md:hidden"
            >
              <span className="sr-only">
                {isMenuOpen ? "Close menu" : "Open menu"}
              </span>

              <span aria-hidden="true" className="text-xl leading-none">
                {isMenuOpen ? "×" : "☰"}
              </span>
            </button>
          </div>
        </div>
      </Container>

      {isMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-white/10 bg-black md:hidden"
        >
          <Container className="py-6">
            <div className="flex flex-col">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMenu}
                  className="border-b border-white/10 py-4 text-base text-zinc-300 transition last:border-b-0 hover:text-white"
                >
                  {item.name}
                </Link>
              ))}

              <Link
                href="/contact"
                onClick={closeMenu}
                className="mt-6 inline-flex justify-center border border-white bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Contact WPAG
              </Link>
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}