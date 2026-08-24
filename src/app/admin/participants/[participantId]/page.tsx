import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import AdminDashboardReturnLink from "@/components/admin/AdminDashboardReturnLink";
import LifecycleActionPanel from "@/components/admin/LifecycleActionPanel";
import ParticipantInvitationPanel from "@/components/admin/ParticipantInvitationPanel";
import HfosMeasurementFoundationCard from "@/components/admin/HfosMeasurementFoundationCard";
import ResearchControlsFoundationCard from "@/components/admin/ResearchControlsFoundationCard";
import ResearchWave3GovernanceCard from "@/components/admin/ResearchWave3GovernanceCard";
import ResearchWave4ReadinessCard from "@/components/admin/ResearchWave4ReadinessCard";
import ResearchParticipantRequestPanel from "@/components/admin/ResearchParticipantRequestPanel";
import { requireAdminAccess } from "@/lib/auth/admin-access";
import { getParticipantCore, startParticipantProjectionLoads } from "@/lib/services/admin/admin-participant-detail-service";

interface ParticipantDetailPageProps { params: Promise<{ participantId: string }> }

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
function formatStatus(status: string | null) { return status ? status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : "—"; }
function getStatusClasses(status: string | null) {
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  if (status === "pending_enrollment") return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  if (status === "paused") return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  if (status === "completed") return "border-violet-400/20 bg-violet-400/10 text-violet-300";
  if (status === "withdrawn") return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  return "border-white/10 bg-white/5 text-white/70";
}

export function ProjectionFallback({ label }: { label: string }) {
  return <section aria-busy="true" aria-label={`${label} loading`} className="mt-8 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-6 motion-reduce:animate-none"><p className="text-sm text-white/55">Loading {label.toLowerCase()}…</p><div className="mt-4 h-12 rounded-xl bg-white/5" /></section>;
}

export async function GovernedProjection<T>({ promise, label, children }: { promise: Promise<T>; label: string; children: (value: T) => ReactNode }) {
  let result: { ok: true; value: T } | { ok: false };
  try { result = { ok: true, value: await promise }; }
  catch (error) { console.error(`Participant ${label} projection failed`, error); result = { ok: false }; }
  if (!result.ok) return <section role="alert" className="mt-8 rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-6"><h2 className="font-semibold text-rose-100">{label} unavailable</h2><p className="mt-2 text-sm text-rose-100/70">This governed information could not be loaded. No actions are available for this section.</p></section>;
  return children(result.value);
}

export default async function ParticipantDetailPage({ params }: ParticipantDetailPageProps) {
  const staff = await requireAdminAccess("/admin/dashboard");
  const { participantId } = await params;
  const participant = await getParticipantCore(participantId);
  const loads = startParticipantProjectionLoads(participantId, staff.auth_user_id);

  return <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <nav className="mb-8" aria-label="Participant workspace navigation"><AdminDashboardReturnLink /></nav>
    <header className="border-b border-white/10 pb-8">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">Participant Workspace</p>
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{participant.full_name ?? "Unnamed Participant"}</h1><p className="mt-3 font-mono text-sm text-white/45">{participant.participant_code ?? participant.id}</p></div><span className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-medium ${getStatusClasses(participant.lifecycle_status)}`}>{formatStatus(participant.lifecycle_status)}</span></div>
    </header>

    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Participant information">{[['Email', participant.email ?? '—'], ['Enrollment Date', formatDate(participant.enrollment_date)], ['Registered Date', formatDate(participant.created_at)], ['Auth Account', participant.auth_user_id ? 'Linked' : 'Not linked']].map(([label,value]) => <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-white/35">{label}</p><p className="mt-3 break-all text-sm text-white/80">{value}</p></article>)}</section>

    <Suspense fallback={<ProjectionFallback label="Assessment summary" />}><GovernedProjection promise={loads.assessmentSummary} label="Assessment summary">{(summary) => <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-label="Assessment summary"><p className="text-xs uppercase tracking-wider text-white/35">Participant assessment</p><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs text-white/40">Status</p><p className="mt-2">{formatStatus(summary?.session_status ?? null)}</p></div><div><p className="text-xs text-white/40">Modules</p><p className="mt-2">{summary ? `${summary.completed_module_count} of ${summary.total_module_count}` : "—"}</p></div><div><p className="text-xs text-white/40">Versions</p><p className="mt-2">{summary ? `${summary.assessment_version} · ${summary.hfos_version}` : "—"}</p></div><div><p className="text-xs text-white/40">Submitted</p><p className="mt-2">{formatDate(summary?.submitted_at ?? null)}</p></div></div>{summary?.session_status === "submitted" && summary.assessment_id ? <Link prefetch={false} href={`/admin/reviews/assessments/${summary.assessment_id}`} className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-500">Open Assessment Review</Link> : null}</section>}</GovernedProjection></Suspense>
    <Suspense fallback={<ProjectionFallback label="Measurement summary" />}><GovernedProjection promise={loads.measurementSummary} label="Measurement summary">{(summary) => <HfosMeasurementFoundationCard summary={summary} />}</GovernedProjection></Suspense>
    <Suspense fallback={<ProjectionFallback label="Research controls" />}><GovernedProjection promise={loads.researchControls} label="Research controls">{(status) => <ResearchControlsFoundationCard status={status} />}</GovernedProjection></Suspense>
    <Suspense fallback={<ProjectionFallback label="Research requests" />}><GovernedProjection promise={loads.researchRequests} label="Research requests">{(requests) => <ResearchParticipantRequestPanel participantId={participantId} requests={requests} />}</GovernedProjection></Suspense>
    <Suspense fallback={<ProjectionFallback label="Wave 3 governance" />}><GovernedProjection promise={loads.researchWave3} label="Wave 3 governance">{(overview) => <ResearchWave3GovernanceCard overview={overview} />}</GovernedProjection></Suspense>
    <Suspense fallback={<ProjectionFallback label="Wave 4 readiness" />}><GovernedProjection promise={loads.researchWave4} label="Wave 4 readiness">{(overview) => <ResearchWave4ReadinessCard participantId={participantId} overview={overview} />}</GovernedProjection></Suspense>
    <Suspense fallback={<ProjectionFallback label="Evidence" />}><GovernedProjection promise={loads.evidence} label="Evidence">{(evidence) => <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-label="Participant evidence"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Evidence</h2><p className="mt-1 text-sm text-white/45">Governed assessment evidence and current verification status.</p></div><Link prefetch={false} href="/admin/evidence" className="text-sm text-sky-300">Open Evidence Queue</Link></div>{evidence.length === 0 ? <p className="mt-5 text-sm text-white/45">No evidence is available for this participant.</p> : <div className="mt-5 space-y-3">{evidence.map((item) => <Link prefetch={false} key={item.documentId} href={`/admin/evidence/${item.documentId}`} className="flex flex-col gap-2 rounded-xl border border-white/10 p-4 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"><span>{item.documentName} · v{item.versionNumber}</span><span className="text-sm text-white/50">{formatStatus(item.verificationStatus)}</span></Link>)}</div>}</section>}</GovernedProjection></Suspense>

    <Suspense fallback={<ProjectionFallback label="Invitation controls" />}><GovernedProjection promise={loads.invitation} label="Invitation controls">{(invitation) => <ParticipantInvitationPanel participantId={participant.id} authUserId={participant.auth_user_id} lifecycleStatus={participant.lifecycle_status} invitation={invitation} />}</GovernedProjection></Suspense>
    <LifecycleActionPanel participantId={participant.id} lifecycleStatus={participant.lifecycle_status} />
    <Suspense fallback={<ProjectionFallback label="Lifecycle timeline" />}><GovernedProjection promise={loads.lifecycleHistory} label="Lifecycle timeline">{(history) => <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"><div className="border-b border-white/10 px-6 py-5"><h2 className="text-lg font-semibold">Lifecycle Timeline</h2><p className="mt-1 text-sm text-white/45">Immutable history of participant lifecycle transitions.</p></div>{history.length === 0 ? <div className="px-6 py-14 text-center"><p className="text-sm text-white/50">No lifecycle history is available.</p></div> : <div className="divide-y divide-white/5">{history.map((event) => <article key={event.id} className="grid gap-4 px-6 py-5 md:grid-cols-[180px_1fr]"><time dateTime={event.changed_at} className="text-sm text-white/45">{formatDate(event.changed_at)}</time><div><div className="flex flex-wrap items-center gap-2">{event.from_status ? <><span className="text-sm text-white/45">{formatStatus(event.from_status)}</span><span className="text-white/25" aria-hidden="true">→</span></> : null}<span className="font-medium text-white">{formatStatus(event.to_status)}</span></div>{event.transition_reason ? <p className="mt-2 text-sm leading-6 text-white/55">{event.transition_reason}</p> : null}{event.changed_by ? <p className="mt-2 text-xs text-white/30">Changed by: {event.changed_by}</p> : null}</div></article>)}</div>}</section>}</GovernedProjection></Suspense>
  </div></main>;
}
