import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  enrollParticipant,
  ParticipantEnrollmentError,
} from "@/lib/services/admin/enrollment-service";

type EnrollmentRequest = {
  participantId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole("administrator");

    const body = (await request.json()) as EnrollmentRequest;

    const participantId = body.participantId?.trim();

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

    const participant = await enrollParticipant(
      participantId,
      staff.auth_user_id
    );

    return NextResponse.json(
      {
        success: true,
        participant,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof ParticipantEnrollmentError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    console.error("Participant enrollment failed:", error);

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