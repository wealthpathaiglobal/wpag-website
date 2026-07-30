import { supabaseAdmin } from "@/lib/supabase/admin";

export type ParticipantLifecycleStatus =
  | "pending_enrollment"
  | "active"
  | "paused"
  | "completed"
  | "withdrawn"
  | "archived";

type ParticipantLifecycleRecord = {
  id: string;
  participant_code: string;
  lifecycle_status: ParticipantLifecycleStatus;
  deleted_at: string | null;
};

type LifecycleMetadata = Record<string, unknown>;

type TransitionParticipantInput = {
  participantId: string;
  toStatus: ParticipantLifecycleStatus;
  changedByAuthUserId: string;
  reason?: string | null;
  metadata?: LifecycleMetadata;
};

export class ParticipantLifecycleError extends Error {
  readonly status: 400 | 404;

  constructor(message: string, status: 400 | 404 = 400) {
    super(message);
    this.name = "ParticipantLifecycleError";
    this.status = status;
  }
}

function validateRequiredId(value: string, fieldName: string): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new ParticipantLifecycleError(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function normalizeReason(reason?: string | null): string | null {
  const normalizedReason = reason?.trim();

  return normalizedReason || null;
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

async function transitionParticipant({
  participantId,
  toStatus,
  changedByAuthUserId,
  reason = null,
  metadata = {},
}: TransitionParticipantInput) {
  const normalizedParticipantId = validateRequiredId(
    participantId,
    "Participant ID"
  );

  const normalizedChangedByAuthUserId =
    changedByAuthUserId?.trim();

  if (!normalizedChangedByAuthUserId) {
    throw new Error(
      "Lifecycle actor identity is unavailable."
    );
  }

  const normalizedReason = normalizeReason(reason);

  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new ParticipantLifecycleError(
      "Lifecycle metadata must be an object."
    );
  }

  const { data: participant, error: participantLookupError } =
    await supabaseAdmin
      .from("participants")
      .select(
        `
          id,
          participant_code,
          lifecycle_status,
          deleted_at
        `
      )
      .eq("id", normalizedParticipantId)
      .maybeSingle<ParticipantLifecycleRecord>();

  if (participantLookupError) {
    throw new Error("Unable to load participant.");
  }

  if (!participant) {
    throw new ParticipantLifecycleError(
      "Participant not found.",
      404
    );
  }

  if (participant.deleted_at !== null) {
    throw new ParticipantLifecycleError(
      "Deleted participants cannot transition."
    );
  }

  if (participant.lifecycle_status === toStatus) {
    throw new ParticipantLifecycleError(
      `Participant already has lifecycle status: ${toStatus}.`
    );
  }

  if (toStatus === "withdrawn" && !normalizedReason) {
    throw new ParticipantLifecycleError(
      "Withdrawal reason is required."
    );
  }

  const { data: transitionedParticipant, error: transitionError } =
    await supabaseAdmin.rpc("transition_participant_lifecycle", {
      p_participant_id: participant.id,
      p_to_status: toStatus,
      p_changed_by: normalizedChangedByAuthUserId,
      p_reason: normalizedReason,
      p_metadata: {
        action: `participant_${toStatus}`,
        source: "admin_participant_lifecycle_service",
        participant_code: participant.participant_code,
        ...metadata,
      },
    });

  if (transitionError) {
    if (isKnownLifecycleDomainRejection(transitionError)) {
      throw new ParticipantLifecycleError(
        "The lifecycle transition is not allowed from the participant's current status."
      );
    }

    throw new Error("Participant lifecycle transition failed.");
  }

  if (!transitionedParticipant) {
    throw new Error(
      "Lifecycle transition completed without returning a participant record."
    );
  }

  return transitionedParticipant;
}

export async function pauseParticipant(
  participantId: string,
  changedByAuthUserId: string,
  reason?: string | null
) {
  return transitionParticipant({
    participantId,
    toStatus: "paused",
    changedByAuthUserId,
    reason,
    metadata: {
      operation: "pause",
    },
  });
}

export async function resumeParticipant(
  participantId: string,
  changedByAuthUserId: string,
  reason?: string | null
) {
  return transitionParticipant({
    participantId,
    toStatus: "active",
    changedByAuthUserId,
    reason,
    metadata: {
      operation: "resume",
    },
  });
}

export async function completeParticipant(
  participantId: string,
  changedByAuthUserId: string,
  reason?: string | null
) {
  return transitionParticipant({
    participantId,
    toStatus: "completed",
    changedByAuthUserId,
    reason,
    metadata: {
      operation: "complete",
    },
  });
}

export async function withdrawParticipant(
  participantId: string,
  changedByAuthUserId: string,
  reason: string
) {
  const normalizedReason = normalizeReason(reason);

  if (!normalizedReason) {
    throw new ParticipantLifecycleError(
      "Withdrawal reason is required."
    );
  }

  return transitionParticipant({
    participantId,
    toStatus: "withdrawn",
    changedByAuthUserId,
    reason: normalizedReason,
    metadata: {
      operation: "withdraw",
    },
  });
}

export async function archiveParticipant(
  participantId: string,
  changedByAuthUserId: string,
  reason?: string | null
) {
  return transitionParticipant({
    participantId,
    toStatus: "archived",
    changedByAuthUserId,
    reason,
    metadata: {
      operation: "archive",
    },
  });
}
