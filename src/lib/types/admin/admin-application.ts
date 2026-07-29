/**
 * WPAG Admin Application Types
 *
 * Responsibilities:
 * - Define the data structure used by the Admin Applications module
 * - Keep application and eligibility review data consistently typed
 * - Provide repository-level error information
 *
 * This file must not:
 * - Query the database
 * - Apply eligibility decisions
 * - Render UI
 */

import type {
  ApplicationStatus,
  EligibilityDecision,
  EligibilityReviewStatus,
} from "@/lib/services/participant/application-types";

export interface AdminApplicationListItem {
  id: string;
  applicationCode: string;

  fullName: string;
  email: string;

  countryCode: string;
  stateOrRegion: string | null;
  city: string | null;

  applicationStatus: ApplicationStatus;
  reviewStatus: EligibilityReviewStatus;
  decision: EligibilityDecision;

  reviewId: string;
  reviewNumber: number;

  submittedAt: string | null;
  createdAt: string;
}

export interface AdminApplicationDetail
  extends AdminApplicationListItem {
  authUserId: string | null;

  phoneCountryCode: string;
  phoneNumber: string;

  ageGroup: string | null;
  employmentStatus: string | null;

  applicationReason: string;
  financialChallenges: string | null;
  expectations: string | null;
  referralSource: string | null;

  criteriaResults: Record<string, unknown>;
  eligibilityScore: number | null;

  reviewerNotes: string | null;
  conditionalReason: string | null;
  ineligibleReason: string | null;

  reviewedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;

  applicationUpdatedAt: string;
  reviewCreatedAt: string;
  reviewUpdatedAt: string;
}

export interface AdminApplicationFilters {
  applicationStatus?: ApplicationStatus;
  reviewStatus?: EligibilityReviewStatus;
  decision?: EligibilityDecision;
  search?: string;
}

export class AdminApplicationRepositoryError extends Error {
  readonly operation: string;
  readonly databaseMessage: string | null;

  constructor(
    operation: string,
    message: string,
    databaseMessage: string | null = null,
  ) {
    super(message);

    this.name = "AdminApplicationRepositoryError";
    this.operation = operation;
    this.databaseMessage = databaseMessage;
  }
}