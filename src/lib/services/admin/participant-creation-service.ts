/**
 * WPAG Participant Creation Service
 *
 * Responsibilities:
 * - Create a participant from an eligible application
 * - Prevent duplicate participant creation
 * - Create the initial participant profile
 * - Mark the source application as converted
 * - Roll back partial records when creation fails
 *
 * This file must not:
 * - Approve or reject applications
 * - Send participant invitations
 * - Activate participant enrollment
 * - Render UI
 * - Handle HTTP responses
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface CreateParticipantFromApplicationInput {
  applicationId: string;
  createdBy: string;
}

interface CreatedParticipant {
  id: string;
  participant_code: string;
  application_id: string | null;
  lifecycle_status: string;
  research_status: string;
}

export class ParticipantCreationServiceError extends Error {
  readonly operation: string;

  constructor(operation: string, message: string) {
    super(message);

    this.name = "ParticipantCreationServiceError";
    this.operation = operation;
  }
}

function validateRequiredValue(
  value: string,
  fieldName: string,
): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new ParticipantCreationServiceError(
      "validateRequiredValue",
      `${fieldName} is required.`,
    );
  }

  return normalizedValue;
}

const safeParticipantConversionMessages = new Set([
  "Application ID is required.",
  "Actor identity is required.",
  "Actor is not authorized to convert applications.",
  "Application not found.",
  "Deleted applications cannot be converted.",
  "Application is not eligible for participant conversion.",
  "Application is already linked to a deleted participant.",
  "Existing participant conversion is incomplete.",
  "Application account is already linked to another participant.",
]);

export async function createParticipantFromApprovedApplication(
  input: CreateParticipantFromApplicationInput,
): Promise<CreatedParticipant> {
  const applicationId = validateRequiredValue(
    input.applicationId,
    "Application ID",
  );

  const createdBy = validateRequiredValue(
    input.createdBy,
    "Actor identity",
  );

  const { data, error } = await supabaseAdmin.rpc(
    "create_participant_from_approved_application",
    {
      p_application_id: applicationId,
      p_actor_user_id: createdBy,
    },
  );

  if (error) {
    if (
      error.code === "P1001" &&
      safeParticipantConversionMessages.has(error.message)
    ) {
      throw new ParticipantCreationServiceError(
        "createParticipantFromApprovedApplication",
        error.message,
      );
    }

    throw new Error(
      "Participant conversion could not be completed.",
    );
  }

  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error(
      "Participant conversion could not be completed.",
    );
  }

  return data[0] as CreatedParticipant;
}
