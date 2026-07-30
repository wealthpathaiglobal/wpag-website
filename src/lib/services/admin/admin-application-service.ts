/**
 * WPAG Admin Application Service
 *
 * Responsibilities:
 * - Provide application-review data to the admin UI
 * - Validate incoming application identifiers
 * - Validate eligibility-review decisions
 * - Coordinate application review updates through the repository
 *
 * This file must not:
 * - Query Supabase directly
 * - Render UI
 * - Create participant records
 */

import { AdminApplicationRepository } from "@/lib/repositories/admin/admin-application-repository";
import { createParticipantFromApprovedApplication } from "@/lib/services/admin/participant-creation-service";

import {
  APPLICATION_STATUS,
  ELIGIBILITY_DECISION,
  ELIGIBILITY_REVIEW_STATUS,
} from "@/lib/services/participant/application-types";

import type { EligibilityDecision } from "@/lib/services/participant/application-types";

import type {
  AdminApplicationDetail,
  AdminApplicationListItem,
} from "@/lib/types/admin/admin-application";

type AdminReviewDecision = Exclude<
  EligibilityDecision,
  typeof ELIGIBILITY_DECISION.PENDING
>;

export interface ReviewApplicationInput {
  applicationId: string;
  decision: AdminReviewDecision;
  reviewerNotes?: string | null;
  reason?: string | null;
  reviewedBy: string;
}

export class AdminApplicationServiceError extends Error {
  readonly operation: string;

  constructor(operation: string, message: string) {
    super(message);

    this.name = "AdminApplicationServiceError";
    this.operation = operation;
  }
}

export class AdminApplicationService {
  constructor(
    private readonly repository = new AdminApplicationRepository(),
  ) {}

  async getPendingApplications(): Promise<AdminApplicationListItem[]> {
    return this.repository.getPendingApplications();
  }

  async getApplicationById(
    applicationId: string,
  ): Promise<AdminApplicationDetail | null> {
    const normalizedApplicationId = applicationId.trim();

    if (!normalizedApplicationId) {
      throw new AdminApplicationServiceError(
        "getApplicationById",
        "Application ID is required.",
      );
    }

    return this.repository.getApplicationById(
      normalizedApplicationId,
    );
  }

  async reviewApplication(
    input: ReviewApplicationInput,
  ): Promise<void> {
    const applicationId = input.applicationId.trim();
    const reviewedBy = input.reviewedBy.trim();
    const reviewerNotes = input.reviewerNotes?.trim() || null;
    const reason = input.reason?.trim() || null;

    if (!applicationId) {
      throw new AdminApplicationServiceError(
        "reviewApplication",
        "Application ID is required.",
      );
    }

    if (!reviewedBy) {
      throw new AdminApplicationServiceError(
        "reviewApplication",
        "Reviewer identity is required.",
      );
    }

    const application =
      await this.repository.getApplicationById(applicationId);

    if (!application) {
      throw new AdminApplicationServiceError(
        "reviewApplication",
        "Application was not found.",
      );
    }

    if (
      application.reviewStatus ===
      ELIGIBILITY_REVIEW_STATUS.COMPLETED
    ) {
      throw new AdminApplicationServiceError(
        "reviewApplication",
        "This application review has already been completed.",
      );
    }

    let applicationStatus:
      | typeof APPLICATION_STATUS.ELIGIBILITY_APPROVED
      | typeof APPLICATION_STATUS.ELIGIBILITY_REJECTED
      | typeof APPLICATION_STATUS.MORE_INFORMATION_REQUIRED;

    let conditionalReason: string | null = null;
    let ineligibleReason: string | null = null;

    if (input.decision === ELIGIBILITY_DECISION.APPROVED) {
      applicationStatus =
        APPLICATION_STATUS.ELIGIBILITY_APPROVED;
    } else if (
      input.decision === ELIGIBILITY_DECISION.REJECTED
    ) {
      if (!reason) {
        throw new AdminApplicationServiceError(
          "reviewApplication",
          "A rejection reason is required.",
        );
      }

      applicationStatus =
        APPLICATION_STATUS.ELIGIBILITY_REJECTED;
      ineligibleReason = reason;
    } else if (
      input.decision ===
      ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED
    ) {
      if (!reason) {
        throw new AdminApplicationServiceError(
          "reviewApplication",
          "A reason is required when requesting more information.",
        );
      }

      applicationStatus =
        APPLICATION_STATUS.MORE_INFORMATION_REQUIRED;
      conditionalReason = reason;
    } else {
      throw new AdminApplicationServiceError(
        "reviewApplication",
        "Invalid eligibility decision.",
      );
    }

        await this.repository.updateApplicationReview({
      applicationId,
      reviewId: application.reviewId,
      applicationStatus,
      decision: input.decision,
      reviewerNotes,
      conditionalReason,
      ineligibleReason,
      reviewedBy,
    });

    if (
      input.decision === ELIGIBILITY_DECISION.APPROVED
    ) {
      await createParticipantFromApprovedApplication({
        applicationId,
        createdBy: reviewedBy,
      });
    }
  }
}

export const adminApplicationService =
  new AdminApplicationService();