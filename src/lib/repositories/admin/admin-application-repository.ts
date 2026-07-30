/**
 * WPAG Admin Application Repository
 *
 * Responsibilities:
 * - Read application and eligibility-review records
 * - Return normalized admin application data
 * - Translate application-layer values to database values
 * - Convert database errors into repository errors
 *
 * This file must not:
 * - Make approval or rejection decisions
 * - Render UI
 * - Handle HTTP responses
 * - Create participants
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

import {
  ELIGIBILITY_DECISION,
  ELIGIBILITY_REVIEW_STATUS,
  type ApplicationStatus,
  type EligibilityDecision,
  type EligibilityReviewStatus,
} from "@/lib/services/participant/application-types";

import {
  AdminApplicationRepositoryError,
  type AdminApplicationDetail,
  type AdminApplicationListItem,
} from "@/lib/types/admin/admin-application";

interface ApplicationDatabaseRow {
  id: string;
  application_code: string;
  auth_user_id: string | null;

  full_name: string;
  email: string;

  phone_country_code: string;
  phone_number: string;

  country_code: string;
  state_or_region: string | null;
  city: string | null;

  age_group: string | null;
  employment_status: string | null;

  application_reason: string;
  financial_challenges: string | null;
  expectations: string | null;
  referral_source: string | null;

  status: string;
  submitted_at: string | null;

  created_at: string;
  updated_at: string;
}

interface EligibilityReviewDatabaseRow {
  id: string;
  application_id: string;

  review_number: number;
  review_status: string;
  decision: string;

  criteria_results: Record<string, unknown>;
  eligibility_score: number | null;

  decision_summary: string | null;
  eligibility_conditions: string | null;
  ineligibility_reason: string | null;
  additional_information_required: string | null;

  reviewed_by: string | null;
  started_at: string | null;
  completed_at: string | null;

  created_at: string;
  updated_at: string;

  applications:
    | ApplicationDatabaseRow
    | ApplicationDatabaseRow[]
    | null;
}

function getApplicationRow(
  applications:
    | ApplicationDatabaseRow
    | ApplicationDatabaseRow[]
    | null,
): ApplicationDatabaseRow | null {
  if (!applications) {
    return null;
  }

  if (Array.isArray(applications)) {
    return applications[0] ?? null;
  }

  return applications;
}

function mapDatabaseReviewStatus(
  reviewStatus: string,
): EligibilityReviewStatus {
  switch (reviewStatus) {
    case "pending":
      return ELIGIBILITY_REVIEW_STATUS.PENDING;

    case "in_review":
      return ELIGIBILITY_REVIEW_STATUS.IN_PROGRESS;

    case "completed":
      return ELIGIBILITY_REVIEW_STATUS.COMPLETED;

    default:
      throw new AdminApplicationRepositoryError(
        "mapDatabaseReviewStatus",
        `Unsupported eligibility review status: ${reviewStatus}`,
      );
  }
}

function mapDatabaseDecision(
  decision: string,
): EligibilityDecision {
  switch (decision) {
    case "pending":
      return ELIGIBILITY_DECISION.PENDING;

    case "eligible":
      return ELIGIBILITY_DECISION.APPROVED;

    case "ineligible":
      return ELIGIBILITY_DECISION.REJECTED;

    default:
      throw new AdminApplicationRepositoryError(
        "mapDatabaseDecision",
        `Unsupported eligibility decision: ${decision}`,
      );
  }
}

function mapApplicationStatusToDatabase(
  applicationStatus: ApplicationStatus,
): string {
  switch (applicationStatus) {
    case "eligibility_approved":
      return "eligible";

    case "eligibility_rejected":
      return "ineligible";

    case "more_information_required":
      return "additional_information_required";

    default:
      return applicationStatus;
  }
}
function mapToAdminApplicationListItem(
  review: EligibilityReviewDatabaseRow,
): AdminApplicationListItem {
  const application = getApplicationRow(review.applications);

  if (!application) {
    throw new AdminApplicationRepositoryError(
      "mapToAdminApplicationListItem",
      "Eligibility review does not contain an application record.",
    );
  }

  return {
    id: application.id,
    applicationCode: application.application_code,

    fullName: application.full_name,
    email: application.email,

    countryCode: application.country_code,
    stateOrRegion: application.state_or_region,
    city: application.city,

    applicationStatus: application.status as ApplicationStatus,
    reviewStatus: mapDatabaseReviewStatus(
      review.review_status,
    ),
    decision: mapDatabaseDecision(review.decision),

    reviewId: review.id,
    reviewNumber: review.review_number,

    submittedAt: application.submitted_at,
    createdAt: application.created_at,
  };
}

function mapToAdminApplicationDetail(
  review: EligibilityReviewDatabaseRow,
): AdminApplicationDetail {
  const application = getApplicationRow(review.applications);

  if (!application) {
    throw new AdminApplicationRepositoryError(
      "mapToAdminApplicationDetail",
      "Eligibility review does not contain an application record.",
    );
  }

  return {
    ...mapToAdminApplicationListItem(review),

    authUserId: application.auth_user_id,

    phoneCountryCode: application.phone_country_code,
    phoneNumber: application.phone_number,

    ageGroup: application.age_group,
    employmentStatus: application.employment_status,

    applicationReason: application.application_reason,
    financialChallenges: application.financial_challenges,
    expectations: application.expectations,
    referralSource: application.referral_source,

    criteriaResults: review.criteria_results,
    eligibilityScore: review.eligibility_score,

    reviewerNotes: review.decision_summary,
    conditionalReason: review.eligibility_conditions,
    ineligibleReason: review.ineligibility_reason,

    reviewedBy: review.reviewed_by,
    startedAt: review.started_at,
    completedAt: review.completed_at,

    applicationUpdatedAt: application.updated_at,
    reviewCreatedAt: review.created_at,
    reviewUpdatedAt: review.updated_at,
  };
}

export class AdminApplicationRepository {
  async getPendingApplications(): Promise<
    AdminApplicationListItem[]
  > {
    const { data, error } = await supabaseAdmin
      .from("eligibility_reviews")
      .select(
        `
          *,
          applications (*)
        `,
      )
      .eq("review_status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      throw new AdminApplicationRepositoryError(
        "getPendingApplications",
        "Failed to load pending applications.",
        error.message,
      );
    }

    return (data ?? []).map((review) =>
      mapToAdminApplicationListItem(
        review as EligibilityReviewDatabaseRow,
      ),
    );
  }

  async getApplicationById(
    applicationId: string,
  ): Promise<AdminApplicationDetail | null> {
    const { data, error } = await supabaseAdmin
      .from("eligibility_reviews")
      .select(
        `
          *,
          applications (*)
        `,
      )
      .eq("application_id", applicationId)
      .order("review_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new AdminApplicationRepositoryError(
        "getApplicationById",
        "Failed to load application details.",
        error.message,
      );
    }

    if (!data) {
      return null;
    }

    return mapToAdminApplicationDetail(
      data as EligibilityReviewDatabaseRow,
    );
  }

  async updateApplicationReview(input: {
    applicationId: string;
    reviewId: string;
    applicationStatus: ApplicationStatus;
    decision: EligibilityDecision;
    reviewerNotes: string | null;
    conditionalReason: string | null;
    ineligibleReason: string | null;
    reviewedBy: string;
  }): Promise<void> {
    const completedAt = new Date().toISOString();

    const isMoreInformationRequest =
      input.decision ===
      ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED;

    const databaseDecision =
      input.decision === ELIGIBILITY_DECISION.APPROVED
        ? "eligible"
        : input.decision === ELIGIBILITY_DECISION.REJECTED
          ? "ineligible"
          : "pending";

    const databaseReviewStatus =
      isMoreInformationRequest
        ? "in_review"
        : "completed";

    const { error: reviewError } = await supabaseAdmin
      .from("eligibility_reviews")
      .update({
        review_status: databaseReviewStatus,
        decision: databaseDecision,

        decision_summary: input.reviewerNotes,

        eligibility_conditions: null,

        additional_information_required:
          isMoreInformationRequest
            ? input.conditionalReason
            : null,

        ineligibility_reason:
          input.decision === ELIGIBILITY_DECISION.REJECTED
            ? input.ineligibleReason
            : null,

        reviewed_by: input.reviewedBy,

        completed_at: isMoreInformationRequest
          ? null
          : completedAt,
      })
      .eq("id", input.reviewId)
      .eq("application_id", input.applicationId);

    if (reviewError) {
      throw new AdminApplicationRepositoryError(
        "updateApplicationReview",
        "Failed to update eligibility review.",
        reviewError.message,
      );
    }

    const databaseApplicationStatus =
  mapApplicationStatusToDatabase(
    input.applicationStatus,
  );

const { error: applicationError } =
  await supabaseAdmin
    .from("applications")
    .update({
      status: databaseApplicationStatus,
      reviewed_at:
        input.decision ===
        ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED
          ? null
          : completedAt,
    })
    .eq("id", input.applicationId);

    if (applicationError) {
      throw new AdminApplicationRepositoryError(
        "updateApplicationReview",
        "Eligibility review was updated, but application status update failed.",
        applicationError.message,
      );
    }
  }
}