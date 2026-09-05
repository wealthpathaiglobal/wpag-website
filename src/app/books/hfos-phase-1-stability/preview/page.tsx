import front from "@/content/books/front-matter.json";
import ch01 from "@/content/books/ch01.json";
import ch02 from "@/content/books/ch02.json";
export const metadata={title:"Free preview — HFOS Phase 1",description:"Read the exact opening chapters of HFOS Phase 1: Stability through section 2.4, Delayed Breakdown. Educational only.",alternates:{canonical:"/books/hfos-phase-1-stability/preview"}};
export default function Preview(){return <><p className="book-kicker">Free preview · Educational only</p><h1>Read the opening chapters</h1><article className="book-preview">{[front,ch01,ch02].map(part=><section key={part.id} aria-label={part.id}>{part.paragraphs.map(p=>p.style==="Heading1"?<h2 key={p.id} id={p.id}>{p.text}</h2>:p.style==="Heading2"?<h3 key={p.id} id={p.id}>{p.text}</h3>:<p key={p.id} id={p.id}>{p.text}</p>)}</section>)}</article><p>End of free preview · §2.4 Delayed Breakdown. Payments are not yet enabled.</p></>}
