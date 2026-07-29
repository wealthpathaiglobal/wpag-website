/**
 * WPAG Participant Application Service
 *
 * Responsibilities:
 * - Validate incoming application requests
 * - Coordinate application creation
 * - Coordinate initial eligibility review creation
 * - Perform compensating cleanup when the workflow fails
 * - Return a consistent service result
 *
 * This module must not:
 * - Read HTTP headers directly
 * - Return Next.js responses
 * - Access Supabase directly
 * - Contain React or frontend logic
 */

import {
  ApplicationRepositoryError,
  createApplication,
  createEligibilityReview,
  deleteApplication,
} from "@/lib/repositories/participant/application-repository";

import type {
  ApplicationRequestMetadata,
  ApplicationSubmissionResult,
  ApplicationValidationError,
  CreateApplicationRequest,
} from "@/lib/services/participant/application-types";

import { validateApplication } from "@/lib/services/participant/application-validator";

export interface ApplicationServiceSuccess {
  success: true;
  data: ApplicationSubmissionResult;
  message: string;
}

export interface ApplicationServiceValidationFailure {
  success: false;
  type: "validation_error";
  message: string;
  errors: ApplicationValidationError[];
}

export interface ApplicationServiceProcessingFailure {
  success: false;
  type: "processing_error";
  message: string;
  errors?: undefined;
}

export type ApplicationServiceResult =
  | ApplicationServiceSuccess
  | ApplicationServiceValidationFailure
  | ApplicationServiceProcessingFailure;

function logRepositoryError(
  context: string,
  error: ApplicationRepositoryError,
): void {
  console.error(`[WPAG Application Service] ${context}`, {
    operation: error.operation,
    message: error.message,
    databaseMessage: error.databaseMessage,
  });
}

function logUnexpectedError(context: string, error: unknown): void {
  console.error(`[WPAG Application Service] ${context}`, error);
}

/**
 * Submits a participant application and creates its first eligibility review.
 *
 * Workflow:
 * 1. Validate and normalize the incoming request.
 * 2. Create the application record.
 * 3. Create the initial eligibility review.
 * 4. Delete the application if eligibility review creation fails.
 */
export async function submitApplication(
  request: CreateApplicationRequest | unknown,
  metadata: ApplicationRequestMetadata,
): Promise<ApplicationServiceResult> {
  const validationResult = validateApplication(request);

  if (!validationResult.valid) {
    return {
      success: false,
      type: "validation_error",
      message: "Please correct the application details and try again.",
      errors: validationResult.errors,
    };
  }

  const normalizedInput = validationResult.data;

  let createdApplicationId: string | null = null;

  try {
    const application = await createApplication(
      normalizedInput,
      metadata,
    );

    createdApplicationId = application.id;

    try {
      const eligibilityReview = await createEligibilityReview(
        application.id,
        metadata.authUserId,
      );

      return {
        success: true,
        data: {
          application,
          eligibilityReview,
        },
        message: "Application submitted successfully.",
      };
    } catch (eligibilityError) {
      if (eligibilityError instanceof ApplicationRepositoryError) {
        logRepositoryError(
          "Initial eligibility review creation failed.",
          eligibilityError,
        );
      } else {
        logUnexpectedError(
          "Unexpected eligibility review creation failure.",
          eligibilityError,
        );
      }

      try {
        await deleteApplication(application.id);
      } catch (cleanupError) {
        if (cleanupError instanceof ApplicationRepositoryError) {
          logRepositoryError(
            "Compensating application cleanup failed.",
            cleanupError,
          );
        } else {
          logUnexpectedError(
            "Unexpected compensating cleanup failure.",
            cleanupError,
          );
        }
      }

      return {
        success: false,
        type: "processing_error",
        message:
          "The application could not be finalized. Please try again.",
      };
    }
  } catch (applicationError) {
    if (applicationError instanceof ApplicationRepositoryError) {
      logRepositoryError(
        "Participant application creation failed.",
        applicationError,
      );
    } else {
      logUnexpectedError(
        "Unexpected participant application creation failure.",
        applicationError,
      );
    }

    if (createdApplicationId) {
      try {
        await deleteApplication(createdApplicationId);
      } catch (cleanupError) {
        if (cleanupError instanceof ApplicationRepositoryError) {
          logRepositoryError(
            "Unexpected application cleanup failed.",
            cleanupError,
          );
        } else {
          logUnexpectedError(
            "Unexpected application cleanup failure.",
            cleanupError,
          );
        }
      }
    }

    return {
      success: false,
      type: "processing_error",
      message:
        "The application could not be submitted. Please try again.",
    };
  }
}