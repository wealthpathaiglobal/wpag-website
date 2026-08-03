import Link from "next/link";

import { evidenceClassificationLabel } from "@/lib/evidence/evidence-classification";
import type { ParticipantEvidenceSummary } from "@/lib/types/evidence/evidence-foundation";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const formatStatus = (value: string) => value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

export default function ParticipantEvidenceList({ evidence }: { evidence: ParticipantEvidenceSummary[] }) {
  if (evidence.length === 0) return <div className="border border-black/20 bg-white/35 p-8"><h2 className="font-serif text-3xl">No evidence submitted</h2><p className="mt-3 text-sm leading-7 text-black/60">Use the secure upload form to add evidence for the active assessment.</p></div>;
  return <div className="grid gap-4">{evidence.map((item) => (
    <article key={item.documentId} className="border border-black/20 bg-white/40 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-black/50">Assessment #{item.assessmentNumber} · Version {item.currentVersion}</p><h2 className="mt-3 font-serif text-3xl">{item.documentName}</h2></div><span className="border border-black/25 px-3 py-1 text-xs">{formatStatus(item.verificationStatus)}</span></div>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-black/50">Classification</dt><dd className="mt-1">{evidenceClassificationLabel(item.documentCategory)} · {evidenceClassificationLabel(item.documentType)}</dd></div><div><dt className="text-black/50">Current filename</dt><dd className="mt-1 break-all">{item.originalFilename}</dd></div><div><dt className="text-black/50">Submitted</dt><dd className="mt-1">{formatDate(item.submittedAt)}</dd></div><div><dt className="text-black/50">Last updated</dt><dd className="mt-1">{formatDate(item.updatedAt)}</dd></div></dl>
      {item.canResubmit && <p className="mt-5 border-l-2 border-black pl-3 text-sm font-medium">Action required: open this evidence record to submit a corrected version.</p>}
      <Link href={`/participant/evidence/${item.documentId}`} className="mt-6 inline-flex border border-black px-5 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-black hover:text-white">Open Details</Link>
    </article>
  ))}</div>;
}
