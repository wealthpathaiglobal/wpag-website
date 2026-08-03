"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AdminActionButton from "@/components/admin/AdminActionButton";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import type {
  AssessmentReviewDecision,
  AssessmentReviewStatus,
  AssessmentReviewTransitionCommand,
} from "@/lib/types/admin/admin-assessment-review";

interface Props {
  assessmentId: string;
  reviewStatus: AssessmentReviewStatus | null;
  reviewDecision: AssessmentReviewDecision | null;
  initialReviewerNotes: string | null;
  informationRequest: string | null;
}

type Feedback = { type: "success" | "error"; message: string };
type ConfirmedAction = "request_information" | "approve" | "reject";

const confirmations: Record<
  ConfirmedAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    reasonLabel?: string;
    reasonPlaceholder?: string;
    reasonRequired?: boolean;
  }
> = {
  request_information: {
    title: "Request more information",
    description:
      "Return this assessment for a specific participant information request.",
    confirmLabel: "Confirm Request",
    reasonLabel: "Information required",
    reasonPlaceholder: "Describe the additional information required...",
    reasonRequired: true,
  },
  approve: {
    title: "Approve assessment review",
    description:
      "Record the human review as approved. This does not calculate a score or generate a report.",
    confirmLabel: "Confirm Approval",
  },
  reject: {
    title: "Reject assessment review",
    description:
      "Record the human review as rejected. A clear reviewer rationale is required.",
    confirmLabel: "Confirm Rejection",
    destructive: true,
    reasonLabel: "Rejection rationale",
    reasonPlaceholder: "Enter the institutional review rationale...",
    reasonRequired: true,
  },
};

export default function AssessmentReviewActionPanel({
  assessmentId,
  reviewStatus,
  reviewDecision,
  initialReviewerNotes,
  informationRequest,
}: Props) {
  const router = useRouter();
  const [reviewerNotes, setReviewerNotes] = useState(
    initialReviewerNotes ?? "",
  );
  const [confirmedAction, setConfirmedAction] =
    useState<ConfirmedAction | null>(null);
  const [dialogValue, setDialogValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function submit(
    command: AssessmentReviewTransitionCommand,
    overrides?: {
      reviewerNotes?: string | null;
      informationRequest?: string | null;
    },
  ) {
    if (loading) return;
    try {
      setLoading(true);
      setFeedback(null);
      const response = await fetch(
        "/api/admin/assessment-reviews/transition",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId,
            command,
            reviewerNotes:
              overrides?.reviewerNotes !== undefined
                ? overrides.reviewerNotes
                : reviewerNotes.trim() || null,
            informationRequest:
              overrides?.informationRequest ?? null,
          }),
        },
      );
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          result.error ?? "Assessment review could not be updated.",
        );
      }
      setConfirmedAction(null);
      setDialogValue("");
      setFeedback({
        type: "success",
        message: result.message ?? "Assessment review updated successfully.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Assessment review could not be updated.",
      });
    } finally {
      setLoading(false);
    }
  }

  function confirmAction() {
    if (!confirmedAction) return;
    if (confirmedAction === "request_information") {
      void submit("request_information", {
        informationRequest: dialogValue.trim(),
      });
      return;
    }
    if (confirmedAction === "reject") {
      void submit("reject", { reviewerNotes: dialogValue.trim() });
      return;
    }
    void submit("approve");
  }

  const confirmation = confirmedAction
    ? confirmations[confirmedAction]
    : null;

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div>
        <h2 className="text-lg font-semibold">Human Review Actions</h2>
        <p className="mt-2 text-sm leading-6 text-white/45">
          Record reviewer workflow only. No formula, score, diagnosis, or
          participant report is produced here.
        </p>
      </div>

      {feedback ? (
        <p
          role={feedback.type === "error" ? "alert" : "status"}
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      {reviewStatus === null || reviewStatus === "pending" ? (
        <div className="mt-6">
          <AdminActionButton
            label="Start Review"
            loading={loading}
            onClick={() => void submit("start_review")}
          />
        </div>
      ) : null}

      {reviewStatus === "in_review" ? (
        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="assessment-reviewer-notes"
              className="text-sm font-medium text-white/80"
            >
              Reviewer notes
            </label>
            <textarea
              id="assessment-reviewer-notes"
              value={reviewerNotes}
              onChange={(event) => setReviewerNotes(event.target.value)}
              disabled={loading}
              rows={6}
              maxLength={5000}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
              placeholder="Record institutional reviewer observations..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminActionButton
              label="Save Reviewer Notes"
              variant="secondary"
              loading={loading}
              disabled={!reviewerNotes.trim()}
              onClick={() => void submit("save_notes")}
            />
            <AdminActionButton
              label="Request More Information"
              variant="warning"
              disabled={loading}
              onClick={() => {
                setDialogValue("");
                setConfirmedAction("request_information");
              }}
            />
            <AdminActionButton
              label="Approve Review"
              variant="success"
              disabled={loading}
              onClick={() => setConfirmedAction("approve")}
            />
            <AdminActionButton
              label="Reject Review"
              variant="danger"
              disabled={loading}
              onClick={() => {
                setDialogValue(reviewerNotes);
                setConfirmedAction("reject");
              }}
            />
          </div>
        </div>
      ) : null}

      {reviewStatus === "returned" ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm leading-6 text-amber-200/80">
            This assessment was returned for more information.
            {informationRequest ? ` Request: ${informationRequest}` : ""}
          </p>
          <AdminActionButton
            label="Reopen Review"
            variant="warning"
            loading={loading}
            onClick={() => void submit("start_review")}
          />
        </div>
      ) : null}

      {reviewStatus === "completed" ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/80">
            Review completed: {reviewDecision ?? "decision unavailable"}
          </p>
          <p className="mt-2 text-sm text-white/45">
            Terminal review decisions are read-only and cannot be repeated.
          </p>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={confirmation !== null}
        title={confirmation?.title ?? "Confirm review action"}
        description={confirmation?.description ?? "Confirm this action."}
        confirmLabel={confirmation?.confirmLabel ?? "Confirm"}
        destructive={confirmation?.destructive}
        reasonLabel={confirmation?.reasonLabel}
        reasonPlaceholder={confirmation?.reasonPlaceholder}
        reasonRequired={confirmation?.reasonRequired}
        reasonValue={dialogValue}
        onReasonChange={setDialogValue}
        loading={loading}
        onCancel={() => {
          if (!loading) {
            setConfirmedAction(null);
            setDialogValue("");
          }
        }}
        onConfirm={confirmAction}
      />
    </section>
  );
}
