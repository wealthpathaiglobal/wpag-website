import Link from "next/link";
import { Container } from "@/components/layout/container";

const navigation = [
  { name: "About", href: "/about" },
  { name: "HFOS", href: "/hfos" },
  { name: "Research", href: "/research" },
  { name: "Insights", href: "/insights" },
  { name: "Founder", href: "/founder" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.2em] text-white"
        >
          Wealth Path AI Global
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
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

        <Link
          href="/contact"
          className="border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/50"
        >
          Contact
        </Link>
      </Container>
    </header>
  );
}