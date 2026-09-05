import Link from "next/link";
export function PolicyReturn() {
  return <nav aria-label="Return navigation" className="mb-8 mt-8 flex flex-wrap gap-4 text-base text-neutral-900 bg-white p-4">
    <Link className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2" href="/">Home</Link>
    <Link className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2" href="/books">Books</Link>
    <Link className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2" href="/books/hfos-phase-1-stability">Back to Phase 1</Link>
  </nav>;
}
