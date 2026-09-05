import Link from "next/link";
import { publicPreview } from "@/lib/books/public-preview";
export const metadata={title:"Free preview — HFOS Phase 1",description:"Read the exact opening chapters of HFOS Phase 1: Stability through section 2.4, Delayed Breakdown. Educational only.",alternates:{canonical:"/books/hfos-phase-1-stability/preview"}};
export default function Preview() {
  return <>
    <p className="book-kicker">Free preview · Educational only</p>
    <h1>Read the opening chapters</h1>
    <article className="book-preview">
      {publicPreview.map(part => <section key={part.id} aria-label={part.id}>
        {part.paragraphs.map(p => {
          if (p.style === "Heading1" || p.style === "MatterHeading") return <h2 key={p.id} id={p.id}>{p.text}</h2>;
          if (p.style === "Heading2") return <h3 key={p.id} id={p.id}>{p.text}</h3>;
          if (p.style === "TOCChapter" || p.style === "TOCSection") return <p key={p.id} id={p.id} className={`book-toc-entry ${p.style === "TOCChapter" ? "book-toc-chapter" : "book-toc-section"}`}><a href={`#${p.links[0].target}`}>{p.text}</a></p>;
          return <p key={p.id} id={p.id}>{p.text}</p>;
        })}
      </section>)}
    </article>
    <div className="book-preview-end">
      <p>End of free preview · §2.4 Delayed Breakdown. Payments are not yet enabled.</p>
      <Link href="/books/hfos-phase-1-stability">Back to the book</Link>
    </div>
  </>;
}
