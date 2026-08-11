import Link from "next/link";

import LifecycleActionPanel from "@/components/admin/LifecycleActionPanel";
import ParticipantInvitationPanel from "@/components/admin/ParticipantInvitationPanel";
import HfosMeasurementFoundationCard from "@/components/admin/HfosMeasurementFoundationCard";
import ResearchControlsFoundationCard from "@/components/admin/ResearchControlsFoundationCard";
import ResearchWave3GovernanceCard from "@/components/admin/ResearchWave3GovernanceCard";
import { requireRole } from "@/lib/auth/authorization";
import { getParticipantDetail } from "@/lib/services/admin/admin-participant-detail-service";
import { adminEvidenceFoundationService } from "@/lib/services/admin/admin-evidence-foundation-service";
import { adminResearchControlsService } from "@/lib/services/admin/admin-research-controls-service";
import { adminResearchWave3Service } from "@/lib/services/admin/admin-research-wave3-service";

interface ParticipantDetailPageProps {
  params: Promise<{
    participantId: string;
  }>;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(status: string | null) {
  if (!status) {
    return "—";
  }

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case "active":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "pending_enrollment":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "paused":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "completed":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    case "withdrawn":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";

    case "archived":
      return "border-white/10 bg-white/5 text-white/50";

    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

export default async function ParticipantDetailPage({
  params,
}: ParticipantDetailPageProps) {
  const staff = await requireRole("administrator");

  const { participantId } = await params;

  let participantDetail;

  try {
  participantDetail = await getParticipantDetail(participantId);
} catch (error) {
  console.error("Participant Detail Error:", error);
  throw error;
}

  const {
  participant,
  lifecycleHistory,
  invitation,
  assessmentSummary,
  measurementSummary,
  } = participantDetail;
  const evidence = await adminEvidenceFoundationService.list(
    staff.auth_user_id,
    { participantId },
  );
  const researchControls = await adminResearchControlsService.getStatus(
    participantId,
    staff.auth_user_id,
  );
  const researchWave3 = await adminResearchWave3Service.getOverview(participantId, staff.auth_user_id);

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8" aria-label="Participant workspace navigation">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-sm text-white/50 transition-colors hover:text-white"
          >
            <span aria-hidden="true">←</span>
            <span className="ml-2">Back to Admin Dashboard</span>
          </Link>
        </nav>

        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
            Participant Workspace
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {participant.full_name ?? "Unnamed Participant"}
              </h1>

              <p className="mt-3 font-mono text-sm text-white/45">
                {participant.participant_code ?? participant.id}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-medium ${getStatusClasses(
                participant.lifecycle_status
              )}`}
            >
              {formatStatus(participant.lifecycle_status)}
            </span>
          </div>
        </header>

        <section
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Participant information"
        >
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Email
            </p>

            <p className="mt-3 break-all text-sm text-white/80">
              {participant.email ?? "—"}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Enrollment Date
            </p>

            <p className="mt-3 text-sm text-white/80">
              {formatDate(participant.enrollment_date)}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Registered Date
            </p>

            <p className="mt-3 text-sm text-white/80">
              {formatDate(participant.created_at)}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Auth Account
            </p>

            <p className="mt-3 text-sm text-white/80">
              {participant.auth_user_id ? "Linked" : "Not linked"}
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-label="Assessment summary">
          <p className="text-xs uppercase tracking-wider text-white/35">Participant assessment</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-white/40">Status</p><p className="mt-2">{formatStatus(assessmentSummary?.session_status ?? null)}</p></div>
            <div><p className="text-xs text-white/40">Modules</p><p className="mt-2">{assessmentSummary ? `${assessmentSummary.completed_module_count} of ${assessmentSummary.total_module_count}` : "—"}</p></div>
            <div><p className="text-xs text-white/40">Versions</p><p className="mt-2">{assessmentSummary ? `${assessmentSummary.assessment_version} · ${assessmentSummary.hfos_version}` : "—"}</p></div>
            <div><p className="text-xs text-white/40">Submitted</p><p className="mt-2">{formatDate(assessmentSummary?.submitted_at ?? null)}</p></div>
          </div>
          {assessmentSummary?.session_status === "submitted" && assessmentSummary.assessment_id ? (
            <Link
              href={`/admin/reviews/assessments/${assessmentSummary.assessment_id}`}
              className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
            >
              Open Assessment Review
            </Link>
          ) : null}
        </section>

        <HfosMeasurementFoundationCard summary={measurementSummary} />

        <ResearchControlsFoundationCard status={researchControls} />

        <ResearchWave3GovernanceCard overview={researchWave3} />

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-label="Participant evidence">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Evidence</h2><p className="mt-1 text-sm text-white/45">Governed assessment evidence and current verification status.</p></div><Link href="/admin/evidence" className="text-sm text-sky-300">Open Evidence Queue</Link></div>
          {evidence.length === 0 ? <p className="mt-5 text-sm text-white/45">No evidence is available for this participant.</p> : <div className="mt-5 space-y-3">{evidence.map((item) => <Link key={item.documentId} href={`/admin/evidence/${item.documentId}`} className="flex flex-col gap-2 rounded-xl border border-white/10 p-4 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"><span>{item.documentName} · v{item.versionNumber}</span><span className="text-sm text-white/50">{formatStatus(item.verificationStatus)}</span></Link>)}</div>}
        </section>

       <ParticipantInvitationPanel
  participantId={participant.id}
  authUserId={participant.auth_user_id}
  lifecycleStatus={participant.lifecycle_status}
  invitation={invitation}
/>

<LifecycleActionPanel
  participantId={participant.id}
  lifecycleStatus={participant.lifecycle_status}
/>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-lg font-semibold">Lifecycle Timeline</h2>

            <p className="mt-1 text-sm text-white/45">
              Immutable history of participant lifecycle transitions.
            </p>
          </div>

          {lifecycleHistory.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm text-white/50">
                No lifecycle history is available.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {lifecycleHistory.map((event) => (
                <article
                  key={event.id}
                  className="grid gap-4 px-6 py-5 md:grid-cols-[180px_1fr]"
                >
                  <div>
                    <time
                      dateTime={event.changed_at}
                      className="text-sm text-white/45"
                    >
                      {formatDate(event.changed_at)}
                    </time>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {event.from_status ? (
                        <>
                          <span className="text-sm text-white/45">
                            {formatStatus(event.from_status)}
                          </span>

                          <span className="text-white/25" aria-hidden="true">
                            →
                          </span>
                        </>
                      ) : null}

                      <span className="font-medium text-white">
                        {formatStatus(event.to_status)}
                      </span>
                    </div>

                    {event.transition_reason ? (
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        {event.transition_reason}
                      </p>
                    ) : null}

                    {event.changed_by ? (
                      <p className="mt-2 text-xs text-white/30">
                        Changed by: {event.changed_by}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
