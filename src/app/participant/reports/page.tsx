import Link from "next/link";

import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { listParticipantPreliminaryReports } from "@/lib/services/participant/participant-preliminary-report-service";

function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(parsed); }

export default async function ParticipantReportsPage() {
  await requireParticipantAccess("/participant/reports");
  const reports = await listParticipantPreliminaryReports();
  return (
    <main className="min-h-screen bg-[#f4f2ed] px-5 py-10 text-black sm:px-8"><div className="mx-auto max-w-5xl">
      <Link href="/participant/dashboard" className="text-sm text-black/55 hover:text-black">← Back to Participant Dashboard</Link>
      <header className="mt-8 border-b border-black pb-8"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50">Participant Reports</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.04em]">Preliminary Research Reports</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-black/65">These reports are preliminary research records based on submitted information and authorized human review. They are not financial advice, diagnosis, treatment, or an execution instruction.</p></header>
      <section className="py-10">{reports.length === 0 ? <div className="border border-black/20 bg-white/35 p-10 text-center"><h2 className="font-serif text-3xl">No report available</h2><p className="mt-4 text-sm leading-7 text-black/60">Only reports formally released through the governed review lifecycle appear here.</p></div> : <div className="grid gap-5">{reports.map((report) => <article key={report.reportId} className="border border-black/20 bg-white/40 p-6 sm:p-8"><p className="text-xs uppercase tracking-[0.2em] text-black/45">{report.reportNumber} · Released {date(report.releasedAt)}</p><h2 className="mt-4 font-serif text-3xl">{report.reportTitle}</h2><p className="mt-3 text-sm text-black/55">Assessment #{report.assessmentNumber}</p><Link href={`/participant/reports/${report.reportId}`} className="mt-6 inline-flex border border-black px-5 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-black hover:text-white">View Report</Link></article>)}</div>}</section>
      <aside className="border-t border-black py-8 text-sm leading-7 text-black/60">Preliminary research report only. Released reports include an immutable PDF for secure download. This material does not create financial advice, diagnosis, treatment, transition, execution, Pilot, or Production authority.</aside>
    </div></main>
  );
}
