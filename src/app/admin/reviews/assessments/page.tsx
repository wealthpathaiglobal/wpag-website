import Link from "next/link";

import AdminDashboardReturnLink from "@/components/admin/AdminDashboardReturnLink";
import { requireRole } from "@/lib/auth/authorization";
import { adminAssessmentReviewService } from "@/lib/services/admin/admin-assessment-review-service";
import type { AssessmentReviewStatus } from "@/lib/types/admin/admin-assessment-review";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(value: string | null) {
  if (!value) return "Awaiting Review";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusClasses(status: AssessmentReviewStatus | null) {
  if (!status || status === "pending")
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  if (status === "in_review")
    return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  if (status === "returned")
    return "border-violet-400/20 bg-violet-400/10 text-violet-300";
  return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
}

export default async function AssessmentReviewQueuePage() {
  const staff = await requireRole("administrator");
  const reviews = await adminAssessmentReviewService.listAssessmentReviews(
    staff.auth_user_id,
  );

  const counts = {
    awaiting: reviews.filter(
      (review) => !review.reviewStatus || review.reviewStatus === "pending",
    ).length,
    inReview: reviews.filter(
      (review) => review.reviewStatus === "in_review",
    ).length,
    returned: reviews.filter(
      (review) => review.reviewStatus === "returned",
    ).length,
    completed: reviews.filter(
      (review) => review.reviewStatus === "completed",
    ).length,
  };

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-8" aria-label="Assessment review navigation">
          <AdminDashboardReturnLink />
        </nav>

        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
            Human Review Workspace
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Assessment Review Queue
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Submitted participant assessments awaiting or undergoing authorized
            human review.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Awaiting Review", counts.awaiting],
            ["In Review", counts.inReview],
            ["Returned", counts.returned],
            ["Completed", counts.completed],
          ].map(([label, count]) => (
            <article
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-sm text-white/50">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{count}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {reviews.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-base font-medium text-white/80">
                No submitted assessments
              </p>
              <p className="mt-2 text-sm text-white/40">
                Submitted participant assessments will appear here for review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    {[
                      "Participant Code",
                      "Participant",
                      "Assessment Number / Type",
                      "Assessment Status",
                      "Review Status",
                      "Reviewer",
                      "Submitted Date",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/35"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr
                      key={review.assessmentId}
                      className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.025]"
                    >
                      <td className="whitespace-nowrap px-5 py-5 font-mono text-sm text-white/75">
                        {review.participantCode}
                      </td>
                      <td className="px-5 py-5">
                        <p className="font-medium">{review.participantName}</p>
                        <p className="mt-1 text-xs text-white/40">
                          {review.participantEmail ?? "Email unavailable"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-sm text-white/60">
                        #{review.assessmentNumber} · {formatStatus(review.assessmentType)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-sm text-white/60">
                        {formatStatus(review.assessmentStatus)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(review.reviewStatus)}`}
                        >
                          {formatStatus(review.reviewStatus)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-sm text-white/55">
                        {review.reviewerName ?? "Unassigned"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-sm text-white/55">
                        {formatDate(review.submittedAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5">
                        <Link
                          href={`/admin/reviews/assessments/${review.assessmentId}`}
                          className="text-sm font-medium text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          Open Review
                        </Link>
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
