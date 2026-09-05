import { ReaderControls } from "@/components/books/reader-controls";
import Link from "next/link";
import { publicPreview } from "@/lib/books/public-preview";
export const metadata={title:"Free preview — HFOS Phase 1",description:"Read the exact opening chapters of HFOS Phase 1: Stability through section 2.4, Delayed Breakdown. Educational only.",alternates:{canonical:"/books/hfos-phase-1-stability/preview"}};
export default function Preview() {
  return <>
    <p id="reader-front" tabIndex={-1} className="book-kicker">Free preview · Educational only</p>
    <h1>Read the opening chapters</h1>
    <ReaderControls entries={publicPreview.flatMap(part => part.paragraphs.filter(p => p.style === "Heading1" || p.style === "Heading2").map(p => ({ id: p.id, title: p.text, chapter: p.style === "Heading1" })))} />
    <article className="book-preview" lang="en" aria-label="HFOS Phase 1 free preview">
      {publicPreview.map(part => <section key={part.id} aria-label={part.id === "front-matter" ? "Front matter" : part.id === "ch01" ? "Chapter 1" : "Chapter 2"}>
        {part.paragraphs.map(p => {
          if (p.style === "Heading1" || p.style === "MatterHeading") return <h2 tabIndex={-1} key={p.id} id={p.id}>{p.text}</h2>;
          if (p.style === "Heading2") return <h3 tabIndex={-1} key={p.id} id={p.id}>{p.text}</h3>;
          if (p.style === "TOCChapter" || p.style === "TOCSection") return <p key={p.id} id={p.id} className={`book-toc-entry ${p.style === "TOCChapter" ? "book-toc-chapter" : "book-toc-section"}`}><a href={`#${p.links[0].target}`}>{p.text}</a></p>;
          return <p className={p.style === "ChapterLabel" ? "reader-chapter-label" : undefined} key={p.id} id={p.id}>{p.text}</p>;
        })}
      </section>)}
    </article>
    <div id="reader-end" tabIndex={-1} className="book-preview-end">
      <h2>End of free preview</h2>
      <p>You have reached §2.4 Delayed Breakdown. The full edition is coming soon; payments are not yet enabled.</p>
      <Link href="/books/hfos-phase-1-stability">Back to the book</Link>
    </div>
  </>;
}
