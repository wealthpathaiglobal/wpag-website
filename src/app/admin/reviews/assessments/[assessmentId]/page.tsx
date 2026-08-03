import Link from "next/link";
import { notFound } from "next/navigation";

import AssessmentReviewActionPanel from "@/components/admin/assessment-reviews/AssessmentReviewActionPanel";
import { assessmentRegistry } from "@/lib/assessment/assessment-registry";
import { requireRole } from "@/lib/auth/authorization";
import {
  adminAssessmentReviewService,
  AdminAssessmentReviewServiceError,
} from "@/lib/services/admin/admin-assessment-review-service";

interface Props {
  params: Promise<{ assessmentId: string }>;
}

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

function questionLabel(questionKey: string) {
  const key = questionKey.split(".").at(-1) ?? questionKey;
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function displayAnswer(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not answered";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return new Intl.NumberFormat("en-IN").format(value);
  if (typeof value === "string") return formatStatus(value);
  if (typeof value === "object" && !Array.isArray(value)) {
    const selected = Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => formatStatus(key));
    if (selected.length > 0) return selected.join(", ");
  }
  return JSON.stringify(value);
}

export default async function AssessmentReviewDetailPage({ params }: Props) {
  const staff = await requireRole("administrator");
  const { assessmentId } = await params;

  let detail;
  try {
    detail = await adminAssessmentReviewService.getAssessmentReview(
      assessmentId,
      staff.auth_user_id,
    );
  } catch (error) {
    if (
      error instanceof AdminAssessmentReviewServiceError &&
      (error.message === "Assessment was not found." ||
        error.message === "Assessment ID is required.")
    ) {
      notFound();
    }
    throw error;
  }
  if (!detail) notFound();

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 flex flex-wrap gap-5 text-sm">
          <Link
            href="/admin/reviews/assessments"
            className="text-white/50 hover:text-white"
          >
            ← Back to Assessment Review Queue
          </Link>
          <Link
            href={`/admin/participants/${detail.participantId}`}
            className="text-sky-300 hover:text-sky-200"
          >
            Open Participant Workspace
          </Link>
        </nav>

        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
            Human Assessment Review
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {detail.participantName}
              </h1>
              <p className="mt-3 font-mono text-sm text-white/45">
                {detail.participantCode}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
                Assessment: {formatStatus(detail.assessmentStatus)}
              </span>
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
                Review: {formatStatus(detail.reviewStatus)}
              </span>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Participant Email", detail.participantEmail ?? "—"],
            ["Lifecycle", formatStatus(detail.lifecycleStatus)],
            ["Assessment", `#${detail.assessmentNumber} · ${formatStatus(detail.assessmentType)}`],
            ["Submitted", formatDate(detail.submittedAt)],
            ["Assessment Version", detail.assessmentVersion],
            ["HFOS Version", detail.hfosVersion],
            ["Reviewer", detail.reviewerName ?? "Unassigned"],
            ["Decision", formatStatus(detail.reviewDecision)],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-xs uppercase tracking-wider text-white/35">{label}</p>
              <p className="mt-3 break-words text-sm text-white/80">{value}</p>
            </article>
          ))}
        </section>

        <AssessmentReviewActionPanel
          assessmentId={detail.assessmentId}
          reviewStatus={detail.reviewStatus}
          reviewDecision={detail.reviewDecision}
          initialReviewerNotes={detail.reviewNotes}
          informationRequest={detail.informationRequest}
        />

        <section className="mt-8 space-y-6" aria-label="Assessment answers">
          {assessmentRegistry.map((module) => {
            const moduleAnswers = detail.answers[module.key] ?? {};
            const progress = detail.moduleProgress[module.key];
            const orderedAnswers = module.questions
              .map((question) => {
                const key = `${module.key}.${question.key}`;
                return [key, moduleAnswers[key]] as const;
              })
              .filter((entry) => entry[1] !== undefined);

            return (
              <article
                key={module.key}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold">{module.title}</h2>
                  <p className="text-sm text-white/45">
                    {formatStatus(progress?.status ?? "not_started")} · {orderedAnswers.length} durable answers
                  </p>
                </div>
                {orderedAnswers.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-white/40">
                    No durable answers are available for this module.
                  </p>
                ) : (
                  <dl className="grid gap-px bg-white/5 sm:grid-cols-2">
                    {orderedAnswers.map(([key, answer]) => (
                      <div key={key} className="bg-black px-6 py-5">
                        <dt className="text-xs uppercase tracking-wider text-white/35">
                          {questionLabel(key)}
                        </dt>
                        <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/80">
                          {answer.is_answered
                            ? displayAnswer(answer.value)
                            : "Not answered"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold">Evidence and Documents</h2>
          {detail.documents.length === 0 ? (
            <p className="mt-4 text-sm text-white/45">
              No assessment document metadata is available.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {detail.documents.map((document) => (
                <article
                  key={document.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="font-medium">{document.document_name}</p>
                  <p className="mt-2 text-sm text-white/50">
                    {formatStatus(document.document_category)} · {formatStatus(document.document_type)} · Verification: {formatStatus(document.verification_status)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-white/35">Review started</p><p className="mt-2 text-sm">{formatDate(detail.reviewStartedAt)}</p></div>
          <div><p className="text-xs text-white/35">Review completed</p><p className="mt-2 text-sm">{formatDate(detail.reviewCompletedAt)}</p></div>
          <div><p className="text-xs text-white/35">Review created</p><p className="mt-2 text-sm">{formatDate(detail.reviewCreatedAt)}</p></div>
          <div><p className="text-xs text-white/35">Review updated</p><p className="mt-2 text-sm">{formatDate(detail.reviewUpdatedAt)}</p></div>
        </section>
      </div>
    </main>
  );
}
