import Link from "next/link";
import { notFound } from "next/navigation";
import ApplicationReviewActionPanel from "@/components/admin/applications/application-review-action-panel";

import { requireRole } from "@/lib/auth/authorization";
import { adminApplicationService } from "@/lib/services/admin/admin-application-service";

interface ApplicationReviewPageProps {
  params: Promise<{
    applicationId: string;
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
    case "pending":
    case "submitted":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "in_review":
    case "under_review":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "eligible":
    case "approved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "conditional":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    case "ineligible":
    case "rejected":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";

    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function displayValue(value: string | null) {
  return value?.trim() || "—";
}

export default async function ApplicationReviewPage({
  params,
}: ApplicationReviewPageProps) {
  await requireRole("administrator");

  const { applicationId } = await params;

  let application;

  try {
    application =
      await adminApplicationService.getApplicationById(applicationId);
  } catch {
    notFound();
  }

  if (!application) {
    notFound();
  }

  const location =
    [
      application.city,
      application.stateOrRegion,
      application.countryCode,
    ]
      .filter(Boolean)
      .join(", ") || "—";

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav
          className="mb-8"
          aria-label="Application review navigation"
        >
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
            Application Review Workspace
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {application.fullName}
              </h1>

              <p className="mt-3 font-mono text-sm text-white/45">
                {application.applicationCode}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${getStatusClasses(
                  application.applicationStatus,
                )}`}
              >
                {formatStatus(application.applicationStatus)}
              </span>

              <span
                className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${getStatusClasses(
                  application.reviewStatus,
                )}`}
              >
                Review: {formatStatus(application.reviewStatus)}
              </span>
            </div>
          </div>
        </header>

        <section
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Application summary"
        >
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Email
            </p>

            <p className="mt-3 break-all text-sm text-white/80">
              {application.email}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Phone
            </p>

            <p className="mt-3 text-sm text-white/80">
              {application.phoneCountryCode}{" "}
              {application.phoneNumber}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Location
            </p>

            <p className="mt-3 text-sm text-white/80">
              {location}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Submitted
            </p>

            <p className="mt-3 text-sm text-white/80">
              {formatDate(application.submittedAt)}
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <article className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 px-6 py-5">
                <h2 className="text-lg font-semibold">
                  Applicant Profile
                </h2>
              </div>

              <dl className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Age Group
                  </dt>

                  <dd className="mt-2 text-sm text-white/80">
                    {displayValue(application.ageGroup)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Employment Status
                  </dt>

                  <dd className="mt-2 text-sm text-white/80">
                    {displayValue(application.employmentStatus)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Referral Source
                  </dt>

                  <dd className="mt-2 text-sm text-white/80">
                    {displayValue(application.referralSource)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Auth Account
                  </dt>

                  <dd className="mt-2 text-sm text-white/80">
                    {application.authUserId ? "Linked" : "Not linked"}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 px-6 py-5">
                <h2 className="text-lg font-semibold">
                  Application Narrative
                </h2>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-white/35">
                    Application Reason
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                    {application.applicationReason}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider text-white/35">
                    Financial Challenges
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                    {displayValue(application.financialChallenges)}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider text-white/35">
                    Expectations
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                    {displayValue(application.expectations)}
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 px-6 py-5">
                <h2 className="text-lg font-semibold">
                  Eligibility Review
                </h2>
              </div>

              <dl className="space-y-5 px-6 py-6">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Decision
                  </dt>

                  <dd className="mt-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                        application.decision,
                      )}`}
                    >
                      {formatStatus(application.decision)}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Eligibility Score
                  </dt>

                  <dd className="mt-2 text-sm text-white/80">
                    {application.eligibilityScore ?? "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Review Number
                  </dt>

                  <dd className="mt-2 text-sm text-white/80">
                    {application.reviewNumber}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Started
                  </dt>

                  <dd className="mt-2 text-sm text-white/80">
                    {formatDate(application.startedAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/35">
                    Completed
                  </dt>

                  <dd className="mt-2 text-sm text-white/80">
                    {formatDate(application.completedAt)}
                  </dd>
                </div>
              </dl>
            </article>
            <ApplicationReviewActionPanel
  applicationId={application.id}
  applicationStatus={application.applicationStatus}
  reviewStatus={application.reviewStatus}
/>

            <article className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 px-6 py-5">
                <h2 className="text-lg font-semibold">
                  Reviewer Notes
                </h2>
              </div>

              <div className="space-y-5 px-6 py-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/35">
                    Notes
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">
                    {displayValue(application.reviewerNotes)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/35">
                    Conditional Reason
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">
                    {displayValue(application.conditionalReason)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/35">
                    Ineligible Reason
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">
                    {displayValue(application.ineligibleReason)}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}