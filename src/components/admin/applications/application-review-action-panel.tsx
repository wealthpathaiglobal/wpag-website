"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AdminActionButton from "@/components/admin/AdminActionButton";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";

import { ELIGIBILITY_DECISION } from "@/lib/services/participant/application-types";

type ReviewAction =
  | "approve"
  | "request_more_information"
  | "reject";

interface ApplicationReviewActionPanelProps {
  applicationId: string;
  applicationStatus: string;
  reviewStatus: string;
}

type Feedback = {
  type: "success" | "error";
  message: string;
};

type ActionConfiguration = {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant: "success" | "warning" | "danger";
  destructive?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
};

const actionConfigurations: Record<
  ReviewAction,
  ActionConfiguration
> = {
  approve: {
    label: "Approve",
    title: "Approve application",
    description:
      "This action will mark the applicant as eligible. Participant creation will be handled in the next workflow stage.",
    confirmLabel: "Confirm Approval",
    variant: "success",
  },

  request_more_information: {
    label: "Request More Information",
    title: "Request more information",
    description:
      "This action will pause the eligibility decision until the applicant provides the required information.",
    confirmLabel: "Confirm Request",
    variant: "warning",
    reasonLabel: "Information required",
    reasonPlaceholder:
      "Explain what additional information the applicant must provide...",
    reasonRequired: true,
  },

  reject: {
    label: "Reject",
    title: "Reject application",
    description:
      "This action will mark the applicant as ineligible. A clear institutional reason is required.",
    confirmLabel: "Confirm Rejection",
    variant: "danger",
    destructive: true,
    reasonLabel: "Rejection reason",
    reasonPlaceholder:
      "Enter the institutional reason for rejection...",
    reasonRequired: true,
  },
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

export default function ApplicationReviewActionPanel({
  applicationId,
  applicationStatus,
  reviewStatus,
}: ApplicationReviewActionPanelProps) {
  const router = useRouter();

  const [selectedAction, setSelectedAction] =
    useState<ReviewAction | null>(null);

  const [reason, setReason] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] =
    useState<Feedback | null>(null);

  const selectedConfiguration = selectedAction
    ? actionConfigurations[selectedAction]
    : null;

  const reviewCompleted = reviewStatus === "completed";

  function openAction(action: ReviewAction) {
    setSelectedAction(action);
    setReason("");
    setFeedback(null);
  }

  function closeDialog() {
    if (loading) {
      return;
    }

    setSelectedAction(null);
    setReason("");
  }

  async function confirmAction() {
    if (!selectedAction) {
      return;
    }

    const trimmedReason = reason.trim();

    if (
      selectedConfiguration?.reasonRequired &&
      !trimmedReason
    ) {
      setFeedback({
        type: "error",
        message:
          selectedAction === "reject"
            ? "A rejection reason is required."
            : "Please describe the additional information required.",
      });

      return;
    }

    const decision =
      selectedAction === "approve"
        ? ELIGIBILITY_DECISION.APPROVED
        : selectedAction === "reject"
          ? ELIGIBILITY_DECISION.REJECTED
          : ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED;

    try {
      setLoading(true);
      setFeedback(null);

      const response = await fetch(
        "/api/admin/applications/review",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId,
            decision,
            reviewerNotes:
              reviewerNotes.trim() || null,
            reason: trimmedReason || null,
          }),
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Application review could not be completed.",
        );
      }

      setSelectedAction(null);
      setReason("");

      setFeedback({
        type: "success",
        message:
          result.message ??
          "Application review completed successfully.",
      });

      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Application review could not be completed.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Application Review Actions
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Review the submitted information and record an
              institutional eligibility decision.
            </p>
          </div>

          <div className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60">
            Current: {formatStatus(applicationStatus)}
          </div>
        </div>

        {feedback ? (
          <div
            role={
              feedback.type === "error"
                ? "alert"
                : "status"
            }
            className={`mt-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 ${
              feedback.type === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : "border-rose-400/20 bg-rose-400/10 text-rose-200"
            }`}
          >
            <p className="text-sm leading-6">
              {feedback.message}
            </p>

            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="shrink-0 text-sm opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        ) : null}

        <div className="mt-6">
          <label
            htmlFor="reviewer-notes"
            className="text-sm font-medium text-white/70"
          >
            Reviewer Notes
          </label>

          <textarea
            id="reviewer-notes"
            value={reviewerNotes}
            onChange={(event) =>
              setReviewerNotes(event.target.value)
            }
            disabled={reviewCompleted || loading}
            rows={4}
            placeholder="Add internal review observations or decision notes..."
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="mt-6">
          {reviewCompleted ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">
                This eligibility review has already been
                completed. No further review actions are
                available.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <AdminActionButton
                label="Approve"
                variant="success"
                loading={
                  loading && selectedAction === "approve"
                }
                disabled={loading}
                onClick={() => openAction("approve")}
              />

              <AdminActionButton
                label="Request More Information"
                variant="warning"
                loading={
                  loading &&
                  selectedAction ===
                    "request_more_information"
                }
                disabled={loading}
                onClick={() =>
                  openAction("request_more_information")
                }
              />

              <AdminActionButton
                label="Reject"
                variant="danger"
                loading={
                  loading && selectedAction === "reject"
                }
                disabled={loading}
                onClick={() => openAction("reject")}
              />
            </div>
          )}
        </div>

        {!reviewCompleted ? (
          <p className="mt-5 text-xs leading-5 text-white/30">
            Every eligibility decision requires administrator
            confirmation. Rejection and information requests
            require a documented reason.
          </p>
        ) : null}
      </section>

      <ConfirmActionDialog
        open={selectedAction !== null}
        title={
          selectedConfiguration?.title ??
          "Confirm application review"
        }
        description={
          selectedConfiguration?.description ??
          "Confirm this eligibility decision."
        }
        confirmLabel={
          selectedConfiguration?.confirmLabel ?? "Confirm"
        }
        loading={loading}
        destructive={
          selectedConfiguration?.destructive ?? false
        }
        reasonLabel={selectedConfiguration?.reasonLabel}
        reasonPlaceholder={
          selectedConfiguration?.reasonPlaceholder
        }
        reasonRequired={
          selectedConfiguration?.reasonRequired ?? false
        }
        reasonValue={reason}
        onReasonChange={
          selectedConfiguration?.reasonRequired
            ? setReason
            : undefined
        }
        onCancel={closeDialog}
        onConfirm={() => {
          void confirmAction();
        }}
      />
    </>
  );
}