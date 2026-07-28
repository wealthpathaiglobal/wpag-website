import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  archiveParticipant,
  completeParticipant,
  ParticipantLifecycleError,
  pauseParticipant,
  resumeParticipant,
  withdrawParticipant,
} from "@/lib/services/admin/participant-lifecycle-service";

export type ParticipantLifecycleAction =
  | "pause"
  | "resume"
  | "complete"
  | "withdraw"
  | "archive";

type ParticipantLifecycleRequest = {
  participantId?: string;
  reason?: string;
};

type ExecuteParticipantLifecycleActionOptions = {
  request: NextRequest;
  action: ParticipantLifecycleAction;
};

function requiresReason(action: ParticipantLifecycleAction): boolean {
  return action === "withdraw";
}

function getSuccessMessage(action: ParticipantLifecycleAction): string {
  switch (action) {
    case "pause":
      return "Participant paused successfully.";

    case "resume":
      return "Participant resumed successfully.";

    case "complete":
      return "Participant completed successfully.";

    case "withdraw":
      return "Participant withdrawn successfully.";

    case "archive":
      return "Participant archived successfully.";
  }
}

async function executeLifecycleService(
  action: ParticipantLifecycleAction,
  participantId: string,
  changedByAuthUserId: string,
  reason: string | null
) {
  switch (action) {
    case "pause":
      return pauseParticipant(
        participantId,
        changedByAuthUserId,
        reason
      );

    case "resume":
      return resumeParticipant(
        participantId,
        changedByAuthUserId,
        reason
      );

    case "complete":
      return completeParticipant(
        participantId,
        changedByAuthUserId,
        reason
      );

    case "withdraw":
      return withdrawParticipant(
        participantId,
        changedByAuthUserId,
        reason ?? ""
      );

    case "archive":
      return archiveParticipant(
        participantId,
        changedByAuthUserId,
        reason
      );
  }
}

export async function executeParticipantLifecycleAction({
  request,
  action,
}: ExecuteParticipantLifecycleActionOptions) {
  try {
    const staff = await requireRole("administrator");

    let body: ParticipantLifecycleRequest;

    try {
      body = (await request.json()) as ParticipantLifecycleRequest;
    } catch {
      return NextResponse.json(
        {
          error: "A valid JSON request body is required.",
        },
        {
          status: 400,
        }
      );
    }

    const participantId = body.participantId?.trim();
    const reason = body.reason?.trim() || null;

    if (!participantId) {
      return NextResponse.json(
        {
          error: "Participant ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (requiresReason(action) && !reason) {
      return NextResponse.json(
        {
          error: "Withdrawal reason is required.",
        },
        {
          status: 400,
        }
      );
    }

    const participant = await executeLifecycleService(
      action,
      participantId,
      staff.auth_user_id,
      reason
    );

    return NextResponse.json(
      {
        success: true,
        message: getSuccessMessage(action),
        participant,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof ParticipantLifecycleError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      `Participant lifecycle action "${action}" failed:`,
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}
