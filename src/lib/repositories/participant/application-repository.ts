import { supabaseAdmin } from "@/lib/supabase/admin";

import type {
  ApplicationRequestMetadata,
  ApplicationSubmissionResult,
  CreatedApplicationRecord,
  CreatedEligibilityReviewRecord,
  NormalizedApplicationInput,
} from "@/lib/services/participant/application-types";

interface ApplicationSubmissionDatabaseRow {
  application_id: string;
  application_code: string;
  application_status: CreatedApplicationRecord["status"];
  submitted_at: string;
  application_created_at: string;
  eligibility_review_id: string;
  review_number: number;
  review_status: CreatedEligibilityReviewRecord["reviewStatus"];
  decision: CreatedEligibilityReviewRecord["decision"];
  review_created_at: string;
}

export type ApplicationRepositoryErrorKind =
  | "active_application_exists"
  | "application_data_invalid"
  | "submission_failed";

export class ApplicationRepositoryError extends Error {
  readonly kind: ApplicationRepositoryErrorKind;

  constructor(kind: ApplicationRepositoryErrorKind, message: string) {
    super(message);
    this.name = "ApplicationRepositoryError";
    this.kind = kind;
  }
}

function getKnownDomainError(error: {
  code?: string;
  message?: string;
}): ApplicationRepositoryError | null {
  if (error.code !== "P1001") {
    return null;
  }

  if (error.message === "An active application already exists.") {
    return new ApplicationRepositoryError(
      "active_application_exists",
      "An active application already exists.",
    );
  }

  if (error.message === "Application data is invalid.") {
    return new ApplicationRepositoryError(
      "application_data_invalid",
      "Application data is invalid.",
    );
  }

  return null;
}

export async function createApplicationSubmission(
  input: NormalizedApplicationInput,
  metadata: ApplicationRequestMetadata,
): Promise<ApplicationSubmissionResult> {
  const { data, error } = await supabaseAdmin.rpc(
    "submit_participant_application",
    {
      p_full_name: input.fullName,
      p_email: input.email,
      p_phone_country_code: input.phoneCountryCode,
      p_phone_number: input.phoneNumber,
      p_country_code: input.countryCode,
      p_state_or_region: input.stateOrRegion,
      p_city: input.city,
      p_age_group: input.ageGroup,
      p_employment_status: input.employmentStatus,
      p_application_reason: input.applicationReason,
      p_financial_challenges: input.financialChallenges,
      p_expectations: input.expectations,
      p_referral_source: input.referralSource,
      p_source_ip: metadata.sourceIp,
      p_user_agent: metadata.userAgent,
      p_auth_user_id: metadata.authUserId,
    },
  );

  if (error) {
    const domainError = getKnownDomainError(error);

    if (domainError) {
      throw domainError;
    }

    throw new ApplicationRepositoryError(
      "submission_failed",
      "Participant application submission could not be completed.",
    );
  }

  const row = (data as ApplicationSubmissionDatabaseRow[] | null)?.[0];

  if (!row) {
    throw new ApplicationRepositoryError(
      "submission_failed",
      "Participant application submission could not be completed.",
    );
  }

  return {
    application: {
      id: row.application_id,
      applicationCode: row.application_code,
      status: row.application_status,
      submittedAt: row.submitted_at,
      createdAt: row.application_created_at,
    },
    eligibilityReview: {
      id: row.eligibility_review_id,
      applicationId: row.application_id,
      reviewNumber: row.review_number,
      reviewStatus: row.review_status,
      decision: row.decision,
      createdAt: row.review_created_at,
    },
  };
}
