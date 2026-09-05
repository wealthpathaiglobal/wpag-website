// Document navigation ensures catalogue Explore opens the product at scroll position zero.
import { BookShare } from "./reader-engagement";
import Image from "next/image";
import Link from "next/link";

export function BookSummary({ catalogue = false }: { catalogue?: boolean }) {
  return <div className="book-grid">
    <div className="book-cover-stage">
      <Image className="book-cover" src="/books/hfos-phase1-800.webp" width={800} height={1200} alt="HFOS — Phase 1: Stability book cover" priority sizes="(max-width: 700px) 132px, (max-width: 1000px) 280px, 360px" quality={90}/>
    </div>
    <div>
      <p className="book-kicker">HFOS · Phase 1 · Digital edition</p>
      {catalogue ? <h2>Stability</h2> : <h1>HFOS — Phase 1: Stability</h1>}
      <p>A Structural System for Financial Stability</p>
      {catalogue ? <>
        <p>HFOS Phase 1 introduces a foundational question: what makes a financial system stable before it begins pursuing growth?</p>
        <p>The book explains how obligations, income flow, available capacity, financial pressure, and resilience interact over time.</p>
      </> : <p>This book is for readers who want to understand financial stability before focusing on financial growth.</p>}
      <p className="book-availability">{catalogue ? "Free preview available" : "Free preview — available now"}</p>
      <div className="book-actions">
        {catalogue ? <a href="/books/hfos-phase-1-stability">Explore the book</a> : <Link href="/books/hfos-phase-1-stability/preview">Read the free preview</Link>}
        {!catalogue && <BookShare product />}
      </div>
      {!catalogue && <>
        <p>Financial stability is more than having income or making regular payments. A financial system also needs enough capacity to absorb pressure, continue meeting important obligations, and withstand disruption.</p>
        <p>HFOS Phase 1 introduces the structural foundations of that stability and the relationships that can make a financial system more resilient or more fragile over time.</p>
      </>}
      <p className="book-edition-status">Full digital edition — <strong>₹199 planned</strong><br/>Purchasing is not yet available.</p>
      {catalogue && <p className="book-edition-status">Planned full-edition access: 24 months.</p>}
      <p className="book-terms">Educational only. This book does not provide personal financial advice, assessment, or research enrolment.</p>
    </div>
  </div>;
}
