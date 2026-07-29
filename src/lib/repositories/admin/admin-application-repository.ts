/**
 * WPAG Admin Application Repository
 *
 * Responsibilities:
 * - Read application and eligibility-review records
 * - Return normalized admin application data
 * - Convert database errors into repository errors
 *
 * This file must not:
 * - Make approval or rejection decisions
 * - Render UI
 * - Handle HTTP responses
 * - Create participants
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

import type {
  ApplicationStatus,
  EligibilityDecision,
  EligibilityReviewStatus,
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

  reviewer_notes: string | null;
  conditional_reason: string | null;
  ineligible_reason: string | null;

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
    reviewStatus: review.review_status as EligibilityReviewStatus,
    decision: review.decision as EligibilityDecision,

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

    reviewerNotes: review.reviewer_notes,
    conditionalReason: review.conditional_reason,
    ineligibleReason: review.ineligible_reason,

    reviewedBy: review.reviewed_by,
    startedAt: review.started_at,
    completedAt: review.completed_at,

    applicationUpdatedAt: application.updated_at,
    reviewCreatedAt: review.created_at,
    reviewUpdatedAt: review.updated_at,
  };
}
export class AdminApplicationRepository {
  async getPendingApplications(): Promise<AdminApplicationListItem[]> {
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
}