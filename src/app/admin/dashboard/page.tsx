import Link from "next/link";

import ParticipantRegistryLink from "@/components/admin/ParticipantRegistryLink";
import { requireRole } from "@/lib/auth/authorization";
import { adminApplicationService } from "@/lib/services/admin/admin-application-service";
import { adminAssessmentReviewService } from "@/lib/services/admin/admin-assessment-review-service";
import { adminEvidenceVerificationService } from "@/lib/services/admin/admin-evidence-verification-service";
import { adminPreliminaryReportService } from "@/lib/services/admin/admin-preliminary-report-service";
import { getParticipants } from "@/lib/services/admin/admin-participant-service";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getParticipantStatusClasses(status: string) {
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

function getApplicationStatusClasses(status: string) {
  switch (status) {
    case "submitted":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "under_review":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "approved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "rejected":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";

    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

export default async function AdminDashboardPage() {
  const staff = await requireRole("administrator");

  const [participants, pendingApplications, assessmentReviews, preliminaryReports, evidenceQueue] = await Promise.all([
    getParticipants(),
    adminApplicationService.getPendingApplications(),
    adminAssessmentReviewService.listAssessmentReviews(staff.auth_user_id),
    adminPreliminaryReportService.listReports(staff.auth_user_id),
    adminEvidenceVerificationService.list(staff.auth_user_id),
  ]);

  const totalParticipants = participants.length;
  const totalPendingApplications = pendingApplications.length;
  const awaitingAssessmentReviews = assessmentReviews.filter(
    (review) => !review.reviewStatus || review.reviewStatus === "pending",
  ).length;

  const pendingEnrollment = participants.filter(
    (participant) =>
      participant.lifecycle_status === "pending_enrollment",
  ).length;

  const activeParticipants = participants.filter(
    (participant) => participant.lifecycle_status === "active",
  ).length;

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
            Wealth Path AI Global
          </p>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Application review, participant operations, lifecycle
                management, and institutional oversight.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 lg:min-w-72">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Signed in as
              </p>

              <p className="mt-2 font-medium text-white">
                {staff.full_name ?? staff.email ?? "Administrator"}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/50">
              Pending Applications
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {totalPendingApplications}
            </p>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Submitted applications awaiting eligibility review.
            </p>
          </article>

          <Link
            href="/admin/reviews/assessments"
            className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-6 transition-colors hover:bg-sky-400/10"
          >
            <p className="text-sm text-sky-200/70">
              Assessment Reviews
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {awaitingAssessmentReviews}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/40">
              Open the human assessment review queue.
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.06] p-6 transition-colors hover:bg-violet-400/10"
          >
            <p className="text-sm text-violet-200/70">Preliminary Reports</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {preliminaryReports.filter((report) => report.reportStatus !== "released").length}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/40">
              Open the governed preliminary report workspace.
            </p>
          </Link>

          <Link
            href="/admin/evidence"
            className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-6 transition-colors hover:bg-amber-400/10"
          >
            <p className="text-sm text-amber-200/70">Evidence Verification</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {evidenceQueue.filter((item) => item.verificationStatus === "pending" || item.verificationStatus === "in_progress").length}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/40">
              Open the governed evidence review queue.
            </p>
          </Link>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/50">
              Total Participants
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {totalParticipants}
            </p>

            <p className="mt-2 text-sm leading-6 text-white/40">
              All participant records currently registered in WPAG.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/50">
              Pending Enrollment
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {pendingEnrollment}
            </p>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Participants awaiting formal enrollment activation.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/50">
              Active Participants
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {activeParticipants}
            </p>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Participants currently active in the WPAG system.
            </p>
          </article>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Application Review Queue
              </h2>

              <p className="mt-1 text-sm text-white/45">
                Submitted applications awaiting administrator review.
              </p>
            </div>

            <p className="text-sm text-white/40">
              {totalPendingApplications}{" "}
              {totalPendingApplications === 1
                ? "application"
                : "applications"}
            </p>
          </div>

          {pendingApplications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-base font-medium text-white/80">
                No pending applications
              </p>

              <p className="mt-2 text-sm text-white/40">
                New submitted applications will appear here for review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Application Code
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Applicant
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Email
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Location
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Application Status
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Submitted Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pendingApplications.map((application) => (
                    <tr
                      key={application.reviewId}
                      className="border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.025]"
                    >
                      <td className="whitespace-nowrap px-6 py-5">
                        <Link
  href={`/admin/applications/${application.id}`}
  className="font-mono text-sm text-white/80 transition-colors hover:text-white hover:underline"
>
  {application.applicationCode}
</Link>

<p className="mt-1 text-xs text-red-400">
  {application.id}
</p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <p className="font-medium text-white">
                          {application.fullName}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">
                        {application.email}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">
                        {[
                          application.city,
                          application.stateOrRegion,
                          application.countryCode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getApplicationStatusClasses(
                            application.applicationStatus,
                          )}`}
                        >
                          {formatStatus(
                            application.applicationStatus,
                          )}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">
                        {formatDate(application.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Participant Registry
              </h2>

              <p className="mt-1 text-sm text-white/45">
                Live participant records and current lifecycle status.
              </p>
            </div>

            <p className="text-sm text-white/40">
              {totalParticipants}{" "}
              {totalParticipants === 1 ? "record" : "records"}
            </p>
          </div>

          {participants.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-base font-medium text-white/80">
                No participants found
              </p>

              <p className="mt-2 text-sm text-white/40">
                Participant records will appear here after
                registration.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Participant Code
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Full Name
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Email
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Lifecycle Status
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Enrollment Date
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                      Created Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {participants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.025] has-[a[data-internal-navigation-state=selected]]:bg-sky-400/[0.08] has-[a[data-internal-navigation-state=selected]]:shadow-[inset_3px_0_0_rgba(125,211,252,0.75)]"
                    >
                      <td className="whitespace-nowrap px-6 py-5">
                        <ParticipantRegistryLink
                          participantId={participant.id}
                          participantCode={participant.participant_code}
                        />
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <p className="font-medium text-white">
                          {participant.full_name ?? "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">
                        {participant.email ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getParticipantStatusClasses(
                            participant.lifecycle_status,
                          )}`}
                        >
                          {formatStatus(
                            participant.lifecycle_status,
                          )}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">
                        {formatDate(participant.enrollment_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-white/55">
                        {formatDate(participant.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
