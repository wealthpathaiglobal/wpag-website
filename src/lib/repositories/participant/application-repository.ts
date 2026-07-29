/**
 * WPAG Participant Application Repository
 *
 * Responsibilities:
 * - Insert participant applications
 * - Create the initial eligibility review
 * - Return normalized database records
 *
 * This module must not:
 * - Validate participant input
 * - Apply HTTP response logic
 * - Make eligibility decisions
 * - Generate application codes manually
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

import {
  APPLICATION_STATUS,
  type ApplicationRequestMetadata,
  type CreatedApplicationRecord,
  type CreatedEligibilityReviewRecord,
  type NormalizedApplicationInput,
} from "@/lib/services/participant/application-types";

interface ApplicationDatabaseRow {
  id: string;
  application_code: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

interface EligibilityReviewDatabaseRow {
  id: string;
  application_id: string;
  review_number: number;
  review_status: string;
  decision: string;
  created_at: string;
}

export class ApplicationRepositoryError extends Error {
  readonly operation: string;
  readonly databaseMessage: string | null;

  constructor(
    operation: string,
    message: string,
    databaseMessage: string | null = null,
  ) {
    super(message);

    this.name = "ApplicationRepositoryError";
    this.operation = operation;
    this.databaseMessage = databaseMessage;
  }
}

/**
 * Creates a new participant application.
 *
 * The application_code field is generated automatically by PostgreSQL.
 */
export async function createApplication(
  input: NormalizedApplicationInput,
  metadata: ApplicationRequestMetadata,
): Promise<CreatedApplicationRecord> {
  const submittedAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("applications")
    .insert({
      auth_user_id: metadata.authUserId,

      full_name: input.fullName,
      email: input.email,

      phone_country_code: input.phoneCountryCode,
      phone_number: input.phoneNumber,

      country_code: input.countryCode,
      state_or_region: input.stateOrRegion,
      city: input.city,

      age_group: input.ageGroup,
      employment_status: input.employmentStatus,

      application_reason: input.applicationReason,
      financial_challenges: input.financialChallenges,
      expectations: input.expectations,
      referral_source: input.referralSource,

      status: APPLICATION_STATUS.SUBMITTED,
      submitted_at: submittedAt,

      source_ip: metadata.sourceIp,
      user_agent: metadata.userAgent,

      created_by: metadata.authUserId,
      updated_by: metadata.authUserId,
    })
    .select(
      `
        id,
        application_code,
        status,
        submitted_at,
        created_at
      `,
    )
    .single<ApplicationDatabaseRow>();

  if (error || !data) {
    throw new ApplicationRepositoryError(
      "create_application",
      "Unable to create participant application.",
      error?.message ?? null,
    );
  }

  return {
    id: data.id,
    applicationCode: data.application_code,
    status: APPLICATION_STATUS.SUBMITTED,
    submittedAt: data.submitted_at,
    createdAt: data.created_at,
  };
}

/**
 * Creates the first eligibility review for an application.
 *
 * PostgreSQL defaults provide:
 * - review_number = 1
 * - review_status = pending
 * - decision = pending
 * - criteria_results = {}
 */
export async function createEligibilityReview(
  applicationId: string,
  createdBy: string | null,
): Promise<CreatedEligibilityReviewRecord> {
  const { data, error } = await supabaseAdmin
    .from("eligibility_reviews")
    .insert({
      application_id: applicationId,
      created_by: createdBy,
      updated_by: createdBy,
    })
    .select(
      `
        id,
        application_id,
        review_number,
        review_status,
        decision,
        created_at
      `,
    )
    .single<EligibilityReviewDatabaseRow>();

  if (error || !data) {
    throw new ApplicationRepositoryError(
      "create_eligibility_review",
      "Unable to create the initial eligibility review.",
      error?.message ?? null,
    );
  }

  return {
    id: data.id,
    applicationId: data.application_id,
    reviewNumber: data.review_number,
    reviewStatus:
      data.review_status as CreatedEligibilityReviewRecord["reviewStatus"],
    decision:
      data.decision as CreatedEligibilityReviewRecord["decision"],
    createdAt: data.created_at,
  };
}

/**
 * Compensating cleanup used when eligibility review creation fails
 * after the application record has already been inserted.
 *
 * This prevents incomplete application pipelines.
 */
export async function deleteApplication(
  applicationId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("applications")
    .delete()
    .eq("id", applicationId);

  if (error) {
    throw new ApplicationRepositoryError(
      "delete_application",
      "Unable to remove an incomplete participant application.",
      error.message,
    );
  }
}