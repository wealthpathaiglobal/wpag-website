import Link from "next/link";
import { notFound } from "next/navigation";

import PreliminaryReportActionPanel from "@/components/admin/preliminary-reports/PreliminaryReportActionPanel";
import { requireRole } from "@/lib/auth/authorization";
import { adminPreliminaryReportService, AdminPreliminaryReportServiceError } from "@/lib/services/admin/admin-preliminary-report-service";
import { adminPreliminaryReportArtifactService } from "@/lib/services/admin/admin-preliminary-report-artifact-service";

interface Props { params: Promise<{ reportId: string }> }
function date(value: string | null) { if (!value) return "—"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(parsed); }
function label(value: string) { return value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }

export default async function PreliminaryReportDetailPage({ params }: Props) {
  const staff = await requireRole("administrator");
  const { reportId } = await params;
  let report;
  try { report = await adminPreliminaryReportService.getReport(reportId, staff.auth_user_id); }
  catch (error) { if (error instanceof AdminPreliminaryReportServiceError && ["Preliminary report was not found.", "Preliminary report ID is required."].includes(error.message)) notFound(); throw error; }
  if (!report) notFound();
  const storedArtifact = await adminPreliminaryReportArtifactService.get(report.reportId, staff.auth_user_id);
  const artifact = storedArtifact ? {
    artifactId: storedArtifact.artifactId,
    reportId: storedArtifact.reportId,
    reportVersion: storedArtifact.reportVersion,
    status: storedArtifact.status,
    filename: storedArtifact.filename,
    mimeType: storedArtifact.mimeType,
    byteSize: storedArtifact.byteSize,
    sha256: storedArtifact.sha256,
    generatedAt: storedArtifact.generatedAt,
    releasedAt: storedArtifact.releasedAt,
  } : null;
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
      <nav className="flex flex-wrap gap-5 text-sm"><Link href="/admin/reports" className="text-white/50 hover:text-white">← Back to Report Queue</Link><Link href={`/admin/reviews/assessments/${report.assessmentId}`} className="text-sky-300 hover:underline">Assessment Review</Link><Link href={`/admin/participants/${report.participantId}`} className="text-sky-300 hover:underline">Participant Workspace</Link></nav>
      <header className="mt-8 border-b border-white/10 pb-8"><p className="text-xs uppercase tracking-[0.3em] text-white/40">{report.reportNumber} · Version {report.currentVersion}</p><h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{report.reportTitle}</h1><p className="mt-3 text-sm text-white/55">{report.participantName} · {report.participantCode} · {label(report.reportStatus)}</p></header>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Assessment", `#${report.assessmentNumber} · ${label(report.assessmentType)}`], ["Prepared", date(report.preparedAt)], ["Approved", date(report.approvedAt)], ["Released", date(report.releasedAt)]].map(([title, value]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-white/35">{title}</p><p className="mt-3 text-sm text-white/75">{value}</p></article>)}</section>
      <PreliminaryReportActionPanel key={`${report.reportStatus}-${report.currentVersion}-${artifact?.artifactId ?? "none"}`} reportId={report.reportId} status={report.reportStatus} currentVersion={report.currentVersion} initialContent={report.currentContent} artifact={artifact} />
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 p-6"><h2 className="font-semibold">Version History</h2><div className="mt-4 space-y-4">{report.versionHistory.map((version) => <div key={version.version_number} className="border-t border-white/10 pt-4"><p className="text-sm">Version {version.version_number}</p><p className="mt-1 text-xs text-white/45">{version.change_summary ?? "Initial draft"} · {date(version.created_at)}</p><p className="mt-1 break-all font-mono text-[10px] text-white/25">{version.content_hash}</p></div>)}</div></article>
        <article className="rounded-2xl border border-white/10 p-6"><h2 className="font-semibold">Document Metadata</h2><div className="mt-4 space-y-4">{report.documents.length ? report.documents.map((document) => <div key={document.id} className="border-t border-white/10 pt-4"><p className="text-sm">{document.document_name}</p><p className="mt-1 text-xs text-white/45">{label(document.verification_status)} · {document.original_filename}</p></div>) : <p className="text-sm text-white/40">No linked documents.</p>}</div></article>
        <article className="rounded-2xl border border-white/10 p-6"><h2 className="font-semibold">Audit History</h2><div className="mt-4 space-y-4">{report.auditHistory.map((event, index) => <div key={`${event.event_type}-${event.event_timestamp}-${index}`} className="border-t border-white/10 pt-4"><p className="text-sm">{event.event_title}</p><p className="mt-1 text-xs text-white/45">{event.actor_name ?? "System"} · {date(event.event_timestamp)}</p></div>)}</div></article>
      </section>
    </div></main>
  );
}
