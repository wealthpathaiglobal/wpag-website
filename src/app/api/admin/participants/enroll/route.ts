import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/auth/errors";
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

    let body: unknown;

    try {
      body = await request.json();
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

    if (
      body === null ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          error: "A valid JSON request body is required.",
        },
        {
          status: 400,
        }
      );
    }

    const enrollmentRequest = body as EnrollmentRequest;
    const participantId =
      typeof enrollmentRequest.participantId === "string"
        ? enrollmentRequest.participantId.trim()
        : "";

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
        message: "Participant enrolled successfully.",
        participant,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 401,
        }
      );
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 403,
        }
      );
    }

    if (error instanceof ParticipantEnrollmentError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    console.error("Unexpected participant enrollment failure.");

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
