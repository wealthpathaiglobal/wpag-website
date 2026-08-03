import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  AdminAssessmentReviewRepositoryError,
  assessmentReviewDecisions,
  assessmentReviewStatuses,
  type AssessmentReviewDecision,
  type AssessmentReviewDetail,
  type AssessmentReviewQueueItem,
  type AssessmentReviewStatus,
  type AssessmentReviewTransitionInput,
  type AssessmentReviewTransitionResult,
} from "@/lib/types/admin/admin-assessment-review";

type QueueRow = {
  participant_id: string;
  participant_code: string;
  participant_name: string;
  participant_email: string | null;
  lifecycle_status: string;
  assessment_id: string;
  assessment_session_id: string;
  assessment_number: number;
  assessment_type: string;
  assessment_version: string;
  hfos_version: string;
  assessment_status: string;
  submitted_at: string;
  review_id: string | null;
  review_status: string | null;
  review_decision: string | null;
  review_started_at: string | null;
  review_completed_at: string | null;
  reviewed_by: string | null;
  reviewer_name: string | null;
  review_created_at: string | null;
  review_updated_at: string | null;
};

type DetailRow = QueueRow & {
  assessment_created_at: string;
  assessment_updated_at: string;
  module_progress: AssessmentReviewDetail["moduleProgress"];
  answers: AssessmentReviewDetail["answers"];
  documents: AssessmentReviewDetail["documents"];
  review_notes: string | null;
  information_request: string | null;
};

type TransitionRow = {
  assessment_id: string;
  review_id: string;
  review_status: string;
  review_decision: string | null;
  review_started_at: string;
  review_completed_at: string | null;
  reviewed_by: string;
  reviewer_name: string | null;
  review_notes: string | null;
  information_request: string | null;
  review_created_at: string;
  review_updated_at: string;
};

const safeMessages = new Set([
  "Assessment ID is required.",
  "Reviewer identity is required.",
  "Assessment review command is invalid.",
  "Reviewer notes are required.",
  "Information request is required.",
  "A rejection rationale is required.",
  "Actor is not authorized to review assessments.",
  "Assessment was not found.",
  "Only submitted assessments can be reviewed.",
  "Assessment review has not been started.",
  "Assessment review transition is not allowed.",
]);

function mapStatus(value: string): AssessmentReviewStatus {
  if (assessmentReviewStatuses.includes(value as AssessmentReviewStatus)) {
    return value as AssessmentReviewStatus;
  }
  throw new AdminAssessmentReviewRepositoryError(
    "mapStatus",
    "Assessment review data is invalid.",
  );
}

function mapDecision(value: string): AssessmentReviewDecision {
  if (assessmentReviewDecisions.includes(value as AssessmentReviewDecision)) {
    return value as AssessmentReviewDecision;
  }
  throw new AdminAssessmentReviewRepositoryError(
    "mapDecision",
    "Assessment review data is invalid.",
  );
}

function mapQueue(row: QueueRow): AssessmentReviewQueueItem {
  if (row.assessment_status !== "submitted") {
    throw new AdminAssessmentReviewRepositoryError(
      "mapQueue",
      "Assessment review data is invalid.",
    );
  }

  return {
    participantId: row.participant_id,
    participantCode: row.participant_code,
    participantName: row.participant_name,
    participantEmail: row.participant_email,
    lifecycleStatus: row.lifecycle_status,
    assessmentId: row.assessment_id,
    assessmentSessionId: row.assessment_session_id,
    assessmentNumber: row.assessment_number,
    assessmentType: row.assessment_type,
    assessmentVersion: row.assessment_version,
    hfosVersion: row.hfos_version,
    assessmentStatus: "submitted",
    submittedAt: row.submitted_at,
    reviewId: row.review_id,
    reviewStatus: row.review_status ? mapStatus(row.review_status) : null,
    reviewDecision: row.review_decision
      ? mapDecision(row.review_decision)
      : null,
    reviewStartedAt: row.review_started_at,
    reviewCompletedAt: row.review_completed_at,
    reviewedBy: row.reviewed_by,
    reviewerName: row.reviewer_name,
    reviewCreatedAt: row.review_created_at,
    reviewUpdatedAt: row.review_updated_at,
  };
}

function repositoryFailure(
  operation: string,
  fallback: string,
  error: { code?: string; message?: string },
): never {
  const message =
    error.code === "P1001" &&
    error.message &&
    safeMessages.has(error.message)
      ? error.message
      : fallback;
  throw new AdminAssessmentReviewRepositoryError(operation, message);
}

export class AdminAssessmentReviewRepository {
  async listAssessmentReviews(
    actorUserId: string,
  ): Promise<AssessmentReviewQueueItem[]> {
    const { data, error } = await supabaseAdmin.rpc(
      "list_assessment_reviews",
      { p_actor_user_id: actorUserId },
    );
    if (error) {
      repositoryFailure(
        "listAssessmentReviews",
        "Assessment review queue could not be loaded.",
        error,
      );
    }
    return ((data ?? []) as QueueRow[]).map(mapQueue);
  }

  async getAssessmentReview(
    assessmentId: string,
    actorUserId: string,
  ): Promise<AssessmentReviewDetail | null> {
    const { data, error } = await supabaseAdmin.rpc(
      "get_assessment_review",
      {
        p_assessment_id: assessmentId,
        p_actor_user_id: actorUserId,
      },
    );
    if (error) {
      repositoryFailure(
        "getAssessmentReview",
        "Assessment review details could not be loaded.",
        error,
      );
    }
    const row = ((data ?? []) as DetailRow[])[0];
    if (!row) return null;

    return {
      ...mapQueue(row),
      assessmentCreatedAt: row.assessment_created_at,
      assessmentUpdatedAt: row.assessment_updated_at,
      moduleProgress: row.module_progress ?? {},
      answers: row.answers ?? {},
      documents: row.documents ?? [],
      reviewNotes: row.review_notes,
      informationRequest: row.information_request,
    };
  }

  async transitionAssessmentReview(
    input: AssessmentReviewTransitionInput,
  ): Promise<AssessmentReviewTransitionResult> {
    const { data, error } = await supabaseAdmin.rpc(
      "transition_assessment_review",
      {
        p_assessment_id: input.assessmentId,
        p_actor_user_id: input.actorUserId,
        p_command: input.command,
        p_reviewer_notes: input.reviewerNotes ?? null,
        p_information_request: input.informationRequest ?? null,
      },
    );
    if (error) {
      repositoryFailure(
        "transitionAssessmentReview",
        "Assessment review operation could not be completed.",
        error,
      );
    }
    const row = ((data ?? []) as TransitionRow[])[0];
    if (!row) {
      throw new AdminAssessmentReviewRepositoryError(
        "transitionAssessmentReview",
        "Assessment review operation could not be completed.",
      );
    }

    return {
      assessmentId: row.assessment_id,
      reviewId: row.review_id,
      reviewStatus: mapStatus(row.review_status),
      reviewDecision: row.review_decision
        ? mapDecision(row.review_decision)
        : null,
      reviewStartedAt: row.review_started_at,
      reviewCompletedAt: row.review_completed_at,
      reviewedBy: row.reviewed_by,
      reviewerName: row.reviewer_name,
      reviewNotes: row.review_notes,
      informationRequest: row.information_request,
      reviewCreatedAt: row.review_created_at,
      reviewUpdatedAt: row.review_updated_at,
    };
  }
}
