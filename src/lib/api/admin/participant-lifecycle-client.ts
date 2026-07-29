export type ParticipantLifecycleClientAction =
  | "enroll"
  | "pause"
  | "resume"
  | "complete"
  | "withdraw"
  | "archive";

type LifecycleRequestPayload = {
  participantId: string;
  reason?: string;
};

type LifecycleApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  participant?: T;
  error?: string;
};

export class LifecycleApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LifecycleApiError";
    this.status = status;
  }
}

function getEndpoint(action: ParticipantLifecycleClientAction): string {
  return `/api/admin/participants/${action}`;
}

async function parseResponse<T>(
  response: Response
): Promise<LifecycleApiResponse<T>> {
  try {
    return (await response.json()) as LifecycleApiResponse<T>;
  } catch {
    return {};
  }
}

export async function executeLifecycleAction<T = unknown>(
  action: ParticipantLifecycleClientAction,
  participantId: string,
  reason?: string
): Promise<LifecycleApiResponse<T>> {
  const normalizedParticipantId = participantId.trim();
  const normalizedReason = reason?.trim();

  if (!normalizedParticipantId) {
    throw new LifecycleApiError(
      "Participant ID is required.",
      400
    );
  }

  if (action === "withdraw" && !normalizedReason) {
    throw new LifecycleApiError(
      "Withdrawal reason is required.",
      400
    );
  }

  const payload: LifecycleRequestPayload = {
    participantId: normalizedParticipantId,
  };

  if (normalizedReason) {
    payload.reason = normalizedReason;
  }

  let response: Response;

  try {
    response = await fetch(getEndpoint(action), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new LifecycleApiError(
      "Unable to connect to the server. Please try again.",
      0
    );
  }

  const data = await parseResponse<T>(response);

  if (!response.ok) {
    throw new LifecycleApiError(
      data.error ?? "Lifecycle action failed.",
      response.status
    );
  }

  return data;
}

export function enrollParticipant<T = unknown>(
  participantId: string
) {
  return executeLifecycleAction<T>(
    "enroll",
    participantId
  );
}

export function pauseParticipant<T = unknown>(
  participantId: string,
  reason?: string
) {
  return executeLifecycleAction<T>(
    "pause",
    participantId,
    reason
  );
}

export function resumeParticipant<T = unknown>(
  participantId: string,
  reason?: string
) {
  return executeLifecycleAction<T>(
    "resume",
    participantId,
    reason
  );
}

export function completeParticipant<T = unknown>(
  participantId: string,
  reason?: string
) {
  return executeLifecycleAction<T>(
    "complete",
    participantId,
    reason
  );
}

export function withdrawParticipant<T = unknown>(
  participantId: string,
  reason: string
) {
  return executeLifecycleAction<T>(
    "withdraw",
    participantId,
    reason
  );
}

export function archiveParticipant<T = unknown>(
  participantId: string,
  reason?: string
) {
  return executeLifecycleAction<T>(
    "archive",
    participantId,
    reason
  );
}