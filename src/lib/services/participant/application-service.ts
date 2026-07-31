import {
  ApplicationRepositoryError,
  createApplicationSubmission,
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

export interface ApplicationServiceDuplicateFailure {
  success: false;
  type: "duplicate_error";
  message: string;
  errors?: undefined;
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
  | ApplicationServiceDuplicateFailure
  | ApplicationServiceProcessingFailure;

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

  try {
    const submission = await createApplicationSubmission(
      validationResult.data,
      metadata,
    );

    return {
      success: true,
      data: submission,
      message: "Application submitted successfully.",
    };
  } catch (error) {
    if (
      error instanceof ApplicationRepositoryError &&
      error.kind === "active_application_exists"
    ) {
      return {
        success: false,
        type: "duplicate_error",
        message: "An active application already exists.",
      };
    }

    if (
      error instanceof ApplicationRepositoryError &&
      error.kind === "application_data_invalid"
    ) {
      return {
        success: false,
        type: "validation_error",
        message: "Please correct the application details and try again.",
        errors: [
          {
            field: "request",
            message: "Application data is invalid.",
          },
        ],
      };
    }

    console.error(
      "[WPAG Application Service] Application submission failed.",
    );

    return {
      success: false,
      type: "processing_error",
      message: "The application could not be submitted. Please try again.",
    };
  }
}
