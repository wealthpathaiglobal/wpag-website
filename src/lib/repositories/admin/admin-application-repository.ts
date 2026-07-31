import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  AdminApplicationRepositoryError,
  type AdminApplicationDetail,
  type AdminApplicationListItem,
} from "@/lib/types/admin/admin-application";
import {
  ELIGIBILITY_DECISION,
  ELIGIBILITY_REVIEW_STATUS,
  type ApplicationStatus,
  type EligibilityDecision,
  type EligibilityReviewStatus,
} from "@/lib/services/participant/application-types";

type QueueRow = {
  application_id: string; application_code: string; full_name: string; email: string;
  country_code: string; state_or_region: string | null; city: string | null;
  application_status: string; submitted_at: string | null; application_created_at: string;
  eligibility_review_id: string; review_number: number; review_status: string; decision: string;
};

type DetailRow = QueueRow & {
  auth_user_id: string | null; phone_country_code: string; phone_number: string;
  age_group: string | null; employment_status: string | null; application_reason: string;
  financial_challenges: string | null; expectations: string | null; referral_source: string | null;
  criteria_results: Record<string, unknown>; eligibility_score: number | null;
  decision_summary: string | null; eligibility_conditions: string | null;
  additional_information_required: string | null; ineligibility_reason: string | null;
  reviewed_by: string | null; started_at: string | null; completed_at: string | null;
  application_updated_at: string; review_created_at: string; review_updated_at: string;
};

export type ApplicationReviewTransitionCommand =
  | "approve" | "reject" | "request_more_information";

export type ApplicationReviewTransitionResult = {
  applicationId: string; applicationCode: string; applicationStatus: string;
  reviewId: string; reviewStatus: string; decision: string;
  reviewedAt: string | null; completedAt: string | null;
  participantId: string | null; participantCode: string | null;
  participantLifecycleStatus: string | null; converted: boolean;
};

type TransitionRow = {
  application_id: string; application_code: string; application_status: string;
  review_id: string; review_status: string; decision: string;
  reviewed_at: string | null; completed_at: string | null;
  participant_id: string | null; participant_code: string | null;
  participant_lifecycle_status: string | null; converted: boolean;
};

function reviewStatus(value: string): EligibilityReviewStatus {
  if (value === "pending") return ELIGIBILITY_REVIEW_STATUS.PENDING;
  if (value === "in_review") return ELIGIBILITY_REVIEW_STATUS.IN_PROGRESS;
  if (value === "completed") return ELIGIBILITY_REVIEW_STATUS.COMPLETED;
  throw new AdminApplicationRepositoryError("mapReviewStatus", "Application review data is invalid.");
}

function decision(value: string): EligibilityDecision {
  if (value === "pending") return ELIGIBILITY_DECISION.PENDING;
  if (value === "eligible") return ELIGIBILITY_DECISION.APPROVED;
  if (value === "ineligible") return ELIGIBILITY_DECISION.REJECTED;
  throw new AdminApplicationRepositoryError("mapDecision", "Application review data is invalid.");
}

function applicationStatus(value: string): ApplicationStatus {
  if (value === "eligible") return "eligibility_approved";
  if (value === "ineligible") return "eligibility_rejected";
  if (value === "additional_information_required") return "more_information_required";
  if (value === "converted") return "participant_created";
  return value as ApplicationStatus;
}

function mapList(row: QueueRow): AdminApplicationListItem {
  return {
    id: row.application_id, applicationCode: row.application_code,
    fullName: row.full_name, email: row.email, countryCode: row.country_code,
    stateOrRegion: row.state_or_region, city: row.city,
    applicationStatus: applicationStatus(row.application_status),
    reviewStatus: reviewStatus(row.review_status), decision: decision(row.decision),
    reviewId: row.eligibility_review_id, reviewNumber: row.review_number,
    submittedAt: row.submitted_at, createdAt: row.application_created_at,
  };
}

function mapDetail(row: DetailRow): AdminApplicationDetail {
  return {
    ...mapList(row), authUserId: row.auth_user_id,
    phoneCountryCode: row.phone_country_code, phoneNumber: row.phone_number,
    ageGroup: row.age_group, employmentStatus: row.employment_status,
    applicationReason: row.application_reason, financialChallenges: row.financial_challenges,
    expectations: row.expectations, referralSource: row.referral_source,
    criteriaResults: row.criteria_results, eligibilityScore: row.eligibility_score,
    reviewerNotes: row.decision_summary, conditionalReason: row.additional_information_required,
    ineligibleReason: row.ineligibility_reason, reviewedBy: row.reviewed_by,
    startedAt: row.started_at, completedAt: row.completed_at,
    applicationUpdatedAt: row.application_updated_at,
    reviewCreatedAt: row.review_created_at, reviewUpdatedAt: row.review_updated_at,
  };
}

function repositoryFailure(operation: string, message: string, error: { code?: string; message?: string }) {
  const safeMessages = new Set([
    "Application ID is required.", "Actor identity is required.", "Eligibility decision is invalid.",
    "Application was not found.", "Application is unavailable.",
    "Actor is not authorized to review applications.", "Application review was not found.",
    "Application review has already been completed.", "Application review transition is not allowed.",
    "A rejection reason is required.", "Additional information requirements are required.",
    "Participant conversion could not be completed.",
  ]);
  throw new AdminApplicationRepositoryError(
    operation,
    error.code === "P1001" && error.message && safeMessages.has(error.message)
      ? error.message : message,
  );
}

export class AdminApplicationRepository {
  async getPendingApplications(): Promise<AdminApplicationListItem[]> {
    const { data, error } = await supabaseAdmin.rpc("list_pending_application_reviews", {});
    if (error) repositoryFailure("getPendingApplications", "Failed to load pending applications.", error);
    return ((data ?? []) as QueueRow[]).map(mapList);
  }

  async getApplicationById(applicationId: string): Promise<AdminApplicationDetail | null> {
    const { data, error } = await supabaseAdmin.rpc("get_application_review", {
      p_application_id: applicationId,
    });
    if (error) repositoryFailure("getApplicationById", "Failed to load application details.", error);
    const row = ((data ?? []) as DetailRow[])[0];
    return row ? mapDetail(row) : null;
  }

  async transitionApplicationReview(input: {
    applicationId: string; actorUserId: string; command: ApplicationReviewTransitionCommand;
    reviewerNotes: string | null; reason: string | null;
  }): Promise<ApplicationReviewTransitionResult> {
    const { data, error } = await supabaseAdmin.rpc("transition_application_eligibility_review", {
      p_application_id: input.applicationId, p_actor_user_id: input.actorUserId,
      p_decision: input.command, p_reviewer_notes: input.reviewerNotes, p_reason: input.reason,
    });
    if (error) repositoryFailure("transitionApplicationReview", "Application review operation could not be completed.", error);
    const row = ((data ?? []) as TransitionRow[])[0];
    if (!row) throw new AdminApplicationRepositoryError("transitionApplicationReview", "Application review operation could not be completed.");
    return {
      applicationId: row.application_id, applicationCode: row.application_code,
      applicationStatus: row.application_status, reviewId: row.review_id,
      reviewStatus: row.review_status, decision: row.decision,
      reviewedAt: row.reviewed_at, completedAt: row.completed_at,
      participantId: row.participant_id, participantCode: row.participant_code,
      participantLifecycleStatus: row.participant_lifecycle_status, converted: row.converted,
    };
  }
}
