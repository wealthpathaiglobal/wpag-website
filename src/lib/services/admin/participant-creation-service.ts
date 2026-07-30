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

interface SourceApplication {
  id: string;
  auth_user_id: string | null;

  full_name: string;
  email: string;

  phone_country_code: string;
  phone_number: string;

  country_code: string;
  state_or_region: string | null;
  city: string | null;

  employment_status: string | null;

  status: string;
}

interface ExistingParticipant {
  id: string;
  participant_code: string;
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
  readonly databaseMessage?: string;

  constructor(
    operation: string,
    message: string,
    databaseMessage?: string,
  ) {
    super(message);

    this.name = "ParticipantCreationServiceError";
    this.operation = operation;
    this.databaseMessage = databaseMessage;
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

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const normalizedName = fullName
    .trim()
    .replace(/\s+/g, " ");

  const nameParts = normalizedName.split(" ");

  if (nameParts.length === 1) {
    return {
      firstName: nameParts[0],
      lastName: "",
    };
  }

  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ");

  return {
    firstName,
    lastName,
  };
}

export async function createParticipantFromApprovedApplication(
  input: CreateParticipantFromApplicationInput,
): Promise<CreatedParticipant> {
  const applicationId = validateRequiredValue(
    input.applicationId,
    "Application ID",
  );

  const createdBy = validateRequiredValue(
    input.createdBy,
    "Creator identity",
  );

  /*
   * Duplicate protection.
   *
   * applications.id and participants.application_id have a
   * one-to-one relationship. Return the existing participant
   * instead of creating a duplicate.
   */
  const {
    data: existingParticipant,
    error: existingParticipantError,
  } = await supabaseAdmin
    .from("participants")
    .select(
      `
        id,
        participant_code
      `,
    )
    .eq("application_id", applicationId)
    .is("deleted_at", null)
    .maybeSingle<ExistingParticipant>();

  if (existingParticipantError) {
    throw new ParticipantCreationServiceError(
      "createParticipantFromApprovedApplication",
      "Unable to verify whether a participant already exists.",
      existingParticipantError.message,
    );
  }

  if (existingParticipant) {
    const {
      data: participant,
      error: participantLoadError,
    } = await supabaseAdmin
      .from("participants")
      .select(
        `
          id,
          participant_code,
          application_id,
          lifecycle_status,
          research_status
        `,
      )
      .eq("id", existingParticipant.id)
      .single<CreatedParticipant>();

    if (participantLoadError || !participant) {
      throw new ParticipantCreationServiceError(
        "createParticipantFromApprovedApplication",
        "An existing participant was found but could not be loaded.",
        participantLoadError?.message,
      );
    }

    return participant;
  }

  /*
   * Load and validate the approved source application.
   */
  const {
    data: application,
    error: applicationError,
  } = await supabaseAdmin
    .from("applications")
    .select(
      `
        id,
        auth_user_id,
        full_name,
        email,
        phone_country_code,
        phone_number,
        country_code,
        state_or_region,
        city,
        employment_status,
        status
      `,
    )
    .eq("id", applicationId)
    .maybeSingle<SourceApplication>();

  if (applicationError) {
    throw new ParticipantCreationServiceError(
      "createParticipantFromApprovedApplication",
      "Unable to load the approved application.",
      applicationError.message,
    );
  }

  if (!application) {
    throw new ParticipantCreationServiceError(
      "createParticipantFromApprovedApplication",
      "The approved application was not found.",
    );
  }

  if (application.status !== "eligible") {
    throw new ParticipantCreationServiceError(
      "createParticipantFromApprovedApplication",
      `A participant cannot be created from application status: ${application.status}.`,
    );
  }

  const { firstName, lastName } = splitFullName(
    application.full_name,
  );

  /*
   * Create the participant master record.
   *
   * Database defaults:
   * lifecycle_status = pending_enrollment
   * research_status = not_enrolled
   * participant_code = automatically generated
   */
  const {
    data: participant,
    error: participantError,
  } = await supabaseAdmin
    .from("participants")
    .insert({
      application_id: application.id,
      auth_user_id: application.auth_user_id,
      created_by: createdBy,
      updated_by: createdBy,
    })
    .select(
      `
        id,
        participant_code,
        application_id,
        lifecycle_status,
        research_status
      `,
    )
    .single<CreatedParticipant>();

  if (participantError || !participant) {
    throw new ParticipantCreationServiceError(
      "createParticipantFromApprovedApplication",
      "Unable to create the participant record.",
      participantError?.message,
    );
  }

  /*
   * Create the initial editable participant profile.
   */
  const { error: profileError } = await supabaseAdmin
    .from("participant_profiles")
    .insert({
      participant_id: participant.id,

      first_name: firstName,
      last_name: lastName,

      email: application.email,
      phone_country_code:
        application.phone_country_code,
      phone_number: application.phone_number,

      country_code: application.country_code,
      state: application.state_or_region,
      city: application.city,

      employment_status:
        application.employment_status,

      profile_completed: false,

      created_by: createdBy,
      updated_by: createdBy,
    });

  if (profileError) {
    await supabaseAdmin
      .from("participants")
      .delete()
      .eq("id", participant.id);

    throw new ParticipantCreationServiceError(
      "createParticipantFromApprovedApplication",
      "The participant was created, but the participant profile could not be created.",
      profileError.message,
    );
  }

  /*
   * Mark the source application as successfully converted.
   */
  const { error: conversionError } = await supabaseAdmin
    .from("applications")
    .update({
      status: "converted",
      converted_at: new Date().toISOString(),
      updated_by: createdBy,
    })
    .eq("id", application.id)
    .eq("status", "eligible");

  if (conversionError) {
    await supabaseAdmin
      .from("participant_profiles")
      .delete()
      .eq("participant_id", participant.id);

    await supabaseAdmin
      .from("participants")
      .delete()
      .eq("id", participant.id);

    throw new ParticipantCreationServiceError(
      "createParticipantFromApprovedApplication",
      "The participant was created, but the application could not be marked as converted.",
      conversionError.message,
    );
  }

  return participant;
}