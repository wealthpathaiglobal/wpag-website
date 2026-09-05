"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Container } from "@/components/layout/container";

const navigation = [
  { name: "About", href: "/about" },
  { name: "HFOS", href: "/hfos" },
  { name: "Books", href: "/books" },
  { name: "Research", href: "/research" },
  { name: "Insights", href: "/insights" },
  { name: "Founder", href: "/founder" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/90 text-white backdrop-blur">
      <Container>
        <div className="flex h-20 items-center justify-between gap-3">
          <Link
            href="/"
            onClick={closeMenu}
            aria-label="Wealth Path AI Global home"
            className="flex min-w-0 items-center gap-2.5 text-white sm:gap-3"
          >
            <Image
              src="/brand/wpag-primary-master.svg"
              alt=""
              width={530}
              height={235}
              priority
              className="h-7 w-auto shrink-0 sm:h-8"
            />
            <span className="truncate whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-sm sm:tracking-[0.16em]">
              Wealth Path AI Global
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-8 md:flex"
          >
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                aria-current={pathname === item.href ? "page" : pathname.startsWith(item.href + "/") ? "location" : undefined}
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
              className="inline-flex h-11 w-11 items-center justify-center border border-white/20 text-white transition hover:border-white/50 md:hidden"
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
          className="border-t border-white/10 bg-[#0A0A0A] md:hidden"
        >
          <Container className="py-6">
            <div className="flex flex-col">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                aria-current={pathname === item.href ? "page" : pathname.startsWith(item.href + "/") ? "location" : undefined}
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
