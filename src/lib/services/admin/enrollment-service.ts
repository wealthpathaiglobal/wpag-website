import { supabaseAdmin } from "@/lib/supabase/admin";

type EnrollableParticipant = {
  id: string;
  participant_code: string;
  auth_user_id: string | null;
  lifecycle_status: string;
  research_status: string;
  deleted_at: string | null;
};

export class ParticipantEnrollmentError extends Error {
  readonly status: 400 | 404;

  constructor(message: string, status: 400 | 404 = 400) {
    super(message);
    this.name = "ParticipantEnrollmentError";
    this.status = status;
  }
}

function validateRequiredId(value: string, fieldName: string): void {
  if (!value || value.trim() === "") {
    throw new ParticipantEnrollmentError(`${fieldName} is required.`);
  }
}

function isKnownLifecycleDomainRejection(error: {
  code: string;
  message: string;
}): boolean {
  if (error.code !== "P0001") {
    return false;
  }

  return (
    error.message === "Participant not found." ||
    error.message === "Deleted participants cannot transition." ||
    error.message === "Withdrawal reason is required." ||
    error.message.startsWith(
      "Participant already has lifecycle status:"
    ) ||
    error.message.startsWith("Invalid lifecycle transition:")
  );
}

/**
 * Activates a pending participant through the controlled lifecycle
 * transition function.
 *
 * The changedByAuthUserId value must be staff_members.auth_user_id,
 * because lifecycle audit fields reference auth.users(id).
 */
export async function enrollParticipant(
  participantId: string,
  changedByAuthUserId: string
) {
  validateRequiredId(participantId, "Participant ID");

  const normalizedParticipantId = participantId.trim();
  const normalizedChangedByAuthUserId =
    changedByAuthUserId?.trim();

  if (!normalizedChangedByAuthUserId) {
    throw new Error(
      "Enrollment actor identity is unavailable."
    );
  }

  const { data: participant, error: participantLookupError } =
    await supabaseAdmin
      .from("participants")
      .select(
        `
          id,
          participant_code,
          auth_user_id,
          lifecycle_status,
          research_status,
          deleted_at
        `
      )
      .eq("id", normalizedParticipantId)
      .maybeSingle<EnrollableParticipant>();

  if (participantLookupError) {
    throw new Error("Unable to load participant.");
  }

  if (!participant) {
    throw new ParticipantEnrollmentError(
      "Participant not found.",
      404
    );
  }

  if (participant.deleted_at !== null) {
    throw new ParticipantEnrollmentError(
      "Deleted participants cannot be enrolled."
    );
  }

  if (participant.lifecycle_status !== "pending_enrollment") {
    throw new ParticipantEnrollmentError(
      `Participant cannot be enrolled from lifecycle status: ${participant.lifecycle_status}.`
    );
  }

  if (!participant.auth_user_id) {
    throw new ParticipantEnrollmentError(
      "Participant must accept an invitation before enrollment."
    );
  }

  const { data: enrolledParticipant, error: enrollmentError } =
    await supabaseAdmin.rpc("transition_participant_lifecycle", {
      p_participant_id: participant.id,
      p_to_status: "active",
      p_changed_by: normalizedChangedByAuthUserId,
      p_reason: "Participant enrollment activated by authorized staff.",
      p_metadata: {
        action: "participant_enrollment",
        source: "admin_enrollment_service",
        participant_code: participant.participant_code,
      },
    });

  if (enrollmentError) {
    if (isKnownLifecycleDomainRejection(enrollmentError)) {
      throw new ParticipantEnrollmentError(
        "Participant cannot be enrolled from the current lifecycle status."
      );
    }

    throw new Error("Participant enrollment failed.");
  }

  if (!enrolledParticipant) {
    throw new Error(
      "Participant enrollment completed without returning a participant record."
    );
  }

  return enrolledParticipant;
}
