import Link from "next/link";
import { notFound } from "next/navigation";

import ParticipantEvidenceResubmitForm from "@/components/evidence/ParticipantEvidenceResubmitForm";
import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { getCurrentUser } from "@/lib/auth/current-participant";
import { evidenceClassificationLabel } from "@/lib/evidence/evidence-classification";
import { ParticipantEvidenceFoundationServiceError, participantEvidenceFoundationService } from "@/lib/services/participant/participant-evidence-foundation-service";

const date = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const status = (value: string) => value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

export default async function ParticipantEvidenceDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  await requireParticipantAccess("/participant/evidence", ["active"]);
  const user = await getCurrentUser();
  const { documentId } = await params;
  let evidence;
  try { evidence = await participantEvidenceFoundationService.get(documentId, user.id); }
  catch (error) { if (error instanceof ParticipantEvidenceFoundationServiceError && error.kind === "not_found") notFound(); throw error; }
  return <main className="min-h-screen bg-[#f4f2ed] px-5 py-10 text-black sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/participant/evidence" className="text-sm text-black/55 hover:text-black">← Back to Evidence</Link>
    <header className="mt-8 border-b border-black pb-8"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50">Evidence Detail · Assessment #{evidence.assessmentNumber}</p><div className="mt-4 flex flex-wrap items-start justify-between gap-4"><h1 className="font-serif text-5xl tracking-[-0.04em]">{evidence.documentName}</h1><span className="border border-black px-4 py-2 text-xs font-semibold uppercase tracking-wider">{status(evidence.verificationStatus)}</span></div><p className="mt-5 text-sm text-black/60">{evidenceClassificationLabel(evidence.documentCategory)} · {evidenceClassificationLabel(evidence.documentType)}</p></header>
    <section className="grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]"><div className="space-y-8"><article className="border border-black/20 bg-white/40 p-6 sm:p-8"><h2 className="font-serif text-3xl">Current version</h2><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-black/50">Filename</dt><dd className="mt-1 break-all">{evidence.originalFilename}</dd></div><div><dt className="text-black/50">Version</dt><dd className="mt-1">{evidence.currentVersion}</dd></div><div><dt className="text-black/50">Submitted</dt><dd className="mt-1">{date(evidence.submittedAt)}</dd></div><div><dt className="text-black/50">Size</dt><dd className="mt-1">{Math.ceil(evidence.fileSizeBytes / 1024)} KiB</dd></div></dl>{evidence.verificationNotes && <div className="mt-6 border-l-2 border-black pl-4"><p className="text-xs uppercase tracking-wider text-black/50">Verification feedback</p><p className="mt-2 text-sm leading-7">{evidence.verificationNotes}</p></div>}<a href={`/api/participant/evidence/${evidence.documentId}/download`} className="mt-6 inline-flex border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white">Download Current Version</a></article>
      <article className="border border-black/20 bg-white/40 p-6 sm:p-8"><h2 className="font-serif text-3xl">Version history</h2><div className="mt-5 divide-y divide-black/10">{evidence.versions.map((version) => <div key={version.versionNumber} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto]"><div><p className="font-medium">Version {version.versionNumber} · {version.originalFilename}</p><p className="mt-1 text-sm text-black/55">{version.mimeType} · {Math.ceil(version.fileSizeBytes / 1024)} KiB · {date(version.submittedAt)}</p></div><a href={`/api/participant/evidence/${evidence.documentId}/download?version=${version.versionNumber}`} className="text-sm underline">Download</a></div>)}</div></article>
      <article className="border border-black/20 bg-white/40 p-6 sm:p-8"><h2 className="font-serif text-3xl">Verification history</h2><div className="mt-5 divide-y divide-black/10">{evidence.verificationHistory.map((event, index) => <div key={`${event.eventAt}-${index}`} className="py-5"><p className="font-medium">{status(event.verificationEvent)} · {status(event.verificationStatus)}</p><p className="mt-1 text-sm text-black/55">{date(event.eventAt)}</p>{event.participantNotes && <p className="mt-3 text-sm leading-7">{event.participantNotes}</p>}</div>)}</div></article></div>
      <ParticipantEvidenceResubmitForm documentId={evidence.documentId} canResubmit={evidence.canResubmit} />
    </section>
  </div></main>;
}
