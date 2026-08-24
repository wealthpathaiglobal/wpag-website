import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import ParticipantRegistryLink from "@/components/admin/ParticipantRegistryLink";
import AdminPerformanceTelemetry, { StreamCompletionMarker } from "@/components/admin/AdminPerformanceTelemetry";
import AuthenticatedSignOut from "@/components/auth/AuthenticatedSignOut";
import InternalNavigationFeedbackLink from "@/components/navigation/InternalNavigationFeedbackLink";
import { requireAdminAccess } from "@/lib/auth/admin-access";
import { getAdminRequestPerformanceContext, recordAdminServerPerformance } from "@/lib/observability/admin-performance";
import { adminApplicationService } from "@/lib/services/admin/admin-application-service";
import { adminAssessmentReviewService } from "@/lib/services/admin/admin-assessment-review-service";
import { adminEvidenceVerificationService } from "@/lib/services/admin/admin-evidence-verification-service";
import { adminPreliminaryReportService } from "@/lib/services/admin/admin-preliminary-report-service";
import { getParticipants } from "@/lib/services/admin/admin-participant-service";

type Participants = Awaited<ReturnType<typeof getParticipants>>;
type Applications = Awaited<ReturnType<typeof adminApplicationService.getPendingApplications>>;

export const ADMIN_DASHBOARD_OPERATIONAL_CARDS = [
  { label: "Assessment Reviews", href: "/admin/reviews/assessments" },
  { label: "Preliminary Reports", href: "/admin/reports" },
  { label: "Evidence Verification", href: "/admin/evidence" },
] as const;

export const ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS = [
  "Pending Applications",
  "Total Participants",
  "Pending Enrollment",
  "Active Participants",
] as const;

export function AdminAccountPanel({ displayName }: { displayName: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 lg:min-w-72"><p className="text-xs uppercase tracking-[0.2em] text-white/35">Signed in as</p><p className="mt-2 font-medium text-white">{displayName}</p><AuthenticatedSignOut workspace="Administration" tone="dark" /></div>;
}

export function AdminDashboardSections({ summary, applicationQueue, participantRegistry }: { summary: ReactNode; applicationQueue: ReactNode; participantRegistry: ReactNode }) {
  return <>{summary}{applicationQueue}{participantRegistry}</>;
}

export function AdminDashboardCardGroups({ operationalQueues, systemSummary }: { operationalQueues: ReactNode; systemSummary: ReactNode }) {
  return <section className="mt-8" aria-label="Admin Dashboard overview">
    <div><div className="mb-3 flex items-baseline justify-between gap-4"><h2 className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">Operational Queues</h2><p className="hidden text-xs text-white/30 sm:block">Open a governed administrator workspace</p></div><div className="grid gap-4 md:grid-cols-3">{operationalQueues}</div></div>
    <div className="mt-6"><div className="mb-3 flex items-baseline justify-between gap-4"><h2 className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">System Summary</h2><p className="hidden text-xs text-white/30 sm:block">Current informational totals</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{systemSummary}</div></div>
  </section>;
}

function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—"; }
function formatStatus(status: string) { return status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function participantStatus(status: string) {
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  if (status === "pending_enrollment") return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  if (status === "paused") return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  if (status === "completed") return "border-violet-400/20 bg-violet-400/10 text-violet-300";
  if (status === "withdrawn") return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  return "border-white/10 bg-white/5 text-white/70";
}
function applicationStatus(status: string) {
  if (status === "submitted") return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  if (status === "under_review") return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  if (status === "approved") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  if (status === "rejected") return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  return "border-white/10 bg-white/5 text-white/70";
}

export function DashboardStreamFallback({ label, compact = false }: { label: string; compact?: boolean }) {
  return <div aria-busy="true" aria-label={`${label} loading`} className={`${compact ? "min-h-40" : "mt-8 min-h-56"} animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-6 motion-reduce:animate-none`}><p className="text-sm text-white/50">Loading {label.toLowerCase()}…</p><div className="mt-5 h-12 rounded-xl bg-white/5" /></div>;
}
function StreamFailure({ label }: { label: string }) { return <div role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-6"><p className="font-medium text-rose-100">{label} unavailable</p><p className="mt-2 text-sm text-rose-100/70">This governed dashboard information could not be loaded.</p></div>; }
async function settle<T>(promise: Promise<T>, label: string): Promise<{ ok: true; value: T } | { ok: false }> {
  try { return { ok: true, value: await promise }; }
  catch (error) { console.error(`Admin dashboard ${label} failed`, error); return { ok: false }; }
}

export async function Metric({ promise, boundary, label, describe, count }: { promise: Promise<unknown>; boundary: string; label: string; describe: string; count: (value: unknown) => number }) {
  const result = await settle(promise, label);
  if (!result.ok) return <><StreamFailure label={label} /><StreamCompletionMarker route="admin-dashboard" boundary={boundary} /></>;
  return <><article className="cursor-default select-none rounded-2xl border border-white/10 bg-white/[0.03] p-6"><p className="text-sm text-white/50">{label}</p><p className="mt-3 text-3xl font-semibold">{count(result.value)}</p><p className="mt-2 text-sm leading-6 text-white/40">{describe}</p></article><StreamCompletionMarker route="admin-dashboard" boundary={boundary} /></>;
}

export async function DestinationMetric({ promise, boundary = "destination-metric", href, label, describe, count, tone, pendingLabel, instrumentationName }: { promise: Promise<unknown>; boundary?: string; href: string; label: string; describe: string; count: (value: unknown) => number; tone: "sky" | "violet" | "amber"; pendingLabel: string; instrumentationName: string }) {
  const result = await settle(promise, label);
  if (!result.ok) return <><StreamFailure label={label} /><StreamCompletionMarker route="admin-dashboard" boundary={boundary} /></>;
  return <><InternalNavigationFeedbackLink
    href={href}
    pendingLabel={pendingLabel}
    errorLabel={`${label} could not be opened. Try again.`}
    instrumentationName={instrumentationName}
    containerClassName="min-w-0"
    visualVariant="dashboard-card"
    dashboardCardTone={tone}
  ><p className="text-sm text-white/65">{label}</p><p className="mt-3 text-3xl font-semibold text-white">{count(result.value)}</p><p className="mt-2 text-sm leading-6 text-white/40">{describe}</p></InternalNavigationFeedbackLink><StreamCompletionMarker route="admin-dashboard" boundary={boundary} /></>;
}

async function ApplicationQueue({ promise }: { promise: Promise<Applications> }) {
  const result = await settle(promise, "Application Review Queue");
  if (!result.ok) return <><div className="mt-8"><StreamFailure label="Application Review Queue" /></div><StreamCompletionMarker route="admin-dashboard" boundary="application-queue" /></>;
  const applications = result.value;
  return <><section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"><div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Application Review Queue</h2><p className="mt-1 text-sm text-white/45">Submitted applications awaiting administrator review.</p></div><p className="text-sm text-white/40">{applications.length} {applications.length === 1 ? "application" : "applications"}</p></div>
      {applications.length === 0 ? <div className="px-6 py-16 text-center"><p className="text-base font-medium text-white/80">No pending applications</p><p className="mt-2 text-sm text-white/40">New submitted applications will appear here for review.</p></div> : <div className="overflow-x-auto"><table className="min-w-full border-collapse text-left"><thead><tr className="border-b border-white/10 bg-white/[0.02]">{["Application Code","Applicant","Email","Location","Application Status","Submitted Date"].map((heading) => <th key={heading} className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">{heading}</th>)}</tr></thead><tbody>{applications.map((application) => <tr key={application.reviewId} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.025]"><td className="whitespace-nowrap px-6 py-5"><Link prefetch={false} href={`/admin/applications/${application.id}`} className="font-mono text-sm text-white/80 hover:text-white hover:underline">{application.applicationCode}</Link></td><td className="whitespace-nowrap px-6 py-5 font-medium">{application.fullName}</td><td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">{application.email}</td><td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">{[application.city,application.stateOrRegion,application.countryCode].filter(Boolean).join(", ") || "—"}</td><td className="whitespace-nowrap px-6 py-5"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${applicationStatus(application.applicationStatus)}`}>{formatStatus(application.applicationStatus)}</span></td><td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">{formatDate(application.submittedAt)}</td></tr>)}</tbody></table></div>}
    </section><StreamCompletionMarker route="admin-dashboard" boundary="application-queue" /></>;
}

async function ParticipantRegistry({ promise }: { promise: Promise<Participants> }) {
  const result = await settle(promise, "Participant Registry");
  if (!result.ok) return <><div className="mt-8"><StreamFailure label="Participant Registry" /></div><StreamCompletionMarker route="admin-dashboard" boundary="participant-registry" /></>;
  const participants = result.value;
  return <><section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"><div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Participant Registry</h2><p className="mt-1 text-sm text-white/45">Live participant records and current lifecycle status.</p></div><p className="text-sm text-white/40">{participants.length} {participants.length === 1 ? "record" : "records"}</p></div>
      {participants.length === 0 ? <div className="px-6 py-16 text-center"><p className="text-base font-medium text-white/80">No participants found</p><p className="mt-2 text-sm text-white/40">Participant records will appear here after registration.</p></div> : <div className="overflow-x-auto"><table className="min-w-full border-collapse text-left"><thead><tr className="border-b border-white/10 bg-white/[0.02]">{["Participant Code","Full Name","Email","Lifecycle Status","Enrollment Date","Created Date"].map((heading) => <th key={heading} className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">{heading}</th>)}</tr></thead><tbody>{participants.map((participant) => <tr key={participant.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.025] has-[a[data-internal-navigation-state=selected]]:bg-sky-400/[0.08] has-[a[data-internal-navigation-state=selected]]:shadow-[inset_3px_0_0_rgba(125,211,252,0.75)]"><td className="whitespace-nowrap px-6 py-5"><ParticipantRegistryLink participantId={participant.id} participantCode={participant.participant_code} /></td><td className="whitespace-nowrap px-6 py-5 font-medium">{participant.full_name ?? "—"}</td><td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">{participant.email ?? "—"}</td><td className="whitespace-nowrap px-6 py-5"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${participantStatus(participant.lifecycle_status)}`}>{formatStatus(participant.lifecycle_status)}</span></td><td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">{formatDate(participant.enrollment_date)}</td><td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">{formatDate(participant.created_at)}</td></tr>)}</tbody></table></div>}
    </section><StreamCompletionMarker route="admin-dashboard" boundary="participant-registry" /></>;
}

export default async function AdminDashboardPage() {
  const timing = getAdminRequestPerformanceContext();
  recordAdminServerPerformance("admin-dashboard", "request_start", timing.startedAt);
  const staff = await requireAdminAccess("/admin/dashboard");
  recordAdminServerPerformance("admin-dashboard", "administrator_authorization_complete", timing.startedAt);
  const participants = getParticipants();
  const applications = adminApplicationService.getPendingApplications();
  const reviews = adminAssessmentReviewService.listAssessmentReviews(staff.auth_user_id);
  const reports = adminPreliminaryReportService.listReports(staff.auth_user_id);
  const evidence = adminEvidenceVerificationService.list(staff.auth_user_id);
  recordAdminServerPerformance("admin-dashboard", "server_stream_render_point", timing.startedAt);

  return <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <AdminPerformanceTelemetry route="admin-dashboard" startedAtEpochMs={timing.startedAtEpochMs} expectedBoundaryCount={9} />
    <header className="border-b border-white/10 pb-8"><p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">Wealth Path AI Global</p><div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Admin Dashboard</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">Application review, participant operations, lifecycle management, and institutional oversight.</p></div><AdminAccountPanel displayName={staff.full_name ?? staff.email ?? "Administrator"} /></div></header>
    <AdminDashboardSections summary={<AdminDashboardCardGroups operationalQueues={<>
      <Suspense fallback={<DashboardStreamFallback compact label={ADMIN_DASHBOARD_OPERATIONAL_CARDS[0].label} />}><DestinationMetric promise={reviews} boundary="summary-assessment-reviews" href={ADMIN_DASHBOARD_OPERATIONAL_CARDS[0].href} label={ADMIN_DASHBOARD_OPERATIONAL_CARDS[0].label} pendingLabel="Opening Assessment Reviews…" instrumentationName="admin-dashboard-assessment-reviews" describe="Open the human assessment review queue." count={(value) => (value as Awaited<typeof reviews>).filter((item) => !item.reviewStatus || item.reviewStatus === "pending").length} tone="sky" /></Suspense>
      <Suspense fallback={<DashboardStreamFallback compact label={ADMIN_DASHBOARD_OPERATIONAL_CARDS[1].label} />}><DestinationMetric promise={reports} boundary="summary-preliminary-reports" href={ADMIN_DASHBOARD_OPERATIONAL_CARDS[1].href} label={ADMIN_DASHBOARD_OPERATIONAL_CARDS[1].label} pendingLabel="Opening Preliminary Reports…" instrumentationName="admin-dashboard-preliminary-reports" describe="Open the governed preliminary report workspace." count={(value) => (value as Awaited<typeof reports>).filter((item) => item.reportStatus !== "released").length} tone="violet" /></Suspense>
      <Suspense fallback={<DashboardStreamFallback compact label={ADMIN_DASHBOARD_OPERATIONAL_CARDS[2].label} />}><DestinationMetric promise={evidence} boundary="summary-evidence" href={ADMIN_DASHBOARD_OPERATIONAL_CARDS[2].href} label={ADMIN_DASHBOARD_OPERATIONAL_CARDS[2].label} pendingLabel="Opening Evidence Verification…" instrumentationName="admin-dashboard-evidence-verification" describe="Open the governed evidence review queue." count={(value) => (value as Awaited<typeof evidence>).filter((item) => item.verificationStatus === "pending" || item.verificationStatus === "in_progress").length} tone="amber" /></Suspense>
    </>} systemSummary={<>
      <Suspense fallback={<DashboardStreamFallback compact label={ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS[0]} />}><Metric promise={applications} boundary="summary-pending-applications" label={ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS[0]} describe="Submitted applications awaiting eligibility review." count={(value) => (value as Applications).length} /></Suspense>
      <Suspense fallback={<DashboardStreamFallback compact label={ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS[1]} />}><Metric promise={participants} boundary="summary-total-participants" label={ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS[1]} describe="All participant records currently registered in WPAG." count={(value) => (value as Participants).length} /></Suspense>
      <Suspense fallback={<DashboardStreamFallback compact label={ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS[2]} />}><Metric promise={participants} boundary="summary-pending-enrollment" label={ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS[2]} describe="Participants awaiting formal enrollment activation." count={(value) => (value as Participants).filter((item) => item.lifecycle_status === "pending_enrollment").length} /></Suspense>
      <Suspense fallback={<DashboardStreamFallback compact label={ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS[3]} />}><Metric promise={participants} boundary="summary-active-participants" label={ADMIN_DASHBOARD_SYSTEM_SUMMARY_CARDS[3]} describe="Participants currently active in the WPAG system." count={(value) => (value as Participants).filter((item) => item.lifecycle_status === "active").length} /></Suspense>
    </>} />} applicationQueue={<Suspense fallback={<DashboardStreamFallback label="Application Review Queue" />}><ApplicationQueue promise={applications} /></Suspense>} participantRegistry={<Suspense fallback={<DashboardStreamFallback label="Participant Registry" />}><ParticipantRegistry promise={participants} /></Suspense>} />
  </div></main>;
}
