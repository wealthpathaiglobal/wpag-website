import Link from "next/link";
import { notFound } from "next/navigation";

import PreliminaryReportContentView from "@/components/reports/PreliminaryReportContentView";
import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { loadParticipantPreliminaryReport, ParticipantPreliminaryReportServiceError } from "@/lib/services/participant/participant-preliminary-report-service";
import { loadParticipantPreliminaryReportArtifact, ParticipantPreliminaryReportArtifactServiceError } from "@/lib/services/participant/participant-preliminary-report-artifact-service";

interface Props { params: Promise<{ reportId: string }> }
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeStyle: "short" }).format(parsed); }

export default async function ParticipantReportDetailPage({ params }: Props) {
  await requireParticipantAccess("/participant/reports");
  const { reportId } = await params;
  let report;
  try { report = await loadParticipantPreliminaryReport(reportId); }
  catch (error) { if (error instanceof ParticipantPreliminaryReportServiceError && error.kind === "not_found") notFound(); throw error; }
  if (!report) notFound();
  let artifact = null;
  try { artifact = await loadParticipantPreliminaryReportArtifact(report.reportId); }
  catch (error) {
    if (!(error instanceof ParticipantPreliminaryReportArtifactServiceError) || error.kind !== "not_found") throw error;
  }
  return (
    <main className="min-h-screen bg-[#f4f2ed] px-5 py-10 text-black sm:px-8"><div className="mx-auto max-w-4xl">
      <Link href="/participant/reports" className="text-sm text-black/55 hover:text-black">← Back to Reports</Link>
      <header className="mt-8 border-b border-black pb-8"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50">{report.reportNumber} · Version {report.currentVersion}</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.04em]">{report.reportTitle}</h1><p className="mt-5 text-sm text-black/55">Released {date(report.releasedAt)} · Assessment #{report.assessmentNumber}</p></header>
      <aside className="my-8 border border-black bg-black p-6 text-sm leading-7 text-white/80">This is a preliminary research report based on participant-provided information and human review. It is not financial advice, diagnosis, treatment, a recommendation, or an execution instruction.</aside>
      {artifact ? <section className="mb-8 border border-black/20 bg-white/50 p-6"><h2 className="font-serif text-2xl">Released PDF</h2><p className="mt-3 text-sm text-black/60">{artifact.filename} · Version {artifact.reportVersion} · {(artifact.byteSize / 1024).toFixed(1)} KB</p><a href={`/api/participant/preliminary-reports/${report.reportId}/download`} className="mt-5 inline-flex bg-black px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-black/80">Download PDF</a></section> : null}
      <PreliminaryReportContentView content={report.content} />
      <aside className="mt-8 border-t border-black py-8 text-sm leading-7 text-black/60">This release remains a governed preliminary research record. The PDF contains no scoring output or participant-facing advisory authority.</aside>
    </div></main>
  );
}
